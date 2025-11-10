'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import api from '@/lib/api';

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  price: number;
  cost: number | null;
  currentStock: number;
  minStock: number;
  active: boolean;
  createdAt: string;
}

interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function ProdutosPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [page, search]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 10 };
      if (search) params.search = search;

      const response = await api.get<ProductsResponse>('/inventory/products', { params });
      setProducts(response.data.products);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const getStockStatus = (product: Product) => {
    if (product.currentStock === 0) return { label: 'Sem estoque', color: 'text-red-400 bg-red-500/10' };
    if (product.currentStock <= product.minStock) return { label: 'Estoque baixo', color: 'text-yellow-400 bg-yellow-500/10' };
    return { label: 'Normal', color: 'text-green-400 bg-green-500/10' };
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Produtos</h1>
          <p className="text-gray-400 mt-2">Gerencie seu inventário de produtos</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/estoque/produtos/novo')}
          className="bg-white text-[#111827] px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          + Novo Produto
        </button>
      </div>

      <Card className="bg-[#111827] border-gray-700 p-6">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar por nome ou SKU..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full bg-[#1f2937] border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-gray-600"
          />
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-lg">Nenhum produto encontrado</p>
            <p className="text-sm text-gray-500 mt-1">
              {search ? 'Tente uma busca diferente' : 'Comece adicionando seu primeiro produto'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">SKU</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Nome</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Preço</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Estoque</th>
                    <th className="text-center py-3 px-4 text-gray-400 font-medium">Status</th>
                    <th className="text-center py-3 px-4 text-gray-400 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const status = getStockStatus(product);
                    return (
                      <tr key={product.id} className="border-b border-gray-800 hover:bg-white/5 transition-colors">
                        <td className="py-4 px-4">
                          <span className="text-white font-mono text-sm">{product.sku}</span>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-white font-medium">{product.name}</p>
                            {product.description && (
                              <p className="text-gray-400 text-sm mt-1 line-clamp-1">{product.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="text-white">R$ {product.price.toFixed(2)}</span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div>
                            <p className="text-white font-medium">{product.currentStock}</p>
                            <p className="text-gray-400 text-xs">mín: {product.minStock}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => router.push(`/dashboard/estoque/produtos/${product.id}/editar`)}
                            className="text-white hover:text-gray-300 transition-colors"
                            title="Editar produto"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
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
                  className="px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>
                <span className="text-gray-400">
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Próxima
                </button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
