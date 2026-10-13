import React from 'react';
import { 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown, 
  AlertOctagon, 
  CheckCircle2, 
  Lock, 
  Unlock,
  DollarSign,
  Percent
} from 'lucide-react';
import { TradingAccount } from '../types/execution';

interface RiskOverviewBarProps {
  account: TradingAccount;
  onResetCircuitBreaker: () => void;
  onOpenAccountRules: () => void;
}

export const RiskOverviewBar: React.FC<RiskOverviewBarProps> = ({
  account,
  onResetCircuitBreaker,
  onOpenAccountRules,
}) => {
  const rules = account.riskRules;
  const isPropFirm = account.type === 'PROP_FIRM';
  const isCircuitBreaker = account.status === 'CIRCUIT_BREAKER' || rules.circuitBreakerActive;

  // Daily Loss calculation
  const dailyPnL = account.currentEquity - account.startOfDayBalance;
  const isDailyProfitable = dailyPnL >= 0;
  const currentDailyLossAbs = Math.max(0, -dailyPnL);
  const maxDailyAllowedUsd = (account.startOfDayBalance * rules.maxDailyLossPercent) / 100;
  
  // Daily loss percentage of allowed threshold
  const dailyLossUsagePercent = maxDailyAllowedUsd > 0 
    ? Math.min(100, (currentDailyLossAbs / maxDailyAllowedUsd) * 100)
    : 0;

  // Trailing Drawdown calculation
  const totalDrawdownFromInitial = Math.max(0, account.initialBalance - account.currentEquity);
  const maxTrailingAllowedUsd = (account.initialBalance * rules.maxTrailingDrawdownPercent) / 100;
  const trailingDrawdownUsagePercent = maxTrailingAllowedUsd > 0
    ? Math.min(100, (totalDrawdownFromInitial / maxTrailingAllowedUsd) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {/* 1. Balance & Equity */}
      <div className="tactile-card rounded-xl p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Balance & Equity</span>
          <span className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded ${
            account.floatingPnL >= 0 
              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' 
              : 'bg-red-950/60 text-red-400 border border-red-800/40'
          }`}>
            Flotante: {account.floatingPnL >= 0 ? '+' : ''}${account.floatingPnL.toFixed(2)}
          </span>
        </div>
        <div>
          <div className="font-mono text-2xl font-bold text-white tracking-tight">
            ${account.currentEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-1 font-mono">
            <span>Balance: ${account.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            <span className="text-slate-500">Inicio día: ${account.startOfDayBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* 2. Daily Loss Guardrail (Strict Prop Firm Protection) */}
      <div className="tactile-card rounded-xl p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-medium uppercase tracking-wider">Pérdida Diaria Máx.</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            Límite: {rules.maxDailyLossPercent}% (${maxDailyAllowedUsd.toFixed(0)})
          </span>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className={`font-mono text-lg font-bold flex items-center gap-1 ${
              isDailyProfitable ? 'text-emerald-400' : currentDailyLossAbs > maxDailyAllowedUsd * 0.7 ? 'text-red-400' : 'text-slate-200'
            }`}>
              {isDailyProfitable ? '+' : '-'}${currentDailyLossAbs.toFixed(2)}
              <span className="text-xs font-normal text-slate-400">
                ({isDailyProfitable ? 'Ganancia' : `${dailyLossUsagePercent.toFixed(1)}% consumido`})
              </span>
            </span>
          </div>

          {/* Drawdown Progress Bar */}
          <div className="w-full h-2 rounded-full bg-slate-950 border border-slate-800 overflow-hidden relative">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${
                dailyLossUsagePercent > 80 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' :
                dailyLossUsagePercent > 40 ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${dailyLossUsagePercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
            <span>$0.00</span>
            <span className="text-amber-500/80">Buffer de seguridad</span>
            <span className="text-red-400">-${maxDailyAllowedUsd.toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* 3. Trailing Drawdown Protection */}
      <div className="tactile-card rounded-xl p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <div className="flex items-center space-x-1.5">
            <Lock className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-medium uppercase tracking-wider">Trailing Drawdown</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            {rules.maxTrailingDrawdownPercent}% (${maxTrailingAllowedUsd.toFixed(0)})
          </span>
        </div>

        <div>
          <div className="font-mono text-lg font-bold text-white mb-1.5">
            ${(maxTrailingAllowedUsd - totalDrawdownFromInitial).toFixed(2)}{' '}
            <span className="text-xs font-normal text-slate-400">colchón restante</span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
            <div 
              className="h-full bg-indigo-500 transition-all duration-500 rounded-full"
              style={{ width: `${Math.max(5, trailingDrawdownUsagePercent)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
            <span>Caída: ${totalDrawdownFromInitial.toFixed(2)}</span>
            <span>Tope: ${maxTrailingAllowedUsd.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* 4. Automated Execution Guardrails */}
      <div className="tactile-card rounded-xl p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Reglas Activas</span>
          <button 
            onClick={onOpenAccountRules}
            className="text-[10px] text-amber-400 hover:text-amber-300 underline font-medium"
          >
            Editar
          </button>
        </div>

        <div className="space-y-1.5 text-xs font-mono">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Riesgo / Operación:</span>
            <span className="text-amber-300 font-semibold">{rules.maxRiskPerTradePercent}% (${rules.maxRiskPerTradeUsd})</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Auto-Breakeven:</span>
            <span className="text-emerald-400 font-semibold">Alcanzando +{rules.autoBreakevenAtR}R</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Circuit Breaker:</span>
            {isCircuitBreaker ? (
              <span className="text-red-400 font-bold flex items-center gap-1">
                BLOQUEADO 
                <button 
                  onClick={onResetCircuitBreaker} 
                  className="px-1.5 py-0.5 rounded bg-red-900/60 text-white hover:bg-red-800 text-[10px]"
                >
                  Reset
                </button>
              </span>
            ) : (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Armado
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
