'use client';

import { getMarketplaceConfig } from '@/lib/marketplace-config';

interface MarketplaceSpecificFieldsProps {
  marketplace: string;
  data: Record<string, any>;
}

export default function MarketplaceSpecificFields({
  marketplace,
  data,
}: MarketplaceSpecificFieldsProps) {
  const config = getMarketplaceConfig(marketplace);

  if (!config || !data) return null;

  const specificFields = config.specificFields;
  const entries = Object.entries(specificFields);

  if (entries.length === 0) return null;

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">
        Campos Específicos — {config.name}
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {entries.map(([key, label]) => {
          const value = data[key];
          
          if (value === undefined || value === null) return null;

          return (
            <div key={key} className="flex flex-col gap-1">
              <span className="text-xs text-gray-600 uppercase tracking-wide">
                {label}
              </span>
              <span className="text-sm text-gray-900 font-medium">
                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Badges especiais por marketplace */}
      {marketplace === 'amazon' && data.fulfillmentChannel && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
              data.fulfillmentChannel === 'FBA'
                ? 'bg-orange-100 text-orange-800'
                : 'bg-blue-100 text-blue-800'
            }`}
          >
            {data.fulfillmentChannel === 'FBA' ? '📦 Fulfillment by Amazon (FBA)' : '🚚 Fulfillment by Merchant (FBM)'}
          </span>
        </div>
      )}

      {marketplace === 'mercado-livre' && data.listingType && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
              data.listingType === 'gold_special'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {data.listingType === 'gold_special' ? '⭐ Anúncio Premium' : '📋 Anúncio Clássico'}
          </span>
        </div>
      )}

      {marketplace === 'woocommerce' && data.stockStatus && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
              data.stockStatus === 'instock'
                ? 'bg-green-100 text-green-800'
                : data.stockStatus === 'outofstock'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {data.stockStatus === 'instock' && '✓ Em Estoque'}
            {data.stockStatus === 'outofstock' && '✗ Fora de Estoque'}
            {data.stockStatus === 'onbackorder' && '⏳ Em Espera'}
          </span>
          {data.manageStock && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800">
              Gerenciamento automático
            </span>
          )}
        </div>
      )}
    </div>
  );
}
