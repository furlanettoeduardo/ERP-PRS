import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { InventoryService } from './inventory.service';
import { ProductsController } from './products.controller';
import { MovementsController } from './movements.controller';
import { InventoryDashboardController } from './inventory-dashboard.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ProductsController, MovementsController, InventoryDashboardController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
