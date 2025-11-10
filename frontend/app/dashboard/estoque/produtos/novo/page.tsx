'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import api from '@/lib/api';

export default function NovoProdutoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    price: '',
    cost: '',
    currentStock: '0',
    minStock: '0',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/inventory/products', {
        sku: formData.sku,
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        cost: formData.cost ? parseFloat(formData.cost) : null,
        currentStock: parseInt(formData.currentStock),
        minStock: parseInt(formData.minStock),
      });

      router.push('/dashboard/estoque/produtos');
    } catch (error: any) {
      console.error('Erro ao criar produto:', error);
      alert(error.response?.data?.message || 'Erro ao criar produto');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white transition-colors mb-4 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </button>
        <h1 className="text-3xl font-bold text-white">Novo Produto</h1>
        <p className="text-gray-400 mt-2">Cadastre um novo produto no estoque</p>
      </div>

      <Card className="bg-[#111827] border-gray-700 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="sku" className="block text-gray-400 text-sm font-medium mb-2">
                SKU <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                required
                className="w-full bg-[#1f2937] border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-gray-600"
                placeholder="Ex: PROD-001"
              />
            </div>

            <div>
              <label htmlFor="name" className="block text-gray-400 text-sm font-medium mb-2">
                Nome <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full bg-[#1f2937] border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-gray-600"
                placeholder="Nome do produto"
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-gray-400 text-sm font-medium mb-2">
              Descrição
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full bg-[#1f2937] border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-gray-600"
              placeholder="Descrição detalhada do produto"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="price" className="block text-gray-400 text-sm font-medium mb-2">
                Preço de Venda (R$) <span className="text-red-400">*</span>
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
                className="w-full bg-[#1f2937] border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-gray-600"
                placeholder="0.00"
              />
            </div>

            <div>
              <label htmlFor="cost" className="block text-gray-400 text-sm font-medium mb-2">
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
                className="w-full bg-[#1f2937] border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-gray-600"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="currentStock" className="block text-gray-400 text-sm font-medium mb-2">
                Estoque Inicial <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                id="currentStock"
                name="currentStock"
                value={formData.currentStock}
                onChange={handleChange}
                required
                min="0"
                className="w-full bg-[#1f2937] border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-gray-600"
                placeholder="0"
              />
            </div>

            <div>
              <label htmlFor="minStock" className="block text-gray-400 text-sm font-medium mb-2">
                Estoque Mínimo <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                id="minStock"
                name="minStock"
                value={formData.minStock}
                onChange={handleChange}
                required
                min="0"
                className="w-full bg-[#1f2937] border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-gray-600"
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-white text-[#111827] px-6 py-3 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Salvando...' : 'Criar Produto'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
