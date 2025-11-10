import React from 'react';

interface StatusBadgeProps {
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles = {
    CONNECTED: 'bg-green-50 text-green-600 border-green-200',
    DISCONNECTED: 'bg-gray-50 text-gray-600 border-gray-200',
    ERROR: 'bg-red-50 text-red-600 border-red-200',
  };

  const labels = {
    CONNECTED: 'Conectado',
    DISCONNECTED: 'Desconectado',
    ERROR: 'Erro',
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
      <span className={`w-2 h-2 rounded-full mr-2 ${status === 'CONNECTED' ? 'bg-green-600' : status === 'ERROR' ? 'bg-red-600' : 'bg-gray-400'}`} />
      {labels[status]}
    </span>
  );
}
