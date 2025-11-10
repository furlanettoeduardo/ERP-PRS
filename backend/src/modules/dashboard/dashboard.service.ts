import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(): Promise<DashboardSummaryDto> {
    // Buscar dados reais do banco
    const [usersCount, activeUsers] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { active: true } }),
    ]);

    return {
      usersCount,
      activeUsers,
      timestamp: new Date().toISOString(),
    };
  }
}
