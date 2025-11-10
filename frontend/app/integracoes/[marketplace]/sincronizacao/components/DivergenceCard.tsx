'use client';

import { AlertTriangle, CheckCircle2, Info, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import MarketplaceSpecificFields from './MarketplaceSpecificFields';

interface DivergenceCardProps {
  type: 'product' | 'stock' | 'price' | 'customer' | 'order';
  itemId: string;
  itemName: string;
  field: string;
  localValue: string | number;
  externalValue: string | number;
  lastChecked: string;
  severity: 'critical' | 'warning' | 'info';
  marketplace: string;
  specificData?: Record<string, any>;
  onResolveAuto: () => void;
  onResolveManual: () => void;
}

export default function DivergenceCard({
  type,
  itemId,
  itemName,
  field,
  localValue,
  externalValue,
  lastChecked,
  severity,
  marketplace,
  specificData,
  onResolveAuto,
  onResolveManual,
}: DivergenceCardProps) {
  const [showManualModal, setShowManualModal] = useState(false);
  const [selectedValue, setSelectedValue] = useState<'local' | 'external'>('local');

  const getSeverityConfig = () => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: <AlertTriangle className="text-red-600" size={20} />,
          badge: 'bg-red-100 text-red-800',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: <AlertTriangle className="text-yellow-600" size={20} />,
          badge: 'bg-yellow-100 text-yellow-800',
        };
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: <Info className="text-blue-600" size={20} />,
          badge: 'bg-blue-100 text-blue-800',
        };
    }
  };

  const getTypeLabel = () => {
    const labels: Record<string, string> = {
      product: 'Produto',
      stock: 'Estoque',
      price: 'Preço',
      customer: 'Cliente',
    };
    return labels[type] || type;
  };

  const config = getSeverityConfig();

  const handleManualResolve = () => {
    setShowManualModal(false);
    onResolveManual();
  };

  const formatValue = (value: string | number) => {
    if (field.toLowerCase().includes('preço') || field.toLowerCase().includes('price')) {
      return `R$ ${Number(value).toFixed(2)}`;
    }
    return String(value);
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <div className={`${config.bg} border-2 ${config.border} rounded-lg p-5 mb-4`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
              {config.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-semibold text-gray-900">{itemName}</h3>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${config.badge}`}>
                  {severity.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-gray-700">
                {getTypeLabel()} • ID: {itemId}
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-600">
            Última verificação: {formatDate(lastChecked)}
          </p>
        </div>

        {/* Field comparison */}
        <div className="bg-white rounded-lg p-4 mb-4">
          <p className="text-sm font-semibold text-gray-900 mb-3">
            Campo: <span className="text-gray-700 font-normal">{field}</span>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* Local value */}
            <div className="border border-gray-300 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Valor Local (ERP)</p>
              <p className="text-base font-semibold text-gray-900">{formatValue(localValue)}</p>
            </div>

            {/* Arrow */}
            <div className="flex items-center justify-center">
              <ArrowRight size={24} className="text-gray-400" />
            </div>

            {/* External value */}
            <div className="border border-gray-300 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Valor no Marketplace</p>
              <p className="text-base font-semibold text-gray-900">{formatValue(externalValue)}</p>
            </div>
          </div>
        </div>

        {/* Marketplace-specific fields */}
        {specificData && Object.keys(specificData).length > 0 && (
          <div className="mb-4">
            <MarketplaceSpecificFields marketplace={marketplace} data={specificData} />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onResolveAuto}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#111827] text-white rounded-lg hover:bg-gray-800 transition"
          >
            <CheckCircle2 size={18} />
            Resolver Automaticamente
          </button>
          <button
            onClick={() => setShowManualModal(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Resolver Manualmente
          </button>
        </div>
      </div>

      {/* Manual resolution modal */}
      {showManualModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Resolver Divergência Manualmente</h2>
            
            <div className="mb-6">
              <p className="text-sm text-gray-700 mb-4">
                Escolha qual valor deseja manter para o campo <strong>{field}</strong> do item{' '}
                <strong>{itemName}</strong>:
              </p>

              <div className="space-y-3">
                {/* Local value option */}
                <label
                  className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition ${
                    selectedValue === 'local'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="value"
                    value="local"
                    checked={selectedValue === 'local'}
                    onChange={() => setSelectedValue('local')}
                    className="w-5 h-5 text-blue-600"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 mb-1">Usar Valor Local (ERP)</p>
                    <p className="text-base text-gray-700">{formatValue(localValue)}</p>
                  </div>
                </label>

                {/* External value option */}
                <label
                  className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition ${
                    selectedValue === 'external'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="value"
                    value="external"
                    checked={selectedValue === 'external'}
                    onChange={() => setSelectedValue('external')}
                    className="w-5 h-5 text-blue-600"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 mb-1">Usar Valor do Marketplace</p>
                    <p className="text-base text-gray-700">{formatValue(externalValue)}</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowManualModal(false)}
                className="flex-1 px-4 py-2.5 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleManualResolve}
                className="flex-1 px-4 py-2.5 bg-[#111827] text-white rounded-lg hover:bg-gray-800 transition"
              >
                Confirmar Resolução
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
