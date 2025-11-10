import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SyncService } from '../services/sync.service';
import { Marketplace } from '@prisma/client';
import {
  ProductImportDto,
  ProductExportDto,
  StockSyncDto,
  PriceSyncDto,
  CustomerSyncDto,
  ReconciliationDto,
  UpdateSyncConfigDto,
  SyncJobResponseDto,
} from '../dto/sync.dto';

@ApiTags('Sync')
@ApiBearerAuth()
@Controller('sync')
@UseGuards(JwtAuthGuard)
export class SyncController {
  constructor(private syncService: SyncService) {}

  /**
   * IMPORT / EXPORT
   */

  @Post('products/import')
  @ApiOperation({ summary: 'Importa produtos de um marketplace' })
  @ApiResponse({ status: 201, description: 'Job criado' })
  async importProducts(@Body() dto: ProductImportDto) {
    // TODO: Pegar userId do token JWT
    const userId = 'current-user-id';
    return this.syncService.importProducts(dto, userId);
  }

  @Post('products/export')
  @ApiOperation({ summary: 'Exporta produtos para um marketplace' })
  async exportProducts(@Body() dto: ProductExportDto) {
    const userId = 'current-user-id';
    return this.syncService.exportProducts(dto, userId);
  }

  /**
   * SYNC OPERATIONS
   */

  @Post('stock')
  @ApiOperation({ summary: 'Sincroniza estoque com marketplace' })
  async syncStock(@Body() dto: StockSyncDto) {
    const userId = 'current-user-id';
    return this.syncService.syncStock(dto, userId);
  }

  @Post('prices')
  @ApiOperation({ summary: 'Sincroniza preços com marketplace' })
  async syncPrices(@Body() dto: PriceSyncDto) {
    const userId = 'current-user-id';
    return this.syncService.syncPrice(dto, userId);
  }

  @Post('customers')
  @ApiOperation({ summary: 'Sincroniza clientes do marketplace' })
  async syncCustomers(@Body() dto: CustomerSyncDto) {
    const userId = 'current-user-id';
    return this.syncService.syncCustomers(dto, userId);
  }

  /**
   * RECONCILIATION
   */

  @Post('reconcile')
  @ApiOperation({ summary: 'Executa reconciliação para detectar diferenças' })
  async reconcile(@Body() dto: ReconciliationDto) {
    const userId = 'current-user-id';
    return this.syncService.reconcile(dto, userId);
  }

  /**
   * JOBS MANAGEMENT
   */

  @Get('jobs')
  @ApiOperation({ summary: 'Lista jobs de sincronização' })
  async listJobs(
    @Query('marketplace') marketplace?: Marketplace,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    return this.syncService.listJobs({
      marketplace,
      type: type as any,
      status: status as any,
      page: page ? parseInt(page) : 1,
      perPage: perPage ? parseInt(perPage) : 20,
    });
  }

  @Get('jobs/:jobId')
  @ApiOperation({ summary: 'Busca detalhes de um job' })
  async getJob(@Param('jobId') jobId: string) {
    return this.syncService.getJob(jobId);
  }

  @Post('jobs/:jobId/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancela um job em andamento' })
  async cancelJob(@Param('jobId') jobId: string) {
    return this.syncService.cancelJob(jobId);
  }

  @Post('jobs/:jobId/retry')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retenta um job falhado' })
  async retryJob(@Param('jobId') jobId: string) {
    return this.syncService.retryJob(jobId);
  }

  /**
   * CONFIGURATION
   */

  @Get('config/:marketplace')
  @ApiOperation({ summary: 'Busca configuração de sync de um marketplace' })
  async getSyncConfig(@Param('marketplace') marketplace: Marketplace) {
    return this.syncService.getSyncConfig(marketplace);
  }

  @Put('config/:marketplace')
  @ApiOperation({ summary: 'Atualiza configuração de sync' })
  async updateSyncConfig(
    @Param('marketplace') marketplace: Marketplace,
    @Body() dto: UpdateSyncConfigDto,
  ) {
    return this.syncService.updateSyncConfig(marketplace, dto);
  }

  /**
   * STATS / DASHBOARD
   */

  @Get('stats')
  @ApiOperation({ summary: 'Retorna estatísticas de sincronização' })
  async getStats() {
    // Conta jobs por status
    const [pending, processing, completed, failed] = await Promise.all([
      this.syncService.listJobs({ status: 'PENDING' as any }),
      this.syncService.listJobs({ status: 'PROCESSING' as any }),
      this.syncService.listJobs({ status: 'COMPLETED' as any }),
      this.syncService.listJobs({ status: 'FAILED' as any }),
    ]);

    return {
      pending: pending.total,
      processing: processing.total,
      completed: completed.total,
      failed: failed.total,
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Verifica saúde do sistema de sync' })
  async healthCheck() {
    // TODO: Verificar status das filas BullMQ
    return {
      status: 'healthy',
      queues: {
        'product-import': 'active',
        'product-export': 'active',
        'stock-sync': 'active',
        'price-sync': 'active',
        'customer-sync': 'active',
        reconciliation: 'active',
      },
    };
  }
}
