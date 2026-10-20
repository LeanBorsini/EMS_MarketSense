import { useState, useEffect, useCallback } from 'react';
import { StrategyConfig } from '../types/execution';
import { loadStoredStrategies, saveStoredStrategies } from '../lib/storage';

interface UseStrategyManagerProps {
  onLog?: (level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | 'EXECUTION', message: string, symbol?: string) => void;
}

export interface UseStrategyManagerReturn {
  strategies: StrategyConfig[];
  setStrategies: React.Dispatch<React.SetStateAction<StrategyConfig[]>>;
  addStrategy: (newStrategy: StrategyConfig) => void;
  updateStrategy: (strategyId: string, partial: Partial<StrategyConfig>) => void;
  toggleStrategyActive: (strategyId: string) => void;
}

/**
 * useStrategyManager: Modular hook managing algorithmic trading strategies,
 * parameters, timeframes, and activation state.
 */
export function useStrategyManager({ onLog }: UseStrategyManagerProps = {}): UseStrategyManagerReturn {
  const [strategies, setStrategies] = useState<StrategyConfig[]>(loadStoredStrategies);

  useEffect(() => {
    saveStoredStrategies(strategies);
  }, [strategies]);

  const addStrategy = useCallback((newStrategy: StrategyConfig) => {
    setStrategies(prev => [newStrategy, ...prev]);
    if (onLog) {
      onLog('SUCCESS', `Nueva estrategia de MarketSense añadida: ${newStrategy.name} [${newStrategy.symbol}]`, newStrategy.symbol);
    }
  }, [onLog]);

  const toggleStrategyActive = useCallback((strategyId: string) => {
    setStrategies(prev => prev.map(s => {
      if (s.id !== strategyId) return s;
      const nextActive = !s.isActive;
      if (onLog) {
        onLog('INFO', `Estrategia "${s.name}" ${nextActive ? 'ACTIVADA' : 'PAUSADA'}.`, s.symbol);
      }
      return { ...s, isActive: nextActive };
    }));
  }, [onLog]);

  const updateStrategy = useCallback((strategyId: string, partial: Partial<StrategyConfig>) => {
    setStrategies(prev => prev.map(s => {
      if (s.id !== strategyId) return s;
      const updated = { ...s, ...partial };
      if (onLog) {
        onLog('INFO', `Reglas actualizadas para la estrategia "${updated.name}".`, updated.symbol);
      }
      return updated;
    }));
  }, [onLog]);

  return {
    strategies,
    setStrategies,
    addStrategy,
    updateStrategy,
    toggleStrategyActive,
  };
}
