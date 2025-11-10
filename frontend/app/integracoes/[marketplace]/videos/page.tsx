'use client';

import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';

const VIDEOS: any = {
  'mercado-livre': {
    name: 'Mercado Livre',
    logo: '🛒',
    videos: [
      {
        title: 'Criando sua Aplicação no Mercado Livre Developers',
        duration: '8:45',
        thumbnail: '🎬',
        description: 'Aprenda a criar e configurar sua aplicação no portal de desenvolvedores.',
      },
      {
        title: 'Configurando OAuth2 e Redirect URL',
        duration: '6:30',
        thumbnail: '🔐',
        description: 'Entenda como configurar o fluxo de autenticação OAuth2.',
      },
      {
        title: 'Conectando sua Primeira Integração',
        duration: '5:15',
        thumbnail: '🔌',
        description: 'Passo a passo completo da primeira conexão no sistema.',
      },
      {
        title: 'Sincronizando Produtos e Estoque',
        duration: '12:20',
        thumbnail: '📦',
        description: 'Como manter produtos e estoque sincronizados automaticamente.',
      },
    ],
  },
  shopee: {
    name: 'Shopee',
    logo: '🛍️',
    videos: [
      {
        title: 'Registro no Shopee Open Platform',
        duration: '10:30',
        thumbnail: '🎬',
        description: 'Como registrar sua aplicação e aguardar aprovação.',
      },
      {
        title: 'Obtendo Partner ID e Partner Key',
        duration: '5:45',
        thumbnail: '🔑',
        description: 'Onde encontrar suas credenciais após aprovação.',
      },
      {
        title: 'Autorizando suas Lojas',
        duration: '7:15',
        thumbnail: '🏪',
        description: 'Autorizando cada loja Shopee individualmente.',
      },
      {
        title: 'Configurando Webhooks',
        duration: '9:00',
        thumbnail: '⚡',
        description: 'Recebendo eventos em tempo real da Shopee.',
      },
    ],
  },
  amazon: {
    name: 'Amazon',
    logo: '📦',
    videos: [
      {
        title: 'Introdução à Selling Partner API (SP-API)',
        duration: '11:20',
        thumbnail: '🎬',
        description: 'Visão geral da API da Amazon para vendedores.',
      },
      {
        title: 'Configurando Login with Amazon (LWA)',
        duration: '8:50',
        thumbnail: '🔐',
        description: 'Criando e configurando credenciais LWA.',
      },
      {
        title: 'Solicitando Acesso à SP-API',
        duration: '6:40',
        thumbnail: '📝',
        description: 'Processo de aprovação e documentação necessária.',
      },
      {
        title: 'Primeira Conexão e Testes',
        duration: '10:15',
        thumbnail: '✅',
        description: 'Conectando e testando a integração.',
      },
    ],
  },
  woocommerce: {
    name: 'WooCommerce',
    logo: '🏪',
    videos: [
      {
        title: 'Habilitando REST API no WooCommerce',
        duration: '4:30',
        thumbnail: '🎬',
        description: 'Configurações iniciais da API REST.',
      },
      {
        title: 'Criando Chaves de API',
        duration: '5:20',
        thumbnail: '🔑',
        description: 'Gerando Consumer Key e Consumer Secret.',
      },
      {
        title: 'Configurando Permissões',
        duration: '6:15',
        thumbnail: '🛡️',
        description: 'Definindo níveis de acesso adequados.',
      },
      {
        title: 'Integração Completa no Sistema',
        duration: '8:45',
        thumbnail: '🔌',
        description: 'Do começo ao fim: conectando sua loja WooCommerce.',
      },
    ],
  },
};

export default function IntegrationVideosPage() {
  const router = useRouter();
  const params = useParams();
  const marketplace = params.marketplace as string;
  const videoData = VIDEOS[marketplace] || { videos: [] };

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
          Voltar para {videoData.name}
        </button>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-3xl">
            {videoData.logo}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vídeos Tutoriais</h1>
            <p className="text-gray-600 mt-1">{videoData.name} - Aprenda assistindo</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {videoData.videos.map((video: any, index: number) => (
          <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 h-48 flex items-center justify-center text-6xl">
              {video.thumbnail}
            </div>
            
            <div className="p-6">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="text-lg font-bold text-gray-900 flex-1">{video.title}</h3>
                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium whitespace-nowrap">
                  {video.duration}
                </span>
              </div>
              
              <p className="text-gray-600 text-sm mb-4">{video.description}</p>
              
              <button
                disabled
                className="w-full bg-gray-200 text-gray-500 px-4 py-2 rounded-lg font-medium cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
                Em breve
              </button>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6 bg-yellow-50 border border-yellow-200">
        <div className="flex gap-4">
          <div className="text-3xl">🎥</div>
          <div className="flex-1">
            <h3 className="font-bold text-yellow-900 text-lg mb-2">Vídeos em Produção</h3>
            <p className="text-yellow-800 mb-3">
              Estamos produzindo conteúdo em vídeo de alta qualidade para ajudá-lo a integrar sua loja com o {videoData.name}. 
              Os vídeos estarão disponíveis em breve!
            </p>
            <p className="text-sm text-yellow-700">
              Enquanto isso, você pode seguir nosso <button 
                onClick={() => router.push(`/integracoes/${marketplace}/guia`)}
                className="underline font-medium hover:text-yellow-900"
              >guia escrito passo a passo</button>.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
