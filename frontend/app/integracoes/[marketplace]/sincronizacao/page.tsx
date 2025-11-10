'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  RefreshCw, 
  Package, 
  ShoppingCart, 
  Users, 
  Archive,
  Play,
  Settings,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import SyncActionButton from './components/SyncActionButton';
import SyncStatusCard from './components/SyncStatusCard';
import SyncHistoryTable from './components/SyncHistoryTable';
import { getMarketplaceConfig, hasFeature, getMarketplaceEndpoint, type SyncStatus } from '@/lib/marketplace-config';

interface PageProps {
  params: {
    marketplace: string;
  };
}

export default function SyncPage({ params }: PageProps) {
  const router = useRouter();
  const marketplaceConfig = getMarketplaceConfig(params.marketplace);
  
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    state: 'idle',
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('connected');

  // Redirect se marketplace não existe
  useEffect(() => {
    if (!marketplaceConfig) {
      router.push('/integracoes');
    }
  }, [marketplaceConfig, router]);

  if (!marketplaceConfig) {
    return null;
  }

  const marketplaceName = marketplaceConfig.name;

  const handleFullSync = async () => {
    setShowConfirmModal(false);
    setSyncStatus({
      state: 'running',
      type: 'Sincronização Completa',
      progress: 0,
      currentStep: 'Iniciando...',
    });

    try {
      const endpoint = getMarketplaceEndpoint(params.marketplace, 'fullSync');
      if (!endpoint) throw new Error('Endpoint não encontrado');

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketplace: params.marketplace }),
      });

      if (!response.ok) throw new Error('Erro ao iniciar sincronização');

      // Simular progresso
      simulateProgress('Sincronização Completa');
    } catch (error) {
      setSyncStatus({
        state: 'error',
        type: 'Sincronização Completa',
        currentStep: 'Erro ao sincronizar',
      });
    }
  };

  const handleProductSync = async () => {
    setSyncStatus({
      state: 'running',
      type: 'Sincronizar Produtos',
      progress: 0,
      currentStep: 'Buscando produtos...',
    });

    try {
      const endpoint = getMarketplaceEndpoint(params.marketplace, 'products');
      if (!endpoint) throw new Error('Endpoint não encontrado');

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketplace: params.marketplace }),
      });

      if (!response.ok) throw new Error('Erro ao sincronizar produtos');

      simulateProgress('Sincronizar Produtos');
    } catch (error) {
      setSyncStatus({
        state: 'error',
        type: 'Sincronizar Produtos',
        currentStep: 'Erro ao sincronizar produtos',
      });
    }
  };

  const handleOrderSync = async () => {
    setSyncStatus({
      state: 'running',
      type: 'Sincronizar Pedidos',
      progress: 0,
      currentStep: 'Buscando pedidos...',
    });

    try {
      const endpoint = getMarketplaceEndpoint(params.marketplace, 'orders');
      if (!endpoint) throw new Error('Endpoint não encontrado');

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketplace: params.marketplace }),
      });

      if (!response.ok) throw new Error('Erro ao sincronizar pedidos');

      simulateProgress('Sincronizar Pedidos');
    } catch (error) {
      setSyncStatus({
        state: 'error',
        type: 'Sincronizar Pedidos',
        currentStep: 'Erro ao sincronizar pedidos',
      });
    }
  };

  const handleCustomerSync = async () => {
    // Verificar se marketplace suporta clientes
    if (!hasFeature(params.marketplace, 'customers')) {
      alert(`${marketplaceName} não suporta sincronização de clientes`);
      return;
    }

    setSyncStatus({
      state: 'running',
      type: 'Sincronizar Clientes',
      progress: 0,
      currentStep: 'Buscando clientes...',
    });

    try {
      const endpoint = getMarketplaceEndpoint(params.marketplace, 'customers');
      if (!endpoint) throw new Error('Endpoint não encontrado');

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketplace: params.marketplace }),
      });

      if (!response.ok) throw new Error('Erro ao sincronizar clientes');

      simulateProgress('Sincronizar Clientes');
    } catch (error) {
      setSyncStatus({
        state: 'error',
        type: 'Sincronizar Clientes',
        currentStep: 'Erro ao sincronizar clientes',
      });
    }
  };

  const handleInventorySync = async () => {
    setSyncStatus({
      state: 'running',
      type: 'Sincronizar Estoque',
      progress: 0,
      currentStep: 'Atualizando estoque...',
    });

    try {
      const endpoint = getMarketplaceEndpoint(params.marketplace, 'inventory');
      if (!endpoint) throw new Error('Endpoint não encontrado');

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketplace: params.marketplace }),
      });

      if (!response.ok) throw new Error('Erro ao sincronizar estoque');

      simulateProgress('Sincronizar Estoque');
    } catch (error) {
      setSyncStatus({
        state: 'error',
        type: 'Sincronizar Estoque',
        currentStep: 'Erro ao sincronizar estoque',
      });
    }
  };

  const simulateProgress = (type: string) => {
    let progress = 0;
    const steps = [
      'Conectando ao marketplace...',
      'Baixando dados...',
      'Processando informações...',
      'Atualizando banco de dados...',
      'Finalizando...',
    ];

    const interval = setInterval(() => {
      progress += 20;
      const stepIndex = Math.floor(progress / 20);

      if (progress >= 100) {
        clearInterval(interval);
        setSyncStatus({
          state: 'completed',
          type,
          progress: 100,
          currentStep: 'Concluído!',
        });
        setLastSync(new Date());
      } else {
        setSyncStatus({
          state: 'running',
          type,
          progress,
          currentStep: steps[stepIndex] || 'Processando...',
        });
      }
    }, 1000);
  };

  const handleRefreshStatus = async () => {
    try {
      const response = await fetch(`/api/sync/status?marketplace=${params.marketplace}`);
      if (response.ok) {
        const data = await response.json();
        // Atualizar status com dados reais
        console.log('Status atualizado:', data);
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <button
              onClick={() => router.push('/integracoes')}
              className="hover:text-gray-900 transition"
            >
              Integrações
            </button>
            <ChevronRight size={16} />
            <button
              onClick={() => router.push(`/integracoes/${params.marketplace}`)}
              className="hover:text-gray-900 transition"
            >
              {marketplaceName}
            </button>
            <ChevronRight size={16} />
            <span className="text-gray-900 font-medium">Sincronização</span>
          </div>

          {/* Title & Actions */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Sincronização - {marketplaceName}
              </h1>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      connectionStatus === 'connected'
                        ? 'bg-green-500'
                        : connectionStatus === 'error'
                        ? 'bg-red-500'
                        : 'bg-gray-400'
                    }`}
                  />
                  <span className="text-sm text-gray-600">
                    {connectionStatus === 'connected'
                      ? 'Conectado'
                      : connectionStatus === 'error'
                      ? 'Erro de conexão'
                      : 'Desconectado'}
                  </span>
                </div>
                {lastSync && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock size={14} />
                    <span>
                      Última sincronização: {lastSync.toLocaleString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRefreshStatus}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                <RefreshCw size={18} />
                Atualizar Status
              </button>
              <button
                onClick={() => router.push(`/integracoes/${params.marketplace}`)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                <Settings size={18} />
                Ver Configurações
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Status Card */}
        <SyncStatusCard
          state={syncStatus.state}
          type={syncStatus.type}
          progress={syncStatus.progress}
          currentStep={syncStatus.currentStep}
          onViewLogs={() => router.push(`/integracoes/${params.marketplace}/sincronizacao/logs`)}
        />

        {/* Actions Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Ações de Sincronização
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <SyncActionButton
              icon={<Play size={20} />}
              label="Sincronização Completa"
              description="Sincroniza tudo de uma vez"
              onClick={() => setShowConfirmModal(true)}
              variant="primary"
              disabled={syncStatus.state === 'running'}
            />

            {hasFeature(params.marketplace, 'products') && (
              <SyncActionButton
                icon={<Package size={20} />}
                label="Sincronizar Produtos"
                description="Apenas produtos e variações"
                onClick={handleProductSync}
                disabled={syncStatus.state === 'running'}
              />
            )}

            {hasFeature(params.marketplace, 'orders') && (
              <SyncActionButton
                icon={<ShoppingCart size={20} />}
                label="Sincronizar Pedidos"
                description="Pedidos e status"
                onClick={handleOrderSync}
                disabled={syncStatus.state === 'running'}
              />
            )}

            {hasFeature(params.marketplace, 'customers') && (
              <SyncActionButton
                icon={<Users size={20} />}
                label="Sincronizar Clientes"
                description="Base de clientes"
                onClick={handleCustomerSync}
                disabled={syncStatus.state === 'running'}
              />
            )}

            {hasFeature(params.marketplace, 'inventory') && (
              <SyncActionButton
                icon={<Archive size={20} />}
                label="Sincronizar Estoque"
                description="Quantidades disponíveis"
                onClick={handleInventorySync}
                disabled={syncStatus.state === 'running'}
              />
            )}

            <SyncActionButton
              icon={<AlertCircle size={20} />}
              label="Ver Divergências"
              description="Resolver conflitos"
              onClick={() => router.push(`/integracoes/${params.marketplace}/sincronizacao/divergencias`)}
              variant="warning"
            />
          </div>
        </div>

        {/* History Section */}
        <SyncHistoryTable marketplace={params.marketplace} />
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="text-yellow-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Confirmar Sincronização Completa
                </h3>
                <p className="text-sm text-gray-600">
                  Esta ação irá sincronizar todos os dados (produtos, pedidos, clientes e estoque) com o {marketplaceName}. 
                  Este processo pode demorar alguns minutos.
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleFullSync}
                className="px-4 py-2 text-white bg-[#111827] rounded-lg hover:bg-gray-800 transition"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
