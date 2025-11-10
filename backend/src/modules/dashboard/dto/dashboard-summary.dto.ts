import { ApiProperty } from '@nestjs/swagger';

export class DashboardSummaryDto {
  @ApiProperty({
    description: 'Total de usuários cadastrados',
    example: 42,
  })
  usersCount: number;

  @ApiProperty({
    description: 'Usuários ativos no sistema',
    example: 38,
  })
  activeUsers: number;

  @ApiProperty({
    description: 'Timestamp da última atualização',
    example: '2025-11-10T14:30:00.000Z',
  })
  timestamp: string;
}
