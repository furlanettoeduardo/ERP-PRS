import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';
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
} from '../types/sync.types';

interface AmazonCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  accessToken?: string;
  sellerId: string;
  marketplaceId: string;
  region: 'na' | 'eu' | 'fe'; // North America, Europe, Far East
}

@Injectable()
export class AmazonAdapter implements IMarketplaceAdapter {
  private logger = new Logger(AmazonAdapter.name);
  private clients: Map<string, AxiosInstance> = new Map();

  // URLs por região
  private readonly endpoints = {
    na: 'https://sellingpartnerapi-na.amazon.com',
    eu: 'https://sellingpartnerapi-eu.amazon.com',
    fe: 'https://sellingpartnerapi-fe.amazon.com',
  };

  private readonly authUrl = 'https://api.amazon.com/auth/o2/token';

  /**
   * Cria cliente axios com LWA (Login with Amazon)
   */
  private async createClient(credentials: AmazonCredentials): Promise<AxiosInstance> {
    const cacheKey = credentials.sellerId;

    if (this.clients.has(cacheKey)) {
      return this.clients.get(cacheKey)!;
    }

    // Refresh access token se necessário
    const accessToken = await this.getAccessToken(credentials);

    const client = axios.create({
      baseURL: this.endpoints[credentials.region],
      headers: {
        'Content-Type': 'application/json',
        'x-amz-access-token': accessToken,
      },
      timeout: 30000,
    });

    // Interceptor para rate limit
    client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 429) {
          const retryAfter = parseInt(
            error.response.headers['x-amzn-ratelimit-limit'] || '60',
          );
          throw new RateLimitError('Amazon SP-API rate limit exceeded', retryAfter, {
            url: error.config.url,
          });
        }

        if (error.response?.status === 401 || error.response?.status === 403) {
          throw new AuthenticationError('Amazon SP-API authentication failed', {
            sellerId: credentials.sellerId,
          });
        }

