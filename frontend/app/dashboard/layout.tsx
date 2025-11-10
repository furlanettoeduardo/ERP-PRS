'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/lib/auth';
import Cookies from 'js-cookie';
import { Sidebar } from '@/components/Layout/Sidebar';
import { Topbar } from '@/components/Layout/Topbar';
import { LoadingSpinner } from '@/components/ui/loading';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated, clearAuth, setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = Cookies.get('accessToken');

      // Se não houver token, redirecionar imediatamente
      if (!token) {
        router.push('/auth/login');
        return;
      }

      try {
        // Buscar dados do usuário se não existirem
        if (!user) {
          const userData = await authService.getProfile();
          setUser(userData);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Erro ao buscar perfil:', error);
        clearAuth();
        router.push('/auth/login');
      }
    };

    checkAuth();
  }, [router, user, setUser, clearAuth]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <Topbar />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
