'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import api from '@/lib/api';

const MARKETPLACE_INFO: any = {
  'mercado-livre': {
    name: 'Mercado Livre',
    logo: '🛒',
    docsUrl: 'https://developers.mercadolivre.com.br',
    fields: [
      { name: 'clientId', label: 'Client ID', type: 'text', required: true },
      { name: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
      { name: 'redirectUri', label: 'Redirect URI', type: 'text', required: false, readOnly: true },
    ],
  },
  shopee: {
    name: 'Shopee',
    logo: '🛍️',
    docsUrl: 'https://open.shopee.com',
    fields: [
      { name: 'partnerId', label: 'Partner ID', type: 'text', required: true },
      { name: 'partnerKey', label: 'Partner Key', type: 'password', required: true },
      { name: 'shopId', label: 'Shop ID', type: 'text', required: true },
    ],
  },
  amazon: {
    name: 'Amazon',
    logo: '📦',
    docsUrl: 'https://developer.amazonservices.com',
    fields: [
      { name: 'clientId', label: 'LWA Client ID', type: 'text', required: true },
      { name: 'clientSecret', label: 'LWA Client Secret', type: 'password', required: true },
      { name: 'refreshToken', label: 'Refresh Token', type: 'password', required: true },
      { name: 'roleArn', label: 'Role ARN', type: 'text', required: true },
      { name: 'sellerId', label: 'Seller ID', type: 'text', required: false },
    ],
  },
  woocommerce: {
    name: 'WooCommerce',
    logo: '🏪',
    docsUrl: 'https://woocommerce.github.io/woocommerce-rest-api-docs/',
    fields: [
      { name: 'storeUrl', label: 'Store URL', type: 'url', required: true, placeholder: 'https://sua-loja.com' },
      { name: 'consumerKey', label: 'Consumer Key', type: 'text', required: true },
      { name: 'consumerSecret', label: 'Consumer Secret', type: 'password', required: true },
    ],
  },
};

export default function ConfigureMarketplacePage() {
  const router = useRouter();
  const params = useParams();
  const marketplace = params.marketplace as string;
  const info = MARKETPLACE_INFO[marketplace] || {};

  // Estado inicial vazio ou com redirectUri apenas para Mercado Livre
  const getInitialFormData = () => {
    if (marketplace === 'mercado-livre') {
      return {
        redirectUri: `${window.location.origin}/api/integrations/auth/mercado-livre/callback`,
      };
    }
    return {};
  };

  const [formData, setFormData] = useState<any>(getInitialFormData());
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
    setTestResult(null);
  };

  const handleTest = async () => {
    setLoading(true);
    setError('');
    setTestResult(null);

    try {
      // Filtra apenas os campos definidos para este marketplace
      const allowedFields = MARKETPLACE_INFO[marketplace]?.fields.map((f: any) => f.name) || [];
      const filteredData = Object.keys(formData)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => ({ ...obj, [key]: formData[key] }), {});

      const response = await api.post(`/integrations/auth/${marketplace}/test`, filteredData);
      setTestResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao testar conexão');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');

    try {
      // Filtra apenas os campos definidos para este marketplace
      const allowedFields = MARKETPLACE_INFO[marketplace]?.fields.map((f: any) => f.name) || [];
      const filteredData = Object.keys(formData)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => ({ ...obj, [key]: formData[key] }), {});

      await api.post(`/integrations/auth/${marketplace}/save`, filteredData);
      alert('Credenciais salvas com sucesso!');
      
      // Se for Mercado Livre, inicia fluxo OAuth2
      if (marketplace === 'mercado-livre') {
        const authUrl = `/api/integrations/auth/mercado-livre/authorize?client_id=${formData.clientId}`;
        window.location.href = authUrl;
      } else {
        router.push(`/integracoes/${marketplace}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao salvar credenciais');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async () => {
    // Primeiro salva credenciais
    await handleSave();
  };

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => router.push(`/integracoes/${marketplace}`)}
          className="text-gray-600 hover:text-gray-900 transition-colors mb-4 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </button>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-3xl">
            {info.logo}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Configurar {info.name}</h1>
            <p className="text-gray-600 mt-1">Preencha suas credenciais de API</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Credenciais</h2>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {testResult && (
            <div
              className={`mb-4 p-4 rounded-lg border ${
                testResult.success
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <p className={`font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                {testResult.message}
              </p>
              {testResult.responseTime && (
                <p className="text-xs mt-1 text-gray-600">
                  Tempo de resposta: {testResult.responseTime}ms
                </p>
              )}
            </div>
          )}

          <div className="space-y-4">
            {info.fields?.map((field: any) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type={field.type}
                  name={field.name}
                  value={formData[field.name] || ''}
                  onChange={handleChange}
                  readOnly={field.readOnly}
                  placeholder={field.placeholder}
                  required={field.required}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#111827] focus:border-transparent ${
                    field.readOnly ? 'bg-gray-50 text-gray-500' : ''
                  }`}
                />
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-6 pt-6 border-t">
            {marketplace === 'mercado-livre' ? (
              <>
                <button
                  onClick={handleTest}
                  disabled={loading}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                >
                  {loading ? 'Testando...' : 'Validar Credenciais'}
                </button>
                <button
                  onClick={handleOAuth}
                  disabled={loading || !formData.clientId || !formData.clientSecret}
                  className="flex-1 bg-[#111827] text-white px-6 py-2 rounded-lg hover:bg-[#1f2937] transition-colors font-medium disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Salvar e Autenticar'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleTest}
                  disabled={loading}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                >
                  {loading ? 'Testando...' : 'Testar Conexão'}
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 bg-[#111827] text-white px-6 py-2 rounded-lg hover:bg-[#1f2937] transition-colors font-medium disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Salvar Credenciais'}
                </button>
              </>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">📚 Documentação</h3>
            <p className="text-sm text-gray-600 mb-4">
              Consulte a documentação oficial para obter suas credenciais:
            </p>
            <a
              href={info.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block w-full text-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium text-sm"
            >
              Abrir Documentação →
            </a>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">💡 Recursos</h3>
            <div className="space-y-3">
              <button
                onClick={() => router.push(`/integracoes/${marketplace}/guia`)}
                className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <p className="font-medium text-gray-900">Guia de Integração</p>
                <p className="text-xs text-gray-600 mt-1">Passo a passo completo</p>
              </button>

              <button
                onClick={() => router.push(`/integracoes/${marketplace}/videos`)}
                className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <p className="font-medium text-gray-900">Vídeos Tutoriais</p>
                <p className="text-xs text-gray-600 mt-1">Aprenda assistindo</p>
              </button>
            </div>
          </Card>

          {marketplace === 'shopee' && (
            <Card className="p-6 bg-blue-50 border-blue-200">
              <h4 className="font-bold text-blue-900 mb-2">🔐 Gerar Assinatura</h4>
              <p className="text-sm text-blue-800 mb-3">
                Precisa gerar uma assinatura de teste?
              </p>
              <button
                onClick={async () => {
                  try {
                    const response = await api.post('/integrations/auth/shopee/generate-signature', formData);
                    alert(`Assinatura: ${response.data.signature}\nTimestamp: ${response.data.timestamp}`);
                  } catch (err: any) {
                    alert('Erro ao gerar assinatura');
                  }
                }}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Gerar Assinatura HMAC
              </button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
