'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { LayoutLeft } from './components/LayoutLeft';

export default function AuthPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleToggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
  };

  const handleRegisterSuccess = () => {
    // Após registro bem-sucedido, voltar ao modo login
    setMode('login');
  };

  if (isAuthenticated) {
    return null; // Evita flash de conteúdo durante redirect
  }

  return (
    <div className="min-h-screen flex">
      {/* Lado esquerdo - Decorativo */}
      <LayoutLeft />

      {/* Lado direito - Formulário */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          {mode === 'login' ? (
            <LoginForm onToggleMode={handleToggleMode} />
          ) : (
            <RegisterForm
              onToggleMode={handleToggleMode}
              onSuccess={handleRegisterSuccess}
            />
          )}
        </div>
      </div>
    </div>
  );
}
