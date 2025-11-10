'use client';

import { useState } from 'react';
import { Package, ShoppingCart, Users, Archive, RefreshCw, Eye, CheckCircle2, XCircle, Clock, Loader } from 'lucide-react';

interface SyncHistoryEntry {
  id: string;
  type: 'full' | 'products' | 'orders' | 'customers' | 'inventory';
  marketplace: string;
  startedAt: string;
  finishedAt: string | null;
  status: 'COMPLETED' | 'FAILED' | 'RUNNING' | 'PENDING' | 'CANCELLED';
  itemsSynced: number;
  duration: number | null;
}

interface SyncHistoryTableProps {
  marketplace: string;
}

export default function SyncHistoryTable({ marketplace }: SyncHistoryTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Mock data - substituir por chamada real à API
  const mockHistory: SyncHistoryEntry[] = [
    {
      id: '1',
      type: 'full',
      marketplace,
      startedAt: '2025-01-15T10:30:00Z',
      finishedAt: '2025-01-15T10:35:00Z',
      status: 'COMPLETED',
      itemsSynced: 128,
      duration: 300,
    },
    {
      id: '2',
      type: 'products',
      marketplace,
      startedAt: '2025-01-15T09:15:00Z',
      finishedAt: '2025-01-15T09:18:00Z',
      status: 'COMPLETED',
      itemsSynced: 45,
      duration: 180,
    },
    {
      id: '3',
      type: 'orders',
      marketplace,
      startedAt: '2025-01-15T08:00:00Z',
      finishedAt: '2025-01-15T08:02:00Z',
      status: 'COMPLETED',
      itemsSynced: 23,
      duration: 120,
    },
    {
      id: '4',
      type: 'inventory',
      marketplace,
      startedAt: '2025-01-14T16:45:00Z',
      finishedAt: null,
      status: 'FAILED',
      itemsSynced: 0,
      duration: null,
    },
    {
      id: '5',
      type: 'customers',
      marketplace,
      startedAt: '2025-01-14T14:20:00Z',
      finishedAt: '2025-01-14T14:25:00Z',
      status: 'COMPLETED',
      itemsSynced: 67,
      duration: 300,
    },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'full':
        return <RefreshCw size={16} className="text-gray-700" />;
      case 'products':
        return <Package size={16} className="text-gray-700" />;
      case 'orders':
        return <ShoppingCart size={16} className="text-gray-700" />;
      case 'customers':
        return <Users size={16} className="text-gray-700" />;
      case 'inventory':
        return <Archive size={16} className="text-gray-700" />;
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      full: 'Sincronização Completa',
      products: 'Produtos',
      orders: 'Pedidos',
      customers: 'Clientes',
      inventory: 'Estoque',
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { bg: string; text: string; icon: JSX.Element }> = {
      COMPLETED: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: <CheckCircle2 size={14} />,
      },
      FAILED: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: <XCircle size={14} />,
      },
      RUNNING: {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        icon: <Loader size={14} className="animate-spin" />,
      },
      PENDING: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        icon: <Clock size={14} />,
      },
      CANCELLED: {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        icon: <XCircle size={14} />,
      },
    };

    const config = configs[status] || configs.PENDING;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.icon}
        {status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Histórico de Sincronizações</h2>
        
        {/* Filters */}
        <div className="flex gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Tipo</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos</option>
              <option value="full">Sincronização Completa</option>
              <option value="products">Produtos</option>
              <option value="orders">Pedidos</option>
              <option value="customers">Clientes</option>
              <option value="inventory">Estoque</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos</option>
              <option value="COMPLETED">Concluída</option>
              <option value="FAILED">Falhou</option>
              <option value="RUNNING">Em Andamento</option>
              <option value="PENDING">Pendente</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Início
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Fim
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Itens
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Duração
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {mockHistory.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(entry.type)}
                    <span className="text-sm text-gray-900">{getTypeLabel(entry.type)}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {formatDate(entry.startedAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {entry.finishedAt ? formatDate(entry.finishedAt) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(entry.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                  {entry.itemsSynced}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {formatDuration(entry.duration)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition"
                  >
                    <Eye size={14} />
                    Detalhes
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <p className="text-sm text-gray-700">
          Mostrando <span className="font-medium">1</span> a <span className="font-medium">5</span> de{' '}
          <span className="font-medium">5</span> resultados
        </p>
        <div className="flex gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Anterior
          </button>
          <button
            className="px-3 py-1.5 text-sm bg-[#111827] text-white rounded-lg"
          >
            1
          </button>
          <button
            disabled
            onClick={() => setCurrentPage(currentPage + 1)}
            className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Próximo
          </button>
        </div>
      </div>
    </div>
  );
}
