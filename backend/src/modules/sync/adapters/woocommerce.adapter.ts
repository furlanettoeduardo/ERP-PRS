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

interface WooCommerceCredentials {
  storeUrl: string;
  consumerKey: string;
  consumerSecret: string;
}

@Injectable()
export class WooCommerceAdapter implements IMarketplaceAdapter {
  private logger = new Logger(WooCommerceAdapter.name);
  private clients: Map<string, AxiosInstance> = new Map();

  /**
   * Cria cliente axios com Basic Auth (Consumer Key/Secret)
   */
  private createClient(credentials: WooCommerceCredentials): AxiosInstance {
    const cacheKey = credentials.storeUrl;

    if (this.clients.has(cacheKey)) {
      return this.clients.get(cacheKey)!;
    }

    const baseURL = credentials.storeUrl.endsWith('/')
      ? `${credentials.storeUrl}wp-json/wc/v3`
      : `${credentials.storeUrl}/wp-json/wc/v3`;

    const client = axios.create({
      baseURL,
      auth: {
        username: credentials.consumerKey,
        password: credentials.consumerSecret,
      },
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Interceptor para rate limit
    client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 429) {
          const retryAfter = parseInt(
            error.response.headers['retry-after'] || '60',
          );
          throw new RateLimitError(
            'WooCommerce rate limit exceeded',
            retryAfter,
            { url: error.config.url },
          );
        }

        if (error.response?.status === 401 || error.response?.status === 403) {
          throw new AuthenticationError(
            'WooCommerce authentication failed - check consumer key/secret',
            { storeUrl: credentials.storeUrl },
          );
        }

        throw error;
      },
    );

