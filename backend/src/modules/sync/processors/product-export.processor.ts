import { Processor, Process, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../../prisma/prisma.service';
import { IntegrationsService } from '../../integrations/integrations.service';
import { MappingService } from '../services/mapping.service';
import { WooCommerceAdapter } from '../adapters/woocommerce.adapter';
import { MercadoLivreAdapter } from '../adapters/mercadolivre.adapter';
import { ShopeeAdapter } from '../adapters/shopee.adapter';
import { AmazonAdapter } from '../adapters/amazon.adapter';
import { SyncJobStatus, SyncAction, Marketplace } from '@prisma/client';
import { IMarketplaceAdapter } from '../interfaces/adapter.interface';

@Processor('product-export')
export class ProductExportProcessor {
  private logger = new Logger(ProductExportProcessor.name);

  constructor(
    private prisma: PrismaService,
    private integrationsService: IntegrationsService,
    private mappingService: MappingService,
    private wooAdapter: WooCommerceAdapter,
    private mlAdapter: MercadoLivreAdapter,
    private shopeeAdapter: ShopeeAdapter,
    private amazonAdapter: AmazonAdapter,
  ) {}

  @Process('export')
  async handleExport(job: Job) {
    const { jobId, marketplace, accountId, options } = job.data;

    this.logger.log(`Processing product export job ${jobId} for ${marketplace}`);

    try {
      await this.updateJobStatus(jobId, SyncJobStatus.PROCESSING);

      const integration = await this.integrationsService.getIntegrationByMarketplace(
        accountId,
        marketplace,
      );

      if (!integration || !integration.credentials) {
        throw new Error('Integration credentials not found');
      }

      const adapter = this.getAdapter(marketplace);

      // Busca produtos para exportar
      const products = await this.prisma.product.findMany({
        where: {
          id: options.options.productIds
            ? { in: options.options.productIds }
            : undefined,
          active: true,
        },
        include: {
          variants: true,
          productMappings: {
            where: { marketplace },
          },
        },
      });

      let totalProcessed = 0;
      let totalFailed = 0;

      for (const product of products) {
        try {
          // Aplica mapeamento de categoria
          const categoryMapping = options.options.categoryMapping?.[product.id];

          // Aplica regras de preço
          const adjustedPrice = await this.mappingService.calculateAdjustedPrice(
            product.id,
            marketplace,
            product.price,
          );

          // Normaliza produto
          const normalizedProduct = {
            externalId: product.productMappings[0]?.externalCategoryId || '',
            sku: product.sku,
            name: product.name,
            description: product.description || '',
            price: adjustedPrice,
            stock: product.currentStock,
            images: [], // TODO: Buscar imagens
            categories: categoryMapping ? [categoryMapping] : [],
            active: product.active,
            variations: product.variants?.map((v) => ({
              externalId: '',
              sku: v.sku,
              attributes: v.attributes as any,
              price: v.price,
              stock: v.stock,
            })),
          };

          // Verifica se produto já existe no marketplace
          const existingMapping = product.productMappings[0];

          let result;
          if (existingMapping) {
            // Atualiza produto existente
            result = await adapter.updateProduct(
              integration.credentials,
              existingMapping.externalCategoryId!,
              normalizedProduct,
            );
          } else {
            // Cria novo produto
            const idempotencyKey = `export-${product.id}-${Date.now()}`;
            result = await adapter.createProduct(
              integration.credentials,
              normalizedProduct,
              idempotencyKey,
            );

            // Cria mapeamento
            if (result.success && result.data) {
              await this.prisma.marketplaceProduct.create({
                data: {
                  marketplace,
                  marketplaceItemId: result.data.externalId || '',
                  productId: product.id,
                  sku: product.sku,
                  status: 'active',
                  syncedAt: new Date(),
                },
              });
            }
          }

          if (result.success) {
            totalProcessed++;

            // Log sucesso
            await this.createSyncLog(jobId, marketplace, {
              externalId: result.data?.externalId,
              localId: product.id,
              sku: product.sku,
              action: existingMapping ? SyncAction.UPDATE : SyncAction.CREATE,
              result: 'success',
            });
          } else {
            throw new Error(result.error || 'Export failed');
          }

          // Sincroniza estoque se solicitado
          if (options.options.stockSync && result.success) {
            await adapter.updateStock(integration.credentials, [
              {
                sku: product.sku,
                quantity: product.currentStock,
                externalId: result.data?.externalId,
              },
            ]);
          }
        } catch (error: any) {
          this.logger.error(`Failed to export product ${product.sku}:`, error);
          totalFailed++;

          await this.createSyncLog(jobId, marketplace, {
            localId: product.id,
            sku: product.sku,
            action: SyncAction.CREATE,
            result: 'failed',
            error: error.message,
          });
        }

        // Atualiza progresso
        const progress = Math.min(
          Math.round(((totalProcessed + totalFailed) / products.length) * 100),
          100,
        );

        await this.prisma.syncJob.update({
          where: { id: jobId },
          data: {
            progress,
            processedItems: totalProcessed,
            failedItems: totalFailed,
            totalItems: products.length,
          },
        });

        await adapter.waitForRateLimit();
      }

      await this.updateJobStatus(jobId, SyncJobStatus.COMPLETED, {
        processedItems: totalProcessed,
        failedItems: totalFailed,
      });

      this.logger.log(
        `Product export job ${jobId} completed: ${totalProcessed} exported, ${totalFailed} failed`,
      );

      return { totalProcessed, totalFailed };
    } catch (error) {
      this.logger.error(`Product export job ${jobId} failed:`, error);

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

  private async createSyncLog(jobId: string, marketplace: Marketplace, data: any) {
    return this.prisma.syncLog.create({
      data: {
        jobId,
        marketplace,
        ...data,
      },
    });
  }

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);
  }

  @OnQueueCompleted()
  onComplete(job: Job, result: any) {
    this.logger.log(`Completed job ${job.id}: ${JSON.stringify(result)}`);
  }

  @OnQueueFailed()
  onError(job: Job, error: any) {
    this.logger.error(`Failed job ${job.id}: ${error.message}`);
  }
}
