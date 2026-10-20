import { useState, useEffect, useCallback, useRef } from 'react';
import { TradeOrder, MarketTicker } from '../types/execution';
import { checkAutoBreakeven } from '../lib/riskCalculator';
import { loadDaemonRunning, saveDaemonRunning } from '../lib/storage';

interface UseAutonomousDaemonProps {
  enabled?: boolean;
  tickers: Record<string, MarketTicker>;
  setTrades: React.Dispatch<React.SetStateAction<TradeOrder[]>>;
  onLog?: (level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | 'EXECUTION', message: string, symbol?: string) => void;
}

export interface UseAutonomousDaemonReturn {
  isDaemonRunning: boolean;
  setIsDaemonRunning: React.Dispatch<React.SetStateAction<boolean>>;
  toggleDaemon: () => void;
}

/**
 * useAutonomousDaemon: Runs the 24/7 background trade lifecycle surveillance loop.
 * Monitors ticks, updates floating PnL, triggers auto-breakeven when +1R is reached,
 * and executes TP / SL triggers according to quantitative rules.
 */
export function useAutonomousDaemon({
  enabled = true,
  tickers,
  setTrades,
  onLog,
}: UseAutonomousDaemonProps): UseAutonomousDaemonReturn {
  const [isDaemonRunning, setIsDaemonRunning] = useState<boolean>(loadDaemonRunning);
  const isRunningRef = useRef(isDaemonRunning);
  isRunningRef.current = isDaemonRunning;

  useEffect(() => {
    saveDaemonRunning(isDaemonRunning);
  }, [isDaemonRunning]);

  const toggleDaemon = useCallback(() => {
    setIsDaemonRunning(prev => {
      const next = !prev;
      if (onLog) {
        onLog(
          next ? 'SUCCESS' : 'WARN',
          next
            ? 'Daemon 24/7 de trading autónomo REANUDADO. Vigilancia de ticks activa.'
            : 'Daemon 24/7 PAUSADO. No se abrirán ni gestionarán órdenes automáticas.'
        );
      }
      return next;
    });
  }, [onLog]);

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      setTrades(prevTrades => {
        let hasChanges = false;
        const updated = prevTrades.map(trade => {
          if (trade.status !== 'OPEN') return trade;

          const currentTicker = tickers[trade.symbol];
          if (!currentTicker) return trade;

          const currentPrice = currentTicker.price;
          const pipSize = currentTicker.pipSize;
          const pipValue = currentTicker.pipValuePerLot;

          // Price difference in pips
          const isBuy = trade.direction === 'BUY';
          const pnlPriceDiff = isBuy ? currentPrice - trade.openPrice : trade.openPrice - currentPrice;
          const pnlPips = pnlPriceDiff / pipSize;

          const grossPnL = Math.round(pnlPips * pipValue * trade.lotSize * 100) / 100;
          const netPnL = Math.round((grossPnL - trade.commissionCost - trade.spreadCost) * 100) / 100;

          // Initial risk in price
          const initialRiskPrice = Math.abs(trade.openPrice - trade.originalSl);
          const rMultiple = initialRiskPrice > 0 ? Math.round((pnlPriceDiff / initialRiskPrice) * 100) / 100 : 0;

          // Track MAE & MFE
          const currentAdversePips = isBuy 
            ? Math.max(0, (trade.openPrice - currentPrice) / pipSize)
            : Math.max(0, (currentPrice - trade.openPrice) / pipSize);
          const newMae = Math.max(trade.maePips, Math.round(currentAdversePips * 10) / 10);

          const currentFavorablePips = Math.max(0, pnlPips);
          const newMfe = Math.max(trade.mfePips, Math.round(currentFavorablePips * 10) / 10);

          let updatedSl = trade.sl;
          let breakevenTriggered = trade.breakevenMoved;

          // AUTO-BREAKEVEN CHECK
          if (!trade.breakevenMoved && isRunningRef.current) {
            const beCheck = checkAutoBreakeven(trade.openPrice, currentPrice, trade.originalSl, trade.direction, trade.symbol, 1.0);
            if (beCheck.shouldMoveToBreakeven) {
              updatedSl = beCheck.newSlPrice;
              breakevenTriggered = true;
              hasChanges = true;
              if (onLog) {
                onLog('SUCCESS', `Auto-Breakeven activado en ${trade.symbol}: SL protegido a precio de entrada +1 pip (+1.0R alcanzado).`, trade.symbol);
              }
            }
          }

          // TAKE PROFIT CHECK
          const tpHit = isBuy ? currentPrice >= trade.tp : currentPrice <= trade.tp;
          if (tpHit) {
            hasChanges = true;
            if (onLog) {
              onLog('SUCCESS', `Take Profit alcanzado en ${trade.symbol}! Ganancia neta: $${netPnL.toFixed(2)} (+${rMultiple}R)`, trade.symbol);
            }
            return {
              ...trade,
              status: 'CLOSED' as const,
              closePrice: trade.tp,
              closeTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
              grossPnL,
              netPnL,
              rMultiple: Math.max(1, rMultiple),
              maePips: newMae,
              mfePips: newMfe,
              postMortem: {
                category: 'WIN_CLEAN' as const,
                verdict: 'Objetivo de beneficio alcanzado íntegramente según el script de MarketSense.',
                rootCause: 'Extensión de impulso en dirección de la tendencia detectada.',
                learningObservation: `Excelente ratio R:R (+${rMultiple}R). El MAE fue de solo ${newMae} pips, señal de timing de alta precisión.`,
                aiTuningTip: 'La estrategia está mostrando alta fidelidad estadística.',
                disciplineScore: 10,
              },
            };
          }

          // STOP LOSS CHECK
          const slHit = isBuy ? currentPrice <= updatedSl : currentPrice >= updatedSl;
          if (slHit) {
            hasChanges = true;
            const wasBe = trade.breakevenMoved;
            if (onLog) {
              onLog(
                wasBe ? 'INFO' : 'WARN',
                wasBe
                  ? `Cierre en Breakeven en ${trade.symbol}. Capital protegido sin pérdidas.`
                  : `Stop Loss ejecutado en ${trade.symbol}: Riesgo acotado a $${netPnL.toFixed(2)}.`,
                trade.symbol
              );
            }
            return {
              ...trade,
              status: 'CLOSED' as const,
              closePrice: updatedSl,
              closeTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
              grossPnL,
              netPnL,
              rMultiple,
              maePips: newMae,
              mfePips: newMfe,
              postMortem: {
                category: wasBe ? ('TRAILING_SL_SAVED' as const) : ('SL_HIT_VOLATILITY' as const),
                verdict: wasBe ? 'Breakeven protector evitó caída mayor.' : 'Pérdida estrictamente limitada por Stop Loss.',
                rootCause: wasBe ? 'Giro repentino del mercado absorbido por el SL de equilibrio.' : 'Volatilidad contraria al movimiento anticipado.',
                learningObservation: wasBe ? 'Operación cerrada sin daño al equity.' : 'El Stop Loss protegió la cuenta de fondeo de pérdidas fuera de plan.',
                aiTuningTip: 'Revisar si el stop loss en periodos de alta volatilidad requiere amortiguación extra (1.5x ATR).',
                disciplineScore: wasBe ? 10 : 9,
              },
            };
          }

          return {
            ...trade,
            currentPrice,
            grossPnL,
            netPnL,
            rMultiple,
            maePips: newMae,
            mfePips: newMfe,
            sl: updatedSl,
            breakevenMoved: breakevenTriggered,
          };
        });

        return hasChanges ? updated : prevTrades;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [enabled, tickers, onLog, setTrades]);

  return {
    isDaemonRunning,
    setIsDaemonRunning,
    toggleDaemon,
  };
}
