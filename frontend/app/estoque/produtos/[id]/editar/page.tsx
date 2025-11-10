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
}

export default function EditarProdutoPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    price: '',
    cost: '',
    minStock: '',
  });

  useEffect(() => {
    fetchProduct();
  }, [params.id]);

  const fetchProduct = async () => {
    try {
      const response = await api.get<Product>(`/inventory/products/${params.id}`);
      setProduct(response.data);
      setFormData({
        sku: response.data.sku,
        name: response.data.name,
        description: response.data.description || '',
        price: response.data.price.toString(),
        cost: response.data.cost?.toString() || '',
        minStock: response.data.minStock.toString(),
      });
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
      alert('Produto não encontrado');
      router.push('/estoque/produtos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.put(`/inventory/products/${params.id}`, {
        sku: formData.sku,
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        cost: formData.cost ? parseFloat(formData.cost) : null,
        minStock: parseInt(formData.minStock),
      });

      router.push('/estoque/produtos');
    } catch (error: any) {
      console.error('Erro ao atualizar produto:', error);
      alert(error.response?.data?.message || 'Erro ao atualizar produto');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900 transition-colors mb-4 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Editar Produto</h1>
        <p className="text-gray-600 mt-2">Atualize as informações do produto</p>
      </div>

      <Card className="p-6">
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm">Estoque Atual</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{product?.currentStock}</p>
          <p className="text-gray-500 text-xs mt-1">Para ajustar o estoque, use a página de movimentações</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="sku" className="block text-gray-700 text-sm font-medium mb-2">
                SKU <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                required
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="name" className="block text-gray-700 text-sm font-medium mb-2">
                Nome <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-gray-700 text-sm font-medium mb-2">
              Descrição
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full bg-gray-50 border border-gray-300 text-gray-900 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="price" className="block text-gray-700 text-sm font-medium mb-2">
                Preço de Venda (R$) <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="cost" className="block text-gray-700 text-sm font-medium mb-2">
                Custo (R$)
              </label>
              <input
                type="number"
                id="cost"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="minStock" className="block text-gray-700 text-sm font-medium mb-2">
              Estoque Mínimo <span className="text-red-600">*</span>
            </label>
            <input
              type="number"
              id="minStock"
              name="minStock"
              value={formData.minStock}
              onChange={handleChange}
              required
              min="0"
              className="w-full bg-gray-50 border border-gray-300 text-gray-900 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[#111827] text-white px-6 py-3 rounded-lg hover:bg-[#1f2937] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
