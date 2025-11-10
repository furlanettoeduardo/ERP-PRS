import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IntegrationsService } from '../../integrations/integrations.service';
import { WooCommerceAdapter } from '../adapters/woocommerce.adapter';
import { MercadoLivreAdapter } from '../adapters/mercadolivre.adapter';
import { ShopeeAdapter } from '../adapters/shopee.adapter';
import { AmazonAdapter } from '../adapters/amazon.adapter';
import { Marketplace } from '@prisma/client';
import { IMarketplaceAdapter } from '../interfaces/adapter.interface';
import { ReconciliationDto } from '../dto/sync.dto';

interface ReconciliationDifference {
  sku: string;
  field: string;
  localValue: any;
  externalValue: any;
  severity: 'critical' | 'warning' | 'info';
}

interface ReconciliationReport {
  marketplace: Marketplace;
  entityType: string;
  totalChecked: number;
  differences: ReconciliationDifference[];
  timestamp: Date;
  summary: {
    critical: number;
    warnings: number;
    info: number;
  };
}

@Injectable()
export class ReconciliationService {
  private logger = new Logger(ReconciliationService.name);

  constructor(
    private prisma: PrismaService,
    private integrationsService: IntegrationsService,
    private wooAdapter: WooCommerceAdapter,
    private mlAdapter: MercadoLivreAdapter,
    private shopeeAdapter: ShopeeAdapter,
    private amazonAdapter: AmazonAdapter,
  ) {}

  /**
   * Executa reconciliação completa
   */
  async reconcile(
    marketplace: Marketplace,
    accountId: string,
    options: ReconciliationDto,
  ): Promise<ReconciliationReport> {
    this.logger.log(`Starting reconciliation for ${marketplace} - type: ${options.entityType}`);

    const integration = await this.integrationsService.getIntegrationByMarketplace(
      accountId,
      marketplace,
    );

    if (!integration || !integration.credentials) {
      throw new Error('Integration credentials not found');
    }

    const adapter = this.getAdapter(marketplace);
    let differences: ReconciliationDifference[] = [];

    switch (options.entityType) {
      case 'product':
        differences = await this.reconcileProducts(
          adapter,
          integration.credentials,
          options.skus,
        );
        break;

      case 'stock':
        differences = await this.reconcileStock(
          adapter,
          integration.credentials,
          options.skus,
        );
        break;

      case 'price':
        differences = await this.reconcilePrices(
          adapter,
          integration.credentials,
          options.skus,
        );
        break;

      case 'all':
        const [productDiffs, stockDiffs, priceDiffs] = await Promise.all([
          this.reconcileProducts(adapter, integration.credentials, options.skus),
          this.reconcileStock(adapter, integration.credentials, options.skus),
          this.reconcilePrices(adapter, integration.credentials, options.skus),
        ]);
        differences = [...productDiffs, ...stockDiffs, ...priceDiffs];
        break;

      default:
        throw new Error(`Invalid entity type: ${options.entityType}`);
    }

    // Aplica correções se solicitado
    if (options.fixDifferences && !options.reportOnly) {
      await this.applyFixes(adapter, integration.credentials, differences);
    }

    // Gera relatório
    const report: ReconciliationReport = {
      marketplace,
      entityType: options.entityType,
      totalChecked: differences.length,
      differences,
      timestamp: new Date(),
      summary: {
        critical: differences.filter((d) => d.severity === 'critical').length,
        warnings: differences.filter((d) => d.severity === 'warning').length,
        info: differences.filter((d) => d.severity === 'info').length,
      },
    };

    this.logger.log(
      `Reconciliation completed: ${report.summary.critical} critical, ${report.summary.warnings} warnings`,
    );

    return report;
  }

