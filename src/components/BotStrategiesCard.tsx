import React from 'react';
import { 
  Bot, 
  Power, 
  Code, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  FileCode, 
  Radio, 
  Plus,
  Terminal
} from 'lucide-react';
import { StrategyConfig } from '../types/execution';

interface BotStrategiesCardProps {
  strategies: StrategyConfig[];
  onToggleActive: (strategyId: string) => void;
  onOpenNewStrategyModal: () => void;
  onOpenRunnerGuide: () => void;
}

export const BotStrategiesCard: React.FC<BotStrategiesCardProps> = ({
  strategies,
  onToggleActive,
  onOpenNewStrategyModal,
  onOpenRunnerGuide,
}) => {
  return (
    <div className="tactile-card rounded-xl p-4 sm:p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Bot className="w-5 h-5 text-indigo-400" />
            <h2 className="font-heading text-lg sm:text-xl font-bold text-white tracking-tight">
              Estrategias y Bots Autónomos de MarketSense
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Scripts vinculados que envían señales con cálculo automático de Stop Loss y Take Profit
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenRunnerGuide}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 text-xs font-medium transition-all"
            title="Guía de ejecución 24/7 desatendida (VPS / Fedora / Oracle)"
          >
            <Terminal className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Daemon 24/7 VPS</span>
            <span className="sm:hidden">Daemon</span>
          </button>

          <button
            onClick={onOpenNewStrategyModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Vincular Script</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-4">
        {strategies.map(strategy => (
          <div 
            key={strategy.id} 
            className={`rounded-xl p-3.5 border transition-all flex flex-col justify-between ${
              strategy.isActive 
                ? 'bg-slate-900/90 border-slate-700 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)]' 
                : 'bg-slate-950/60 border-slate-800/80 opacity-70'
            }`}
          >
            <div>
              {/* Header: Name, Active Toggle */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                      {strategy.symbol}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 px-1 py-0.5 rounded bg-slate-800">
                      {strategy.timeframe}
                    </span>
                    <span className="text-[10px] font-mono uppercase text-indigo-400">
                      {strategy.mode}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-100 mt-1.5 leading-snug">
                    {strategy.name}
                  </h3>
                </div>

                {/* Power toggle */}
                <button
                  onClick={() => onToggleActive(strategy.id)}
                  className={`p-1.5 rounded-lg border transition-all ${
                    strategy.isActive
                      ? 'bg-emerald-950 border-emerald-600 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                      : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'
                  }`}
                  title={strategy.isActive ? 'Pausar bot' : 'Activar bot 24/7'}
                >
                  <Power className="w-4 h-4" />
                </button>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800/80 my-2 text-center font-mono">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Win Rate</div>
                  <div className="text-xs font-bold text-emerald-400">{strategy.winRate}%</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Profit Factor</div>
                  <div className="text-xs font-bold text-slate-200">{strategy.profitFactor}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Target R:R</div>
                  <div className="text-xs font-bold text-amber-300">{strategy.targetRiskReward}R</div>
                </div>
              </div>

              {/* Last Signal */}
              {strategy.lastSignal && (
                <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] font-mono mb-2">
                  <div className="flex items-center justify-between text-slate-400 mb-0.5">
                    <span className="flex items-center gap-1 text-slate-300">
                      <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                      Última Señal: {strategy.lastSignal.action}
                    </span>
                    <span className="text-[10px] text-slate-500">{strategy.lastSignal.timestamp}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {strategy.lastSignal.reason}
                  </div>
                </div>
              )}
            </div>

            {/* Script badge & management */}
            <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400">
              <span className="flex items-center gap-1 text-slate-500 font-mono">
                <FileCode className="w-3 h-3 text-indigo-400" />
                {strategy.source === 'MARKETSENSE_SCRIPT' ? 'MarketSense Pine' : 'Python Daemon'}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {strategy.totalTrades} ejecuciones
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
