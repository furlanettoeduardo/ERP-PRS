import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum MovementType {
  ENTRY = 'ENTRY',
  EXIT = 'EXIT',
  ADJUSTMENT = 'ADJUSTMENT',
}

export enum MovementOrigin {
  MANUAL = 'MANUAL',
  MARKETPLACE = 'MARKETPLACE',
  ORDER = 'ORDER',
  IMPORT = 'IMPORT',
  OTHER = 'OTHER',
}

export class CreateMovementDto {
  @ApiProperty({ example: 'uuid-do-produto', description: 'ID do produto' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ enum: MovementType, example: MovementType.ENTRY, description: 'Tipo de movimentação' })
  @IsEnum(MovementType)
  @IsNotEmpty()
  type: MovementType;

  @ApiProperty({ example: 10, description: 'Quantidade (sempre positivo)' })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  @ApiProperty({ enum: MovementOrigin, example: MovementOrigin.MANUAL, description: 'Origem da movimentação', required: false })
  @IsEnum(MovementOrigin)
  @IsOptional()
  origin?: MovementOrigin;

  @ApiProperty({ example: 'Recebimento de fornecedor', description: 'Observação', required: false })
  @IsString()
  @IsOptional()
  note?: string;
}
