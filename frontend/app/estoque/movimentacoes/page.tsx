'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import api from '@/lib/api';

interface Product {
  id: string;
  sku: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface Movement {
  id: string;
  type: 'ENTRY' | 'EXIT' | 'ADJUSTMENT';
  quantity: number;
  previousStock: number;
  newStock: number;
  origin: 'MANUAL' | 'MARKETPLACE' | 'ORDER' | 'IMPORT' | 'OTHER';
  note: string | null;
  createdAt: string;
  product: Product;
  user: User;
}

interface MovementsResponse {
  movements: Movement[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ProductOption {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
}

export default function MovimentacoesPage() {
  const router = useRouter();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    type: 'ENTRY' as 'ENTRY' | 'EXIT' | 'ADJUSTMENT',
    quantity: '',
    origin: 'MANUAL' as 'MANUAL' | 'MARKETPLACE' | 'ORDER' | 'IMPORT' | 'OTHER',
    note: '',
  });

  useEffect(() => {
    fetchMovements();
    fetchProducts();
  }, [page]);

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const response = await api.get<MovementsResponse>('/inventory/movements', {
        params: { page, limit: 10 },
      });
      setMovements(response.data.movements || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Erro ao carregar movimentações:', error);
      setMovements([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/inventory/products', { params: { limit: 100 } });
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      setProducts([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post('/inventory/movements', {
        productId: formData.productId,
        type: formData.type,
        quantity: parseInt(formData.quantity),
        origin: formData.origin,
        note: formData.note || null,
      });

      setShowModal(false);
      setFormData({
        productId: '',
        type: 'ENTRY',
        quantity: '',
        origin: 'MANUAL',
        note: '',
      });
      fetchMovements();
      fetchProducts();
    } catch (error: any) {
      console.error('Erro ao criar movimentação:', error);
      alert(error.response?.data?.message || 'Erro ao criar movimentação');
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, { label: string; color: string }> = {
      ENTRY: { label: 'Entrada', color: 'text-green-600 bg-green-50' },
      EXIT: { label: 'Saída', color: 'text-red-600 bg-red-50' },
      ADJUSTMENT: { label: 'Ajuste', color: 'text-yellow-600 bg-yellow-50' },
    };
    return types[type] || types.ENTRY;
  };

  const getOriginLabel = (origin: string) => {
    const origins: Record<string, string> = {
      MANUAL: 'Manual',
      MARKETPLACE: 'Marketplace',
      ORDER: 'Pedido',
      IMPORT: 'Importação',
      OTHER: 'Outro',
    };
    return origins[origin] || origin;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && movements.length === 0) {
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
          onClick={() => router.push('/estoque')}
          className="text-gray-600 hover:text-gray-900 transition-colors mb-4 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar para Estoque
        </button>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Movimentações de Estoque</h1>
          <p className="text-gray-600 mt-2">Histórico de entradas, saídas e ajustes</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#111827] text-white px-4 py-2 rounded-lg hover:bg-[#1f2937] transition-colors font-medium"
        >
          + Nova Movimentação
        </button>
      </div>

      <Card className="p-6">
        {!movements || movements.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            <p className="text-lg">Nenhuma movimentação registrada</p>
            <p className="text-sm text-gray-500 mt-1">Registre entradas e saídas de estoque</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-gray-700 font-semibold text-sm">Data</th>
                    <th className="text-left py-3 px-4 text-gray-700 font-semibold text-sm">Produto</th>
                    <th className="text-center py-3 px-4 text-gray-700 font-semibold text-sm">Tipo</th>
                    <th className="text-right py-3 px-4 text-gray-700 font-semibold text-sm">Quantidade</th>
                    <th className="text-right py-3 px-4 text-gray-700 font-semibold text-sm">Estoque</th>
                    <th className="text-center py-3 px-4 text-gray-700 font-semibold text-sm">Origem</th>
                    <th className="text-left py-3 px-4 text-gray-700 font-semibold text-sm">Usuário</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((movement) => {
                    const typeInfo = getTypeLabel(movement.type);
                    return (
                      <tr key={movement.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4">
                          <span className="text-gray-600 text-sm">{formatDate(movement.createdAt)}</span>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-gray-900 font-medium">{movement.product.name}</p>
                            <p className="text-gray-500 text-xs font-mono">{movement.product.sku}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                            {typeInfo.label}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className={`font-medium ${movement.type === 'ENTRY' ? 'text-green-600' : movement.type === 'EXIT' ? 'text-red-600' : 'text-yellow-600'}`}>
                            {movement.type === 'ENTRY' ? '+' : movement.type === 'EXIT' ? '-' : '±'}{movement.quantity}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="text-gray-500 text-sm">{movement.previousStock} </span>
                          <span className="text-gray-900 font-medium ml-1">{movement.newStock}</span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="text-gray-600 text-sm">{getOriginLabel(movement.origin)}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gray-600 text-sm">{movement.user.name}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>
                <span className="text-gray-600">
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Próxima
                </button>
              </div>
            )}
          </>
        )}
      </Card>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="p-6 max-w-lg w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Nova Movimentação</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Produto <span className="text-red-600">*</span>
                </label>
                <select
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  required
                  className="w-full bg-gray-50 border border-gray-300 text-gray-900 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent"
                >
                  <option value="">Selecione um produto</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.sku}) - Estoque: {product.currentStock}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Tipo <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    required
                    className="w-full bg-gray-50 border border-gray-300 text-gray-900 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent"
                  >
                    <option value="ENTRY">Entrada</option>
                    <option value="EXIT">Saída</option>
                    <option value="ADJUSTMENT">Ajuste</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Quantidade <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                    min="1"
                    className="w-full bg-gray-50 border border-gray-300 text-gray-900 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Origem <span className="text-red-600">*</span>
                </label>
                <select
                  value={formData.origin}
                  onChange={(e) => setFormData({ ...formData, origin: e.target.value as any })}
                  required
                  className="w-full bg-gray-50 border border-gray-300 text-gray-900 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent"
                >
                  <option value="MANUAL">Manual</option>
                  <option value="MARKETPLACE">Marketplace</option>
                  <option value="ORDER">Pedido</option>
                  <option value="IMPORT">Importação</option>
                  <option value="OTHER">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Observações</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  rows={3}
                  className="w-full bg-gray-50 border border-gray-300 text-gray-900 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent"
                  placeholder="Adicione observações (opcional)"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-[#111827] text-white px-6 py-3 rounded-lg hover:bg-[#1f2937] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {submitting ? 'Salvando...' : 'Confirmar'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