  /**
   * Reconcilia produtos
   */
  private async reconcileProducts(
    adapter: IMarketplaceAdapter,
    credentials: any,
    skus?: string[],
  ): Promise<ReconciliationDifference[]> {
    const differences: ReconciliationDifference[] = [];

    // Busca produtos locais
    const localProducts = await this.prisma.product.findMany({
      where: skus ? { sku: { in: skus } } : {},
      include: {
        marketplaceProducts: true,
      },
    });

    // Busca produtos do marketplace
    const externalResponse = await adapter.fetchProducts(credentials);
    const externalProducts = externalResponse.data;

    // Cria mapa para lookup rápido
    const externalMap = new Map(
      externalProducts.map((p) => [p.sku, p]),
    );

    for (const localProduct of localProducts) {
      const externalProduct = externalMap.get(localProduct.sku);

      if (!externalProduct) {
        differences.push({
          sku: localProduct.sku,
          field: 'existence',
          localValue: 'exists',
          externalValue: 'not found',
          severity: 'critical',
        });
        continue;
      }

      // Compara nome
      if (localProduct.name !== externalProduct.name) {
        differences.push({
          sku: localProduct.sku,
          field: 'name',
          localValue: localProduct.name,
          externalValue: externalProduct.name,
          severity: 'warning',
        });
      }

      // Compara preço
      if (Math.abs(localProduct.price - externalProduct.price) > 0.01) {
        differences.push({
          sku: localProduct.sku,
          field: 'price',
          localValue: localProduct.price,
          externalValue: externalProduct.price,
          severity: 'critical',
        });
      }

      // Compara estoque
      if (localProduct.currentStock !== externalProduct.stock) {
        differences.push({
          sku: localProduct.sku,
          field: 'stock',
          localValue: localProduct.currentStock,
          externalValue: externalProduct.stock,
          severity: 'critical',
        });
      }

      // Compara status ativo
      if (localProduct.active !== externalProduct.active) {
        differences.push({
          sku: localProduct.sku,
          field: 'active',
          localValue: localProduct.active,
          externalValue: externalProduct.active,
          severity: 'warning',
        });
      }
    }

    return differences;
  }

  /**
   * Reconcilia estoque
   */
  private async reconcileStock(
    adapter: IMarketplaceAdapter,
    credentials: any,
    skus?: string[],
  ): Promise<ReconciliationDifference[]> {
    const differences: ReconciliationDifference[] = [];

    const localProducts = await this.prisma.product.findMany({
      where: skus ? { sku: { in: skus } } : {},
      select: {
        sku: true,
        currentStock: true,
      },
    });

    const externalStockResponse = await adapter.fetchStock(
      credentials,
      localProducts.map((p) => p.sku),
    );

    const externalStock = externalStockResponse.data;
    const externalStockMap = new Map(
      Array.isArray(externalStock) ? externalStock.map((s: any) => [s.sku, s.quantity]) : [],
    );

    for (const product of localProducts) {
      const externalQuantity = externalStockMap.get(product.sku);

      if (externalQuantity === undefined) {
        differences.push({
          sku: product.sku,
          field: 'stock',
          localValue: product.currentStock,
          externalValue: 'not found',
          severity: 'critical',
        });
        continue;
      }

      if (product.currentStock !== externalQuantity) {
        differences.push({
          sku: product.sku,
          field: 'stock',
          localValue: product.currentStock,
          externalValue: externalQuantity,
          severity: 'critical',
        });
      }
    }

    return differences;
  }

  /**
   * Reconcilia preços
   */
  private async reconcilePrices(
    adapter: IMarketplaceAdapter,
    credentials: any,
    skus?: string[],
  ): Promise<ReconciliationDifference[]> {
    const differences: ReconciliationDifference[] = [];

    const localProducts = await this.prisma.product.findMany({
      where: skus ? { sku: { in: skus } } : {},
      select: {
        sku: true,
        price: true,
      },
    });

    const externalPricesResponse = await adapter.fetchPrices(
      credentials,
      localProducts.map((p) => p.sku),
    );

    const externalPrices = externalPricesResponse.data;
    const externalPricesMap = new Map(
      Array.isArray(externalPrices) ? externalPrices.map((p: any) => [p.sku, p.price]) : [],
    );

    for (const product of localProducts) {
      const externalPrice = externalPricesMap.get(product.sku);

      if (externalPrice === undefined) {
        differences.push({
          sku: product.sku,
          field: 'price',
          localValue: product.price,
          externalValue: 'not found',
          severity: 'critical',
        });
        continue;
      }

      if (Math.abs(product.price - externalPrice) > 0.01) {
        differences.push({
          sku: product.sku,
          field: 'price',
          localValue: product.price,
          externalValue: externalPrice,
          severity: 'critical',
        });
      }
    }

    return differences;
  }

