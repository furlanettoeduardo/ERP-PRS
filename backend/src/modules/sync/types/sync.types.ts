/**
 * Types e Interfaces para Sistema de Sincronização
 * ETAPA 07 - Sincronização Completa
 */

import { Marketplace } from '@prisma/client';

// ============================================
// TIPOS DE PRODUTOS
// ============================================

export interface NormalizedProduct {
  externalId: string;
  sku: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  stock?: number;
  images?: string[];
  categories?: string[];
  attributes?: Record<string, any>;
  variations?: NormalizedVariation[];
  active?: boolean;
  metadata?: Record<string, any>;
}

export interface NormalizedVariation {
  externalId: string;
  sku: string;
  name: string;
  attributes: Record<string, string>; // {color: "Red", size: "M"}
  price?: number;
  stock?: number;
  images?: string[];
  active?: boolean;
}

export interface NormalizedCategory {
  externalId: string;
  name: string;
  parentId?: string;
  path?: string[];
  attributes?: CategoryAttribute[];
  metadata?: Record<string, any>;
}

export interface CategoryAttribute {
  id: string;
  name: string;
  required: boolean;
  type: 'text' | 'select' | 'number' | 'boolean';
  options?: string[];
}

// ============================================
// TIPOS DE CLIENTES
// ============================================

export interface NormalizedCustomer {
  externalId: string;
  email?: string;
  name?: string;
  phone?: string;
  document?: string; // CPF/CNPJ
  addresses?: CustomerAddress[];
  metadata?: Record<string, any>;
}

export interface CustomerAddress {
  street: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// ============================================
// TIPOS DE PEDIDOS
// ============================================

export interface NormalizedOrder {
  externalId: string;
  orderNumber: string;
  customer: NormalizedCustomer;
  items: OrderItem[];
  total: number;
  status: string;
  paymentMethod?: string;
  shippingMethod?: string;
  shippingAddress?: CustomerAddress;
  billingAddress?: CustomerAddress;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface OrderItem {
  externalId: string;
  sku: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

// ============================================
// TIPOS DE ESTOQUE
// ============================================

export interface StockUpdate {
  sku: string;
  quantity: number;
  warehouseId?: string;
  operation?: 'set' | 'increment' | 'decrement';
}

export interface StockSyncResult {
  sku: string;
  success: boolean;
  previousStock?: number;
  newStock: number;
  error?: string;
}

// ============================================
// TIPOS DE PREÇO
// ============================================

export interface PriceUpdate {
  sku: string;
  price: number;
  compareAtPrice?: number; // Preço de comparação (antes)
  salePrice?: number; // Preço promocional
}

export interface PriceSyncResult {
  sku: string;
  success: boolean;
  previousPrice?: number;
  newPrice: number;
  error?: string;
}

// ============================================
// RATE LIMITING
// ============================================

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter?: number; // segundos
}

export interface RateLimiterConfig {
  tokensPerInterval: number;
  interval: number; // milliseconds
  maxBurst?: number;
}

// ============================================
// ADAPTER RESPONSES
// ============================================

export interface AdapterResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  rateLimit?: RateLimitInfo;
  metadata?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    hasMore: boolean;
  };
  rateLimit?: RateLimitInfo;
}

// ============================================
// SYNC OPTIONS
// ============================================

export interface SyncOptions {
  batchSize?: number;
  dryRun?: boolean;
  forceUpdate?: boolean;
  filters?: Record<string, any>;
  includeInactive?: boolean;
  skipValidation?: boolean;
}

export interface ProductImportOptions extends SyncOptions {
  sinceDate?: Date;
  categories?: string[];
  skus?: string[];
  updateExisting?: boolean;
}

export interface ProductExportOptions extends SyncOptions {
  productIds?: string[];
  categoryMapping?: boolean;
  priceRules?: boolean;
  stockSync?: boolean;
}

export interface StockSyncOptions extends SyncOptions {
  warehouse?: string;
  skus?: string[];
  fullSync?: boolean;
}

export interface ReconciliationOptions extends SyncOptions {
  entityType: 'product' | 'stock' | 'price' | 'customer' | 'all';
  fixDifferences?: boolean;
  reportOnly?: boolean;
}

// ============================================
// WEBHOOK TYPES
// ============================================

export interface WebhookPayload {
  event: string;
  marketplace: Marketplace;
  data: any;
  timestamp: Date;
  signature?: string;
}

export interface WebhookConfig {
  url: string;
  secret: string;
  events: string[];
  active: boolean;
}

// ============================================
// JOB METADATA
// ============================================

export interface JobMetadata {
  marketplace: Marketplace;
  accountId: string;
  options?: SyncOptions;
  startedBy?: string;
  scheduledJob?: boolean;
}

// ============================================
// RECONCILIATION
// ============================================

export interface ReconciliationResult {
  entityType: string;
  totalChecked: number;
  differences: ReconciliationDifference[];
  summary: {
    matching: number;
    different: number;
    missingLocal: number;
    missingRemote: number;
  };
}

export interface ReconciliationDifference {
  sku?: string;
  externalId?: string;
  localId?: string;
  field: string;
  localValue: any;
  remoteValue: any;
  action?: 'update_local' | 'update_remote' | 'manual';
}

// ============================================
// MAPPING RULES
// ============================================

export interface MappingRule {
  sourceField: string;
  targetField: string;
  transform?: (value: any) => any;
  required?: boolean;
  defaultValue?: any;
}

export interface AttributeMapping {
  [localAttribute: string]: {
    externalAttribute: string;
    transform?: (value: any) => any;
  };
}

// ============================================
// PRICE RULES
// ============================================

export interface PriceRuleFormula {
  type: 'fixed' | 'percentage' | 'markup' | 'markdown';
  value: number;
  roundTo?: number;
}

export interface PriceRuleCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'in';
  value: any;
}

// ============================================
// ERROR TYPES
// ============================================

export class SyncError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false,
    public context?: Record<string, any>,
  ) {
    super(message);
    this.name = 'SyncError';
  }
}

export class RateLimitError extends SyncError {
  constructor(
    message: string,
    public retryAfter: number,
    context?: Record<string, any>,
  ) {
    super(message, 'RATE_LIMIT_EXCEEDED', true, context);
    this.name = 'RateLimitError';
  }
}

export class AuthenticationError extends SyncError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'AUTHENTICATION_FAILED', false, context);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends SyncError {
  constructor(message: string, public errors: any[], context?: Record<string, any>) {
    super(message, 'VALIDATION_FAILED', false, context);
    this.name = 'ValidationError';
  }
}
