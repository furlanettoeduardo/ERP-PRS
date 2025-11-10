import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { IntegrationsService } from '../integrations.service';
import {
  MercadoLivreAuthService,
  ShopeeAuthService,
  WooCommerceAuthService,
  AmazonAuthService,
} from '../services/auth.service';
import {
  MercadoLivreAuthDto,
  ShopeeAuthDto,
  WooCommerceAuthDto,
  AmazonAuthDto,
  TestConnectionResponseDto,
  WebhookConfigDto,
  WebhookRegistrationResponseDto,
} from '../dto/auth.dto';

@ApiTags('Integrations Auth')
@Controller('integrations/auth')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class IntegrationsAuthController {
  constructor(
    private integrationsService: IntegrationsService,
    private mercadoLivreAuthService: MercadoLivreAuthService,
    private shopeeAuthService: ShopeeAuthService,
    private wooCommerceAuthService: WooCommerceAuthService,
    private amazonAuthService: AmazonAuthService,
  ) {}

  // ============================================
  // MERCADO LIVRE
  // ============================================

  @Post('mercado-livre/save')
  @ApiOperation({ summary: 'Salvar credenciais Mercado Livre' })
  async saveMercadoLivreCredentials(@Req() req, @Body() credentials: MercadoLivreAuthDto) {
    const userId = req.user.id;

    // Salva credenciais criptografadas
    await this.integrationsService.connect('MERCADO_LIVRE', credentials, userId);

    return {
      success: true,
      message: 'Credenciais salvas com sucesso',
    };
  }

  @Get('mercado-livre/authorize')
  @ApiOperation({ summary: 'Iniciar fluxo OAuth2 Mercado Livre' })
  async authorizeMercadoLivre(@Req() req, @Query('client_id') clientId: string, @Res() res: Response) {
    if (!clientId) {
      throw new BadRequestException('client_id é obrigatório');
    }

    const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:4000'}/integrations/auth/mercado-livre/callback`;
    const state = `${req.user.id}:${Date.now()}`;

    const authUrl = this.mercadoLivreAuthService.getAuthorizationUrl(clientId, redirectUri, state);

    return res.redirect(authUrl);
  }

  @Get('mercado-livre/callback')
  @ApiOperation({ summary: 'Callback OAuth2 Mercado Livre' })
  async mercadoLivreCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}/integracoes/mercado-livre?error=no_code`);
    }

    try {
      // Extrai userId do state
      const [userIdStr] = state.split(':');
      const userId = userIdStr;

      // Busca credenciais salvas
      const integration = await this.integrationsService.getIntegrationByMarketplace(
        userId,
        'MERCADO_LIVRE',
      );

      if (!integration || !integration.credentials) {
        throw new Error('Credenciais não encontradas');
      }

      // As credenciais estão no extraData como JSON
      const credentials = integration.credentials.extraData as any;

      // Troca code por token
      const tokenResponse = await this.mercadoLivreAuthService.exchangeCodeForToken(
        code,
        credentials.clientId,
        credentials.clientSecret,
        `${process.env.BACKEND_URL || 'http://localhost:4000'}/integrations/auth/mercado-livre/callback`,
      );

      // Atualiza credenciais com tokens
      await this.integrationsService.connect('MERCADO_LIVRE', {
        ...credentials,
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresIn: tokenResponse.expires_in,
        userId: tokenResponse.user_id.toString(),
      }, userId);

      return res.redirect(`${process.env.FRONTEND_URL}/integracoes/mercado-livre?success=true`);
    } catch (error) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/integracoes/mercado-livre?error=${encodeURIComponent(error.message)}`,
      );
    }
  }

  @Post('mercado-livre/test')
  @ApiOperation({ summary: 'Testar conexão Mercado Livre' })
  async testMercadoLivre(@Body() credentials: MercadoLivreAuthDto): Promise<TestConnectionResponseDto> {
    return this.mercadoLivreAuthService.testConnection(credentials);
  }

  // ============================================
  // SHOPEE
  // ============================================

  @Post('shopee/save')
  @ApiOperation({ summary: 'Salvar credenciais Shopee' })
  async saveShopeeCredentials(@Req() req, @Body() credentials: ShopeeAuthDto) {
    const userId = req.user.id;

    await this.integrationsService.connect('SHOPEE', credentials, userId);

    return {
      success: true,
      message: 'Credenciais Shopee salvas com sucesso',
    };
  }

  @Post('shopee/test')
  @ApiOperation({ summary: 'Testar conexão Shopee' })
  async testShopee(@Body() credentials: ShopeeAuthDto): Promise<TestConnectionResponseDto> {
    return this.shopeeAuthService.testConnection(credentials);
  }

  @Post('shopee/generate-signature')
  @ApiOperation({ summary: 'Gerar assinatura de teste Shopee' })
  async generateShopeeSignature(@Body() credentials: ShopeeAuthDto) {
    const timestamp = Math.floor(Date.now() / 1000);
    const path = '/api/v2/shop/get_shop_info';

    const signature = this.shopeeAuthService.generateSignature({
      partnerId: credentials.partnerId,
      partnerKey: credentials.partnerKey,
      path,
      timestamp,
    });

    return {
      signature,
      timestamp,
      path,
      partnerId: credentials.partnerId,
    };
  }

  // ============================================
  // WOOCOMMERCE
  // ============================================

  @Post('woocommerce/save')
  @ApiOperation({ summary: 'Salvar credenciais WooCommerce' })
  async saveWooCommerceCredentials(@Req() req, @Body() credentials: WooCommerceAuthDto) {
    const userId = req.user.id;

    await this.integrationsService.connect('WOOCOMMERCE', credentials, userId);

    return {
      success: true,
      message: 'Credenciais WooCommerce salvas com sucesso',
    };
  }

  @Post('woocommerce/test')
  @ApiOperation({ summary: 'Testar conexão WooCommerce' })
  async testWooCommerce(@Body() credentials: WooCommerceAuthDto): Promise<TestConnectionResponseDto> {
    return this.wooCommerceAuthService.testConnection(credentials);
  }

  // ============================================
  // AMAZON SP-API
  // ============================================

  @Post('amazon/save')
  @ApiOperation({ summary: 'Salvar credenciais Amazon SP-API' })
  async saveAmazonCredentials(@Req() req, @Body() credentials: AmazonAuthDto) {
    const userId = req.user.id;

    await this.integrationsService.connect('AMAZON', credentials, userId);

    return {
      success: true,
      message: 'Credenciais Amazon SP-API salvas com sucesso',
    };
  }

  @Post('amazon/test')
  @ApiOperation({ summary: 'Testar conexão Amazon SP-API' })
  async testAmazon(@Body() credentials: AmazonAuthDto): Promise<TestConnectionResponseDto> {
    return this.amazonAuthService.testConnection(credentials);
  }

  // ============================================
  // WEBHOOKS
  // ============================================

  @Post(':marketplace/webhook/register')
  @ApiOperation({ summary: 'Registrar configuração de webhook' })
  async registerWebhook(
    @Req() req,
    @Param('marketplace') marketplace: string,
    @Body() config: WebhookConfigDto,
  ): Promise<WebhookRegistrationResponseDto> {
    const userId = req.user.id;

    // Gera secret aleatório se não fornecido
    const webhookSecret = config.webhookSecret || require('crypto').randomBytes(32).toString('hex');

    // Busca integração existente
    const integration = await this.integrationsService.getIntegrationByMarketplace(
      userId,
      marketplace.toUpperCase().replace('-', '_')
    );

    if (!integration) {
      throw new BadRequestException('Integração não encontrada');
    }

    // Atualiza credenciais com webhook config
    const credentials = (integration.credentials?.extraData as any) || {};
    credentials.webhookUrl = config.webhookUrl;
    credentials.webhookSecret = webhookSecret;

    await this.integrationsService.connect(
      marketplace.toUpperCase().replace('-', '_'),
      credentials,
      userId,
    );

    return {
      webhookUrl: config.webhookUrl,
      webhookSecret,
      marketplace: marketplace,
      status: 'registered',
    };
  }

  @Get(':marketplace/webhook/url')
  @ApiOperation({ summary: 'Obter URL de webhook para o marketplace' })
  async getWebhookUrl(@Param('marketplace') marketplace: string) {
    const webhookUrl = `${process.env.BACKEND_URL || 'http://localhost:4000'}/integrations/webhook/${marketplace}`;

    return {
      webhookUrl,
      marketplace,
      instructions: `Configure esta URL no painel do ${marketplace}`,
    };
  }
}
