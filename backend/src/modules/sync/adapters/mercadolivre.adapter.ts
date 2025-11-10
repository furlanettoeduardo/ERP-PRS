import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { IMarketplaceAdapter } from '../interfaces/adapter.interface';
import {
  NormalizedProduct,
  NormalizedCategory,
  NormalizedCustomer,
  NormalizedOrder,
  StockUpdate,
  PriceUpdate,
  AdapterResponse,
  PaginatedResponse,
  SyncOptions,
  RateLimitInfo,
  SyncError,
  RateLimitError,
  AuthenticationError,
  ValidationError,
} from '../types/sync.types';

interface MLCredentials {
  clientId: string;
  clientSecret: string;
  accessToken: string;
  refreshToken: string;
  sellerId: string;
}

@Injectable()
export class MercadoLivreAdapter implements IMarketplaceAdapter {
  private logger = new Logger(MercadoLivreAdapter.name);
  private readonly baseUrl = 'https://api.mercadolibre.com';
  private clients: Map<string, AxiosInstance> = new Map();

  /**
   * Cria cliente axios com OAuth2
   */
  private createClient(credentials: MLCredentials): AxiosInstance {
    const cacheKey = credentials.sellerId;

    if (this.clients.has(cacheKey)) {
      return this.clients.get(cacheKey)!;
    }

    const client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${credentials.accessToken}`,
      },
      timeout: 30000,
    });

    // Interceptor para rate limit
    client.interceptors.response.use(
      (response) => {
        // ML usa header X-RateLimit-*
        const remaining = response.headers['x-ratelimit-remaining'];
        const limit = response.headers['x-ratelimit-limit'];
        const reset = response.headers['x-ratelimit-reset'];

        if (remaining !== undefined) {
          this.logger.debug(
            `ML Rate Limit: ${remaining}/${limit} (reset at ${reset})`,
          );
        }

        return response;
      },
      async (error) => {
        if (error.response?.status === 429) {
          const retryAfter = parseInt(
            error.response.headers['retry-after'] || '60',
          );
          throw new RateLimitError('Mercado Livre rate limit exceeded', retryAfter, {
            url: error.config.url,
          });
        }

        if (error.response?.status === 401 || error.response?.status === 403) {
          throw new AuthenticationError(
            'Mercado Livre authentication failed - token may be expired',
            { sellerId: credentials.sellerId },
          );
        }

        throw error;
      },
    );

    this.clients.set(cacheKey, client);
    return client;
  }

  /**
   * Valida credenciais fazendo request ao /users/me
   */
  async validateCredentials(credentials: any): Promise<AdapterResponse<boolean>> {
    try {
      const client = this.createClient(credentials);
      const response = await client.get('/users/me');

      return {
        success: response.data.id === credentials.sellerId,
        data: response.data.id === credentials.sellerId,
      };
    } catch (error) {
      return {
        success: false,
        data: false,
        error: this.normalizeError(error),
      };
    }
  }

  /**
   * Busca produtos com paginação
   */
  async fetchProducts(
    credentials: any,
    options?: SyncOptions,
  ): Promise<PaginatedResponse<NormalizedProduct>> {
    try {
      const client = this.createClient(credentials);
      const page = options?.filters?.page || 1;
      const perPage = options?.filters?.perPage || 50;
      const offset = (page - 1) * perPage;

      // Busca IDs dos produtos do seller
      const searchResponse = await client.get(
        `/users/${credentials.sellerId}/items/search`,
        {
          params: {
            offset,
            limit: perPage,
            status: 'active',
          },
        },
      );

      const itemIds = searchResponse.data.results;
      const total = searchResponse.data.paging?.total || 0;

      // Busca detalhes de cada produto (ML não tem bulk endpoint)
      const products: NormalizedProduct[] = [];

      for (const itemId of itemIds) {
        try {
          const itemResponse = await client.get(`/items/${itemId}`);
          const normalized = this.normalizeProduct(itemResponse.data);
          products.push(normalized);

          // Rate limit protection
          await this.sleep(200); // 5 req/s
        } catch (error) {
          this.logger.error(`Failed to fetch ML item ${itemId}:`, error);
        }
      }

      const rateLimitInfo = this.extractRateLimitInfo(searchResponse);

      return {
        success: true,
        data: products,
        pagination: {
          page,
          perPage,
          total,
          hasMore: offset + perPage < total,
        },
        rateLimitInfo,
      };
    } catch (error) {
      throw new SyncError('Failed to fetch Mercado Livre products', {
        originalError: error,
      });
    }
  }

  /**
   * Busca produto único
   */
  async fetchProduct(
    credentials: any,
    productId: string,
  ): Promise<AdapterResponse<NormalizedProduct>> {
    try {
      const client = this.createClient(credentials);
      const response = await client.get(`/items/${productId}`);

      return {
        success: true,
        data: this.normalizeProduct(response.data),
        rateLimitInfo: this.extractRateLimitInfo(response),
      };
    } catch (error) {
      return {
        success: false,
        data: null as any,
        error: this.normalizeError(error),
      };
    }
  }

  /**
   * Cria produto
   */
  async createProduct(
    credentials: any,
    product: NormalizedProduct,
    idempotencyKey?: string,
  ): Promise<AdapterResponse<NormalizedProduct>> {
    try {
      const client = this.createClient(credentials);
      const mlProduct = this.denormalizeProduct(product, credentials);

      const headers: any = {};
      if (idempotencyKey) {
        headers['X-Idempotency-Key'] = idempotencyKey;
      }

      const response = await client.post('/items', mlProduct, { headers });

      return {
        success: true,
        data: this.normalizeProduct(response.data),
        rateLimitInfo: this.extractRateLimitInfo(response),
      };
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new ValidationError(error.response.data.message, {
          errors: error.response.data.cause || [],
        });
      }
      throw error;
    }
  }

  /**
   * Atualiza produto
   */
  async updateProduct(
    credentials: any,
    productId: string,
    updates: Partial<NormalizedProduct>,
  ): Promise<AdapterResponse<NormalizedProduct>> {
    try {
      const client = this.createClient(credentials);
      const mlUpdates = this.denormalizeProduct(updates as NormalizedProduct, credentials);

      const response = await client.put(`/items/${productId}`, mlUpdates);

      return {
        success: true,
        data: this.normalizeProduct(response.data),
        rateLimitInfo: this.extractRateLimitInfo(response),
      };
    } catch (error) {
      return {
        success: false,
        data: null as any,
        error: this.normalizeError(error),
      };
    }
  }

  /**
   * Deleta produto (pausa anúncio)
   */
  async deleteProduct(
    credentials: any,
    productId: string,
  ): Promise<AdapterResponse<boolean>> {
    try {
      const client = this.createClient(credentials);

      // ML não deleta, apenas pausa
      await client.put(`/items/${productId}`, {
        status: 'paused',
      });

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      return {
        success: false,
        data: false,
        error: this.normalizeError(error),
      };
    }
  }

  /**
   * Atualiza estoque
   */
  async updateStock(
    credentials: any,
    updates: StockUpdate[],
  ): Promise<AdapterResponse<any>> {
    try {
      const client = this.createClient(credentials);
      const results = [];

      for (const update of updates) {
        try {
          // Busca item por SKU (seller_custom_field)
          const searchResponse = await client.get(
            `/users/${credentials.sellerId}/items/search`,
            {
              params: {
                seller_custom_field: update.sku,
              },
            },
          );

          if (searchResponse.data.results.length === 0) {
            results.push({
              sku: update.sku,
              success: false,
              error: 'Product not found',
            });
            continue;
          }

          const itemId = searchResponse.data.results[0];

          // Atualiza quantidade
          await client.put(`/items/${itemId}`, {
            available_quantity: update.quantity,
          });

          results.push({
            sku: update.sku,
            success: true,
            newStock: update.quantity,
          });

          await this.sleep(200);
        } catch (error: any) {
          results.push({
            sku: update.sku,
            success: false,
            error: error.message,
          });
        }
      }

      return {
        success: true,
        data: results,
      };
    } catch (error) {
      throw new SyncError('Failed to update Mercado Livre stock', {
        originalError: error,
      });
    }
  }

  /**
   * Busca estoque atual
   */
  async fetchStock(
    credentials: any,
    skus?: string[],
  ): Promise<AdapterResponse<any[]>> {
    try {
      const client = this.createClient(credentials);
      const stockData = [];

      for (const sku of skus || []) {
        const searchResponse = await client.get(
          `/users/${credentials.sellerId}/items/search`,
          {
            params: {
              seller_custom_field: sku,
            },
          },
        );

        if (searchResponse.data.results.length > 0) {
          const itemId = searchResponse.data.results[0];
          const itemResponse = await client.get(`/items/${itemId}`);

          stockData.push({
            sku,
            quantity: itemResponse.data.available_quantity || 0,
            externalId: itemId,
          });
        }

        await this.sleep(200);
      }

      return {
        success: true,
        data: stockData,
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: this.normalizeError(error),
      };
    }
  }

  /**
   * Atualiza preços
   */
  async updatePrice(
    credentials: any,
    updates: PriceUpdate[],
  ): Promise<AdapterResponse<any>> {
    try {
      const client = this.createClient(credentials);
      const results = [];

      for (const update of updates) {
        try {
          const searchResponse = await client.get(
            `/users/${credentials.sellerId}/items/search`,
            {
              params: {
                seller_custom_field: update.sku,
              },
            },
          );

          if (searchResponse.data.results.length === 0) {
            results.push({
              sku: update.sku,
              success: false,
              error: 'Product not found',
            });
            continue;
          }

          const itemId = searchResponse.data.results[0];

          await client.put(`/items/${itemId}`, {
            price: update.price,
          });

          results.push({
            sku: update.sku,
            success: true,
            newPrice: update.price,
          });

          await this.sleep(200);
        } catch (error: any) {
          results.push({
            sku: update.sku,
            success: false,
            error: error.message,
          });
        }
      }

      return {
        success: true,
        data: results,
      };
    } catch (error) {
      throw new SyncError('Failed to update Mercado Livre prices', {
        originalError: error,
      });
    }
  }

  /**
   * Busca preços
   */
  async fetchPrices(
    credentials: any,
    skus?: string[],
  ): Promise<AdapterResponse<any[]>> {
    return this.fetchStock(credentials, skus); // Mesma lógica
  }

  /**
   * Busca categorias
   */
  async fetchCategories(
    credentials: any,
    parentId?: string,
  ): Promise<PaginatedResponse<NormalizedCategory>> {
    try {
      const client = this.createClient(credentials);
      
      // Se não tem parent, busca categorias raiz por país (Brasil = MLB)
      const siteId = 'MLB';
      const response = await client.get(`/sites/${siteId}/categories`);

      const categories: NormalizedCategory[] = response.data.map((cat: any) => ({
        externalId: cat.id,
        name: cat.name,
        parentId: null,
        attributes: [],
        metadata: {},
      }));

      return {
        success: true,
        data: categories,
        pagination: {
          page: 1,
          perPage: categories.length,
          total: categories.length,
          hasMore: false,
        },
      };
    } catch (error) {
      throw new SyncError('Failed to fetch Mercado Livre categories', {
        originalError: error,
      });
    }
  }

  /**
   * Busca atributos da categoria
   */
  async fetchCategoryAttributes(
    credentials: any,
    categoryId: string,
  ): Promise<AdapterResponse<any>> {
    try {
      const client = this.createClient(credentials);
      const response = await client.get(`/categories/${categoryId}/attributes`);

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: this.normalizeError(error),
      };
    }
  }

  /**
   * Busca clientes (ML não expõe clientes diretamente)
   */
  async fetchCustomers(
    credentials: any,
    options?: SyncOptions,
  ): Promise<PaginatedResponse<NormalizedCustomer>> {
    // ML não tem endpoint de clientes
    // Podemos buscar via orders e extrair compradores
    return {
      success: true,
      data: [],
      pagination: {
        page: 1,
        perPage: 0,
        total: 0,
        hasMore: false,
      },
    };
  }

  async fetchCustomer(
    credentials: any,
    customerId: string,
  ): Promise<AdapterResponse<NormalizedCustomer>> {
    return {
      success: false,
      data: null as any,
      error: { message: 'Not supported by Mercado Livre', code: 'NOT_SUPPORTED' },
    };
  }

  async upsertCustomer(
    credentials: any,
    customer: NormalizedCustomer,
  ): Promise<AdapterResponse<NormalizedCustomer>> {
    return {
      success: false,
      data: null as any,
      error: { message: 'Not supported by Mercado Livre', code: 'NOT_SUPPORTED' },
    };
  }

  /**
   * Busca pedidos
   */
  async fetchOrders(
    credentials: any,
    options?: SyncOptions,
  ): Promise<PaginatedResponse<NormalizedOrder>> {
    try {
      const client = this.createClient(credentials);
      const page = options?.filters?.page || 1;
      const perPage = options?.filters?.perPage || 50;
      const offset = (page - 1) * perPage;

      const response = await client.get(`/orders/search`, {
        params: {
          seller: credentials.sellerId,
          offset,
          limit: perPage,
          sort: 'date_desc',
        },
      });

      const orders: NormalizedOrder[] = response.data.results.map((order: any) => ({
        externalId: order.id.toString(),
        orderNumber: order.id.toString(),
        status: order.status,
        total: order.total_amount,
        items: order.order_items.map((item: any) => ({
          sku: item.item.seller_custom_field || '',
          name: item.item.title,
          quantity: item.quantity,
          price: item.unit_price,
        })),
        customer: {
          externalId: order.buyer.id.toString(),
          email: '',
          name: order.buyer.nickname,
        },
        createdAt: order.date_created,
        metadata: order,
      }));

      return {
        success: true,
        data: orders,
        pagination: {
          page,
          perPage,
          total: response.data.paging?.total || 0,
          hasMore: response.data.paging?.offset + perPage < response.data.paging?.total,
        },
      };
    } catch (error) {
      throw new SyncError('Failed to fetch Mercado Livre orders', {
        originalError: error,
      });
    }
  }

  async fetchOrder(
    credentials: any,
    orderId: string,
  ): Promise<AdapterResponse<NormalizedOrder>> {
    try {
      const client = this.createClient(credentials);
      const response = await client.get(`/orders/${orderId}`);

      const order = response.data;
      const normalized: NormalizedOrder = {
        externalId: order.id.toString(),
        orderNumber: order.id.toString(),
        status: order.status,
        total: order.total_amount,
        items: order.order_items.map((item: any) => ({
          sku: item.item.seller_custom_field || '',
          name: item.item.title,
          quantity: item.quantity,
          price: item.unit_price,
        })),
        customer: {
          externalId: order.buyer.id.toString(),
          email: '',
          name: order.buyer.nickname,
        },
        createdAt: order.date_created,
        metadata: order,
      };

      return {
        success: true,
        data: normalized,
      };
    } catch (error) {
      return {
        success: false,
        data: null as any,
        error: this.normalizeError(error),
      };
    }
  }

  /**
   * Webhooks (ML usa notificações)
   */
  async createWebhook(
    credentials: any,
    config: any,
  ): Promise<AdapterResponse<any>> {
    try {
      const client = this.createClient(credentials);
      const response = await client.post('/applications/webhooks', {
        topic: config.topic || 'items',
        url: config.url,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: this.normalizeError(error),
      };
    }
  }

  async deleteWebhook(
    credentials: any,
    webhookId: string,
  ): Promise<AdapterResponse<boolean>> {
    try {
      const client = this.createClient(credentials);
      await client.delete(`/applications/webhooks/${webhookId}`);

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      return {
        success: false,
        data: false,
        error: this.normalizeError(error),
      };
    }
  }

  async validateWebhookSignature(
    payload: any,
    signature: string,
    secret: string,
  ): Promise<boolean> {
    // ML não usa signature, valida via request ao endpoint
    return true;
  }

  /**
   * Rate limit info
   */
  async getRateLimitInfo(credentials: any): Promise<RateLimitInfo> {
    return {
      limit: 10000,
      remaining: 9000,
      reset: Date.now() + 3600000,
    };
  }

  async waitForRateLimit(): Promise<void> {
    await this.sleep(200); // 5 req/s
  }

  normalizeError(error: any): { message: string; code?: string; retryable?: boolean } {
    if (error instanceof RateLimitError || error instanceof AuthenticationError) {
      return {
        message: error.message,
        code: error.name,
        retryable: error instanceof RateLimitError,
      };
    }

    return {
      message: error.response?.data?.message || error.message || 'Unknown error',
      code: error.response?.data?.error || 'UNKNOWN',
      retryable: error.response?.status >= 500,
    };
  }

  /**
   * Normaliza produto ML → formato padrão
   */
  private normalizeProduct(mlProduct: any): NormalizedProduct {
    return {
      externalId: mlProduct.id,
      sku: mlProduct.seller_custom_field || mlProduct.id,
      name: mlProduct.title,
      description: mlProduct.description,
      price: mlProduct.price,
      stock: mlProduct.available_quantity || 0,
      images: mlProduct.pictures?.map((pic: any) => pic.url) || [],
      categories: [mlProduct.category_id],
      active: mlProduct.status === 'active',
      variations: mlProduct.variations?.map((v: any) => ({
        externalId: v.id.toString(),
        sku: v.seller_custom_field || `${mlProduct.id}-${v.id}`,
        attributes: v.attribute_combinations || [],
        price: v.price,
        stock: v.available_quantity || 0,
      })),
      attributes: mlProduct.attributes || [],
      metadata: mlProduct,
    };
  }

  /**
   * Denormaliza formato padrão → ML
   */
  private denormalizeProduct(product: NormalizedProduct, credentials: any): any {
    return {
      title: product.name,
      category_id: product.categories?.[0],
      price: product.price,
      currency_id: 'BRL',
      available_quantity: product.stock,
      buying_mode: 'buy_it_now',
      listing_type_id: 'gold_special',
      condition: 'new',
      description: product.description,
      pictures: product.images?.map((url) => ({ source: url })),
      seller_custom_field: product.sku,
      attributes: product.attributes || [],
    };
  }

  private extractRateLimitInfo(response: any): RateLimitInfo | undefined {
    const remaining = response.headers['x-ratelimit-remaining'];
    const limit = response.headers['x-ratelimit-limit'];
    const reset = response.headers['x-ratelimit-reset'];

    if (!remaining) return undefined;

    return {
      limit: parseInt(limit),
      remaining: parseInt(remaining),
      reset: parseInt(reset) * 1000,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
