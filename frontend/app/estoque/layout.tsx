'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Layout/Sidebar';
import { Topbar } from '@/components/Layout/Topbar';
import { authService } from '@/lib/auth';
import { useAuthStore } from '@/store/authStore';
import Cookies from 'js-cookie';

export default function EstoqueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const { setUser } = useAuthStore();

  useEffect(() => {
    const verifyAuth = async () => {
      const token = Cookies.get('accessToken');

      if (!token) {
        router.push('/auth/login');
        return;
      }

      try {
        const profile = await authService.getProfile();
        setUser(profile);
        setIsLoading(false);
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        router.push('/auth/login');
      }
    };

    verifyAuth();
  }, [router, setUser]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-600">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
