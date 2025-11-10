/**
 * DTOs para endpoints de sincronização
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsInt,
  IsArray,
  IsObject,
  Min,
  Max,
  IsDateString,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Marketplace, SyncJobType } from '@prisma/client';

// ============================================
// PRODUCT SYNC DTOs
// ============================================

export class ProductImportDto {
  @ApiProperty({ enum: Marketplace })
  @IsEnum(Marketplace)
  marketplace: Marketplace;

  @ApiProperty()
  @IsString()
  accountId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  sinceDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skus?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  updateExisting?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  batchSize?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;
}

export class ProductExportDto {
  @ApiProperty({ enum: Marketplace })
  @IsEnum(Marketplace)
  marketplace: Marketplace;

  @ApiProperty()
  @IsString()
  accountId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  categoryMapping?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  priceRules?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  stockSync?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  batchSize?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;
}

// ============================================
// STOCK SYNC DTOs
// ============================================

export class StockSyncDto {
  @ApiProperty({ enum: Marketplace })
  @IsEnum(Marketplace)
  marketplace: Marketplace;

  @ApiProperty()
  @IsString()
  accountId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skus?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  warehouseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  fullSync?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  batchSize?: number;
}

export class StockUpdateItemDto {
  @ApiProperty()
  @IsString()
  sku: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  warehouseId?: string;
}

export class BulkStockUpdateDto {
  @ApiProperty({ enum: Marketplace })
  @IsEnum(Marketplace)
  marketplace: Marketplace;

  @ApiProperty()
  @IsString()
  accountId: string;

  @ApiProperty({ type: [StockUpdateItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockUpdateItemDto)
  updates: StockUpdateItemDto[];
}

// ============================================
// PRICE SYNC DTOs
// ============================================

export class PriceSyncDto {
  @ApiProperty({ enum: Marketplace })
  @IsEnum(Marketplace)
  marketplace: Marketplace;

  @ApiProperty()
  @IsString()
  accountId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skus?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  applyRules?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;
}

export class PriceUpdateItemDto {
  @ApiProperty()
  @IsString()
  sku: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  compareAtPrice?: number;
}

export class BulkPriceUpdateDto {
  @ApiProperty({ enum: Marketplace })
  @IsEnum(Marketplace)
  marketplace: Marketplace;

  @ApiProperty()
  @IsString()
  accountId: string;

  @ApiProperty({ type: [PriceUpdateItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriceUpdateItemDto)
  updates: PriceUpdateItemDto[];
}

// ============================================
// CUSTOMER SYNC DTOs
// ============================================

export class CustomerSyncDto {
  @ApiProperty({ enum: Marketplace })
  @IsEnum(Marketplace)
  marketplace: Marketplace;

  @ApiProperty()
  @IsString()
  accountId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  sinceDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  batchSize?: number;
}

// ============================================
// RECONCILIATION DTOs
// ============================================

export class ReconciliationDto {
  @ApiProperty({ enum: Marketplace })
  @IsEnum(Marketplace)
  marketplace: Marketplace;

  @ApiProperty()
  @IsString()
  accountId: string;

  @ApiProperty({ enum: ['product', 'stock', 'price', 'customer', 'all'] })
  @IsEnum(['product', 'stock', 'price', 'customer', 'all'])
  entityType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  fixDifferences?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  reportOnly?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skus?: string[];
}

// ============================================
// MAPPING DTOs
// ============================================

export class ProductMappingDto {
  @ApiProperty()
  @IsString()
  productId: string;

  @ApiProperty({ enum: Marketplace })
  @IsEnum(Marketplace)
  marketplace: Marketplace;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  externalCategoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  attributeMapping?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  priceAdjustment?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(['fixed', 'percentage'])
  priceAdjustmentType?: string;
}

export class CategoryMappingDto {
  @ApiProperty({ enum: Marketplace })
  @IsEnum(Marketplace)
  marketplace: Marketplace;

  @ApiProperty()
  @IsString()
  externalCategoryId: string;

  @ApiProperty()
  @IsString()
  externalCategoryName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  localCategoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  localCategoryName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  attributesSchema?: Record<string, any>;
}

// ============================================
// SYNC CONFIG DTOs
// ============================================

export class UpdateSyncConfigDto {
  @ApiProperty({ enum: Marketplace })
  @IsEnum(Marketplace)
  marketplace: Marketplace;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(30)
  stockSyncInterval?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(300)
  priceSyncInterval?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(3600)
  productSyncInterval?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  autoSync?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(['erp', 'marketplace', 'hybrid'])
  sourceOfTruth?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(500)
  batchSize?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(10)
  rateLimitPerMinute?: number;
}

// ============================================
// RESPONSE DTOs
// ============================================

export class SyncJobResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: SyncJobType })
  type: SyncJobType;

  @ApiProperty({ enum: Marketplace })
  marketplace: Marketplace;

  @ApiProperty()
  status: string;

  @ApiProperty()
  progress: number;

  @ApiPropertyOptional()
  totalItems?: number;

  @ApiPropertyOptional()
  processedItems?: number;

  @ApiPropertyOptional()
  failedItems?: number;

  @ApiPropertyOptional()
  startedAt?: Date;

  @ApiPropertyOptional()
  finishedAt?: Date;

  @ApiPropertyOptional()
  error?: string;

  @ApiProperty()
  createdAt: Date;
}

export class SyncJobListResponseDto {
  @ApiProperty({ type: [SyncJobResponseDto] })
  jobs: SyncJobResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  perPage: number;
}