  /**
   * Aplica correções automaticamente
   */
  private async applyFixes(
    adapter: IMarketplaceAdapter,
    credentials: any,
    differences: ReconciliationDifference[],
  ): Promise<void> {
    this.logger.log(`Applying fixes for ${differences.length} differences`);

    // Agrupa diferenças por tipo
    const stockDiffs = differences.filter((d) => d.field === 'stock');
    const priceDiffs = differences.filter((d) => d.field === 'price');

    // Corrige estoque (usa valor local como verdade)
    if (stockDiffs.length > 0) {
      const stockUpdates = stockDiffs.map((diff) => ({
        sku: diff.sku,
        quantity: diff.localValue as number,
      }));

      await adapter.updateStock(credentials, stockUpdates);
      this.logger.log(`Fixed ${stockDiffs.length} stock differences`);
    }

    // Corrige preços
    if (priceDiffs.length > 0) {
      const priceUpdates = priceDiffs.map((diff) => ({
        sku: diff.sku,
        price: diff.localValue as number,
      }));

      await adapter.updatePrice(credentials, priceUpdates);
      this.logger.log(`Fixed ${priceDiffs.length} price differences`);
    }
  }

  /**
   * Cria conflito para resolução manual
   */
  async createConflict(
    marketplace: Marketplace,
    sku: string,
    field: string,
    localValue: any,
    externalValue: any,
  ) {
    const product = await this.prisma.product.findUnique({
      where: { sku },
    });

    if (!product) {
      throw new Error(`Product with SKU ${sku} not found`);
    }

    return this.prisma.syncConflict.create({
      data: {
        productId: product.id,
        marketplace,
        field,
        localValue: JSON.stringify(localValue),
        externalValue: JSON.stringify(externalValue),
        resolved: false,
      },
    });
  }

  /**
   * Resolve conflito
   */
  async resolveConflict(
    conflictId: string,
    resolution: 'use_local' | 'use_external',
  ) {
    const conflict = await this.prisma.syncConflict.findUnique({
      where: { id: conflictId },
      include: { product: true },
    });

    if (!conflict) {
      throw new Error(`Conflict ${conflictId} not found`);
    }

    // Aplica resolução
    const valueToUse =
      resolution === 'use_local' ? conflict.localValue : conflict.externalValue;

    await this.prisma.product.update({
      where: { id: conflict.productId },
      data: {
        [conflict.field]: JSON.parse(valueToUse),
      },
    });

    // Marca como resolvido
    return this.prisma.syncConflict.update({
      where: { id: conflictId },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        resolution: valueToUse,
      },
    });
  }

  /**
   * Lista conflitos pendentes
   */
  async getPendingConflicts(marketplace?: Marketplace) {
    return this.prisma.syncConflict.findMany({
      where: {
        resolved: false,
        ...(marketplace && { marketplace }),
      },
      include: {
        product: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  private getAdapter(marketplace: Marketplace): IMarketplaceAdapter {
    const adapters = {
      [Marketplace.WOOCOMMERCE]: this.wooAdapter,
      [Marketplace.MERCADO_LIVRE]: this.mlAdapter,
      [Marketplace.SHOPEE]: this.shopeeAdapter,
      [Marketplace.AMAZON]: this.amazonAdapter,
    };

    return adapters[marketplace];
  }
}
