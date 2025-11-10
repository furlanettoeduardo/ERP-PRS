import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsAuthController } from './controllers/integrations-auth.controller';
import { IntegrationsService } from './integrations.service';
import { EncryptionService } from './encryption.service';
import {
  MercadoLivreAuthService,
  ShopeeAuthService,
  WooCommerceAuthService,
  AmazonAuthService,
} from './services/auth.service';
import {
  MercadoLivreAdapter,
  ShopeeAdapter,
  AmazonAdapter,
  WooCommerceAdapter,
} from './adapters/marketplace.adapters';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [IntegrationsController, IntegrationsAuthController],
  providers: [
    IntegrationsService,
    EncryptionService,
    MercadoLivreAuthService,
    ShopeeAuthService,
    WooCommerceAuthService,
    AmazonAuthService,
    MercadoLivreAdapter,
    ShopeeAdapter,
    AmazonAdapter,
    WooCommerceAdapter,
  ],
  exports: [IntegrationsService, EncryptionService],
})
export class IntegrationsModule {}
