'use client';

import { useState } from 'react';
import { authService } from '@/lib/auth';

interface RegisterFormProps {
  onToggleMode: () => void;
  onSuccess: () => void;
}

export function RegisterForm({ onToggleMode, onSuccess }: RegisterFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      await authService.register({ name, email, password });
      // Após registro bem-sucedido, voltar ao login
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar conta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Criar nova conta
        </h1>
        <p className="text-gray-600">
          Preencha os dados abaixo para começar a usar o sistema
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Nome completo
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="Seu nome"
            disabled={isLoading}
          />
        </div>

        <div>
          <label
            htmlFor="register-email"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            E-mail
          </label>
          <input
            id="register-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="seu@email.com"
            disabled={isLoading}
          />
        </div>

        <div>
          <label
            htmlFor="register-password"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Senha
          </label>
          <input
            id="register-password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="Mínimo 6 caracteres"
            disabled={isLoading}
          />
        </div>

        <div>
          <label
            htmlFor="confirm-password"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Confirmar senha
          </label>
          <input
            id="confirm-password"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="Digite a senha novamente"
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Criando conta...' : 'Criar conta'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Já tem uma conta?{' '}
          <button
            onClick={onToggleMode}
            className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
          >
            Fazer login
          </button>
        </p>
      </div>
    </div>
  );
}
