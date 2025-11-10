import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../../prisma/prisma.service';
import { IntegrationsService } from '../../integrations/integrations.service';
import { WooCommerceAdapter } from '../adapters/woocommerce.adapter';
import { MercadoLivreAdapter } from '../adapters/mercadolivre.adapter';
import { ShopeeAdapter } from '../adapters/shopee.adapter';
import { AmazonAdapter } from '../adapters/amazon.adapter';
import { SyncJobStatus, Marketplace } from '@prisma/client';
import { IMarketplaceAdapter } from '../interfaces/adapter.interface';

@Processor('stock-sync')
export class StockSyncProcessor {
  private logger = new Logger(StockSyncProcessor.name);

  constructor(
    private prisma: PrismaService,
    private integrationsService: IntegrationsService,
    private wooAdapter: WooCommerceAdapter,
    private mlAdapter: MercadoLivreAdapter,
    private shopeeAdapter: ShopeeAdapter,
    private amazonAdapter: AmazonAdapter,
  ) {}

  @Process('sync')
  async handleSync(job: Job) {
    const { jobId, marketplace, accountId, options } = job.data;

    this.logger.log(`Processing stock sync job ${jobId} for ${marketplace}`);

    try {
      await this.updateJobStatus(jobId, SyncJobStatus.PROCESSING);

      const integration = await this.integrationsService.getIntegrationByMarketplace(
        accountId,
        marketplace,
      );

      if (!integration) {
        throw new Error('Integration not found');
      }

      const adapter = this.getAdapter(marketplace);

      // Busca produtos para sincronizar
      const products = await this.prisma.product.findMany({
        where: {
          sku: options.options.skus ? { in: options.options.skus } : undefined,
          active: true,
        },
        include: {
          marketplaceProducts: {
            where: { marketplace },
          },
        },
      });

      // Prepara atualizações de estoque
      const stockUpdates = products
        .filter((p) => p.marketplaceProducts.length > 0)
        .map((p) => ({
          sku: p.sku,
          quantity: p.currentStock,
        }));

      if (stockUpdates.length === 0) {
        throw new Error('No products found to sync');
      }

      // Atualiza estoque em lote
      const result = await adapter.updateStock(integration.credentials, stockUpdates);

      const successful = result.data.filter((r: any) => r.success).length;
      const failed = result.data.filter((r: any) => !r.success).length;

      // Atualiza timestamps de sincronização
      for (const update of result.data) {
        if (update.success) {
          await this.prisma.marketplaceProduct.updateMany({
            where: {
              marketplace,
              sku: update.sku,
            },
            data: {
              syncedAt: new Date(),
            },
          });
        }
      }

      await this.updateJobStatus(jobId, SyncJobStatus.COMPLETED, {
        processedItems: successful,
        failedItems: failed,
        totalItems: stockUpdates.length,
      });

      this.logger.log(`Stock sync job ${jobId} completed: ${successful} synced, ${failed} failed`);

      return { successful, failed };
    } catch (error) {
      this.logger.error(`Stock sync job ${jobId} failed:`, error);

      await this.updateJobStatus(jobId, SyncJobStatus.FAILED, {
        error: (error as Error).message,
      });

      throw error;
    }
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

  private async updateJobStatus(jobId: string, status: SyncJobStatus, data?: any) {
    const updateData: any = { status };

    if (status === SyncJobStatus.PROCESSING) {
      updateData.startedAt = new Date();
    }

    if (status === SyncJobStatus.COMPLETED || status === SyncJobStatus.FAILED) {
      updateData.finishedAt = new Date();
    }

    if (data) {
      Object.assign(updateData, data);
    }

    return this.prisma.syncJob.update({
      where: { id: jobId },
      data: updateData,
    });
  }
}
