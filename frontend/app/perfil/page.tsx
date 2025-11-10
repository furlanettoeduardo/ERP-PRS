'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';

export default function PerfilPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
        <p className="text-gray-600 mt-2">Informações da sua conta</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Nome</label>
              <p className="mt-1 text-gray-900">{user?.name || 'Não informado'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">E-mail</label>
              <p className="mt-1 text-gray-900">{user?.email || 'Não informado'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Tipo de Usuário</label>
              <p className="mt-1 text-gray-900 capitalize">{user?.role || 'Não informado'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status da Conta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Status</label>
              <div className="mt-1">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700">
                  Ativa
                </span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Membro desde</label>
              <p className="mt-1 text-gray-900">
                {new Date().toLocaleDateString('pt-BR')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ações</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-sm mb-4">
            Funcionalidades de edição de perfil e alteração de senha serão implementadas em breve.
          </p>
          <div className="flex gap-3">
            <button
              disabled
              className="px-4 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
            >
              Editar Perfil
            </button>
            <button
              disabled
              className="px-4 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
            >
              Alterar Senha
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
