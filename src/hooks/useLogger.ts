import { useState, useEffect, useCallback } from 'react';
import { DaemonLog } from '../types/execution';
import { loadStoredLogs, saveStoredLogs } from '../lib/storage';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | 'EXECUTION';

export interface UseLoggerReturn {
  logs: DaemonLog[];
  addLog: (level: LogLevel, message: string, symbol?: string) => void;
  clearLogs: () => void;
}

const MAX_LOG_ENTRIES = 50;

/**
 * useLogger: Modular audit and activity logging hook
 * Decoupled from execution logic; persists to local storage and bounds memory usage.
 */
export function useLogger(): UseLoggerReturn {
  const [logs, setLogs] = useState<DaemonLog[]>(loadStoredLogs);

  useEffect(() => {
    saveStoredLogs(logs);
  }, [logs]);

  const addLog = useCallback((level: LogLevel, message: string, symbol?: string) => {
    const newLog: DaemonLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      }),
      level,
      message,
      symbol,
    };
    setLogs(prev => [newLog, ...prev.slice(0, MAX_LOG_ENTRIES - 1)]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return { logs, addLog, clearLogs };
}
