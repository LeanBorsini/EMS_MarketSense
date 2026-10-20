import { useCallback } from 'react';
import { useLogger } from './useLogger';
import { useAccountManager } from './useAccountManager';
import { useStrategyManager } from './useStrategyManager';
import { useTradeExecution } from './useTradeExecution';
import { useMarketFeed } from './useMarketFeed';
import { useAutonomousDaemon } from './useAutonomousDaemon';
import { useMT5Telemetry } from './useMT5Telemetry';
import { useWebhookListener } from './useWebhookListener';
import { clearAllSimulationData } from '../lib/storage';
import { APP_FEATURES } from '../config/features';

/**
 * useTradingEngine: High-level architectural Facade.
 * 
 * Orchestrates cohesive, single-responsibility domain hooks:
 * - useLogger (audit & system logs)
 * - useAccountManager (multi-broker accounts, risk rules, balances)
 * - useStrategyManager (MarketSense algorithmic strategies)
 * - useTradeExecution (orders, manual tickets, discretionary closures)
 * - useMarketFeed (real-time institutional tick stream)
 * - useAutonomousDaemon (24/7 SL/TP/Breakeven background loop)
 * - useMT5Telemetry (real-time MetaTrader 5 gateway bridge)
 * - useWebhookListener (TradingView alerts relay receiver)
 * 
 * Each domain hook can be modified, tested, or deleted independently without
 * breaking other subsystems.
 */
export function useTradingEngine() {
  // 1. Audit Logging Subsystem
  const { logs, addLog, clearLogs } = useLogger();

  // 2. Multi-Account Management Subsystem
  const {
    accounts,
    setAccounts,
    activeAccountId,
    activeAccount,
    switchAccount,
    updateAccountRiskRules,
    updateAccountBalance,
    addAccount,
    removeAccount,
    resetCircuitBreaker,
    resetAccountsToCleanDefault,
  } = useAccountManager({ onLog: addLog });

  // 3. Strategy Configuration Subsystem
  const {
    strategies,
    addStrategy,
    updateStrategy,
    toggleStrategyActive,
  } = useStrategyManager({ onLog: addLog });

  // 4. Real-time Market Feeds Subsystem
  const { tickers, lastTickTime } = useMarketFeed({
    enabled: APP_FEATURES.enableTradingDaemon,
  });

  // 5. Trade Execution Subsystem
  const {
    trades,
    setTrades,
    placeManualTrade,
    closeTradeManual,
    moveToBreakevenManual,
    updateTradeJournalNotes,
    emergencyPanicCloseAll,
    clearAllTrades,
  } = useTradeExecution({
    tickers,
    onLog: addLog,
    onPanicTrip: () => setIsDaemonRunning(false),
  });

  // 6. 24/7 Autonomous Daemon Subsystem
  const {
    isDaemonRunning,
    setIsDaemonRunning,
    toggleDaemon,
  } = useAutonomousDaemon({
    enabled: APP_FEATURES.enableTradingDaemon,
    tickers,
    setTrades,
    onLog: addLog,
  });

  // 7. MetaTrader 5 Telemetry Subsystem
  const {
    mt5SyncInfo,
    isSyncingMT5,
    syncWithMetaTraderNow,
  } = useMT5Telemetry({
    enabled: APP_FEATURES.enableMetaTraderEA || APP_FEATURES.enablePythonDirect,
    activeAccountId,
    onSyncAccount: setAccounts,
    onLog: addLog,
  });

  // 8. TradingView Webhooks Subsystem
  const { testWebhookSignal } = useWebhookListener({
    enabled: APP_FEATURES.enableTradingViewWebhooks,
    onLog: addLog,
  });

  // Reset to Clean Real Mode (purges all mock demo history)
  const resetToRealCleanMode = useCallback(() => {
    clearAllSimulationData();
    clearAllTrades();
    resetAccountsToCleanDefault();
    clearLogs();
    addLog('SUCCESS', '🧹 Modo Real Limpio activado. Se han eliminado todos los datos de simulación demo.');
  }, [clearAllTrades, resetAccountsToCleanDefault, clearLogs, addLog]);

  return {
    // Accounts
    accounts,
    activeAccount,
    activeAccountId,
    switchAccount,
    updateAccountRiskRules,
    updateAccountBalance,
    addAccount,
    removeAccount,
    resetCircuitBreaker,
    resetToRealCleanMode,

    // Strategies
    strategies,
    addStrategy,
    updateStrategy,
    toggleStrategyActive,

    // Trades & Orders
    trades,
    placeManualTrade,
    closeTradeManual,
    moveToBreakevenManual,
    updateTradeJournalNotes,
    emergencyPanicCloseAll,

    // Market & Daemon
    tickers,
    lastTickTime,
    isDaemonRunning,
    toggleDaemon,

    // Logs & Telemetry
    logs,
    addLog,
    mt5SyncInfo,
    isSyncingMT5,
    syncWithMetaTraderNow,
    testWebhookSignal,
  };
}
