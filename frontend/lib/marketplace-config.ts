// Tipos e constantes compartilhadas entre todos os marketplaces

export interface MarketplaceConfig {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
  features: {
    products: boolean;
    orders: boolean;
    customers: boolean;
    inventory: boolean;
    categories: boolean;
  };
  specificFields: Record<string, any>;
  apiEndpoints: {
    fullSync: string;
    products: string;
    orders: string;
    customers: string;
    inventory: string;
    status: string;
    history: string;
    logs: string;
    divergences: string;
  };
}

export const MARKETPLACE_CONFIGS: Record<string, MarketplaceConfig> = {
  'mercado-livre': {
    id: 'mercado-livre',
    name: 'Mercado Livre',
    slug: 'mercado-livre',
    color: '#FFE600',
    icon: '🛒',
    features: {
      products: true,
      orders: true,
      customers: false, // ML não expõe clientes diretamente
      inventory: true,
      categories: true,
    },
    specificFields: {
      itemId: 'Item ID',
      categoryId: 'Category ID',
      listingType: 'Listing Type',
      permalink: 'Permalink',
      sellerId: 'Seller ID',
    },
    apiEndpoints: {
      fullSync: '/api/sync/ml/full',
      products: '/api/sync/ml/products',
      orders: '/api/sync/ml/orders',
      customers: '/api/sync/ml/customers',
      inventory: '/api/sync/ml/inventory',
      status: '/api/sync/ml/status',
      history: '/api/sync/ml/history',
      logs: '/api/sync/ml/logs',
      divergences: '/api/sync/ml/divergences',
    },
  },
  'woocommerce': {
    id: 'woocommerce',
    name: 'WooCommerce',
    slug: 'woocommerce',
    color: '#96588A',
    icon: '🛍️',
    features: {
      products: true,
      orders: true,
      customers: true,
      inventory: true,
      categories: true,
    },
    specificFields: {
      productId: 'Product ID',
      variationId: 'Variation ID',
      regularPrice: 'Regular Price',
      salePrice: 'Sale Price',
      stockStatus: 'Stock Status',
      manageStock: 'Manage Stock',
      permalink: 'Permalink',
    },
    apiEndpoints: {
      fullSync: '/api/sync/wc/full',
      products: '/api/sync/wc/products',
      orders: '/api/sync/wc/orders',
      customers: '/api/sync/wc/customers',
      inventory: '/api/sync/wc/inventory',
      status: '/api/sync/wc/status',
      history: '/api/sync/wc/history',
      logs: '/api/sync/wc/logs',
      divergences: '/api/sync/wc/divergences',
    },
  },
  'shopee': {
    id: 'shopee',
    name: 'Shopee',
    slug: 'shopee',
    color: '#EE4D2D',
    icon: '🛒',
    features: {
      products: true,
      orders: true,
      customers: false, // Shopee restringe acesso a clientes
      inventory: true,
      categories: true,
    },
    specificFields: {
      itemId: 'Item ID',
      shopId: 'Shop ID',
      modelList: 'Model List (Variations)',
      weight: 'Weight',
      logisticInfo: 'Logistic Info',
      status: 'Status',
    },
    apiEndpoints: {
      fullSync: '/api/sync/shopee/full',
      products: '/api/sync/shopee/products',
      orders: '/api/sync/shopee/orders',
      customers: '/api/sync/shopee/customers',
      inventory: '/api/sync/shopee/inventory',
      status: '/api/sync/shopee/status',
      history: '/api/sync/shopee/history',
      logs: '/api/sync/shopee/logs',
      divergences: '/api/sync/shopee/divergences',
    },
  },
  'amazon': {
    id: 'amazon',
    name: 'Amazon',
    slug: 'amazon',
    color: '#FF9900',
    icon: '📦',
    features: {
      products: true,
      orders: true,
      customers: false, // Amazon restringe acesso a clientes
      inventory: true,
      categories: true,
    },
    specificFields: {
      asin: 'ASIN',
      sku: 'SKU',
      conditionType: 'Condition Type',
      fulfillmentChannel: 'Fulfillment Channel (FBA/FBM)',
      attributeSets: 'Attribute Sets',
      marketplaceId: 'Marketplace ID',
    },
    apiEndpoints: {
      fullSync: '/api/sync/amazon/full',
      products: '/api/sync/amazon/products',
      orders: '/api/sync/amazon/orders',
      customers: '/api/sync/amazon/customers',
      inventory: '/api/sync/amazon/inventory',
      status: '/api/sync/amazon/status',
      history: '/api/sync/amazon/history',
      logs: '/api/sync/amazon/logs',
      divergences: '/api/sync/amazon/divergences',
    },
  },
};

export interface SyncStatus {
  state: 'idle' | 'running' | 'error' | 'completed';
  type?: string;
  progress?: number;
  currentStep?: string;
  error?: string;
}

export interface SyncHistoryEntry {
  id: string;
  type: 'full' | 'products' | 'orders' | 'customers' | 'inventory';
  marketplace: string;
  startedAt: string;
  finishedAt: string | null;
  status: 'COMPLETED' | 'FAILED' | 'RUNNING' | 'PENDING' | 'CANCELLED';
  itemsSynced: number;
  duration: number | null;
  error?: string;
}

export interface Divergence {
  id: string;
  type: 'product' | 'stock' | 'price' | 'customer' | 'order';
  itemId: string;
  itemName: string;
  field: string;
  localValue: string | number;
  externalValue: string | number;
  lastChecked: string;
  severity: 'critical' | 'warning' | 'info';
  marketplace: string;
  specificData?: Record<string, any>; // Campos específicos do marketplace
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'ERROR' | 'WARNING' | 'INFO' | 'DEBUG';
  message: string;
  marketplace: string;
  syncType?: string;
}

// Helper functions
export function getMarketplaceConfig(slug: string): MarketplaceConfig | null {
  return MARKETPLACE_CONFIGS[slug] || null;
}

export function getAllMarketplaces(): MarketplaceConfig[] {
  return Object.values(MARKETPLACE_CONFIGS);
}

export function getMarketplaceEndpoint(
  slug: string,
  endpointType: keyof MarketplaceConfig['apiEndpoints'],
): string | null {
  const config = getMarketplaceConfig(slug);
  return config ? config.apiEndpoints[endpointType] : null;
}

export function hasFeature(
  slug: string,
  feature: keyof MarketplaceConfig['features'],
): boolean {
  const config = getMarketplaceConfig(slug);
  return config ? config.features[feature] : false;
}
