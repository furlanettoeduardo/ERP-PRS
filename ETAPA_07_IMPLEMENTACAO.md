# ETAPA 07 - PARTE 2: Implementações Complementares

## 🔌 3. Sync Service (Orquestração)

**Arquivo:** `backend/src/modules/sync/services/sync.service.ts`

```typescript
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../../prisma/prisma.service';
import { Marketplace, SyncJobType, SyncJobStatus } from '@prisma/client';
import {
  ProductImportDto,
  ProductExportDto,
  StockSyncDto,
  PriceSyncDto,
  CustomerSyncDto,
  ReconciliationDto,
} from '../dto/sync.dto';

@Injectable()
export class SyncService {
  private logger = new Logger(SyncService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue('product-import') private productImportQueue: Queue,
    @InjectQueue('product-export') private productExportQueue: Queue,
    @InjectQueue('stock-sync') private stockSyncQueue: Queue,
    @InjectQueue('price-sync') private priceSyncQueue: Queue,
    @InjectQueue('customer-sync') private customerSyncQueue: Queue,
    @InjectQueue('reconciliation') private reconciliationQueue: Queue,
  ) {}

  /**
   * Importa produtos do marketplace
   */
  async importProducts(dto: ProductImportDto, userId: string) {
    this.logger.log(`Creating product import job for ${dto.marketplace}`);

    const job = await this.prisma.syncJob.create({
      data: {
        type: SyncJobType.PRODUCT_IMPORT,
        marketplace: dto.marketplace,
        accountId: dto.accountId,
        status: SyncJobStatus.PENDING,
        meta: {
          options: {
            sinceDate: dto.sinceDate,
            categories: dto.categories,
            skus: dto.skus,
            updateExisting: dto.updateExisting,
            batchSize: dto.batchSize || 50,
            dryRun: dto.dryRun || false,
          },
          userId,
        },
      },
    });

    // Enfileira job
    await this.productImportQueue.add(
      'import',
      {
        jobId: job.id,
        marketplace: dto.marketplace,
        accountId: dto.accountId,
        options: job.meta,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: false,
        removeOnFail: false,
      },
    );

    this.logger.log(`Product import job ${job.id} enqueued`);
    return job;
  }

  /**
   * Exporta produtos para marketplace
   */
  async exportProducts(dto: ProductExportDto, userId: string) {
    this.logger.log(`Creating product export job for ${dto.marketplace}`);

    const job = await this.prisma.syncJob.create({
      data: {
        type: SyncJobType.PRODUCT_EXPORT,
        marketplace: dto.marketplace,
        accountId: dto.accountId,
        status: SyncJobStatus.PENDING,
        meta: {
          options: {
            productIds: dto.productIds,
            categoryMapping: dto.categoryMapping,
            priceRules: dto.priceRules,
            stockSync: dto.stockSync,
            batchSize: dto.batchSize || 20,
            dryRun: dto.dryRun || false,
          },
          userId,
        },
      },
    });

    await this.productExportQueue.add(
      'export',
      {
        jobId: job.id,
        marketplace: dto.marketplace,
        accountId: dto.accountId,
        options: job.meta,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    );

    return job;
  }

  /**
   * Sincroniza estoque
   */
  async syncStock(dto: StockSyncDto, userId: string) {
    const job = await this.prisma.syncJob.create({
      data: {
        type: SyncJobType.STOCK_SYNC,
        marketplace: dto.marketplace,
        accountId: dto.accountId,
        status: SyncJobStatus.PENDING,
        meta: {
          options: {
            skus: dto.skus,
            warehouseId: dto.warehouseId,
            fullSync: dto.fullSync,
            batchSize: dto.batchSize || 100,
          },
          userId,
        },
      },
    });

    await this.stockSyncQueue.add(
      'sync',
      {
        jobId: job.id,
        marketplace: dto.marketplace,
        accountId: dto.accountId,
        options: job.meta,
      },
      {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );

    return job;
  }

  /**
   * Sincroniza preços
   */
  async syncPrice(dto: PriceSyncDto, userId: string) {
    const job = await this.prisma.syncJob.create({
      data: {
        type: SyncJobType.PRICE_SYNC,
        marketplace: dto.marketplace,
        accountId: dto.accountId,
        status: SyncJobStatus.PENDING,
        meta: {
          options: {
            skus: dto.skus,
            applyRules: dto.applyRules,
            dryRun: dto.dryRun,
          },
          userId,
        },
      },
    });

    await this.priceSyncQueue.add(
      'sync',
      {
        jobId: job.id,
        marketplace: dto.marketplace,
        accountId: dto.accountId,
        options: job.meta,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 3000,
        },
      },
    );

    return job;
  }

  /**
   * Sincroniza clientes
   */
  async syncCustomers(dto: CustomerSyncDto, userId: string) {
    const job = await this.prisma.syncJob.create({
      data: {
        type: SyncJobType.CUSTOMER_SYNC,
        marketplace: dto.marketplace,
        accountId: dto.accountId,
        status: SyncJobStatus.PENDING,
        meta: {
          options: {
            sinceDate: dto.sinceDate,
            batchSize: dto.batchSize || 50,
          },
          userId,
        },
      },
    });

    await this.customerSyncQueue.add(
      'sync',
      {
        jobId: job.id,
        marketplace: dto.marketplace,
        accountId: dto.accountId,
        options: job.meta,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    );

    return job;
  }

  /**
   * Executa reconciliação
   */
  async reconcile(dto: ReconciliationDto, userId: string) {
    const job = await this.prisma.syncJob.create({
      data: {
        type: SyncJobType.RECONCILIATION,
        marketplace: dto.marketplace,
        accountId: dto.accountId,
        status: SyncJobStatus.PENDING,
        meta: {
          options: {
            entityType: dto.entityType,
            fixDifferences: dto.fixDifferences,
            reportOnly: dto.reportOnly,
            skus: dto.skus,
          },
          userId,
        },
      },
    });

    await this.reconciliationQueue.add(
      'reconcile',
      {
        jobId: job.id,
        marketplace: dto.marketplace,
        accountId: dto.accountId,
        options: job.meta,
      },
      {
        attempts: 1,
        timeout: 300000, // 5 minutos
      },
    );

    return job;
  }

  /**
   * Lista jobs com paginação e filtros
   */
  async listJobs(filters?: {
    marketplace?: Marketplace;
    type?: SyncJobType;
    status?: SyncJobStatus;
    page?: number;
    perPage?: number;
  }) {
    const page = filters?.page || 1;
    const perPage = filters?.perPage || 20;
    const skip = (page - 1) * perPage;

    const where: any = {};
    if (filters?.marketplace) where.marketplace = filters.marketplace;
    if (filters?.type) where.type = filters.type;
    if (filters?.status) where.status = filters.status;

    const [jobs, total] = await Promise.all([
      this.prisma.syncJob.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.syncJob.count({ where }),
    ]);

    return {
      jobs,
      total,
      page,
      perPage,
    };
  }

  /**
   * Busca job por ID
   */
  async getJob(jobId: string) {
    const job = await this.prisma.syncJob.findUnique({
      where: { id: jobId },
      include: {
        logs: {
          take: 100,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!job) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }

    return job;
  }

  /**
   * Atualiza status do job
   */
  async updateJobStatus(
    jobId: string,
    status: SyncJobStatus,
    data?: {
      progress?: number;
      totalItems?: number;
      processedItems?: number;
      failedItems?: number;
      error?: string;
    },
  ) {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === SyncJobStatus.PROCESSING && !data) {
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

  /**
   * Cancela um job
   */
  async cancelJob(jobId: string) {
    const job = await this.getJob(jobId);

    if (job.status === SyncJobStatus.COMPLETED || job.status === SyncJobStatus.FAILED) {
      throw new Error('Cannot cancel completed or failed job');
    }

    // TODO: Remover job da fila BullMQ
    // Requer buscar job na fila e remover

    return this.updateJobStatus(jobId, SyncJobStatus.CANCELLED);
  }

  /**
   * Retenta job falhado
   */
  async retryJob(jobId: string) {
    const job = await this.getJob(jobId);

    if (job.status !== SyncJobStatus.FAILED) {
      throw new Error('Only failed jobs can be retried');
    }

    // Limpa logs anteriores
    await this.prisma.syncLog.deleteMany({
      where: { jobId },
    });

    // Reseta job
    await this.prisma.syncJob.update({
      where: { id: jobId },
      data: {
        status: SyncJobStatus.PENDING,
        progress: 0,
        processedItems: 0,
        failedItems: 0,
        error: null,
        retryCount: { increment: 1 },
        startedAt: null,
        finishedAt: null,
      },
    });

    // Re-enfileira baseado no tipo
    const queueMap = {
      [SyncJobType.PRODUCT_IMPORT]: this.productImportQueue,
      [SyncJobType.PRODUCT_EXPORT]: this.productExportQueue,
      [SyncJobType.STOCK_SYNC]: this.stockSyncQueue,
      [SyncJobType.PRICE_SYNC]: this.priceSyncQueue,
      [SyncJobType.CUSTOMER_SYNC]: this.customerSyncQueue,
      [SyncJobType.RECONCILIATION]: this.reconciliationQueue,
    };

    const queue = queueMap[job.type];
    await queue.add('retry', {
      jobId: job.id,
      marketplace: job.marketplace,
      accountId: job.accountId,
      options: job.meta,
    });

    return job;
  }

  /**
   * Busca configuração de sync por marketplace
   */
  async getSyncConfig(marketplace: Marketplace) {
    let config = await this.prisma.syncConfig.findUnique({
      where: { marketplace },
    });

    if (!config) {
      // Cria config padrão
      config = await this.prisma.syncConfig.create({
        data: {
          marketplace,
          enabled: false,
          autoSync: false,
        },
      });
    }

    return config;
  }

  /**
   * Atualiza configuração de sync
   */
  async updateSyncConfig(marketplace: Marketplace, data: any) {
    return this.prisma.syncConfig.upsert({
      where: { marketplace },
      create: {
        marketplace,
        ...data,
      },
      update: data,
    });
  }
}
```

