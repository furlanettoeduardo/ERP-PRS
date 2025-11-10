'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/integrations/StatusBadge';
import api from '@/lib/api';

const MARKETPLACE_INFO: any = {
  'mercado-livre': {
    name: 'Mercado Livre',
    logo: '🛒',
    description: 'O maior marketplace da América Latina',
  },
  shopee: {
    name: 'Shopee',
    logo: '🛍️',
    description: 'Marketplace de e-commerce internacional',
  },
  amazon: {
    name: 'Amazon',
    logo: '📦',
    description: 'Maior marketplace do mundo',
  },
  woocommerce: {
    name: 'WooCommerce',
    logo: '🏪',
    description: 'Plataforma de e-commerce WordPress',
  },
};

export default function MarketplaceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const marketplace = params.marketplace as string;
  const [integration, setIntegration] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const info = MARKETPLACE_INFO[marketplace] || {};

  useEffect(() => {
    fetchIntegrationDetails();
  }, [marketplace]);

  const fetchIntegrationDetails = async () => {
    try {
      setLoading(true);
      
      // Busca status da integração
      const statusResponse = await api.get(`/integrations/${marketplace}/status`);
      setIntegration(statusResponse.data);

      // Se conectado, busca logs
      if (statusResponse.data.connected) {
        const integrationsResponse = await api.get('/integrations');
        const found = integrationsResponse.data.find(
          (i: any) => i.marketplace === marketplace.toUpperCase().replace('-', '_')
        );
        
        if (found) {
          const logsResponse = await api.get(`/integrations/${found.id}/logs`);
          setLogs(logsResponse.data.logs || []);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReconnect = () => {
    router.push(`/integracoes/${marketplace}/configurar`);
  };

  const handleDisconnect = async () => {
    if (!confirm('Tem certeza que deseja desconectar esta integração?')) return;

    try {
      await api.post(`/integrations/${marketplace}/disconnect`);
      await fetchIntegrationDetails();
      alert('Integração desconectada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao desconectar:', error);
      alert(error.response?.data?.message || 'Erro ao desconectar');
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
        <button
          onClick={() => router.push('/integracoes')}
          className="text-gray-600 hover:text-gray-900 transition-colors mb-4 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar para Integrações
        </button>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-3xl">
            {info.logo}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{info.name}</h1>
            <p className="text-gray-600 mt-1">{info.description}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Status da Integração</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Status:</span>
              <StatusBadge status={integration?.status || 'DISCONNECTED'} />
            </div>

            {integration?.connected && (
              <>
                {integration.expiresAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Expira em:</span>
                    <span className="text-gray-900">
                      {new Date(integration.expiresAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}

                {integration.shopId && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Shop ID:</span>
                    <span className="text-gray-900 font-mono text-sm">{integration.shopId}</span>
                  </div>
                )}

                {integration.sellerId && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Seller ID:</span>
                    <span className="text-gray-900 font-mono text-sm">{integration.sellerId}</span>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex gap-3 mt-6 pt-6 border-t">
            {integration?.connected ? (
              <>
                <button
                  onClick={handleReconnect}
                  className="flex-1 bg-[#111827] text-white px-4 py-2 rounded-lg hover:bg-[#1f2937] transition-colors font-medium"
                >
                  Reconectar
                </button>
                <button
                  onClick={handleDisconnect}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                >
                  Desconectar
                </button>
              </>
            ) : (
              <button
                onClick={handleReconnect}
                className="flex-1 bg-[#111827] text-white px-4 py-2 rounded-lg hover:bg-[#1f2937] transition-colors font-medium"
              >
                Conectar
              </button>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Recursos</h3>
            <div className="space-y-3">
              <button
                onClick={() => router.push(`/integracoes/${marketplace}/guia`)}
                className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">📖</span>
                  <div>
                    <p className="font-medium text-gray-900">Guia de Integração</p>
                    <p className="text-xs text-gray-600">Passo a passo completo</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => router.push(`/integracoes/${marketplace}/videos`)}
                className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🎥</span>
                  <div>
                    <p className="font-medium text-gray-900">Vídeos Tutoriais</p>
                    <p className="text-xs text-gray-600">Aprenda assistindo</p>
                  </div>
                </div>
              </button>
            </div>
          </Card>
        </div>
      </div>

      {integration?.connected && logs.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Logs Recentes</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-700 font-semibold text-sm">Data</th>
                  <th className="text-left py-3 px-4 text-gray-700 font-semibold text-sm">Tipo</th>
                  <th className="text-left py-3 px-4 text-gray-700 font-semibold text-sm">Mensagem</th>
                </tr>
              </thead>
              <tbody>
                {logs.slice(0, 10).map((log) => (
                  <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(log.createdAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          log.type === 'ERROR'
                            ? 'bg-red-50 text-red-600'
                            : log.type === 'WARNING'
                            ? 'bg-yellow-50 text-yellow-600'
                            : 'bg-blue-50 text-blue-600'
                        }`}
                      >
                        {log.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">{log.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
