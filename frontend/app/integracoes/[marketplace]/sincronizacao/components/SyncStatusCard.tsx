'use client';

import { Activity, CheckCircle2, XCircle, Clock, Eye } from 'lucide-react';

interface SyncStatusCardProps {
  state: 'idle' | 'running' | 'error' | 'completed';
  type?: string;
  progress?: number;
  currentStep?: string;
  onViewLogs: () => void;
}

export default function SyncStatusCard({
  state,
  type,
  progress = 0,
  currentStep,
  onViewLogs,
}: SyncStatusCardProps) {
  const getStateConfig = () => {
    switch (state) {
      case 'running':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: <Activity className="text-blue-600 animate-pulse" size={24} />,
          title: 'Sincronização em Andamento',
          subtitle: type || 'Processando...',
          color: 'text-blue-900',
        };
      case 'completed':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: <CheckCircle2 className="text-green-600" size={24} />,
          title: 'Sincronização Concluída',
          subtitle: type || 'Operação finalizada com sucesso',
          color: 'text-green-900',
        };
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: <XCircle className="text-red-600" size={24} />,
          title: 'Erro na Sincronização',
          subtitle: type || 'Ocorreu um problema',
          color: 'text-red-900',
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          icon: <Clock className="text-gray-600" size={24} />,
          title: 'Aguardando Sincronização',
          subtitle: 'Nenhuma operação em andamento',
          color: 'text-gray-900',
        };
    }
  };

  const config = getStateConfig();

  return (
    <div className={`${config.bg} border-2 ${config.border} rounded-lg p-6 mb-6`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
            {config.icon}
          </div>
          <div>
            <h2 className={`text-lg font-semibold ${config.color} mb-1`}>
              {config.title}
            </h2>
            <p className="text-sm text-gray-700">{config.subtitle}</p>
          </div>
        </div>

        {state === 'running' && (
          <button
            onClick={onViewLogs}
            className="flex items-center gap-2 px-4 py-2 text-sm text-blue-700 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition"
          >
            <Eye size={16} />
            Ver Logs em Tempo Real
          </button>
        )}
      </div>

      {state === 'running' && (
        <div className="space-y-3">
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm text-gray-700 mb-2">
              <span>Progresso</span>
              <span className="font-semibold">{progress}%</span>
            </div>
            <div className="w-full h-2 bg-white rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Current Step */}
          {currentStep && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Activity size={14} className="animate-pulse" />
              <span>{currentStep}</span>
            </div>
          )}

          {/* Estimated Time */}
          <div className="text-xs text-gray-600">
            Tempo estimado: {Math.ceil((100 - progress) / 20)} minutos
          </div>
        </div>
      )}

      {state === 'completed' && (
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-700">
            <Clock size={14} />
            <span>Duração: 5 minutos</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <CheckCircle2 size={14} />
            <span>128 itens sincronizados</span>
          </div>
        </div>
      )}

      {state === 'error' && (
        <div className="mt-4">
          <p className="text-sm text-red-800 mb-3">
            {currentStep || 'Falha ao conectar com o marketplace. Verifique suas credenciais e tente novamente.'}
          </p>
          <button className="text-sm text-red-700 font-medium hover:text-red-800 transition">
            Ver detalhes do erro →
          </button>
        </div>
      )}
    </div>
  );
}
