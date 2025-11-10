import React from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { StatusBadge } from './StatusBadge';

interface IntegrationCardProps {
  name: string;
  marketplace: string;
  logo: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  description: string;
  onConnect: () => void;
  onDisconnect: () => void;
  isConnecting?: boolean;
}

export function IntegrationCard({
  name,
  marketplace,
  logo,
  status,
  description,
  onConnect,
  onDisconnect,
  isConnecting = false,
}: IntegrationCardProps) {
  const router = useRouter();

  // Converte MERCADO_LIVRE para mercado-livre
  const marketplacePath = marketplace.toLowerCase().replace('_', '-');

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
            {logo}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
            <StatusBadge status={status} />
          </div>
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-4">{description}</p>

      <div className="flex gap-2">
        {status === 'CONNECTED' ? (
          <>
            <button
              onClick={() => router.push(`/integracoes/${marketplacePath}`)}
              className="flex-1 bg-gray-100 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
            >
              Ver Detalhes
            </button>
            <button
              onClick={onDisconnect}
              disabled={isConnecting}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium text-sm disabled:opacity-50"
            >
              Desconectar
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => router.push(`/integracoes/${marketplacePath}/configuracao`)}
              disabled={isConnecting}
              className="flex-1 bg-[#111827] text-white px-4 py-2 rounded-lg hover:bg-[#1f2937] transition-colors font-medium text-sm disabled:opacity-50"
            >
              Configurar
            </button>
            <button
              onClick={() => router.push(`/integracoes/${marketplacePath}/guia`)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium text-sm"
            >
              Guia
            </button>
          </>
        )}
      </div>
    </Card>
  );
}
