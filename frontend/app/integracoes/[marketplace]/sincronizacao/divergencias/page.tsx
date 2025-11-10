'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Package, Archive, ShoppingCart, Users, AlertTriangle } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import DivergenceCard from '../components/DivergenceCard';
import { getMarketplaceConfig, type Divergence } from '@/lib/marketplace-config';

type DivergenceType = 'produtos' | 'estoque' | 'pedidos' | 'clientes';

export default function DivergenciasPage() {
  const router = useRouter();
  const params = useParams();
  const marketplace = params.marketplace as string;
  const marketplaceConfig = getMarketplaceConfig(marketplace);
  const [activeTab, setActiveTab] = useState<DivergenceType>('produtos');

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

  // Helper function to generate marketplace-specific data
  const getMarketplaceSpecificData = () => {
    switch (marketplace) {
      case 'woocommerce':
        return {
          productId: '12345',
          variationId: '67890',
          regularPrice: '549.90',
          salePrice: '499.90',
          stockStatus: 'instock',
          manageStock: true,
          permalink: 'https://store.example.com/product/notebook-dell',
        };
      case 'mercado-livre':
        return {
          itemId: 'MLB123456789',
          categoryId: 'MLB1649',
          listingType: 'gold_premium',
          permalink: 'https://produto.mercadolivre.com.br/MLB-123456789-notebook-dell',
          sellerId: '123456789',
        };
      case 'shopee':
        return {
          itemId: '987654321',
          shopId: '123456',
          modelList: [{ model_id: 111, model_sku: 'SKU-12345-A' }],
          weight: '2.5',
          logisticInfo: [{ logistic_id: 123, logistic_name: 'Standard Delivery' }],
        };
      case 'amazon':
        return {
          asin: 'B08N5WRWNW',
          sku: 'DELL-INSP-15-001',
          conditionType: 'New',
          fulfillmentChannel: 'FBA',
          attributeSets: [{ Title: 'Notebook Dell Inspiron 15' }],
          marketplaceId: 'ATVPDKIKX0DER',
        };
      default:
        return {};
    }
  };

  // Mock data - substituir por chamada real à API
  const mockDivergences: Record<DivergenceType, Divergence[]> = {
    produtos: [
      {
        id: '1',
        type: 'product',
        itemId: 'SKU-12345',
        itemName: 'Notebook Dell Inspiron 15',
        field: 'Nome do Produto',
        localValue: 'Notebook Dell Inspiron 15 i5 8GB',
        externalValue: 'Notebook Dell Inspiron 15',
        lastChecked: new Date().toISOString(),
        severity: 'warning',
        marketplace,
        specificData: getMarketplaceSpecificData(),
      },
      {
        id: '2',
        type: 'price',
        itemId: 'SKU-67890',
        itemName: 'Mouse Logitech MX Master 3',
        field: 'Preço',
        localValue: 549.90,
        externalValue: 499.90,
        lastChecked: new Date(Date.now() - 3600000).toISOString(),
        severity: 'critical',
        marketplace,
        specificData: marketplace === 'woocommerce'
          ? {
              productId: '67890',
              regularPrice: '549.90',
              salePrice: '499.90',
              stockStatus: 'instock',
              manageStock: true,
            }
          : marketplace === 'mercado-livre'
          ? {
              itemId: 'MLB987654321',
              listingType: 'gold_special',
              permalink: 'https://produto.mercadolivre.com.br/MLB-987654321-mouse',
            }
          : marketplace === 'amazon'
          ? {
              asin: 'B07S395RWD',
              sku: 'LOGI-MX3-001',
              conditionType: 'New',
              fulfillmentChannel: 'FBM',
            }
          : { itemId: '111222333', shopId: '654321' },
      },
      {
        id: '3',
        type: 'product',
        itemId: 'SKU-11111',
        itemName: 'Teclado Mecânico Keychron K2',
        field: 'Descrição',
        localValue: 'Teclado mecânico RGB com switches Gateron Brown',
        externalValue: 'Teclado mecânico RGB',
        lastChecked: new Date(Date.now() - 7200000).toISOString(),
        severity: 'info',
        marketplace,
        specificData: marketplace === 'woocommerce'
          ? {
              productId: '11111',
              regularPrice: '799.90',
              stockStatus: 'onbackorder',
              manageStock: false,
            }
          : marketplace === 'mercado-livre'
          ? { itemId: 'MLB555555555', listingType: 'free' }
          : {},
      },
    ],
    estoque: [
      {
        id: '4',
        type: 'stock',
        itemId: 'SKU-22222',
        itemName: 'Headset HyperX Cloud II',
        field: 'Quantidade em Estoque',
        localValue: 45,
        externalValue: 50,
        lastChecked: new Date(Date.now() - 1800000).toISOString(),
        severity: 'warning',
        marketplace,
        specificData: marketplace === 'woocommerce'
          ? { stockStatus: 'instock', manageStock: true }
          : {},
      },
      {
        id: '5',
        type: 'stock',
        itemId: 'SKU-33333',
        itemName: 'Webcam Logitech C920',
        field: 'Quantidade em Estoque',
        localValue: 0,
        externalValue: 5,
        lastChecked: new Date(Date.now() - 900000).toISOString(),
        severity: 'critical',
        marketplace,
        specificData: marketplace === 'woocommerce'
          ? { stockStatus: 'outofstock', manageStock: true }
          : marketplace === 'amazon'
          ? { fulfillmentChannel: 'FBA' }
          : {},
      },
    ],
    pedidos: [
      {
        id: '6',
        type: 'customer',
        itemId: 'ORDER-44444',
        itemName: 'Pedido #44444',
        field: 'Status do Pedido',
        localValue: 'Enviado',
        externalValue: 'Processando',
        lastChecked: new Date(Date.now() - 600000).toISOString(),
        severity: 'warning',
        marketplace,
        specificData: {},
      },
    ],
    clientes: [
      {
        id: '7',
        type: 'customer',
        itemId: 'CUST-55555',
        itemName: 'João Silva',
        field: 'Email',
        localValue: 'joao.silva@email.com',
        externalValue: 'j.silva@email.com',
        lastChecked: new Date(Date.now() - 3600000).toISOString(),
        severity: 'info',
        marketplace,
        specificData: {},
      },
    ],
  };

  const tabs: Array<{ key: DivergenceType; label: string; icon: JSX.Element }> = [
    { key: 'produtos', label: 'Produtos', icon: <Package size={18} /> },
    { key: 'estoque', label: 'Estoque', icon: <Archive size={18} /> },
    { key: 'pedidos', label: 'Pedidos', icon: <ShoppingCart size={18} /> },
  ];

  // Adicionar aba de clientes apenas se o marketplace suportar
  if (marketplaceConfig.features.customers) {
    tabs.push({ key: 'clientes', label: 'Clientes', icon: <Users size={18} /> });
  }

  const currentDivergences = mockDivergences[activeTab];

  const handleResolveAuto = (id: string) => {
    console.log('Resolvendo automaticamente:', id);
    // Implementar chamada à API
  };

  const handleResolveManual = (id: string) => {
    console.log('Resolvendo manualmente:', id);
    // Implementar chamada à API
  };

  const handleResolveAll = () => {
    console.log('Resolvendo todas as divergências automaticamente');
    // Implementar chamada à API
  };

  const totalDivergences = Object.values(mockDivergences).reduce(
    (sum, arr) => sum + arr.length,
    0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-4 transition"
          >
            <ArrowLeft size={20} />
            <span>Voltar</span>
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Divergências de Sincronização
              </h1>
              <p className="text-gray-700">
                Resolva conflitos entre o ERP e {marketplaceName}
              </p>
            </div>

            {currentDivergences.length > 0 && (
              <button
                onClick={handleResolveAll}
                className="px-4 py-2.5 bg-[#111827] text-white rounded-lg hover:bg-gray-800 transition"
              >
                Resolver Todas Automaticamente
              </button>
            )}
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="text-yellow-600" size={24} />
            <h2 className="text-lg font-semibold text-gray-900">
              {totalDivergences} Divergências Encontradas
            </h2>
          </div>
          <p className="text-sm text-gray-700">
            Existem {totalDivergences} conflitos entre os dados do ERP e do marketplace que precisam ser
            resolvidos. Você pode resolver automaticamente (usando o valor local) ou manualmente
            (escolhendo qual valor manter).
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
          <div className="flex border-b border-gray-200">
            {tabs.map((tab) => {
              const count = mockDivergences[tab.key].length;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition ${
                    activeTab === tab.key
                      ? 'bg-[#111827] text-white'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {count > 0 && (
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        activeTab === tab.key
                          ? 'bg-white text-gray-900'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Divergences List */}
        <div>
          {currentDivergences.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="text-green-600" size={32} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma Divergência Encontrada
              </h3>
              <p className="text-gray-700">
                Todos os dados em {tabs.find((t) => t.key === activeTab)?.label.toLowerCase()} estão
                sincronizados corretamente.
              </p>
            </div>
          ) : (
            currentDivergences.map((divergence) => (
              <DivergenceCard
                key={divergence.id}
                type={divergence.type}
                itemId={divergence.itemId}
                itemName={divergence.itemName}
                field={divergence.field}
                localValue={divergence.localValue}
                externalValue={divergence.externalValue}
                lastChecked={divergence.lastChecked}
                severity={divergence.severity}
                marketplace={marketplace}
                specificData={divergence.specificData}
                onResolveAuto={() => handleResolveAuto(divergence.id)}
                onResolveManual={() => handleResolveManual(divergence.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
