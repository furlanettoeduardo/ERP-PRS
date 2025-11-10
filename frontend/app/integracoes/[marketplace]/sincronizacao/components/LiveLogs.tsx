'use client';

import { useEffect, useState, useRef } from 'react';
import { Activity, XCircle, AlertCircle, Info, Bug } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'ERROR' | 'WARNING' | 'INFO' | 'DEBUG';
  message: string;
}

interface LiveLogsProps {
  marketplace: string;
  jobId?: string;
}

export default function LiveLogs({ marketplace, jobId }: LiveLogsProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Simular logs em tempo real (substituir por SSE ou polling real)
  useEffect(() => {
    const mockLogs: LogEntry[] = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: `Iniciando sincronização com ${marketplace}`,
      },
      {
        id: '2',
        timestamp: new Date(Date.now() + 1000).toISOString(),
        level: 'INFO',
        message: 'Conectando ao marketplace...',
      },
      {
        id: '3',
        timestamp: new Date(Date.now() + 2000).toISOString(),
        level: 'INFO',
        message: 'Conexão estabelecida com sucesso',
      },
      {
        id: '4',
        timestamp: new Date(Date.now() + 3000).toISOString(),
        level: 'INFO',
        message: 'Baixando lista de produtos...',
      },
      {
        id: '5',
        timestamp: new Date(Date.now() + 4000).toISOString(),
        level: 'DEBUG',
        message: 'Recebidos 128 produtos do marketplace',
      },
      {
        id: '6',
        timestamp: new Date(Date.now() + 5000).toISOString(),
        level: 'INFO',
        message: 'Processando produtos...',
      },
      {
        id: '7',
        timestamp: new Date(Date.now() + 6000).toISOString(),
        level: 'WARNING',
        message: 'Produto SKU-12345 sem preço definido, usando preço padrão',
      },
      {
        id: '8',
        timestamp: new Date(Date.now() + 7000).toISOString(),
        level: 'DEBUG',
        message: 'Processados 50/128 produtos',
      },
      {
        id: '9',
        timestamp: new Date(Date.now() + 8000).toISOString(),
        level: 'ERROR',
        message: 'Erro ao processar produto SKU-67890: imagem não encontrada',
      },
      {
        id: '10',
        timestamp: new Date(Date.now() + 9000).toISOString(),
        level: 'INFO',
        message: 'Atualizando banco de dados local...',
      },
    ];

    setLogs(mockLogs);

    // Simular novos logs chegando
    const interval = setInterval(() => {
      const newLog: LogEntry = {
        id: String(Date.now()),
        timestamp: new Date().toISOString(),
        level: ['INFO', 'DEBUG', 'WARNING', 'ERROR'][Math.floor(Math.random() * 4)] as any,
        message: `Log simulado em tempo real ${new Date().toLocaleTimeString()}`,
      };
      setLogs((prev) => [...prev, newLog]);
    }, 3000);

    return () => clearInterval(interval);
  }, [marketplace, jobId]);

  // Auto-scroll para o final quando novos logs chegam
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const getLevelConfig = (level: string) => {
    switch (level) {
      case 'ERROR':
        return {
          icon: <XCircle size={14} />,
          color: 'text-red-600',
          bg: 'bg-red-50',
        };
      case 'WARNING':
        return {
          icon: <AlertCircle size={14} />,
          color: 'text-yellow-600',
          bg: 'bg-yellow-50',
        };
      case 'INFO':
        return {
          icon: <Info size={14} />,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
        };
      case 'DEBUG':
        return {
          icon: <Bug size={14} />,
          color: 'text-gray-600',
          bg: 'bg-gray-50',
        };
      default:
        return {
          icon: <Activity size={14} />,
          color: 'text-gray-600',
          bg: 'bg-gray-50',
        };
    }
  };

  const formatTimestamp = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  };

  const filteredLogs = filterLevel === 'all' 
    ? logs 
    : logs.filter(log => log.level === filterLevel);

  const handleDownloadLogs = () => {
    const logsText = logs
      .map(log => `[${formatTimestamp(log.timestamp)}] [${log.level}] ${log.message}`)
      .join('\n');
    
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sync-logs-${marketplace}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity size={20} className="text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">Logs em Tempo Real</h2>
          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Ativo
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter by level */}
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os níveis</option>
            <option value="ERROR">Erros</option>
            <option value="WARNING">Avisos</option>
            <option value="INFO">Informação</option>
            <option value="DEBUG">Debug</option>
          </select>

          {/* Auto-scroll toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-3 py-1.5 text-sm border rounded-lg transition ${
              autoScroll
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {autoScroll ? 'Auto-scroll: ON' : 'Auto-scroll: OFF'}
          </button>

          {/* Clear logs */}
          <button
            onClick={() => setLogs([])}
            className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Limpar
          </button>

          {/* Download logs */}
          <button
            onClick={handleDownloadLogs}
            className="px-3 py-1.5 text-sm text-white bg-[#111827] rounded-lg hover:bg-gray-800 transition"
          >
            Baixar Logs
          </button>
        </div>
      </div>

      {/* Logs container */}
      <div 
        ref={logsContainerRef}
        className="h-[600px] overflow-y-auto bg-gray-900 p-4 font-mono text-sm"
      >
        {filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            Nenhum log para exibir
          </div>
        ) : (
          <div className="space-y-1">
            {filteredLogs.map((log) => {
              const config = getLevelConfig(log.level);
              return (
                <div
                  key={log.id}
                  className={`flex items-start gap-3 p-2 rounded ${config.bg} border border-transparent hover:border-gray-300 transition`}
                >
                  <span className="text-gray-500 text-xs whitespace-nowrap mt-0.5">
                    {formatTimestamp(log.timestamp)}
                  </span>
                  <span className={`flex items-center gap-1 font-semibold text-xs uppercase whitespace-nowrap mt-0.5 ${config.color}`}>
                    {config.icon}
                    {log.level}
                  </span>
                  <span className="text-gray-800 flex-1">{log.message}</span>
                </div>
              );
            })}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50">
        <p className="text-sm text-gray-700">
          <span className="font-medium">{filteredLogs.length}</span> logs exibidos
        </p>
        <p className="text-xs text-gray-600">
          Atualizando automaticamente a cada 3 segundos
        </p>
      </div>
    </div>
  );
}
