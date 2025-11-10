import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from '../../prisma/prisma.module';
import { IntegrationsModule } from '../integrations/integrations.module';

// Controllers
import { SyncController } from './controllers/sync.controller';
import { MappingController } from './controllers/mapping.controller';
import { WooCommerceController } from './controllers/woocommerce.controller';

// Services
import { SyncService } from './services/sync.service';
import { MappingService } from './services/mapping.service';
import { ReconciliationService } from './services/reconciliation.service';
import { RateLimiterService } from './services/rate-limiter.service';

// Adapters
import { WooCommerceAdapter } from './adapters/woocommerce.adapter';
import { MercadoLivreAdapter } from './adapters/mercadolivre.adapter';
import { ShopeeAdapter } from './adapters/shopee.adapter';
import { AmazonAdapter } from './adapters/amazon.adapter';

// Workers/Processors
import { ProductImportProcessor } from './processors/product-import.processor';
import { ProductExportProcessor } from './processors/product-export.processor';
import { StockSyncProcessor } from './processors/stock-sync.processor';
import { PriceSyncProcessor } from './processors/price-sync.processor';
import { CustomerSyncProcessor } from './processors/customer-sync.processor';
import { ReconciliationProcessor } from './processors/reconciliation.processor';

@Module({
  imports: [
    PrismaModule,
    IntegrationsModule,
    BullModule.registerQueue(
      { name: 'product-import' },
      { name: 'product-export' },
      { name: 'stock-sync' },
      { name: 'price-sync' },
      { name: 'customer-sync' },
      { name: 'reconciliation' },
      { name: 'dlq' },
    ),
  ],
  controllers: [SyncController, MappingController, WooCommerceController],
  providers: [
    // Core Services
    SyncService,
    MappingService,
    ReconciliationService,
    RateLimiterService,

    // Adapters
    WooCommerceAdapter,
    MercadoLivreAdapter,
    ShopeeAdapter,
    AmazonAdapter,

    // Processors
    ProductImportProcessor,
    ProductExportProcessor,
    StockSyncProcessor,
    PriceSyncProcessor,
    CustomerSyncProcessor,
    ReconciliationProcessor,
  ],
  exports: [
    SyncService,
    MappingService,
    ReconciliationService,
    // Adapters
    WooCommerceAdapter,
    MercadoLivreAdapter,
    ShopeeAdapter,
    AmazonAdapter,
  ],
})
export class SyncModule {}
