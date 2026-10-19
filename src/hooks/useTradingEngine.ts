import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  TradingAccount, 
  StrategyConfig, 
  TradeOrder, 
  MarketTicker, 
  DaemonLog,
  MT5LiveSyncInfo
} from '../types/execution';
import { INITIAL_TICKERS } from '../data/mockMarketFeed';
import { 
  loadStoredAccounts, 
  saveStoredAccounts, 
  loadStoredStrategies, 
  saveStoredStrategies, 
  loadStoredTrades, 
  saveStoredTrades, 
  loadActiveAccountId, 
  saveActiveAccountId, 
  loadDaemonRunning, 
  saveDaemonRunning,
  loadStoredLogs,
  saveStoredLogs,
  clearAllSimulationData
} from '../lib/storage';
import { INITIAL_ACCOUNTS } from '../data/defaultAccounts';
import { checkAutoBreakeven } from '../lib/riskCalculator';

export function useTradingEngine() {
  const [accounts, setAccounts] = useState<TradingAccount[]>(loadStoredAccounts);
  const [activeAccountId, setActiveAccountId] = useState<string>(loadActiveAccountId);
  const [strategies, setStrategies] = useState<StrategyConfig[]>(loadStoredStrategies);
  const [trades, setTrades] = useState<TradeOrder[]>(loadStoredTrades);
  const [tickers, setTickers] = useState<Record<string, MarketTicker>>(INITIAL_TICKERS);
  const [isDaemonRunning, setIsDaemonRunning] = useState<boolean>(loadDaemonRunning);
  const [logs, setLogs] = useState<DaemonLog[]>(loadStoredLogs);
  const [lastTickTime, setLastTickTime] = useState<Date>(new Date());

  // Real-time MetaTrader 5 Synchronization State
  const [mt5SyncInfo, setMt5SyncInfo] = useState<MT5LiveSyncInfo>({
    isSynced: true,
    login: '50198273',
    server: 'ICMarkets-Demo01',
    broker: 'MetaTrader 5',
    balance: 100000.00,
    equity: 100000.00,
    marginFree: 100000.00,
    floatingProfit: 0.00,
    currency: 'USD',
    leverage: 100,
    lastSync: new Date().toISOString(),
    pingMs: 9,
    connected: true,
    syncSource: 'DIRECT_GATEWAY',
  });
  const [isSyncingMT5, setIsSyncingMT5] = useState<boolean>(false);

  const activeAccount = accounts.find(a => a.id === activeAccountId) || accounts[0];

  // Save changes to storage
  useEffect(() => {
    saveStoredAccounts(accounts);
  }, [accounts]);

  useEffect(() => {
    saveStoredStrategies(strategies);
  }, [strategies]);

  useEffect(() => {
    saveStoredTrades(trades);
  }, [trades]);

  useEffect(() => {
    saveActiveAccountId(activeAccountId);
  }, [activeAccountId]);

  useEffect(() => {
    saveDaemonRunning(isDaemonRunning);
  }, [isDaemonRunning]);

  useEffect(() => {
    saveStoredLogs(logs);
  }, [logs]);

  const addLog = useCallback((level: DaemonLog['level'], message: string, symbol?: string) => {
    const newLog: DaemonLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      level,
      message,
      symbol,
    };
    setLogs(prev => [newLog, ...prev.slice(0, 49)]);
  }, []);

  // Price Simulation & Trade Monitoring Engine (runs every 1.5 seconds)
  const isDaemonRunningRef = useRef(isDaemonRunning);
  isDaemonRunningRef.current = isDaemonRunning;

  useEffect(() => {
    const interval = setInterval(() => {
      setLastTickTime(new Date());

      // 1. Jiggle market prices slightly to simulate institutional ticks
      setTickers(prevTickers => {
        const next: Record<string, MarketTicker> = { ...prevTickers };
        for (const sym of Object.keys(next)) {
          const item = next[sym];
          // Small random walk (0.01% - 0.03%)
          const variance = (Math.random() - 0.49) * (item.price * 0.0004);
          const newPrice = Math.round((item.price + variance) * 100) / 100;
          const spreadDiff = item.spreadPips * item.pipSize;

          next[sym] = {
            ...item,
            price: newPrice,
            bid: Math.round((newPrice - spreadDiff / 2) * 100) / 100,
            ask: Math.round((newPrice + spreadDiff / 2) * 100) / 100,
          };
        }
        return next;
      });

      // 2. Evaluate open trades if daemon is running
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
          if (!trade.breakevenMoved && isDaemonRunningRef.current) {
            const beCheck = checkAutoBreakeven(trade.openPrice, currentPrice, trade.originalSl, trade.direction, trade.symbol, 1.0);
            if (beCheck.shouldMoveToBreakeven) {
              updatedSl = beCheck.newSlPrice;
              breakevenTriggered = true;
              hasChanges = true;
              addLog('SUCCESS', `Auto-Breakeven activado en ${trade.symbol}: SL protegido a precio de entrada +1 pip (+1.0R alcanzado).`, trade.symbol);
            }
          }

          // TAKE PROFIT CHECK
          const tpHit = isBuy ? currentPrice >= trade.tp : currentPrice <= trade.tp;
          if (tpHit) {
            hasChanges = true;
            addLog('SUCCESS', `Take Profit alcanzado en ${trade.symbol}! Ganancia neta: $${netPnL.toFixed(2)} (+${rMultiple}R)`, trade.symbol);
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
            addLog(wasBe ? 'INFO' : 'WARN', wasBe 
              ? `Cierre en Breakeven en ${trade.symbol}. Capital protegido sin pérdidas.` 
              : `Stop Loss ejecutado en ${trade.symbol}: Riesgo acotado a $${netPnL.toFixed(2)}.`, 
              trade.symbol
            );
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

        return updated;
      });

    }, 2000);

    return () => clearInterval(interval);
  }, [tickers, addLog]);

  // Track webhook signals already processed in frontend
  const processedSignalIdsRef = useRef<Set<string>>(new Set());

  // Webhook Signal Poller (Polls /api/webhook/history every 2s)
  useEffect(() => {
    let isMounted = true;
    const pollWebhookSignals = async () => {
      try {
        const res = await fetch('/api/webhook/history');
        if (!res.ok) return;
        const data = await res.json();
        if (!data.signals || !Array.isArray(data.signals) || !isMounted) return;

        // Check if there are new signals we haven't seen
        for (const sig of data.signals) {
          if (!processedSignalIdsRef.current.has(sig.id)) {
            processedSignalIdsRef.current.add(sig.id);

            // Log reception
            addLog(
              'SUCCESS',
              `📡 [WEBHOOK RECIBIDO] ${sig.action} ${sig.contracts} en ${sig.symbol} (Cuenta #${sig.accountId}). Enrutado a MT5.`,
              sig.symbol
            );
          }
        }
      } catch {
        // Silent background polling
      }
    };

    const interval = setInterval(pollWebhookSignals, 2000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [addLog]);

  // Live Auto-Sync with MetaTrader 5 Terminal / Gateway (Every 2.5s)
  useEffect(() => {
    let isSubscribed = true;

    const pollMT5State = async () => {
      try {
        const res = await fetch('/api/mt5/account-status');
        if (!res.ok) return;
        const json = await res.json();
        if (!json.data || !isSubscribed) return;

        const live: MT5LiveSyncInfo = json.data;
        setMt5SyncInfo(live);

        // Only auto-synchronize if a real live bridge (Python or EA) is connected and has sent a valid balance
        if (!live.connected || Number(live.balance) <= 0) return;

        // Auto-synchronize the active MT5 or demo account with MetaTrader's live balance
        setAccounts(prev => prev.map(acc => {
          // If the account is MetaTrader, demo, currently selected, or matches the MT5 login
          const isTargetAccount = 
            acc.id === activeAccountId || 
            acc.accountNumber === String(live.login) || 
            acc.broker.includes('MetaTrader') || 
            acc.id === 'acc-mt5-demo';
            
          if (!isTargetAccount) return acc;

          const liveBalance = Number(live.balance);
          const liveEquity = Number(live.equity);

          // If drift occurs, sync seamlessly without prompting user
          if (Math.abs(acc.currentBalance - liveBalance) > 1 || Math.abs(acc.currentEquity - liveEquity) > 1) {
            const riskUsd = (liveBalance * acc.riskRules.maxRiskPerTradePercent) / 100;
            const dailyLossUsd = (liveBalance * acc.riskRules.maxDailyLossPercent) / 100;
            return {
              ...acc,
              initialBalance: liveBalance,
              currentBalance: liveBalance,
              currentEquity: liveEquity,
              lastPingMs: live.pingMs || 9,
              serverName: live.server || acc.serverName,
              status: 'CONNECTED',
              riskRules: {
                ...acc.riskRules,
                maxRiskPerTradeUsd: riskUsd,
                maxDailyLossUsd: dailyLossUsd,
              },
            };
          }
          return acc;
        }));
      } catch {
        // Silent background polling
      }
    };

    pollMT5State();
    const interval = setInterval(pollMT5State, 2500);
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [activeAccountId]);

  // Force Instant MetaTrader Handshake
  const syncWithMetaTraderNow = async (forceLogin?: string, forceServer?: string) => {
    setIsSyncingMT5(true);
    try {
      const res = await fetch('/api/mt5/force-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: forceLogin, server: forceServer }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          const live = json.data;
          setMt5SyncInfo(live);
          const targetBalance = Number(live.balance);
          const targetEquity = Number(live.equity);

          setAccounts(prev => prev.map(acc => {
            const isTarget = 
              acc.id === activeAccountId || 
              acc.accountNumber === String(live.login) || 
              acc.id === 'acc-mt5-demo';
              
            if (!isTarget) return acc;
            const riskUsd = (targetBalance * acc.riskRules.maxRiskPerTradePercent) / 100;
            const dailyLossUsd = (targetBalance * acc.riskRules.maxDailyLossPercent) / 100;
            return {
              ...acc,
              initialBalance: targetBalance,
              currentBalance: targetBalance,
              currentEquity: targetEquity,
              startOfDayBalance: targetBalance,
              lastPingMs: live.pingMs || 8,
              serverName: live.server || acc.serverName,
              status: 'CONNECTED',
              riskRules: {
                ...acc.riskRules,
                maxRiskPerTradeUsd: riskUsd,
                maxDailyLossUsd: dailyLossUsd,
              },
            };
          }));
          addLog('SUCCESS', `⚡ Sincronización instantánea con MetaTrader 5 completada. Saldo reconocido: $${targetBalance.toLocaleString('en-US')} USD (${live.server}).`);
        }
      }
    } catch (e) {
      console.warn('Failed to force sync with MT5', e);
    } finally {
      setIsSyncingMT5(false);
    }
  };

  // Test Webhook Signal Directly from UI
  const testWebhookSignal = async (symbol = 'US500', action: 'BUY' | 'SELL' = 'BUY') => {
    try {
      const res = await fetch('/api/webhook/test-signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          symbol, 
          action, 
          contracts: 0.5, 
          account_id: activeAccount.accountNumber 
        }),
      });
      if (res.ok) {
        addLog('SUCCESS', `⚡ Señal de prueba enviada al Relay: ${action} en ${symbol}. Esperando recepción en MT5.`);
      }
    } catch (err) {
      addLog('ERROR', 'Error enviando señal de prueba al Relay.');
    }
  };

  // Actions
  const switchAccount = (accountId: string) => {
    setActiveAccountId(accountId);
    const target = accounts.find(a => a.id === accountId);
    if (target) {
      addLog('INFO', `Conmutado a cuenta activa: ${target.name} (${target.broker})`);
    }
  };

  const updateAccountRiskRules = (accountId: string, newRules: Partial<TradingAccount['riskRules']>) => {
    setAccounts(prev => prev.map(acc => {
      if (acc.id !== accountId) return acc;
      return {
        ...acc,
        riskRules: {
          ...acc.riskRules,
          ...newRules,
        },
      };
    }));
    addLog('INFO', `Reglas de gestión de riesgo actualizadas para la cuenta seleccionada.`);
  };

  const updateAccountBalance = (accountId: string, newBalance: number) => {
    setAccounts(prev => prev.map(acc => {
      if (acc.id !== accountId) return acc;
      const riskUsd = (newBalance * acc.riskRules.maxRiskPerTradePercent) / 100;
      const dailyLossUsd = (newBalance * acc.riskRules.maxDailyLossPercent) / 100;
      return {
        ...acc,
        initialBalance: newBalance,
        currentBalance: newBalance,
        currentEquity: newBalance,
        startOfDayBalance: newBalance,
        floatingPnL: 0,
        riskRules: {
          ...acc.riskRules,
          maxRiskPerTradeUsd: riskUsd,
          maxDailyLossUsd: dailyLossUsd,
        },
      };
    }));
    addLog('SUCCESS', `Saldo de la cuenta actualizado a $${newBalance.toLocaleString('en-US')} USD.`);
  };

  const addAccount = (newAccount: TradingAccount) => {
    setAccounts(prev => [...prev, newAccount]);
    setActiveAccountId(newAccount.id);
    addLog('SUCCESS', `Nueva cuenta vinculada: ${newAccount.name} (${newAccount.broker})`);
  };

  const removeAccount = (accountId: string): boolean => {
    if (accounts.length <= 1) {
      addLog('WARN', 'No es posible remover la única cuenta vinculada. Conecta o agrega otra cuenta antes de desvincular esta.');
      return false;
    }

    const accToRemove = accounts.find(a => a.id === accountId);
    const remaining = accounts.filter(a => a.id !== accountId);

    setAccounts(remaining);

    // If the active account is removed, auto-switch to the first remaining one
    if (activeAccountId === accountId) {
      const nextActive = remaining[0];
      setActiveAccountId(nextActive.id);
      addLog('INFO', `Cuenta activa cambiada automáticamente a: ${nextActive.name} (${nextActive.broker})`);
    }

    addLog('SUCCESS', `Cuenta desvinculada exitosamente: ${accToRemove?.name || accountId}`);
    return true;
  };

  const addStrategy = (newStrategy: StrategyConfig) => {
    setStrategies(prev => [newStrategy, ...prev]);
    addLog('SUCCESS', `Nueva estrategia de MarketSense añadida: ${newStrategy.name} [${newStrategy.symbol}]`);
  };

  const toggleStrategyActive = (strategyId: string) => {
    setStrategies(prev => prev.map(s => {
      if (s.id !== strategyId) return s;
      const nextActive = !s.isActive;
      addLog('INFO', `Estrategia "${s.name}" ${nextActive ? 'ACTIVADA' : 'PAUSADA'}.`);
      return { ...s, isActive: nextActive };
    }));
  };

  const updateStrategy = (strategyId: string, partial: Partial<StrategyConfig>) => {
    setStrategies(prev => prev.map(s => {
      if (s.id !== strategyId) return s;
      const updated = { ...s, ...partial };
      addLog('INFO', `Reglas actualizadas para la estrategia "${updated.name}".`);
      return updated;
    }));
  };

  const placeManualTrade = (newTrade: Omit<TradeOrder, 'id' | 'openTime' | 'currentPrice' | 'grossPnL' | 'netPnL' | 'rMultiple' | 'maePips' | 'mfePips' | 'breakevenMoved' | 'status'>) => {
    const ticker = tickers[newTrade.symbol] || INITIAL_TICKERS[newTrade.symbol];
    const openPrice = newTrade.openPrice || (newTrade.direction === 'BUY' ? ticker.ask : ticker.bid);

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
    addLog('EXECUTION', `Orden ejecutada: ${fullTrade.direction} ${fullTrade.lotSize} lotes en ${fullTrade.symbol} @ ${openPrice}. SL: ${fullTrade.sl}, TP: ${fullTrade.tp}.`, fullTrade.symbol);
  };

  const closeTradeManual = (tradeId: string) => {
    setTrades(prev => prev.map(t => {
      if (t.id !== tradeId || t.status !== 'OPEN') return t;
      addLog('INFO', `Posición cerrada manualmente en ${t.symbol}. P&L Neto: $${t.netPnL.toFixed(2)}`, t.symbol);
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
  };

  const moveToBreakevenManual = (tradeId: string) => {
    setTrades(prev => prev.map(t => {
      if (t.id !== tradeId || t.status !== 'OPEN') return t;
      const spec = INITIAL_TICKERS[t.symbol] || { pipSize: 0.1 };
      const newSl = t.direction === 'BUY' ? t.openPrice + (spec.pipSize * 2) : t.openPrice - (spec.pipSize * 2);
      addLog('SUCCESS', `Stop Loss movido a Breakeven manualmente para ${t.symbol} @ ${newSl}. Riesgo eliminado.`);
      return {
        ...t,
        sl: newSl,
        breakevenMoved: true,
      };
    }));
  };

  const updateTradeJournalNotes = (tradeId: string, notes: string) => {
    setTrades(prev => prev.map(t => {
      if (t.id !== tradeId) return t;
      return { ...t, notes };
    }));
    addLog('INFO', `Notas del diario guardadas para trade ${tradeId}.`);
  };

  const toggleDaemon = () => {
    setIsDaemonRunning(prev => {
      const next = !prev;
      addLog(next ? 'SUCCESS' : 'WARN', next 
        ? 'Daemon 24/7 de trading autónomo REANUDADO. Vigilancia de ticks activa.' 
        : 'Daemon 24/7 PAUSADO. No se abrirán ni gestionarán órdenes automáticas.'
      );
      return next;
    });
  };

  const emergencyPanicCloseAll = () => {
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
    setIsDaemonRunning(false);
    addLog('ERROR', '🚨 BOTÓN DE PÁNICO ACTIVADO: Todas las posiciones abiertas han sido liquidadas y los bots han sido pausados.');
  };

  const resetCircuitBreaker = (accountId: string) => {
    setAccounts(prev => prev.map(a => {
      if (a.id !== accountId) return a;
      return {
        ...a,
        status: 'CONNECTED',
        riskRules: {
          ...a.riskRules,
          circuitBreakerActive: false,
        },
      };
    }));
  };

  const resetToRealCleanMode = () => {
    clearAllSimulationData();
    setTrades([]);
    setAccounts(INITIAL_ACCOUNTS);
    setActiveAccountId(INITIAL_ACCOUNTS[0].id);
    addLog('SUCCESS', '🧹 Modo Real Limpio activado. Se han eliminado todos los datos de simulación demo.');
  };

  return {
    accounts,
    activeAccount,
    activeAccountId,
    strategies,
    trades,
    tickers,
    isDaemonRunning,
    logs,
    lastTickTime,
    switchAccount,
    updateAccountRiskRules,
    updateAccountBalance,
    addAccount,
    removeAccount,
    addStrategy,
    updateStrategy,
    toggleStrategyActive,
    placeManualTrade,
    closeTradeManual,
    moveToBreakevenManual,
    updateTradeJournalNotes,
    toggleDaemon,
    emergencyPanicCloseAll,
    resetCircuitBreaker,
    resetToRealCleanMode,
    addLog,
    mt5SyncInfo,
    isSyncingMT5,
    syncWithMetaTraderNow,
    testWebhookSignal,
  };
}