        throw error;
      },
    );

    this.clients.set(cacheKey, client);
    return client;
  }

  /**
   * Obtém access token via LWA (Login with Amazon)
   */
  private async getAccessToken(credentials: AmazonCredentials): Promise<string> {
    if (credentials.accessToken) {
      // TODO: Verificar se token ainda é válido
      return credentials.accessToken;
    }

    try {
      const response = await axios.post(this.authUrl, {
        grant_type: 'refresh_token',
        refresh_token: credentials.refreshToken,
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
      });

      return response.data.access_token;
    } catch (error) {
      throw new AuthenticationError('Failed to refresh Amazon access token', {
        error,
      });
    }
  }

  async validateCredentials(credentials: any): Promise<AdapterResponse<boolean>> {
    try {
      const client = await this.createClient(credentials);
      const response = await client.get('/sellers/v1/marketplaceParticipations');

      return {
        success: response.status === 200,
        data: response.status === 200,
      };
    } catch (error) {
      return {
        success: false,
        data: false,
        error: this.normalizeError(error),
      };
    }
  }

  async fetchProducts(
    credentials: any,
    options?: SyncOptions,
  ): Promise<PaginatedResponse<NormalizedProduct>> {
    try {
      const client = await this.createClient(credentials);
      
      // Amazon SP-API: busca via Catalog Items API
      const response = await client.get('/catalog/2022-04-01/items', {
        params: {
          marketplaceIds: credentials.marketplaceId,
          sellerId: credentials.sellerId,
          pageSize: options?.filters?.perPage || 20,
          pageToken: options?.filters?.nextToken,
        },
      });

      const items = response.data.items || [];
      const products: NormalizedProduct[] = [];

      // Para cada item, busca detalhes completos
      for (const item of items) {
        try {
          const detailResponse = await client.get(
            `/catalog/2022-04-01/items/${item.asin}`,
            {
              params: {
                marketplaceIds: credentials.marketplaceId,
                includedData: 'summaries,attributes,salesRanks,images',
              },
            },
          );

          products.push(this.normalizeProduct(detailResponse.data));
          await this.sleep(100); // Rate limit protection
        } catch (error) {
          this.logger.error(`Failed to fetch Amazon product ${item.asin}:`, error);
        }
      }

      return {
        success: true,
        data: products,
        pagination: {
          page: 1,
          perPage: items.length,
          total: items.length,
          hasMore: !!response.data.pagination?.nextToken,
        },
      };
    } catch (error) {
      throw new SyncError('Failed to fetch Amazon products', {
        originalError: error,
      });
    }
  }

  async fetchProduct(
    credentials: any,
    productId: string, // ASIN
  ): Promise<AdapterResponse<NormalizedProduct>> {
    try {
      const client = await this.createClient(credentials);
      const response = await client.get(`/catalog/2022-04-01/items/${productId}`, {
        params: {
          marketplaceIds: credentials.marketplaceId,
          includedData: 'summaries,attributes,salesRanks,images',
        },
      });

      return {
        success: true,
        data: this.normalizeProduct(response.data),
      };
    } catch (error) {
      return {
        success: false,
        data: null as any,
        error: this.normalizeError(error),
      };
    }
  }

  async createProduct(
    credentials: any,
    product: NormalizedProduct,
    idempotencyKey?: string,
  ): Promise<AdapterResponse<NormalizedProduct>> {
    try {
      const client = await this.createClient(credentials);
      const amazonProduct = this.denormalizeProduct(product, credentials);

      // Amazon usa Listings Items API
      const response = await client.put(
        `/listings/2021-08-01/items/${credentials.sellerId}/${product.sku}`,
        {
          productType: 'PRODUCT', // Deve ser obtido da categoria
          requirements: 'LISTING',
          attributes: amazonProduct,
        },
        {
          params: {
            marketplaceIds: credentials.marketplaceId,
          },
        },
      );

      return {
        success: response.status === 200 || response.status === 202,
        data: product,
      };
    } catch (error) {
      return {
        success: false,
        data: null as any,
        error: this.normalizeError(error),
      };
    }
  }

  async updateProduct(
    credentials: any,
    productId: string,
    updates: Partial<NormalizedProduct>,
  ): Promise<AdapterResponse<NormalizedProduct>> {
    try {
      const client = await this.createClient(credentials);
      const amazonUpdates = this.denormalizeProduct(updates as NormalizedProduct, credentials);

      const response = await client.patch(
        `/listings/2021-08-01/items/${credentials.sellerId}/${productId}`,
        {
          productType: 'PRODUCT',
          patches: [
            {
              op: 'replace',
              path: '/attributes',
              value: [amazonUpdates],
            },
          ],
        },
        {
          params: {
            marketplaceIds: credentials.marketplaceId,
          },
        },
      );

      return {
        success: response.status === 200 || response.status === 202,
        data: updates as NormalizedProduct,
      };
    } catch (error) {
      return {
        success: false,
        data: null as any,
        error: this.normalizeError(error),
      };
    }
  }

  async deleteProduct(
    credentials: any,
    productId: string,
  ): Promise<AdapterResponse<boolean>> {
    try {
      const client = await this.createClient(credentials);

      // Amazon deleta via Listings API
      await client.delete(
        `/listings/2021-08-01/items/${credentials.sellerId}/${productId}`,
        {
          params: {
            marketplaceIds: credentials.marketplaceId,
          },
        },
      );

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

  async updateStock(
    credentials: any,
    updates: StockUpdate[],
  ): Promise<AdapterResponse<any>> {
    try {
      const client = await this.createClient(credentials);
      const results = [];

      // Amazon usa FBA Inventory API
      for (const update of updates) {
        try {
          const response = await client.post('/fba/inventory/v1/items/inventory', {
            sellerSku: update.sku,
            marketplaceId: credentials.marketplaceId,
            quantity: update.quantity,
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
      throw new SyncError('Failed to update Amazon stock', {
        originalError: error,
      });
    }
  }

  async fetchStock(
    credentials: any,
    skus?: string[],
  ): Promise<AdapterResponse<any[]>> {
    try {
      const client = await this.createClient(credentials);
      const stockData = [];

      const response = await client.get('/fba/inventory/v1/summaries', {
        params: {
          granularityType: 'Marketplace',
          granularityId: credentials.marketplaceId,
          marketplaceIds: credentials.marketplaceId,
          sellerSkus: skus?.join(','),
        },
      });

      for (const item of response.data.inventorySummaries || []) {
        stockData.push({
          sku: item.sellerSku,
          quantity: item.totalQuantity || 0,
          externalId: item.asin,
        });
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

  async updatePrice(
    credentials: any,
    updates: PriceUpdate[],
  ): Promise<AdapterResponse<any>> {
    try {
      const client = await this.createClient(credentials);
      const results = [];

      for (const update of updates) {
        try {
          await client.put(
            `/listings/2021-08-01/items/${credentials.sellerId}/${update.sku}`,
            {
              productType: 'PRODUCT',
              patches: [
                {
                  op: 'replace',
                  path: '/attributes/purchasable_offer',
                  value: [
                    {
                      marketplace_id: credentials.marketplaceId,
                      currency: 'BRL',
                      our_price: [{ schedule: [{ value_with_tax: update.price }] }],
                    },
                  ],
                },
              ],
            },
            {
              params: {
                marketplaceIds: credentials.marketplaceId,
              },
            },
          );

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
      throw new SyncError('Failed to update Amazon prices', {
        originalError: error,
      });
    }
  }

  async fetchPrices(
    credentials: any,
    skus?: string[],
  ): Promise<AdapterResponse<any[]>> {
    return {
      success: true,
      data: [],
    };
  }

  async fetchCategories(
    credentials: any,
    parentId?: string,
  ): Promise<PaginatedResponse<NormalizedCategory>> {
    // Amazon tem categorias fixas (Browse Tree)
    // Requer implementação específica com cache local
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

  async fetchCategoryAttributes(
    credentials: any,
    categoryId: string,
  ): Promise<AdapterResponse<any>> {
    return {
      success: true,
      data: [],
    };
  }

  async fetchCustomers(
    credentials: any,
    options?: SyncOptions,
  ): Promise<PaginatedResponse<NormalizedCustomer>> {
    // Amazon não expõe dados de clientes por LGPD/GDPR
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
      error: { message: 'Not supported by Amazon', code: 'NOT_SUPPORTED' },
    };
  }

  async upsertCustomer(
    credentials: any,
    customer: NormalizedCustomer,
  ): Promise<AdapterResponse<NormalizedCustomer>> {
    return {
      success: false,
      data: null as any,
      error: { message: 'Not supported by Amazon', code: 'NOT_SUPPORTED' },
    };
  }

  async fetchOrders(
    credentials: any,
    options?: SyncOptions,
  ): Promise<PaginatedResponse<NormalizedOrder>> {
    try {
      const client = await this.createClient(credentials);

      const createdAfter =
        options?.filters?.sinceDate ||
        new Date(Date.now() - 86400000 * 30).toISOString(); // 30 dias

      const response = await client.get('/orders/v0/orders', {
        params: {
          MarketplaceIds: credentials.marketplaceId,
          CreatedAfter: createdAfter,
          MaxResultsPerPage: options?.filters?.perPage || 50,
          NextToken: options?.filters?.nextToken,
        },
      });

      const orders: NormalizedOrder[] = [];

      for (const order of response.data.Orders || []) {
        // Busca items do pedido
        const itemsResponse = await client.get(
          `/orders/v0/orders/${order.AmazonOrderId}/orderItems`,
        );

        orders.push({
          externalId: order.AmazonOrderId,
          orderNumber: order.AmazonOrderId,
          status: order.OrderStatus,
          total: parseFloat(order.OrderTotal?.Amount || '0'),
          items: itemsResponse.data.OrderItems?.map((item: any) => ({
            sku: item.SellerSKU,
            name: item.Title,
            quantity: item.QuantityOrdered,
            price: parseFloat(item.ItemPrice?.Amount || '0'),
          })),
          customer: {
            externalId: order.BuyerInfo?.BuyerEmail || '',
            email: order.BuyerInfo?.BuyerEmail || '',
            name: order.BuyerInfo?.BuyerName || '',
          },
          createdAt: order.PurchaseDate,
          metadata: order,
        });

        await this.sleep(100);
      }

      return {
        success: true,
        data: orders,
        pagination: {
          page: 1,
          perPage: orders.length,
          total: orders.length,
          hasMore: !!response.data.NextToken,
        },
      };
    } catch (error) {
      throw new SyncError('Failed to fetch Amazon orders', {
        originalError: error,
      });
    }
  }

  async fetchOrder(
    credentials: any,
    orderId: string,
  ): Promise<AdapterResponse<NormalizedOrder>> {
    try {
      const client = await this.createClient(credentials);

      const [orderResponse, itemsResponse] = await Promise.all([
        client.get(`/orders/v0/orders/${orderId}`),
        client.get(`/orders/v0/orders/${orderId}/orderItems`),
      ]);

      const order = orderResponse.data;

      return {
        success: true,
        data: {
          externalId: order.AmazonOrderId,
          orderNumber: order.AmazonOrderId,
          status: order.OrderStatus,
          total: parseFloat(order.OrderTotal?.Amount || '0'),
          items: itemsResponse.data.OrderItems?.map((item: any) => ({
            sku: item.SellerSKU,
            name: item.Title,
            quantity: item.QuantityOrdered,
            price: parseFloat(item.ItemPrice?.Amount || '0'),
          })),
          customer: {
            externalId: order.BuyerInfo?.BuyerEmail || '',
            email: order.BuyerInfo?.BuyerEmail || '',
            name: order.BuyerInfo?.BuyerName || '',
          },
          createdAt: order.PurchaseDate,
          metadata: order,
        },
      };
    } catch (error) {
      return {
        success: false,
        data: null as any,
        error: this.normalizeError(error),
      };
    }
  }

  async createWebhook(
    credentials: any,
    config: any,
  ): Promise<AdapterResponse<any>> {
    try {
      const client = await this.createClient(credentials);

      // Amazon usa EventBridge notifications
      const response = await client.post('/notifications/v1/subscriptions', {
        notificationType: config.notificationType || 'ANY_OFFER_CHANGED',
        destinationId: config.destinationId,
        payloadVersion: '1.0',
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
      const client = await this.createClient(credentials);
      await client.delete(`/notifications/v1/subscriptions/${webhookId}`);

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
    // Amazon EventBridge usa AWS Signature V4
    // Requer implementação completa do algoritmo
    return true;
  }

  async getRateLimitInfo(credentials: any): Promise<RateLimitInfo> {
    return {
      limit: 20,
      remaining: 15,
      reset: Date.now() + 60000,
    };
  }

  async waitForRateLimit(): Promise<void> {
    await this.sleep(100);
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
      message: error.response?.data?.errors?.[0]?.message || error.message || 'Unknown error',
      code: error.response?.data?.errors?.[0]?.code || 'UNKNOWN',
      retryable: error.response?.status >= 500,
    };
  }

  private normalizeProduct(amazonProduct: any): NormalizedProduct {
    const summary = amazonProduct.summaries?.[0] || {};
    const attributes = amazonProduct.attributes || {};

    return {
      externalId: summary.asin,
      sku: summary.itemName || summary.asin,
      name: summary.itemName || attributes.item_name?.[0]?.value,
      description: attributes.bullet_point?.map((b: any) => b.value).join('\n'),
      price: 0, // Preço vem de outro endpoint
      stock: 0, // Estoque vem de outro endpoint
      images: amazonProduct.images?.map((img: any) => img.link) || [],
      categories: [],
      active: summary.status === 'BUYABLE',
      variations: [],
      attributes: [],
      metadata: amazonProduct,
    };
  }

  private denormalizeProduct(product: NormalizedProduct, credentials: any): any {
    return {
      item_name: [{ value: product.name, marketplace_id: credentials.marketplaceId }],
      bullet_point: product.description?.split('\n').map((line) => ({
        value: line,
        marketplace_id: credentials.marketplaceId,
      })),
      purchasable_offer: [
        {
          marketplace_id: credentials.marketplaceId,
          currency: 'BRL',
          our_price: [{ schedule: [{ value_with_tax: product.price }] }],
        },
      ],
      fulfillment_availability: [
        {
          fulfillment_channel_code: 'DEFAULT',
          quantity: product.stock,
        },
      ],
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
