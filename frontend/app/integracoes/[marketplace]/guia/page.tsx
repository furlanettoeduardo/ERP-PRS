'use client';

import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';

const GUIDES: any = {
  'mercado-livre': {
    name: 'Mercado Livre',
    logo: '🛒',
    steps: [
      {
        title: 'Acesse o Mercado Livre Developers',
        description: 'Vá para https://developers.mercadolivre.com.br',
        details: 'Faça login com sua conta de vendedor do Mercado Livre.',
      },
      {
        title: 'Crie uma Aplicação',
        description: 'No painel de desenvolvedores, crie uma nova aplicação',
        details: 'Clique em "Criar aplicação" e preencha os dados solicitados (nome, descrição, etc).',
      },
      {
        title: 'Configure Redirect URL',
        description: 'Adicione a URL de callback do sistema',
        details: 'Configure a URL: https://seu-dominio.com/api/integrations/mercado-livre/callback',
      },
      {
        title: 'Copie as Credenciais',
        description: 'Obtenha o Client ID e Client Secret',
        details: 'Copie as credenciais fornecidas e guarde-as com segurança.',
      },
      {
        title: 'Configure no Sistema',
        description: 'Cole as credenciais na página de integração',
        details: 'Volte para /integracoes/mercado-livre e cole o Client ID e Client Secret.',
      },
      {
        title: 'Autorize a Aplicação',
        description: 'Clique em conectar e autorize o acesso',
        details: 'Você será redirecionado para o Mercado Livre para autorizar o acesso da aplicação.',
      },
    ],
  },
  shopee: {
    name: 'Shopee',
    logo: '🛍️',
    steps: [
      {
        title: 'Acesse o Shopee Open Platform',
        description: 'Vá para https://open.shopee.com',
        details: 'Faça login com sua conta de vendedor da Shopee.',
      },
      {
        title: 'Registre sua Aplicação',
        description: 'Crie uma nova aplicação no painel',
        details: 'Preencha os dados solicitados e aguarde aprovação (pode levar até 48h).',
      },
      {
        title: 'Obtenha as Chaves de API',
        description: 'Copie Partner ID e Partner Key',
        details: 'Após aprovação, acesse as credenciais da sua aplicação.',
      },
      {
        title: 'Configure Webhook (Opcional)',
        description: 'Configure URLs de webhook para eventos em tempo real',
        details: 'Adicione: https://seu-dominio.com/api/integrations/shopee/webhook',
      },
      {
        title: 'Conecte no Sistema',
        description: 'Cole as credenciais na página de integração',
        details: 'Volte para /integracoes/shopee e insira Partner ID e Partner Key.',
      },
      {
        title: 'Autorize as Lojas',
        description: 'Autorize cada loja individualmente',
        details: 'Cada loja da Shopee precisa autorizar a integração separadamente.',
      },
    ],
  },
  amazon: {
    name: 'Amazon',
    logo: '📦',
    steps: [
      {
        title: 'Acesse Seller Central',
        description: 'Faça login em sellercentral.amazon.com.br',
        details: 'Use sua conta de vendedor da Amazon.',
      },
      {
        title: 'Navegue para Configurações',
        description: 'Vá em Configurações > Permissões de Usuário',
        details: 'Procure pela seção "Login com Amazon" (LWA).',
      },
      {
        title: 'Registre sua Aplicação',
        description: 'Crie um novo cliente LWA',
        details: 'Preencha nome da aplicação e configurações de privacidade.',
      },
      {
        title: 'Configure Redirect URI',
        description: 'Adicione URI de redirecionamento',
        details: 'Configure: https://seu-dominio.com/api/integrations/amazon/callback',
      },
      {
        title: 'Copie as Credenciais',
        description: 'Obtenha Client ID e Client Secret',
        details: 'Anote também o Selling Partner ID da sua conta.',
      },
      {
        title: 'Ative SP-API',
        description: 'Solicite acesso à Selling Partner API',
        details: 'Siga o processo de aprovação da Amazon (pode levar alguns dias).',
      },
      {
        title: 'Conecte no Sistema',
        description: 'Cole as credenciais e autorize',
        details: 'Insira Client ID, Client Secret e Seller ID em /integracoes/amazon.',
      },
    ],
  },
  woocommerce: {
    name: 'WooCommerce',
    logo: '🏪',
    steps: [
      {
        title: 'Acesse o WordPress Admin',
        description: 'Faça login no painel administrativo',
        details: 'Acesse: https://sua-loja.com/wp-admin',
      },
      {
        title: 'Navegue para WooCommerce',
        description: 'Vá em WooCommerce > Configurações',
        details: 'Clique na aba "Avançado" e depois em "REST API".',
      },
      {
        title: 'Crie uma Nova Chave de API',
        description: 'Clique em "Adicionar chave"',
        details: 'Preencha a descrição (ex: "Integração ERP") e escolha permissões de Leitura/Gravação.',
      },
      {
        title: 'Selecione Permissões',
        description: 'Defina nível de acesso como Leitura/Gravação',
        details: 'Isso permitirá que o sistema leia e atualize produtos, pedidos e estoque.',
      },
      {
        title: 'Copie as Credenciais',
        description: 'Copie Consumer Key e Consumer Secret',
        details: 'ATENÇÃO: O Consumer Secret só será exibido uma vez. Salve em local seguro!',
      },
      {
        title: 'Configure no Sistema',
        description: 'Cole as credenciais em /integracoes/woocommerce',
        details: 'Insira também a URL completa da sua loja (ex: https://sua-loja.com).',
      },
      {
        title: 'Teste a Conexão',
        description: 'Clique em conectar para verificar',
        details: 'O sistema testará a conexão e exibirá o status.',
      },
    ],
  },
};

export default function IntegrationGuidePage() {
  const router = useRouter();
  const params = useParams();
  const marketplace = params.marketplace as string;
  const guide = GUIDES[marketplace] || { steps: [] };

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
          Voltar para {guide.name}
        </button>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-3xl">
            {guide.logo}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Guia de Integração</h1>
            <p className="text-gray-600 mt-1">{guide.name} - Passo a passo completo</p>
          </div>
        </div>
      </div>

      <Card className="p-6">
        <div className="space-y-8">
          {guide.steps.map((step: any, index: number) => (
            <div key={index} className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-[#111827] text-white rounded-full flex items-center justify-center font-bold text-lg">
                  {index + 1}
                </div>
              </div>
              
              <div className="flex-1 pb-8 border-b border-gray-200 last:border-0 last:pb-0">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-700 mb-3">{step.description}</p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">{step.details}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-bold text-blue-900 mb-2">💡 Precisa de ajuda?</h4>
            <p className="text-sm text-blue-800">
              Se você tiver dúvidas durante a integração, consulte também nossos vídeos tutoriais ou entre em contato com o suporte técnico.
            </p>
            <button
              onClick={() => router.push(`/integracoes/${marketplace}/videos`)}
              className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Ver vídeos tutoriais →
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
