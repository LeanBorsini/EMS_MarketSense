import { useState, useEffect, useCallback, useMemo } from 'react';
import { TradingAccount } from '../types/execution';
import { 
  loadStoredAccounts, 
  saveStoredAccounts, 
  loadActiveAccountId, 
  saveActiveAccountId 
} from '../lib/storage';
import { INITIAL_ACCOUNTS } from '../data/defaultAccounts';

interface UseAccountManagerProps {
  onLog?: (level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | 'EXECUTION', message: string) => void;
}

export interface UseAccountManagerReturn {
  accounts: TradingAccount[];
  setAccounts: React.Dispatch<React.SetStateAction<TradingAccount[]>>;
  activeAccountId: string;
  activeAccount: TradingAccount;
  switchAccount: (accountId: string) => void;
  updateAccountRiskRules: (accountId: string, newRules: Partial<TradingAccount['riskRules']>) => void;
  updateAccountBalance: (accountId: string, newBalance: number) => void;
  addAccount: (newAccount: TradingAccount) => void;
  removeAccount: (accountId: string) => boolean;
  resetCircuitBreaker: (accountId: string) => void;
  resetAccountsToCleanDefault: () => void;
}

/**
 * useAccountManager: Modular hook responsible exclusively for multi-account lifecycle,
 * risk rules configuration, balance updates, and account switching.
 */
export function useAccountManager({ onLog }: UseAccountManagerProps = {}): UseAccountManagerReturn {
  const [accounts, setAccounts] = useState<TradingAccount[]>(loadStoredAccounts);
  const [activeAccountId, setActiveAccountId] = useState<string>(loadActiveAccountId);

  useEffect(() => {
    saveStoredAccounts(accounts);
  }, [accounts]);

  useEffect(() => {
    saveActiveAccountId(activeAccountId);
  }, [activeAccountId]);

  const activeAccount = useMemo(() => {
    return accounts.find(a => a.id === activeAccountId) || accounts[0] || INITIAL_ACCOUNTS[0];
  }, [accounts, activeAccountId]);

  const switchAccount = useCallback((accountId: string) => {
    setActiveAccountId(accountId);
    const target = accounts.find(a => a.id === accountId);
    if (target && onLog) {
      onLog('INFO', `Conmutado a cuenta activa: ${target.name} (${target.broker})`);
    }
  }, [accounts, onLog]);

  const updateAccountRiskRules = useCallback((accountId: string, newRules: Partial<TradingAccount['riskRules']>) => {
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
    if (onLog) {
      onLog('INFO', 'Reglas de gestión de riesgo actualizadas para la cuenta seleccionada.');
    }
  }, [onLog]);

  const updateAccountBalance = useCallback((accountId: string, newBalance: number) => {
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
    if (onLog) {
      onLog('SUCCESS', `Saldo de la cuenta actualizado a $${newBalance.toLocaleString('en-US')} USD.`);
    }
  }, [onLog]);

  const addAccount = useCallback((newAccount: TradingAccount) => {
    setAccounts(prev => [...prev, newAccount]);
    setActiveAccountId(newAccount.id);
    if (onLog) {
      onLog('SUCCESS', `Nueva cuenta vinculada: ${newAccount.name} (${newAccount.broker})`);
    }
  }, [onLog]);

  const removeAccount = useCallback((accountId: string): boolean => {
    if (accounts.length <= 1) {
      if (onLog) {
        onLog('WARN', 'No es posible remover la única cuenta vinculada. Conecta otra cuenta antes de desvincular esta.');
      }
      return false;
    }

    const accToRemove = accounts.find(a => a.id === accountId);
    const remaining = accounts.filter(a => a.id !== accountId);

    setAccounts(remaining);

    if (activeAccountId === accountId) {
      const nextActive = remaining[0];
      setActiveAccountId(nextActive.id);
      if (onLog) {
        onLog('INFO', `Cuenta activa cambiada automáticamente a: ${nextActive.name} (${nextActive.broker})`);
      }
    }

    if (onLog) {
      onLog('SUCCESS', `Cuenta desvinculada exitosamente: ${accToRemove?.name || accountId}`);
    }
    return true;
  }, [accounts, activeAccountId, onLog]);

  const resetCircuitBreaker = useCallback((accountId: string) => {
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
    if (onLog) {
      onLog('SUCCESS', 'Circuit breaker de riesgo restaurado. Trading habilitado.');
    }
  }, [onLog]);

  const resetAccountsToCleanDefault = useCallback(() => {
    setAccounts(INITIAL_ACCOUNTS);
    setActiveAccountId(INITIAL_ACCOUNTS[0].id);
  }, []);

  return {
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
  };
}
