import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { EncryptionService } from './encryption.service';
import {
  MercadoLivreAdapter,
  ShopeeAdapter,
  AmazonAdapter,
  WooCommerceAdapter,
} from './adapters/marketplace.adapters';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [IntegrationsController],
  providers: [
    IntegrationsService,
    EncryptionService,
    MercadoLivreAdapter,
    ShopeeAdapter,
    AmazonAdapter,
    WooCommerceAdapter,
  ],
  exports: [IntegrationsService, EncryptionService],
})
export class IntegrationsModule {}
