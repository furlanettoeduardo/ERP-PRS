import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InventoryService } from './inventory.service';

@ApiTags('inventory-dashboard')
@Controller('inventory/dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InventoryDashboardController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Obter estatísticas do estoque' })
  @ApiResponse({ status: 200, description: 'Estatísticas retornadas com sucesso' })
  getStats() {
    return this.inventoryService.getDashboardStats();
  }
}
