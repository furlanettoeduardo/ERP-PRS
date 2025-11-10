'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { PageContainer } from '@/components/ui/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingCard } from '@/components/ui/loading';
import { Users, UserCheck, Clock } from 'lucide-react';

interface DashboardSummary {
  usersCount: number;
  activeUsers: number;
  timestamp: string;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const { data } = await api.get<DashboardSummary>('/dashboard/summary');
        setSummary(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erro ao carregar métricas');
        console.error('Erro ao buscar summary:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <PageContainer
      title="Dashboard"
      description="Visão geral do sistema e métricas principais"
    >
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {isLoading ? (
          <>
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
          </>
        ) : (
          <>
            {/* Total Users Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total de Usuários
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {summary?.usersCount || 0}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  Usuários cadastrados no sistema
                </p>
              </CardContent>
            </Card>

            {/* Active Users Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Usuários Ativos
                    </p>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                      {summary?.activeUsers || 0}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <UserCheck className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  Usuários com status ativo
                </p>
              </CardContent>
            </Card>

            {/* Last Update Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Última Atualização
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-2">
                      {summary?.timestamp ? formatDate(summary.timestamp) : '-'}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  Sincronizado com o servidor
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Welcome Section */}
      <Card>
        <CardHeader>
          <CardTitle>Bem-vindo ao ERP System</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Este é o painel principal do sistema ERP. Aqui você terá acesso a todas as
            funcionalidades e métricas importantes para gerenciar seu negócio.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">📊 Próximas Funcionalidades</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Gestão completa de produtos</li>
                <li>• Controle de estoque</li>
                <li>• Gerenciamento de pedidos</li>
                <li>• Integração com marketplaces</li>
              </ul>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">✅ Já Disponível</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Sistema de autenticação JWT</li>
                <li>• Gerenciamento de usuários</li>
                <li>• Dashboard com métricas</li>
                <li>• Layout responsivo</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
