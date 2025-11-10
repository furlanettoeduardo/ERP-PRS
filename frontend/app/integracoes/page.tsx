'use client';

import { useEffect, useState } from 'react';
import { IntegrationCard } from '@/components/integrations/IntegrationCard';
import api from '@/lib/api';

const MARKETPLACES = [
  {
    name: 'Mercado Livre',
    marketplace: 'MERCADO_LIVRE',
    logo: '🛒',
    description: 'Integre com o maior marketplace da América Latina',
  },
  {
    name: 'Shopee',
    marketplace: 'SHOPEE',
    logo: '🛍️',
    description: 'Conecte sua loja com a Shopee Brasil',
  },
  {
    name: 'Amazon',
    marketplace: 'AMAZON',
    logo: '📦',
    description: 'Venda seus produtos na Amazon',
  },
  {
    name: 'WooCommerce',
    marketplace: 'WOOCOMMERCE',
    logo: '🏪',
    description: 'Integre com sua loja WooCommerce',
  },
];

export default function IntegracoesPage() {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const response = await api.get('/integrations');
      setIntegrations(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar integrações:', error);
      setIntegrations([]);
    } finally {
      setLoading(false);
    }
  };

  const getIntegrationStatus = (marketplace: string) => {
    const integration = integrations.find((i) => i.marketplace === marketplace);
    return integration?.status || 'DISCONNECTED';
  };

  const handleConnect = async (marketplace: string) => {
    setConnecting(marketplace);
    
    // Redireciona para página de configuração
    window.location.href = `/integracoes/${marketplace.toLowerCase()}/configurar`;
  };

  const handleDisconnect = async (marketplace: string) => {
    if (!confirm('Tem certeza que deseja desconectar esta integração?')) {
      return;
    }

    setConnecting(marketplace);
    
    try {
      await api.post(`/integrations/${marketplace.toLowerCase()}/disconnect`);
      await fetchIntegrations();
      alert('Integração desconectada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao desconectar:', error);
      alert(error.response?.data?.message || 'Erro ao desconectar integração');
    } finally {
      setConnecting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Integrações</h1>
        <p className="text-gray-600 mt-2">
          Conecte seu ERP com os principais marketplaces e plataformas
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MARKETPLACES.map((mp) => (
          <IntegrationCard
            key={mp.marketplace}
            name={mp.name}
            marketplace={mp.marketplace}
            logo={mp.logo}
            status={getIntegrationStatus(mp.marketplace)}
            description={mp.description}
            onConnect={() => handleConnect(mp.marketplace)}
            onDisconnect={() => handleDisconnect(mp.marketplace)}
            isConnecting={connecting === mp.marketplace}
          />
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          💡 Precisa de ajuda?
        </h3>
        <p className="text-blue-700 text-sm mb-4">
          Confira nossos guias detalhados e vídeos tutoriais para cada marketplace.
        </p>
        <div className="flex gap-3">
          <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
            Ver documentação →
          </button>
          <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
            Assistir vídeos →
          </button>
        </div>
      </div>
    </div>
  );
}