## 🔄 4. Product Import Processor (Worker)

**Arquivo:** `backend/src/modules/sync/processors/product-import.processor.ts`

```typescript
import { Processor, Process, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../../prisma/prisma.service';
import { IntegrationsService } from '../../integrations/integrations.service';
import { WooCommerceAdapter } from '../adapters/woocommerce.adapter';
import { MercadoLivreAdapter } from '../adapters/mercadolivre.adapter';
import { ShopeeAdapter } from '../adapters/shopee.adapter';
import { AmazonAdapter } from '../adapters/amazon.adapter';
import { SyncJobStatus, SyncAction, Marketplace } from '@prisma/client';
import { IMarketplaceAdapter } from '../interfaces/adapter.interface';

@Processor('product-import')
export class ProductImportProcessor {
  private logger = new Logger(ProductImportProcessor.name);

  constructor(
    private prisma: PrismaService,
    private integrationsService: IntegrationsService,
    private wooAdapter: WooCommerceAdapter,
    private mlAdapter: MercadoLivreAdapter,
    private shopeeAdapter: ShopeeAdapter,
    private amazonAdapter: AmazonAdapter,
  ) {}

  @Process('import')
  async handleImport(job: Job) {
    const { jobId, marketplace, accountId, options } = job.data;

    this.logger.log(`Processing product import job ${jobId} for ${marketplace}`);

    try {
      // Atualiza job para PROCESSING
      await this.updateJobStatus(jobId, SyncJobStatus.PROCESSING);

      // Busca credenciais
      const integration = await this.integrationsService.getIntegrationByMarketplace(
        accountId,
        marketplace,
      );

      if (!integration || !integration.credentials) {
        throw new Error('Integration credentials not found');
      }

      // Seleciona adapter
      const adapter = this.getAdapter(marketplace);

      // Busca produtos do marketplace com paginação
      let page = 1;
      let hasMore = true;
      let totalProcessed = 0;
      let totalFailed = 0;

      while (hasMore) {
        const response = await adapter.fetchProducts(
          integration.credentials,
          {
            ...options.options,
            filters: { page },
          },
        );

        for (const product of response.data) {
          try {
            await this.importProduct(product, marketplace, accountId, jobId);
            totalProcessed++;
          } catch (error) {
            this.logger.error(`Failed to import product ${product.sku}:`, error);
            totalFailed++;

            // Log erro
            await this.createSyncLog(jobId, marketplace, {
              externalId: product.externalId,
              sku: product.sku,
              action: SyncAction.CREATE,
              result: 'failed',
              error: error.message,
            });
          }

          // Atualiza progresso
          const progress = Math.min(
            Math.round((totalProcessed / (response.pagination.total || 1)) * 100),
            100,
          );

          await this.prisma.syncJob.update({
            where: { id: jobId },
            data: {
              progress,
              processedItems: totalProcessed,
              failedItems: totalFailed,
              totalItems: response.pagination.total,
            },
          });
        }

        hasMore = response.pagination.hasMore;
        page++;

        // Aguarda rate limit
        await adapter.waitForRateLimit();
      }

      // Finaliza job
      await this.updateJobStatus(jobId, SyncJobStatus.COMPLETED, {
        processedItems: totalProcessed,
        failedItems: totalFailed,
      });

      this.logger.log(`Product import job ${jobId} completed: ${totalProcessed} imported, ${totalFailed} failed`);

      return { totalProcessed, totalFailed };
    } catch (error) {
      this.logger.error(`Product import job ${jobId} failed:`, error);

      await this.updateJobStatus(jobId, SyncJobStatus.FAILED, {
        error: error.message,
      });

      throw error;
    }
  }

  private async importProduct(
    product: any,
    marketplace: Marketplace,
    accountId: string,
    jobId: string,
  ) {
    // Verifica se produto já existe por SKU
    let localProduct = await this.prisma.product.findUnique({
      where: { sku: product.sku },
    });

    if (!localProduct) {
      // Cria novo produto
      localProduct = await this.prisma.product.create({
        data: {
          sku: product.sku,
          name: product.name,
          description: product.description,
          price: product.price,
          cost: product.cost,
          currentStock: product.stock || 0,
          active: product.active !== false,
        },
      });

      this.logger.log(`Created product ${product.sku} from ${marketplace}`);
    } else {
      // Atualiza produto existente (se opção updateExisting estiver ativa)
      localProduct = await this.prisma.product.update({
        where: { id: localProduct.id },
        data: {
          name: product.name,
          description: product.description,
          price: product.price,
          currentStock: product.stock || localProduct.currentStock,
        },
      });

      this.logger.log(`Updated product ${product.sku} from ${marketplace}`);
    }

    // Cria/atualiza mapeamento marketplace
    await this.prisma.marketplaceProduct.upsert({
      where: {
        marketplace_marketplaceItemId: {
          marketplace,
          marketplaceItemId: product.externalId,
        },
      },
      create: {
        marketplace,
        marketplaceItemId: product.externalId,
        productId: localProduct.id,
        sku: product.sku,
        status: product.active !== false ? 'active' : 'inactive',
        syncedAt: new Date(),
        extraData: product.metadata,
      },
      update: {
        productId: localProduct.id,
        sku: product.sku,
        status: product.active !== false ? 'active' : 'inactive',
        syncedAt: new Date(),
        extraData: product.metadata,
      },
    });

    // Log sucesso
    await this.createSyncLog(jobId, marketplace, {
      externalId: product.externalId,
      localId: localProduct.id,
      sku: product.sku,
      action: SyncAction.CREATE,
      result: 'success',
      payload: product,
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

  private async updateJobStatus(
    jobId: string,
    status: SyncJobStatus,
    data?: any,
  ) {
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

  private async createSyncLog(
    jobId: string,
    marketplace: Marketplace,
    data: any,
  ) {
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
```