    this.clients.set(cacheKey, client);
    return client;
  }

  /**
   * Valida credenciais testando endpoint /system_status
   */
  async validateCredentials(
    credentials: any,
  ): Promise<AdapterResponse<boolean>> {
    try {
      const client = this.createClient(credentials);
      await client.get('/system_status');

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
   * Busca produtos com paginação
   */
  async fetchProducts(
    credentials: any,
    options?: SyncOptions,
  ): Promise<PaginatedResponse<NormalizedProduct>> {
    try {
      const client = this.createClient(credentials);
      const page = options?.filters?.page || 1;
      const perPage = options?.filters?.perPage || 100;

      const response = await client.get('/products', {
        params: {
          page,
          per_page: perPage,
          orderby: 'modified',
          order: 'desc',
        },
      });

      const products: NormalizedProduct[] = response.data.map((product: any) =>
        this.normalizeProduct(product),
      );

      const total = parseInt(response.headers['x-wp-total'] || '0');
      const totalPages = parseInt(response.headers['x-wp-totalpages'] || '1');

      return {
        success: true,
        data: products,
        pagination: {
          page,
          perPage,
          total,
          hasMore: page < totalPages,
        },
      };
    } catch (error) {
      throw new SyncError('Failed to fetch WooCommerce products', {
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
      const response = await client.get(`/products/${productId}`);

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
      const wcProduct = this.denormalizeProduct(product);

      const response = await client.post('/products', wcProduct);

      return {
        success: true,
        data: this.normalizeProduct(response.data),
      };
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new ValidationError(error.response.data.message, {
          errors: error.response.data.data?.params || {},
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
      const wcUpdates = this.denormalizeProduct(
        updates as NormalizedProduct,
      );

      const response = await client.put(`/products/${productId}`, wcUpdates);

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

  /**
   * Deleta produto
   */
  async deleteProduct(
    credentials: any,
    productId: string,
  ): Promise<AdapterResponse<boolean>> {
    try {
      const client = this.createClient(credentials);
      await client.delete(`/products/${productId}`, {
        params: { force: true },
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
          // Busca produto por SKU
          const searchResponse = await client.get('/products', {
            params: { sku: update.sku },
          });

          if (searchResponse.data.length === 0) {
            results.push({
              sku: update.sku,
              success: false,
              error: 'Product not found',
            });
            continue;
          }

          const product = searchResponse.data[0];

          // Atualiza estoque
          await client.put(`/products/${product.id}`, {
            stock_quantity: update.quantity,
            manage_stock: true,
            stock_status: update.quantity > 0 ? 'instock' : 'outofstock',
          });

          results.push({
            sku: update.sku,
            success: true,
            newStock: update.quantity,
          });

          await this.sleep(100); // Rate limit protection
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
      throw new SyncError('Failed to update WooCommerce stock', {
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
        const response = await client.get('/products', {
          params: { sku },
        });

        if (response.data.length > 0) {
          const product = response.data[0];
          stockData.push({
            sku,
            quantity: product.stock_quantity || 0,
            externalId: product.id.toString(),
            stockStatus: product.stock_status,
            manageStock: product.manage_stock,
          });
        }

        await this.sleep(100);
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
          const searchResponse = await client.get('/products', {
            params: { sku: update.sku },
          });

          if (searchResponse.data.length === 0) {
            results.push({
              sku: update.sku,
              success: false,
              error: 'Product not found',
            });
            continue;
          }

          const product = searchResponse.data[0];

          await client.put(`/products/${product.id}`, {
            regular_price: update.price.toString(),
          });

          results.push({
            sku: update.sku,
            success: true,
            newPrice: update.price,
          });

          await this.sleep(100);
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
      throw new SyncError('Failed to update WooCommerce prices', {
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

      const params: any = {
        per_page: 100,
        orderby: 'name',
        order: 'asc',
      };

      if (parentId) {
        params.parent = parentId;
      }

      const response = await client.get('/products/categories', { params });

      const categories: NormalizedCategory[] = response.data.map(
        (cat: any) => ({
          externalId: cat.id.toString(),
          name: cat.name,
          parentId: cat.parent ? cat.parent.toString() : null,
          attributes: [],
          metadata: {
            slug: cat.slug,
            count: cat.count,
            image: cat.image,
          },
        }),
      );

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
      throw new SyncError('Failed to fetch WooCommerce categories', {
        originalError: error,
      });
    }
  }

  /**
   * Busca atributos da categoria (WC não tem por categoria)
   */
  async fetchCategoryAttributes(
    credentials: any,
    categoryId: string,
  ): Promise<AdapterResponse<any>> {
    try {
      const client = this.createClient(credentials);
      const response = await client.get('/products/attributes');

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
   * Busca clientes
   */
  async fetchCustomers(
    credentials: any,
    options?: SyncOptions,
  ): Promise<PaginatedResponse<NormalizedCustomer>> {
    try {
      const client = this.createClient(credentials);
      const page = options?.filters?.page || 1;
      const perPage = options?.filters?.perPage || 100;

      const response = await client.get('/customers', {
        params: {
          page,
          per_page: perPage,
          orderby: 'registered_date',
          order: 'desc',
        },
      });

      const customers: NormalizedCustomer[] = response.data.map(
        (customer: any) => this.normalizeCustomer(customer),
      );

      const total = parseInt(response.headers['x-wp-total'] || '0');
      const totalPages = parseInt(response.headers['x-wp-totalpages'] || '1');

      return {
        success: true,
        data: customers,
        pagination: {
          page,
          perPage,
          total,
          hasMore: page < totalPages,
        },
      };
    } catch (error) {
      throw new SyncError('Failed to fetch WooCommerce customers', {
        originalError: error,
      });
    }
  }

  async fetchCustomer(
    credentials: any,
    customerId: string,
  ): Promise<AdapterResponse<NormalizedCustomer>> {
    try {
      const client = this.createClient(credentials);
      const response = await client.get(`/customers/${customerId}`);

      return {
        success: true,
        data: this.normalizeCustomer(response.data),
      };
    } catch (error) {
      return {
        success: false,
        data: null as any,
        error: this.normalizeError(error),
      };
    }
  }

  async upsertCustomer(
    credentials: any,
    customer: NormalizedCustomer,
  ): Promise<AdapterResponse<NormalizedCustomer>> {
    try {
      const client = this.createClient(credentials);

      if (customer.externalId) {
        // Update
        const response = await client.put(
          `/customers/${customer.externalId}`,
          this.denormalizeCustomer(customer),
        );
        return {
          success: true,
          data: this.normalizeCustomer(response.data),
        };
      } else {
        // Create
        const response = await client.post(
          '/customers',
          this.denormalizeCustomer(customer),
        );
        return {
          success: true,
          data: this.normalizeCustomer(response.data),
        };
      }
    } catch (error) {
      return {
        success: false,
        data: null as any,
        error: this.normalizeError(error),
      };
    }
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
      const perPage = options?.filters?.perPage || 100;

      const response = await client.get('/orders', {
        params: {
          page,
          per_page: perPage,
          orderby: 'date',
          order: 'desc',
        },
      });

      const orders: NormalizedOrder[] = response.data.map((order: any) =>
        this.normalizeOrder(order),
      );

      const total = parseInt(response.headers['x-wp-total'] || '0');
      const totalPages = parseInt(response.headers['x-wp-totalpages'] || '1');

      return {
        success: true,
        data: orders,
        pagination: {
          page,
          perPage,
          total,
          hasMore: page < totalPages,
        },
      };
    } catch (error) {
      throw new SyncError('Failed to fetch WooCommerce orders', {
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

      return {
        success: true,
        data: this.normalizeOrder(response.data),
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
   * Webhooks
   */
  async createWebhook(
    credentials: any,
    config: any,
  ): Promise<AdapterResponse<any>> {
    try {
      const client = this.createClient(credentials);
      const response = await client.post('/webhooks', {
        name: config.name || 'ERP Sync Webhook',
        topic: config.topic || 'product.updated',
        delivery_url: config.url,
        secret: config.secret || '',
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
      await client.delete(`/webhooks/${webhookId}`, {
        params: { force: true },
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

  async validateWebhookSignature(
    payload: any,
    signature: string,
    secret: string,
  ): Promise<boolean> {
    const crypto = require('crypto');
    const hash = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('base64');

    return hash === signature;
  }

  /**
   * Rate limit info
   */
  async getRateLimitInfo(credentials: any): Promise<RateLimitInfo> {
    return {
      limit: 1000,
      remaining: 900,
      reset: Date.now() + 3600000,
    };
  }

  async waitForRateLimit(): Promise<void> {
    await this.sleep(100); // 10 req/s
  }

  normalizeError(error: any): {
    message: string;
    code?: string;
    retryable?: boolean;
  } {
    if (
      error instanceof RateLimitError ||
      error instanceof AuthenticationError
    ) {
      return {
        message: error.message,
        code: error.name,
        retryable: error instanceof RateLimitError,
      };
    }

    return {
      message:
        error.response?.data?.message || error.message || 'Unknown error',
      code: error.response?.data?.code || 'UNKNOWN',
      retryable: error.response?.status >= 500,
    };
  }

  /**
   * Normaliza produto WC → formato padrão
   */
  private normalizeProduct(wcProduct: any): NormalizedProduct {
    return {
      externalId: wcProduct.id.toString(),
      sku: wcProduct.sku || wcProduct.id.toString(),
      name: wcProduct.name,
      description: wcProduct.description,
      price: parseFloat(wcProduct.regular_price || wcProduct.price || '0'),
      stock: wcProduct.stock_quantity || 0,
      images: wcProduct.images?.map((img: any) => img.src) || [],
      categories: wcProduct.categories?.map((cat: any) => cat.id.toString()) || [],
      active: wcProduct.status === 'publish',
      variations: wcProduct.variations?.map((varId: number) => ({
        externalId: varId.toString(),
        sku: `${wcProduct.sku}-VAR-${varId}`,
        attributes: [],
        price: 0,
        stock: 0,
      })),
      attributes: wcProduct.attributes || [],
      metadata: {
        productId: wcProduct.id,
        regularPrice: wcProduct.regular_price,
        salePrice: wcProduct.sale_price,
        stockStatus: wcProduct.stock_status,
        manageStock: wcProduct.manage_stock,
        permalink: wcProduct.permalink,
      },
    };
  }

  /**
   * Denormaliza formato padrão → WC
   */
  private denormalizeProduct(product: NormalizedProduct): any {
    return {
      name: product.name,
      description: product.description,
      regular_price: product.price?.toString(),
      sku: product.sku,
      stock_quantity: product.stock,
      manage_stock: true,
      stock_status: product.stock > 0 ? 'instock' : 'outofstock',
      status: product.active ? 'publish' : 'draft',
      images: product.images?.map((url) => ({ src: url })),
      categories: product.categories?.map((id) => ({ id: parseInt(id) })),
      attributes: product.attributes || [],
    };
  }

  /**
   * Normaliza cliente WC → formato padrão
   */
  private normalizeCustomer(wcCustomer: any): NormalizedCustomer {
    return {
      externalId: wcCustomer.id.toString(),
      email: wcCustomer.email,
      name: `${wcCustomer.first_name} ${wcCustomer.last_name}`.trim(),
      phone: wcCustomer.billing?.phone || '',
      document: wcCustomer.meta_data?.find((m: any) => m.key === 'cpf')?.value || '',
      addresses: [
        {
          street: wcCustomer.billing?.address_1 || '',
          number: wcCustomer.billing?.address_2 || '',
          complement: '',
          neighborhood: '',
          city: wcCustomer.billing?.city || '',
          state: wcCustomer.billing?.state || '',
          zipCode: wcCustomer.billing?.postcode || '',
          country: wcCustomer.billing?.country || '',
        },
      ],
      metadata: wcCustomer,
    };
  }

  /**
   * Denormaliza cliente padrão → WC
   */
  private denormalizeCustomer(customer: NormalizedCustomer): any {
    const nameParts = customer.name.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    return {
      email: customer.email,
      first_name: firstName,
      last_name: lastName,
      billing: {
        first_name: firstName,
        last_name: lastName,
        phone: customer.phone,
        address_1: customer.addresses?.[0]?.street || '',
        address_2: customer.addresses?.[0]?.number || '',
        city: customer.addresses?.[0]?.city || '',
        state: customer.addresses?.[0]?.state || '',
        postcode: customer.addresses?.[0]?.zipCode || '',
        country: customer.addresses?.[0]?.country || 'BR',
      },
    };
  }

  /**
   * Normaliza pedido WC → formato padrão
   */
  private normalizeOrder(wcOrder: any): NormalizedOrder {
    return {
      externalId: wcOrder.id.toString(),
      orderNumber: wcOrder.number || wcOrder.id.toString(),
      status: wcOrder.status,
      total: parseFloat(wcOrder.total || '0'),
      items: wcOrder.line_items.map((item: any) => ({
        sku: item.sku || '',
        name: item.name,
        quantity: item.quantity,
        price: parseFloat(item.price || '0'),
      })),
      customer: {
        externalId: wcOrder.customer_id?.toString() || '',
        email: wcOrder.billing.email,
        name: `${wcOrder.billing.first_name} ${wcOrder.billing.last_name}`.trim(),
      },
      createdAt: wcOrder.date_created,
      metadata: wcOrder,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
