import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from './encryption.service';
import {
  MercadoLivreAdapter,
  ShopeeAdapter,
  AmazonAdapter,
  WooCommerceAdapter,
} from './adapters/marketplace.adapters';
import { Marketplace } from '@prisma/client';

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
    private readonly mercadoLivreAdapter: MercadoLivreAdapter,
    private readonly shopeeAdapter: ShopeeAdapter,
    private readonly amazonAdapter: AmazonAdapter,
    private readonly wooCommerceAdapter: WooCommerceAdapter,
  ) {}

  // ==================== INTEGRAÇÕES ====================

  async findAll(userId: string) {
    const integrations = await this.prisma.integration.findMany({
      where: { userId },
      include: {
        credentials: {
          select: {
            id: true,
            expiresAt: true,
            shopId: true,
            sellerId: true,
            // Nunca retornar tokens para o frontend
          },
        },
        _count: {
          select: { logs: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return integrations;
  }

  async findOne(id: string, userId: string) {
    const integration = await this.prisma.integration.findFirst({
      where: { id, userId },
      include: {
        credentials: {
          select: {
            id: true,
            expiresAt: true,
            shopId: true,
            sellerId: true,
            extraData: true,
          },
        },
        logs: {
          take: 50,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!integration) {
      throw new NotFoundException('Integração não encontrada');
    }

    return integration;
  }

  /**
   * Busca integração com credenciais completas (uso interno apenas)
   */
  private async findOneWithCredentials(userId: string, marketplace: Marketplace) {
    const integration = await this.prisma.integration.findFirst({
      where: { userId, marketplace },
      include: {
        credentials: true,
      },
    });

    return integration;
  }

  /**
   * Método público para buscar integração por marketplace
   */
  async getIntegrationByMarketplace(userId: string, marketplace: string) {
    const marketplaceEnum = marketplace.toUpperCase().replace('-', '_') as Marketplace;
    return this.findOneWithCredentials(userId, marketplaceEnum);
  }

  async connect(marketplace: string, credentials: any, userId: string) {
    const marketplaceEnum = marketplace.toUpperCase().replace('-', '_') as Marketplace;

    // Verifica se já existe
    const existing = await this.prisma.integration.findFirst({
      where: { userId, marketplace: marketplaceEnum },
    });

    if (existing && existing.status === 'CONNECTED') {
      throw new ConflictException('Integração já conectada. Desconecte antes de reconectar.');
    }

    // Seleciona adapter correto
    let adapter;
    switch (marketplaceEnum) {
      case 'MERCADO_LIVRE':
        adapter = this.mercadoLivreAdapter;
        break;
      case 'SHOPEE':
        adapter = this.shopeeAdapter;
        break;
      case 'AMAZON':
        adapter = this.amazonAdapter;
        break;
      case 'WOOCOMMERCE':
        adapter = this.wooCommerceAdapter;
        break;
      default:
        throw new BadRequestException('Marketplace não suportado');
    }

    try {
      // Conecta usando o adapter
      const result = await adapter.connect(credentials, userId);

      // Cria ou atualiza integração
      let integration;
      if (existing) {
        integration = await this.prisma.integration.update({
          where: { id: existing.id },
          data: { status: 'CONNECTED', updatedAt: new Date() },
        });
      } else {
        integration = await this.prisma.integration.create({
          data: {
            marketplace: marketplaceEnum,
            status: 'CONNECTED',
            userId,
          },
        });
      }

      // Salva credenciais criptografadas
      await this.prisma.integrationCredential.upsert({
        where: { integrationId: integration.id },
        create: {
          integrationId: integration.id,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresAt: result.expiresAt,
          apiKey: result.apiKey,
          shopId: result.shopId,
          sellerId: result.sellerId,
          extraData: result.extraData || {},
        },
        update: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresAt: result.expiresAt,
          apiKey: result.apiKey,
          shopId: result.shopId,
          sellerId: result.sellerId,
          extraData: result.extraData || {},
          updatedAt: new Date(),
        },
      });

      // Log de sucesso
      await this.createLog(integration.id, `Integração ${marketplace} conectada com sucesso`, 'INFO');

      return {
        message: 'Integração conectada com sucesso',
        integration,
        authUrl: result.authUrl, // Para OAuth (Mercado Livre)
      };
    } catch (error) {
      // Log de erro
      if (existing) {
        await this.prisma.integration.update({
          where: { id: existing.id },
          data: { status: 'ERROR' },
        });
        await this.createLog(existing.id, `Erro ao conectar: ${error.message}`, 'ERROR', { error: error.message });
      }
      throw error;
    }
  }

  async disconnect(marketplace: string, userId: string) {
    const marketplaceEnum = marketplace.toUpperCase().replace('-', '_') as Marketplace;

    const integration = await this.prisma.integration.findFirst({
      where: { userId, marketplace: marketplaceEnum },
    });

    if (!integration) {
      throw new NotFoundException('Integração não encontrada');
    }

    // Desconecta usando adapter
    let adapter;
    switch (marketplaceEnum) {
      case 'MERCADO_LIVRE':
        adapter = this.mercadoLivreAdapter;
        break;
      case 'SHOPEE':
        adapter = this.shopeeAdapter;
        break;
      case 'AMAZON':
        adapter = this.amazonAdapter;
        break;
      case 'WOOCOMMERCE':
        adapter = this.wooCommerceAdapter;
        break;
    }

    await adapter.disconnect(integration.id);

    // Atualiza status
    await this.prisma.integration.update({
      where: { id: integration.id },
      data: { status: 'DISCONNECTED' },
    });

    // Remove credenciais
    await this.prisma.integrationCredential.deleteMany({
      where: { integrationId: integration.id },
    });

    await this.createLog(integration.id, `Integração ${marketplace} desconectada`, 'INFO');

    return { message: 'Integração desconectada com sucesso' };
  }

  async getStatus(marketplace: string, userId: string) {
    const marketplaceEnum = marketplace.toUpperCase().replace('-', '_') as Marketplace;

    const integration = await this.prisma.integration.findFirst({
      where: { userId, marketplace: marketplaceEnum },
      include: {
        credentials: {
          select: {
            expiresAt: true,
            shopId: true,
            sellerId: true,
          },
        },
      },
    });

    if (!integration) {
      return {
        marketplace: marketplaceEnum,
        status: 'DISCONNECTED',
        connected: false,
      };
    }

    // Verifica se token expirou
    const isExpired = integration.credentials?.expiresAt
      ? this.encryptionService.isTokenExpired(integration.credentials.expiresAt)
      : false;

    return {
      marketplace: marketplaceEnum,
      status: isExpired ? 'ERROR' : integration.status,
      connected: integration.status === 'CONNECTED' && !isExpired,
      expiresAt: integration.credentials?.expiresAt,
      shopId: integration.credentials?.shopId,
      sellerId: integration.credentials?.sellerId,
    };
  }

  // ==================== LOGS ====================

  async getLogs(integrationId: string, userId: string, query: any = {}) {
    const integration = await this.prisma.integration.findFirst({
      where: { id: integrationId, userId },
    });

    if (!integration) {
      throw new NotFoundException('Integração não encontrada');
    }

    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = { integrationId };
    if (query.type) {
      where.type = query.type;
    }

    const [logs, total] = await Promise.all([
      this.prisma.integrationLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.integrationLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createLog(integrationId: string, message: string, type: 'INFO' | 'WARNING' | 'ERROR', payload: any = {}) {
    return this.prisma.integrationLog.create({
      data: {
        integrationId,
        message,
        type,
        payload,
      },
    });
  }
}