## 🎨 5. Frontend - Dashboard Principal

**Arquivo:** `frontend/app/sync/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import api from '@/lib/api';

interface JobStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

interface SyncJob {
  id: string;
  type: string;
  marketplace: string;
  status: string;
  progress: number;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
}

export default function SyncDashboardPage() {
  const [stats, setStats] = useState<JobStats | null>(null);
  const [recentJobs, setRecentJobs] = useState<SyncJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, jobsRes] = await Promise.all([
        api.get('/sync/stats'),
        api.get('/sync/jobs?perPage=10'),
      ]);

      setStats(statsRes.data);
      setRecentJobs(jobsRes.data.jobs);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunImport = async (marketplace: string) => {
    try {
      await api.post('/sync/products/import', {
        marketplace,
        accountId: 'user-integration-id', // TODO: Buscar do contexto
      });

      alert('Import iniciado!');
      fetchDashboardData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao iniciar import');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sincronização</h1>
        <p className="text-gray-600 mt-2">
          Gerencie a sincronização de dados entre ERP e marketplaces
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600">Pendentes</h3>
          <p className="text-3xl font-bold text-yellow-600 mt-2">{stats?.pending || 0}</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600">Processando</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">{stats?.processing || 0}</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600">Completos</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">{stats?.completed || 0}</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600">Falhas</h3>
          <p className="text-3xl font-bold text-red-600 mt-2">{stats?.failed || 0}</p>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => handleRunImport('WOOCOMMERCE')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            🏪 Importar Produtos WooCommerce
          </button>

          <button
            onClick={() => handleRunImport('MERCADO_LIVRE')}
            className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
          >
            🛒 Importar Produtos Mercado Livre
          </button>

          <button
            onClick={() => alert('Em desenvolvimento')}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            📦 Sincronizar Estoque (Todos)
          </button>

          <button
            onClick={() => alert('Em desenvolvimento')}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            💰 Sincronizar Preços (Todos)
          </button>
        </div>
      </Card>

      {/* Recent Jobs */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Jobs Recentes</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Marketplace
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Progresso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentJobs.map((job) => (
                <tr key={job.id}>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {job.type}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {job.marketplace}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      job.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      job.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                      job.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {job.progress}%
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(job.createdAt).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <a
                      href={`/sync/jobs/${job.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Detalhes
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
```

## 🧪 6. Testes

**Arquivo:** `backend/src/modules/sync/adapters/woocommerce.adapter.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { WooCommerceAdapter } from './woocommerce.adapter';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

describe('WooCommerceAdapter', () => {
  let adapter: WooCommerceAdapter;
  let mockAxios: MockAdapter;

  const credentials = {
    storeUrl: 'https://test.com',
    consumerKey: 'ck_test',
    consumerSecret: 'cs_test',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WooCommerceAdapter],
    }).compile();

    adapter = module.get<WooCommerceAdapter>(WooCommerceAdapter);
    mockAxios = new MockAdapter(axios);
  });

  afterEach(() => {
    mockAxios.reset();
  });

  describe('fetchProducts', () => {
    it('should fetch and normalize products', async () => {
      const mockProducts = [
        {
          id: 123,
          sku: 'TEST-001',
          name: 'Test Product',
          description: 'Test description',
          price: '99.99',
          regular_price: '99.99',
          stock_quantity: 10,
          status: 'publish',
          images: [{ src: 'https://test.com/image.jpg' }],
          categories: [{ id: 1, name: 'Test Category' }],
          attributes: [],
        },
      ];

      mockAxios.onGet(/products/).reply(200, mockProducts, {
        'x-wp-total': '1',
        'x-wp-totalpages': '1',
      });

      const result = await adapter.fetchProducts(credentials);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].sku).toBe('TEST-001');
      expect(result.data[0].price).toBe(99.99);
      expect(result.pagination.total).toBe(1);
    });

    it('should handle rate limit errors', async () => {
      mockAxios.onGet(/products/).reply(429, null, {
        'retry-after': '60',
      });

      await expect(adapter.fetchProducts(credentials)).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('updateStock', () => {
    it('should update stock for multiple SKUs', async () => {
      // Mock busca produto por SKU
      mockAxios.onGet(/products\?sku=TEST-001/).reply(200, [
        { id: 123, sku: 'TEST-001', stock_quantity: 5 },
      ]);

      // Mock atualização
      mockAxios.onPut(/products\/123/).reply(200, {
        id: 123,
        stock_quantity: 10,
      });

      const result = await adapter.updateStock(credentials, [
        { sku: 'TEST-001', quantity: 10 },
      ]);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].success).toBe(true);
      expect(result.data[0].newStock).toBe(10);
    });
  });
});
```

## 🚀 7. Instalação e Deployment

### Instalar Dependências

```bash
cd backend
npm install @nestjs/bull bull redis
npm install @nestjs/schedule
npm install --save-dev @types/bull axios-mock-adapter

cd ../frontend
# Dependências já instaladas (axios, react-query)
```

### Adicionar ao app.module.ts

```typescript
import { BullModule } from '@nestjs/bull';
import { SyncModule } from './modules/sync/sync.module';

@Module({
  imports: [
    // ... outros imports
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      },
    }),
    SyncModule,
  ],
})
export class AppModule {}
```

### Rodar Migrations

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

### Testar

```bash
# Backend
npm run test

# Rodar servidor
npm run start:dev

# Frontend
npm run dev
```

## 📝 Checklist de Implementação

- [x] Schema Prisma e migrations
- [x] Types e interfaces
- [x] DTOs completos
- [x] Rate Limiter Service
- [x] WooCommerce Adapter (completo)
- [ ] Adapters: Mercado Livre, Shopee, Amazon
- [ ] Sync Service
- [ ] Mapping Service
- [ ] Reconciliation Service
- [ ] 6 Workers/Processors
- [ ] Controllers
- [ ] Frontend Dashboard
- [ ] Frontend páginas por marketplace
- [ ] Testes completos
- [ ] Documentação API

**STATUS:** Implementação base concluída (40%). Adapters, services, workers e frontend requerem implementação completa seguindo os exemplos fornecidos.

