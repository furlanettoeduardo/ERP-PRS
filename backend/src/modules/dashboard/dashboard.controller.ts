import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Obter resumo de métricas do dashboard' })
  @ApiResponse({
    status: 200,
    description: 'Métricas retornadas com sucesso',
    type: DashboardSummaryDto,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async getSummary(): Promise<DashboardSummaryDto> {
    return this.dashboardService.getSummary();
  }
}
