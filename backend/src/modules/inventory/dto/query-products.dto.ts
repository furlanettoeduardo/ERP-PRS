import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryProductsDto {
  @ApiProperty({ example: 'notebook', description: 'Buscar por nome ou SKU', required: false })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({ example: 1, description: 'Número da página', required: false, default: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiProperty({ example: 20, description: 'Itens por página', required: false, default: 20 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
