/**
 * Interface base para Marketplace Adapters
 * Define contrato padrão que todos os adapters devem implementar
 */

import {
  NormalizedProduct,
  NormalizedCustomer,
  NormalizedCategory,
  NormalizedOrder,
  StockUpdate,
  PriceUpdate,
  AdapterResponse,
  PaginatedResponse,
  ProductImportOptions,
  WebhookConfig,
  RateLimitInfo,
} from '../types/sync.types';

export interface IMarketplaceAdapter {
  /**
   * Nome do marketplace
   */
  readonly name: string;

  /**
   * Valida credenciais de acesso
   */
  validateCredentials(credentials: any): Promise<AdapterResponse<boolean>>;

  // ============================================
  // PRODUTOS
  // ============================================

  /**
   * Busca produtos do marketplace com paginação
   */
  fetchProducts(
    credentials: any,
    options?: ProductImportOptions,
  ): Promise<PaginatedResponse<NormalizedProduct>>;

  /**
   * Busca um produto específico por ID externo
   */
  fetchProduct(
    credentials: any,
    externalId: string,
  ): Promise<AdapterResponse<NormalizedProduct>>;

  /**
   * Cria um novo produto no marketplace
   */
  createProduct(
    credentials: any,
    product: NormalizedProduct,
    idempotencyKey?: string,
  ): Promise<AdapterResponse<{ externalId: string }>>;

  /**
   * Atualiza um produto existente
   */
  updateProduct(
    credentials: any,
    externalId: string,
    product: Partial<NormalizedProduct>,
    idempotencyKey?: string,
  ): Promise<AdapterResponse<boolean>>;

  /**
   * Deleta um produto (ou marca como inativo)
   */
  deleteProduct(
    credentials: any,
    externalId: string,
  ): Promise<AdapterResponse<boolean>>;

  // ============================================
  // CATEGORIAS
  // ============================================

  /**
   * Busca categorias disponíveis no marketplace
   */
  fetchCategories(
    credentials: any,
    parentId?: string,
  ): Promise<PaginatedResponse<NormalizedCategory>>;

  /**
   * Busca atributos obrigatórios para uma categoria
   */
  fetchCategoryAttributes(
    credentials: any,
    categoryId: string,
  ): Promise<AdapterResponse<any[]>>;

  // ============================================
  // ESTOQUE
  // ============================================

  /**
   * Atualiza estoque de um ou mais produtos
   */
  updateStock(
    credentials: any,
    updates: StockUpdate[],
  ): Promise<AdapterResponse<any[]>>;

  /**
   * Busca estoque atual de produtos
   */
  fetchStock(
    credentials: any,
    skus: string[],
  ): Promise<AdapterResponse<Record<string, number>>>;

  // ============================================
  // PREÇOS
  // ============================================

  /**
   * Atualiza preços de um ou mais produtos
   */
  updatePrice(
    credentials: any,
    updates: PriceUpdate[],
  ): Promise<AdapterResponse<any[]>>;

  /**
   * Busca preços atuais de produtos
   */
  fetchPrices(
    credentials: any,
    skus: string[],
  ): Promise<AdapterResponse<Record<string, number>>>;

  // ============================================
  // CLIENTES
  // ============================================

  /**
   * Busca clientes do marketplace
   */
  fetchCustomers(
    credentials: any,
    options?: { page?: number; perPage?: number; sinceDate?: Date },
  ): Promise<PaginatedResponse<NormalizedCustomer>>;

  /**
   * Busca um cliente específico
   */
  fetchCustomer(
    credentials: any,
    externalId: string,
  ): Promise<AdapterResponse<NormalizedCustomer>>;

  /**
   * Cria ou atualiza um cliente
   */
  upsertCustomer(
    credentials: any,
    customer: NormalizedCustomer,
  ): Promise<AdapterResponse<{ externalId: string }>>;

  // ============================================
  // PEDIDOS
  // ============================================

  /**
   * Busca pedidos do marketplace
   */
  fetchOrders(
    credentials: any,
    options?: { page?: number; perPage?: number; sinceDate?: Date; status?: string[] },
  ): Promise<PaginatedResponse<NormalizedOrder>>;

  /**
   * Busca um pedido específico
   */
  fetchOrder(
    credentials: any,
    externalId: string,
  ): Promise<AdapterResponse<NormalizedOrder>>;

  // ============================================
  // WEBHOOKS
  // ============================================

  /**
   * Registra webhook no marketplace
   */
  createWebhook(
    credentials: any,
    config: WebhookConfig,
  ): Promise<AdapterResponse<{ webhookId: string }>>;

  /**
   * Remove webhook
   */
  deleteWebhook(
    credentials: any,
    webhookId: string,
  ): Promise<AdapterResponse<boolean>>;

  /**
   * Valida assinatura de webhook
   */
  validateWebhookSignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean;

  // ============================================
  // RATE LIMITING
  // ============================================

  /**
   * Retorna informações de rate limit
   */
  getRateLimitInfo(): RateLimitInfo | null;

  /**
   * Aguarda até que rate limit seja liberado
   */
  waitForRateLimit(): Promise<void>;

  // ============================================
  // UTILIDADES
  // ============================================

  /**
   * Normaliza erro da API do marketplace para formato padrão
   */
  normalizeError(error: any): { message: string; code: string; retryable: boolean };
}
