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

interface ShopeeCredentials {
  partnerId: string;
  partnerKey: string;
  shopId: string;
  accessToken: string;
}

@Injectable()
export class ShopeeAdapter implements IMarketplaceAdapter {
  private logger = new Logger(ShopeeAdapter.name);
  private readonly baseUrl = 'https://partner.shopeemobile.com';
  private clients: Map<string, AxiosInstance> = new Map();

  /**
   * Cria cliente axios com HMAC signature
   */
  private createClient(credentials: ShopeeCredentials): AxiosInstance {
    const cacheKey = credentials.shopId;

    if (this.clients.has(cacheKey)) {
      return this.clients.get(cacheKey)!;
    }

    const client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Interceptor para adicionar signature em cada request
    client.interceptors.request.use((config) => {
      const timestamp = Math.floor(Date.now() / 1000);
      const path = config.url || '';
      const signature = this.generateSignature(
        credentials.partnerId,
        credentials.partnerKey,
        path,
        timestamp,
      );

      config.params = {
        ...config.params,
        partner_id: credentials.partnerId,
        timestamp,
        sign: signature,
        shop_id: credentials.shopId,
        access_token: credentials.accessToken,
      };

      return config;
    });

    // Interceptor para erros
    client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.data?.error === 'error_auth') {
          throw new AuthenticationError('Shopee authentication failed', {
            shopId: credentials.shopId,
          });
        }

        if (error.response?.data?.error === 'error_rate_limit_exceed') {
          throw new RateLimitError('Shopee rate limit exceeded', 60, {
            url: error.config.url,
          });
        }

