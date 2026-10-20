import { useState, useEffect, useCallback } from 'react';
import { MT5LiveSyncInfo, TradingAccount } from '../types/execution';
import { SYSTEM_DEFAULTS } from '../config/features';

interface UseMT5TelemetryOptions {
  enabled?: boolean;
  activeAccountId: string;
  onSyncAccount?: (updater: (prev: TradingAccount[]) => TradingAccount[]) => void;
  onLog?: (type: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | 'EXECUTION', message: string, symbol?: string) => void;
}

export function useMT5Telemetry({
  enabled = true,
  activeAccountId,
  onSyncAccount,
  onLog,
}: UseMT5TelemetryOptions) {
  const [mt5SyncInfo, setMt5SyncInfo] = useState<MT5LiveSyncInfo | undefined>(undefined);
  const [isSyncingMT5, setIsSyncingMT5] = useState(false);

  // Auto-Sync poller
  useEffect(() => {
    if (!enabled) return;
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

        if (onSyncAccount) {
          onSyncAccount(prev => prev.map(acc => {
            const isTargetAccount = 
              acc.id === activeAccountId || 
              acc.accountNumber === String(live.login) || 
              acc.broker.includes('MetaTrader') || 
              acc.id === 'acc-mt5-demo';
              
            if (!isTargetAccount) return acc;

            const liveBalance = Number(live.balance);
            const liveEquity = Number(live.equity);

            // If drift occurs, sync seamlessly
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
        }
      } catch {
        // Silent background polling
      }
    };

    pollMT5State();
    const interval = setInterval(pollMT5State, SYSTEM_DEFAULTS.telemetryPollIntervalMs);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [activeAccountId, onSyncAccount]);

  // Force manual sync on demand
  const syncWithMetaTraderNow = useCallback(async (customLogin?: string, customServer?: string) => {
    setIsSyncingMT5(true);
    try {
      const res = await fetch('/api/mt5/force-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          login: customLogin || mt5SyncInfo?.login, 
          server: customServer || mt5SyncInfo?.server 
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setMt5SyncInfo(json.data);
          if (onLog) {
            onLog(
              'SUCCESS', 
              `Sincronización forzada completada: Cuenta #${json.data.login} (${json.data.server}) - Saldo: $${json.data.balance.toLocaleString('en-US')}`
            );
          }
        }
      }
    } catch (err) {
      if (onLog) {
        onLog('WARN', 'No se pudo contactar con el terminal MetaTrader 5.');
      }
    } finally {
      setTimeout(() => setIsSyncingMT5(false), 500);
    }
  }, [mt5SyncInfo, onLog]);

  return {
    mt5SyncInfo,
    isSyncingMT5,
    syncWithMetaTraderNow,
  };
}
