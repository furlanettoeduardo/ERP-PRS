import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({ example: 'PROD-001', description: 'SKU único do produto' })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({ example: 'Notebook Dell Inspiron 15', description: 'Nome do produto' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Notebook com 16GB RAM, SSD 512GB', description: 'Descrição detalhada', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 3500.00, description: 'Preço de venda' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @ApiProperty({ example: 2500.00, description: 'Custo do produto', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  cost?: number;

  @ApiProperty({ example: 10, description: 'Estoque inicial', required: false, default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  currentStock?: number;

  @ApiProperty({ example: 5, description: 'Estoque mínimo', required: false, default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  minStock?: number;

  @ApiProperty({ example: true, description: 'Produto ativo', required: false, default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