        throw error;
      },
    );

    this.clients.set(cacheKey, client);
    return client;
  }

  /**
   * Gera HMAC-SHA256 signature para Shopee
   */
  private generateSignature(
    partnerId: string,
    partnerKey: string,
    path: string,
    timestamp: number,
  ): string {
    const message = `${partnerId}${path}${timestamp}`;
    return crypto
      .createHmac('sha256', partnerKey)
      .update(message)
      .digest('hex');
  }

  async validateCredentials(credentials: any): Promise<AdapterResponse<boolean>> {
    try {
      const client = this.createClient(credentials);
      const response = await client.get('/api/v2/shop/get_shop_info');

      return {
        success: response.data.error === '',
        data: response.data.error === '',
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
      const client = this.createClient(credentials);
      const page = options?.filters?.page || 1;
      const perPage = options?.filters?.perPage || 50;
      const offset = (page - 1) * perPage;

      // Shopee: primeiro busca lista de IDs
      const listResponse = await client.get('/api/v2/product/get_item_list', {
        params: {
          offset,
          page_size: perPage,
          item_status: 'NORMAL',
        },
      });

      if (listResponse.data.error) {
        throw new Error(listResponse.data.message);
      }

      const itemIds = listResponse.data.response?.item?.map((i: any) => i.item_id) || [];
      const total = listResponse.data.response?.total_count || 0;

      // Busca detalhes dos produtos (max 50 por request)
      const products: NormalizedProduct[] = [];

      if (itemIds.length > 0) {
        const detailResponse = await client.get('/api/v2/product/get_item_base_info', {
          params: {
            item_id_list: itemIds.join(','),
          },
        });

        if (!detailResponse.data.error) {
          for (const item of detailResponse.data.response?.item_list || []) {
            products.push(this.normalizeProduct(item));
          }
        }
      }

      return {
        success: true,
        data: products,
        pagination: {
          page,
          perPage,
          total,
          hasMore: offset + perPage < total,
        },
      };
    } catch (error) {
      throw new SyncError('Failed to fetch Shopee products', {
        originalError: error,
      });
    }
  }

  async fetchProduct(
    credentials: any,
    productId: string,
  ): Promise<AdapterResponse<NormalizedProduct>> {
    try {
      const client = this.createClient(credentials);
      const response = await client.get('/api/v2/product/get_item_base_info', {
        params: {
          item_id_list: productId,
        },
      });

      if (response.data.error) {
        throw new Error(response.data.message);
      }

      const item = response.data.response?.item_list?.[0];
      if (!item) {
        throw new Error('Product not found');
      }

      return {
        success: true,
        data: this.normalizeProduct(item),
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
      const client = this.createClient(credentials);
      const shopeeProduct = this.denormalizeProduct(product);

      const response = await client.post('/api/v2/product/add_item', shopeeProduct);

      if (response.data.error) {
        throw new Error(response.data.message);
      }

      return {
        success: true,
        data: {
          ...product,
          externalId: response.data.response?.item_id?.toString(),
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

  async updateProduct(
    credentials: any,
    productId: string,
    updates: Partial<NormalizedProduct>,
  ): Promise<AdapterResponse<NormalizedProduct>> {
    try {
      const client = this.createClient(credentials);
      const shopeeUpdates = this.denormalizeProduct(updates as NormalizedProduct);

      const response = await client.post('/api/v2/product/update_item', {
        item_id: parseInt(productId),
        ...shopeeUpdates,
      });

      if (response.data.error) {
        throw new Error(response.data.message);
      }

      return {
        success: true,
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
      const client = this.createClient(credentials);
      const response = await client.post('/api/v2/product/delete_item', {
        item_id: parseInt(productId),
      });

      return {
        success: !response.data.error,
        data: !response.data.error,
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
      const client = this.createClient(credentials);
      const results = [];

      // Shopee permite bulk update de estoque
      const stockList = updates.map((update) => ({
        item_id: parseInt(update.externalId || '0'),
        stock_list: [
          {
            model_id: 0, // 0 = produto sem variação
            normal_stock: update.quantity,
          },
        ],
      }));

      const response = await client.post('/api/v2/product/update_stock', {
        item_list: stockList,
      });

      if (response.data.error) {
        throw new Error(response.data.message);
      }

      for (const update of updates) {
        results.push({
          sku: update.sku,
          success: true,
          newStock: update.quantity,
        });
      }

      return {
        success: true,
        data: results,
      };
    } catch (error) {
      throw new SyncError('Failed to update Shopee stock', {
        originalError: error,
      });
    }
  }

  async fetchStock(
    credentials: any,
    skus?: string[],
  ): Promise<AdapterResponse<any[]>> {
    // Implementação similar a fetchProducts
    return {
      success: true,
      data: [],
    };
  }

  async updatePrice(
    credentials: any,
    updates: PriceUpdate[],
  ): Promise<AdapterResponse<any>> {
    try {
      const client = this.createClient(credentials);
      const results = [];

      const priceList = updates.map((update) => ({
        item_id: parseInt(update.externalId || '0'),
        price_list: [
          {
            model_id: 0,
            original_price: update.price,
          },
        ],
      }));

      const response = await client.post('/api/v2/product/update_price', {
        item_list: priceList,
      });

      if (response.data.error) {
        throw new Error(response.data.message);
      }

      for (const update of updates) {
        results.push({
          sku: update.sku,
          success: true,
          newPrice: update.price,
        });
      }

      return {
        success: true,
        data: results,
      };
    } catch (error) {
      throw new SyncError('Failed to update Shopee prices', {
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
    try {
      const client = this.createClient(credentials);
      const response = await client.get('/api/v2/product/get_category', {
        params: {
          language: 'pt-BR',
        },
      });

      if (response.data.error) {
        throw new Error(response.data.message);
      }

      const categories: NormalizedCategory[] =
        response.data.response?.category_list?.map((cat: any) => ({
          externalId: cat.category_id.toString(),
          name: cat.display_category_name,
          parentId: cat.parent_category_id?.toString() || null,
          attributes: [],
          metadata: cat,
        })) || [];

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
      throw new SyncError('Failed to fetch Shopee categories', {
        originalError: error,
      });
    }
  }

  async fetchCategoryAttributes(
    credentials: any,
    categoryId: string,
  ): Promise<AdapterResponse<any>> {
    try {
      const client = this.createClient(credentials);
      const response = await client.get('/api/v2/product/get_attributes', {
        params: {
          category_id: parseInt(categoryId),
          language: 'pt-BR',
        },
      });

      if (response.data.error) {
        throw new Error(response.data.message);
      }

      return {
        success: true,
        data: response.data.response?.attribute_list || [],
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: this.normalizeError(error),
      };
    }
  }

  async fetchCustomers(
    credentials: any,
    options?: SyncOptions,
  ): Promise<PaginatedResponse<NormalizedCustomer>> {
    // Shopee não expõe endpoint de clientes
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
      error: { message: 'Not supported by Shopee', code: 'NOT_SUPPORTED' },
    };
  }

  async upsertCustomer(
    credentials: any,
    customer: NormalizedCustomer,
  ): Promise<AdapterResponse<NormalizedCustomer>> {
    return {
      success: false,
      data: null as any,
      error: { message: 'Not supported by Shopee', code: 'NOT_SUPPORTED' },
    };
  }

  async fetchOrders(
    credentials: any,
    options?: SyncOptions,
  ): Promise<PaginatedResponse<NormalizedOrder>> {
    try {
      const client = this.createClient(credentials);
      const page = options?.filters?.page || 1;
      const perPage = Math.min(options?.filters?.perPage || 50, 100);

      const timeFrom = options?.filters?.sinceDate
        ? Math.floor(new Date(options.filters.sinceDate).getTime() / 1000)
        : Math.floor(Date.now() / 1000) - 86400 * 15; // 15 dias atrás

      const timeTo = Math.floor(Date.now() / 1000);

      const response = await client.get('/api/v2/order/get_order_list', {
        params: {
          time_range_field: 'create_time',
          time_from: timeFrom,
          time_to: timeTo,
          page_size: perPage,
          cursor: options?.filters?.cursor || '',
        },
      });

      if (response.data.error) {
        throw new Error(response.data.message);
      }

      const orderSnList = response.data.response?.order_list?.map((o: any) => o.order_sn) || [];
      const orders: NormalizedOrder[] = [];

      // Busca detalhes dos pedidos
      if (orderSnList.length > 0) {
        const detailResponse = await client.get('/api/v2/order/get_order_detail', {
          params: {
            order_sn_list: orderSnList.join(','),
          },
        });

        if (!detailResponse.data.error) {
          for (const order of detailResponse.data.response?.order_list || []) {
            orders.push({
              externalId: order.order_sn,
              orderNumber: order.order_sn,
              status: order.order_status,
              total: order.total_amount,
              items: order.item_list?.map((item: any) => ({
                sku: item.item_sku,
                name: item.item_name,
                quantity: item.model_quantity_purchased,
                price: item.model_discounted_price,
              })),
              customer: {
                externalId: order.buyer_user_id?.toString(),
                email: '',
                name: order.recipient_address?.name || '',
              },
              createdAt: new Date(order.create_time * 1000).toISOString(),
              metadata: order,
            });
          }
        }
      }

      return {
        success: true,
        data: orders,
        pagination: {
          page,
          perPage,
          total: response.data.response?.total_count || 0,
          hasMore: response.data.response?.more || false,
        },
      };
    } catch (error) {
      throw new SyncError('Failed to fetch Shopee orders', {
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
      const response = await client.get('/api/v2/order/get_order_detail', {
        params: {
          order_sn_list: orderId,
        },
      });

      if (response.data.error) {
        throw new Error(response.data.message);
      }

      const order = response.data.response?.order_list?.[0];
      if (!order) {
        throw new Error('Order not found');
      }

      return {
        success: true,
        data: {
          externalId: order.order_sn,
          orderNumber: order.order_sn,
          status: order.order_status,
          total: order.total_amount,
          items: order.item_list?.map((item: any) => ({
            sku: item.item_sku,
            name: item.item_name,
            quantity: item.model_quantity_purchased,
            price: item.model_discounted_price,
          })),
          customer: {
            externalId: order.buyer_user_id?.toString(),
            email: '',
            name: order.recipient_address?.name || '',
          },
          createdAt: new Date(order.create_time * 1000).toISOString(),
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
    // Shopee usa push notifications configuradas no painel
    return {
      success: false,
      data: null,
      error: { message: 'Use Shopee Partner Portal to configure webhooks', code: 'NOT_SUPPORTED' },
    };
  }

  async deleteWebhook(
    credentials: any,
    webhookId: string,
  ): Promise<AdapterResponse<boolean>> {
    return {
      success: false,
      data: false,
      error: { message: 'Use Shopee Partner Portal', code: 'NOT_SUPPORTED' },
    };
  }

  async validateWebhookSignature(
    payload: any,
    signature: string,
    secret: string,
  ): Promise<boolean> {
    // Validação via HMAC do body
    const computedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    return computedSignature === signature;
  }

  async getRateLimitInfo(credentials: any): Promise<RateLimitInfo> {
    return {
      limit: 1000,
      remaining: 900,
      reset: Date.now() + 3600000,
    };
  }

  async waitForRateLimit(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 100));
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

  private normalizeProduct(shopeeProduct: any): NormalizedProduct {
    return {
      externalId: shopeeProduct.item_id?.toString(),
      sku: shopeeProduct.item_sku || shopeeProduct.item_id?.toString(),
      name: shopeeProduct.item_name,
      description: shopeeProduct.description,
      price: shopeeProduct.price_info?.[0]?.original_price || 0,
      stock: shopeeProduct.stock_info?.[0]?.normal_stock || 0,
      images: shopeeProduct.image?.image_url_list || [],
      categories: [shopeeProduct.category_id?.toString()],
      active: shopeeProduct.item_status === 'NORMAL',
      variations: shopeeProduct.model?.map((v: any) => ({
        externalId: v.model_id?.toString(),
        sku: v.model_sku,
        attributes: v.tier_index || [],
        price: v.price_info?.[0]?.original_price || 0,
        stock: v.stock_info?.[0]?.normal_stock || 0,
      })),
      attributes: [],
      metadata: shopeeProduct,
    };
  }

  private denormalizeProduct(product: NormalizedProduct): any {
    return {
      item_name: product.name,
      description: product.description,
      category_id: parseInt(product.categories?.[0] || '0'),
      item_sku: product.sku,
      price_list: [
        {
          model_id: 0,
          original_price: product.price,
        },
      ],
      stock_list: [
        {
          model_id: 0,
          normal_stock: product.stock,
        },
      ],
      image: {
        image_id_list: product.images || [],
      },
    };
  }
}
