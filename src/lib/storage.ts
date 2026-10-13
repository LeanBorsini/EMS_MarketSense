import { TradingAccount, StrategyConfig, TradeOrder, DaemonLog } from '../types/execution';
import { INITIAL_ACCOUNTS } from '../data/defaultAccounts';
import { INITIAL_STRATEGIES } from '../data/defaultStrategies';
import { INITIAL_TRADES } from '../data/sampleTrades';

const STORAGE_KEYS = {
  ACCOUNTS: 'ms_exec_accounts_v1',
  STRATEGIES: 'ms_exec_strategies_v1',
  TRADES: 'ms_exec_trades_v1',
  ACTIVE_ACCOUNT: 'ms_exec_active_acc_v1',
  DAEMON_ACTIVE: 'ms_exec_daemon_active_v1',
  LOGS: 'ms_exec_logs_v1',
};

export function loadStoredAccounts(): TradingAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading accounts from localStorage', e);
  }
  return INITIAL_ACCOUNTS;
}

export function saveStoredAccounts(accounts: TradingAccount[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  } catch (e) {
    console.warn('Error saving accounts', e);
  }
}

export function loadStoredStrategies(): StrategyConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STRATEGIES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading strategies from localStorage', e);
  }
  return INITIAL_STRATEGIES;
}

export function saveStoredStrategies(strategies: StrategyConfig[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.STRATEGIES, JSON.stringify(strategies));
  } catch (e) {
    console.warn('Error saving strategies', e);
  }
}

export function loadStoredTrades(): TradeOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRADES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading trades from localStorage', e);
  }
  return INITIAL_TRADES;
}

export function saveStoredTrades(trades: TradeOrder[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(trades));
  } catch (e) {
    console.warn('Error saving trades', e);
  }
}

export function loadActiveAccountId(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_ACCOUNT);
    if (raw) return raw;
  } catch (e) {
    // fallback
  }
  return INITIAL_ACCOUNTS[0].id;
}

export function saveActiveAccountId(id: string) {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ACCOUNT, id);
  } catch (e) {
    // fallback
  }
}

export function loadDaemonRunning(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DAEMON_ACTIVE);
    if (raw !== null) return raw === 'true';
  } catch (e) {
    // fallback
  }
  return true; // Default ON 24/7
}

export function saveDaemonRunning(active: boolean) {
  try {
    localStorage.setItem(STORAGE_KEYS.DAEMON_ACTIVE, String(active));
  } catch (e) {
    // fallback
  }
}

export function loadStoredLogs(): DaemonLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // fallback
  }
  return [
    {
      id: 'log-1',
      timestamp: new Date().toLocaleTimeString('es-ES'),
      level: 'INFO',
      message: 'Motor 24/7 iniciado en modo desatendido. Conexión de latencia ultra-baja (14ms).',
    },
    {
      id: 'log-2',
      timestamp: new Date().toLocaleTimeString('es-ES'),
      level: 'SUCCESS',
      message: 'Reglas de protección de fondeo activas: Drawdown diario tope 2.0% ($2,000).',
    },
  ];
}

export function saveStoredLogs(logs: DaemonLog[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs.slice(-50)));
  } catch (e) {
    // fallback
  }
}

export function exportFullAppState(): string {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    accounts: loadStoredAccounts(),
    strategies: loadStoredStrategies(),
    trades: loadStoredTrades(),
  };
  return JSON.stringify(data, null, 2);
}

export function importFullAppState(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (data.accounts && Array.isArray(data.accounts)) {
      saveStoredAccounts(data.accounts);
    }
    if (data.strategies && Array.isArray(data.strategies)) {
      saveStoredStrategies(data.strategies);
    }
    if (data.trades && Array.isArray(data.trades)) {
      saveStoredTrades(data.trades);
    }
    return true;
  } catch (e) {
    console.error('Failed to import app state', e);
    return false;
  }
}
