'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="z-10 w-full max-w-5xl items-center justify-between">
        <h1 className="text-5xl font-bold mb-4 text-center text-gray-900">
          🚀 ERP - Sistema de Gestão Empresarial
        </h1>
        <p className="text-center text-gray-600 mb-12 text-lg">
          Gerencie seus marketplaces em um único lugar
        </p>
        
        <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-semibold mb-2">✅ Frontend Next.js 15</h2>
              <p className="text-gray-600">
                Interface moderna com App Router, TailwindCSS e componentes reutilizáveis
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-semibold mb-2">⚙️ Backend NestJS</h2>
              <p className="text-gray-600">
                API RESTful com Prisma ORM, PostgreSQL e arquitetura modular
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-semibold mb-2">🐳 Docker</h2>
              <p className="text-gray-600">
                Ambiente containerizado com PostgreSQL e Redis
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-semibold mb-2">🔐 Autenticação JWT</h2>
              <p className="text-gray-600">
                Sistema completo com refresh tokens e proteção de rotas
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          <Link
            href="/login"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md"
          >
            Fazer Login
          </Link>
          <Link
            href="/register"
            className="px-8 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-md"
          >
            Criar Conta
          </Link>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Ambiente de desenvolvimento configurado e pronto para uso ✨
          </p>
        </div>
      </div>
    </main>
  );
}
