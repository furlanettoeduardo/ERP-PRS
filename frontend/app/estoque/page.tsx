'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import api from '@/lib/api';

interface DashboardStats {
  totalProducts: number;
  totalStock: number;
  lowStockProducts: number;
  recentMovements: number;
}

export default function EstoquePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/inventory/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestão de Estoque</h1>
        <p className="text-gray-600 mt-2">Controle e monitore seu inventário</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total de Produtos</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.totalProducts || 0}
              </p>
            </div>
            <div className="bg-[#111827] p-3 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Estoque Total</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.totalStock || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">unidades</p>
            </div>
            <div className="bg-[#111827] p-3 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Estoque Baixo</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {stats?.lowStockProducts || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">produtos</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Movimentações (30d)</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.recentMovements || 0}
              </p>
            </div>
            <div className="bg-[#111827] p-3 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
          <div className="space-y-3">
            <a
              href="/estoque/produtos/novo"
              className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 text-[#111827] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <div>
                  <p className="text-gray-900 font-medium">Cadastrar Produto</p>
                  <p className="text-gray-600 text-sm">Adicionar novo item ao estoque</p>
                </div>
              </div>
            </a>

            <a
              href="/estoque/produtos"
              className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 text-[#111827] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <div>
                  <p className="text-gray-900 font-medium">Ver Produtos</p>
                  <p className="text-gray-600 text-sm">Lista completa do inventário</p>
                </div>
              </div>
            </a>

            <a
              href="/estoque/movimentacoes"
              className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 text-[#111827] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <div>
                  <p className="text-gray-900 font-medium">Movimentações</p>
                  <p className="text-gray-600 text-sm">Histórico de entradas e saídas</p>
                </div>
              </div>
            </a>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Alertas</h2>
          {stats && stats.lowStockProducts > 0 ? (
            <div className="space-y-3">
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-red-800 font-medium">Estoque Baixo</p>
                    <p className="text-red-700 text-sm mt-1">
                      {stats.lowStockProducts} {stats.lowStockProducts === 1 ? 'produto está' : 'produtos estão'} abaixo do estoque mínimo
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>Nenhum alerta no momento</p>
              <p className="text-sm text-gray-400 mt-1">Seu estoque está em níveis adequados</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
