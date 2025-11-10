'use client';

import { getMarketplaceConfig } from '@/lib/marketplace-config';

interface MarketplaceBadgeProps {
  marketplace: string;
  type?: 'default' | 'feature' | 'status';
  feature?: string;
}

export default function MarketplaceBadge({
  marketplace,
  type = 'default',
  feature,
}: MarketplaceBadgeProps) {
  const config = getMarketplaceConfig(marketplace);

  if (!config) return null;

  if (type === 'default') {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border-2"
        style={{
          backgroundColor: `${config.color}20`,
          borderColor: config.color,
          color: '#111827',
        }}
      >
        <span>{config.icon}</span>
        <span>{config.name}</span>
      </span>
    );
  }

  if (type === 'feature' && feature) {
    const hasFeatureFlag = config.features[feature as keyof typeof config.features];
    
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
          hasFeatureFlag
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-600'
        }`}
      >
        {hasFeatureFlag ? '✓' : '✗'} {feature}
      </span>
    );
  }

  if (type === 'status') {
    return (
      <span
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium"
        style={{
          backgroundColor: '#FFFFFF',
          border: `2px solid ${config.color}`,
        }}
      >
        <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: config.color }} />
        <span className="text-gray-900">Conectado</span>
      </span>
    );
  }

  return null;
}
