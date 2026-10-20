import { useState, useEffect, useCallback } from 'react';
import { TradeOrder, MarketTicker } from '../types/execution';
import { loadStoredTrades, saveStoredTrades } from '../lib/storage';
import { INITIAL_TICKERS } from '../data/mockMarketFeed';

interface UseTradeExecutionProps {
  tickers: Record<string, MarketTicker>;
  onLog?: (level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | 'EXECUTION', message: string, symbol?: string) => void;
  onPanicTrip?: () => void;
}

export interface UseTradeExecutionReturn {
  trades: TradeOrder[];
  setTrades: React.Dispatch<React.SetStateAction<TradeOrder[]>>;
  placeManualTrade: (trade: Omit<TradeOrder, 'id' | 'openTime' | 'currentPrice' | 'grossPnL' | 'netPnL' | 'rMultiple' | 'maePips' | 'mfePips' | 'breakevenMoved' | 'status'>) => void;
  closeTradeManual: (tradeId: string) => void;
  moveToBreakevenManual: (tradeId: string) => void;
  updateTradeJournalNotes: (tradeId: string, notes: string) => void;
  emergencyPanicCloseAll: () => void;
  clearAllTrades: () => void;
}

/**
 * useTradeExecution: Modular hook responsible for trade lifecycle:
 * order routing, manual tickets, discretionary closures, manual breakeven, and kill-switch panic closure.
 */
export function useTradeExecution({ tickers, onLog, onPanicTrip }: UseTradeExecutionProps): UseTradeExecutionReturn {
  const [trades, setTrades] = useState<TradeOrder[]>(loadStoredTrades);

  useEffect(() => {
    saveStoredTrades(trades);
  }, [trades]);

  const placeManualTrade = useCallback((newTrade: Omit<TradeOrder, 'id' | 'openTime' | 'currentPrice' | 'grossPnL' | 'netPnL' | 'rMultiple' | 'maePips' | 'mfePips' | 'breakevenMoved' | 'status'>) => {
    const ticker = tickers[newTrade.symbol] || INITIAL_TICKERS[newTrade.symbol];
    const openPrice = newTrade.openPrice || (newTrade.direction === 'BUY' ? ticker?.ask || 100 : ticker?.bid || 100);

    const fullTrade: TradeOrder = {
      ...newTrade,
      id: `trd-${Date.now()}`,
      openPrice,
      currentPrice: openPrice,
      openTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
      grossPnL: 0,
      netPnL: -(newTrade.commissionCost + newTrade.spreadCost),
      rMultiple: 0,
      maePips: 0,
      mfePips: 0,
      breakevenMoved: false,
      status: 'OPEN',
      originalSl: newTrade.sl,
    };

    setTrades(prev => [fullTrade, ...prev]);
    if (onLog) {
      onLog(
        'EXECUTION', 
        `Orden ejecutada: ${fullTrade.direction} ${fullTrade.lotSize} lotes en ${fullTrade.symbol} @ ${openPrice}. SL: ${fullTrade.sl}, TP: ${fullTrade.tp}.`, 
        fullTrade.symbol
      );
    }
  }, [tickers, onLog]);

  const closeTradeManual = useCallback((tradeId: string) => {
    setTrades(prev => prev.map(t => {
      if (t.id !== tradeId || t.status !== 'OPEN') return t;
      if (onLog) {
        onLog('INFO', `Posición cerrada manualmente en ${t.symbol}. P&L Neto: $${t.netPnL.toFixed(2)}`, t.symbol);
      }
      return {
        ...t,
        status: 'CLOSED',
        closePrice: t.currentPrice,
        closeTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
        postMortem: {
          category: t.netPnL >= 0 ? ('WIN_CLEAN' as const) : ('EARLY_EXIT' as const),
          verdict: 'Cierre discrecional manual realizado por el usuario.',
          rootCause: 'Decisión humana de tomar beneficios o cortar pérdida antes de que la orden tocara los límites.',
          learningObservation: `Operación cerrada a ${t.rMultiple}R. MFE fue de ${t.mfePips} pips.`,
          aiTuningTip: 'Evaluar si dejar correr las posiciones hasta el Take Profit objetivo genera mayor rendimiento a largo plazo.',
          disciplineScore: 7,
        },
      };
    }));
  }, [onLog]);

  const moveToBreakevenManual = useCallback((tradeId: string) => {
    setTrades(prev => prev.map(t => {
      if (t.id !== tradeId || t.status !== 'OPEN') return t;
      const spec = INITIAL_TICKERS[t.symbol] || { pipSize: 0.1 };
      const newSl = t.direction === 'BUY' ? t.openPrice + (spec.pipSize * 2) : t.openPrice - (spec.pipSize * 2);
      if (onLog) {
        onLog('SUCCESS', `Stop Loss movido a Breakeven manualmente para ${t.symbol} @ ${newSl}. Riesgo eliminado.`, t.symbol);
      }
      return {
        ...t,
        sl: newSl,
        breakevenMoved: true,
      };
    }));
  }, [onLog]);

  const updateTradeJournalNotes = useCallback((tradeId: string, notes: string) => {
    setTrades(prev => prev.map(t => {
      if (t.id !== tradeId) return t;
      return { ...t, notes };
    }));
    if (onLog) {
      onLog('INFO', `Notas del diario guardadas para trade ${tradeId}.`);
    }
  }, [onLog]);

  const emergencyPanicCloseAll = useCallback(() => {
    setTrades(prev => prev.map(t => {
      if (t.status !== 'OPEN') return t;
      return {
        ...t,
        status: 'CLOSED',
        closePrice: t.currentPrice,
        closeTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
        notes: (t.notes ? t.notes + ' | ' : '') + 'CERRADO DE EMERGENCIA POR KILL SWITCH',
      };
    }));
    if (onPanicTrip) {
      onPanicTrip();
    }
    if (onLog) {
      onLog('ERROR', '🚨 BOTÓN DE PÁNICO ACTIVADO: Todas las posiciones abiertas han sido liquidadas y los bots han sido pausados.');
    }
  }, [onPanicTrip, onLog]);

  const clearAllTrades = useCallback(() => {
    setTrades([]);
  }, []);

  return {
    trades,
    setTrades,
    placeManualTrade,
    closeTradeManual,
    moveToBreakevenManual,
    updateTradeJournalNotes,
    emergencyPanicCloseAll,
    clearAllTrades,
  };
}
