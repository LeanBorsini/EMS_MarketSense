import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Award, 
  FileText, 
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { TradeOrder } from '../types/execution';
import { formatPrice } from '../lib/symbolResolver';

interface TradingJournalListProps {
  trades: TradeOrder[];
  onOpenTradeDetail: (trade: TradeOrder) => void;
}

export const TradingJournalList: React.FC<TradingJournalListProps> = ({
  trades,
  onOpenTradeDetail,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'WINS' | 'LOSSES' | 'AI' | 'HUMAN'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const closedTrades = trades.filter(t => t.status === 'CLOSED');

  const filteredTrades = closedTrades.filter(trade => {
    // Filter type
    if (filterType === 'WINS' && trade.netPnL <= 0) return false;
    if (filterType === 'LOSSES' && trade.netPnL >= 0) return false;
    if (filterType === 'AI' && !trade.isAutonomous) return false;
    if (filterType === 'HUMAN' && trade.isAutonomous) return false;

    // Search term
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchSymbol = trade.symbol.toLowerCase().includes(q);
      const matchNotes = (trade.notes || '').toLowerCase().includes(q);
      const matchVerdict = (trade.postMortem?.verdict || '').toLowerCase().includes(q);
      if (!matchSymbol && !matchNotes && !matchVerdict) return false;
    }

    return true;
  });

  const totalClosedPnL = closedTrades.reduce((acc, t) => acc + t.netPnL, 0);
  const totalCommissions = closedTrades.reduce((acc, t) => acc + t.commissionCost, 0);
  const totalSpreadCost = closedTrades.reduce((acc, t) => acc + t.spreadCost, 0);
  const winCount = closedTrades.filter(t => t.netPnL > 0).length;
  const winRate = closedTrades.length > 0 ? (winCount / closedTrades.length) * 100 : 0;

  return (
    <div className="tactile-card rounded-xl p-4 sm:p-5 mb-8">
      {/* Header & Stats summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h2 className="font-heading text-lg sm:text-xl font-bold text-white tracking-tight">
              Cuaderno de Trading y Aprendizaje de Errores (Post-Mortem)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Registro forense de cada operación, costes reales de spread y comisiones, y feedback para adaptar la estrategia
          </p>
        </div>

        {/* Global Summary Badge */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <div className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
            <span className="text-slate-400 text-[11px]">Net P&L: </span>
            <span className={`font-bold ${totalClosedPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              ${totalClosedPnL.toFixed(2)}
            </span>
          </div>
          <div className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
            <span className="text-slate-400 text-[11px]">Win Rate: </span>
            <span className="font-bold text-slate-200">{winRate.toFixed(1)}%</span>
          </div>
          <div className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
            <span className="text-slate-400 text-[11px]">Costes (Spread+Com): </span>
            <span className="font-bold text-amber-400">${(totalCommissions + totalSpreadCost).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 mb-4">
        {/* Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {(['ALL', 'WINS', 'LOSSES', 'AI', 'HUMAN'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 rounded-lg text-xs font-medium font-mono transition-all ${
                filterType === type
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {type === 'ALL' && `Todas (${closedTrades.length})`}
              {type === 'WINS' && `Ganadoras (${closedTrades.filter(t => t.netPnL > 0).length})`}
              {type === 'LOSSES' && `Pérdidas (${closedTrades.filter(t => t.netPnL < 0).length})`}
              {type === 'AI' && `Bots IA (${closedTrades.filter(t => t.isAutonomous).length})`}
              {type === 'HUMAN' && `Discrecional (${closedTrades.filter(t => !t.isAutonomous).length})`}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar símbolo o notas..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60"
          />
        </div>
      </div>

      {/* Journal Table */}
      {filteredTrades.length === 0 ? (
        <div className="py-12 text-center text-slate-500">
          <p className="text-sm">No se encontraron operaciones cerradas con este filtro.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTrades.map(trade => {
            const isWin = trade.netPnL > 0;
            const pm = trade.postMortem;

            return (
              <div
                key={trade.id}
                onClick={() => onOpenTradeDetail(trade)}
                className="rounded-xl p-3.5 sm:p-4 bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 hover:bg-slate-850/60 transition-all cursor-pointer group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  {/* Symbol, type, time */}
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold font-mono ${
                      trade.direction === 'BUY'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/80'
                        : 'bg-red-950 text-red-400 border border-red-800/80'
                    }`}>
                      {trade.direction}
                    </span>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-100 font-mono">
                          {trade.symbol}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          {trade.lotSize} lotes
                        </span>
                        {trade.isAutonomous ? (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-mono">
                            BOT IA
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                            HUMANO
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Apertura: {trade.openTime} | Cierre: {trade.closeTime || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Profit, R-Multiple, and Costs */}
                  <div className="flex items-center justify-between sm:justify-end space-x-4 font-mono">
                    <div className="text-right">
                      <div className={`text-base font-bold ${isWin ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isWin ? '+' : ''}${trade.netPnL.toFixed(2)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        <span className="text-amber-300 font-semibold">{trade.rMultiple >= 0 ? '+' : ''}{trade.rMultiple.toFixed(2)}R</span>
                        <span className="text-slate-600 ml-1">
                          (MAE: {trade.maePips}p | MFE: {trade.mfePips}p)
                        </span>
                      </div>
                    </div>

                    <div className="text-right hidden sm:block text-[11px] text-slate-500 border-l border-slate-800 pl-3">
                      <div>Spread: ${trade.spreadCost.toFixed(2)}</div>
                      <div>Comisión: ${trade.commissionCost.toFixed(2)}</div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition-colors" />
                  </div>
                </div>

                {/* Post-Mortem insight & user note preview */}
                {pm && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span className="text-slate-300 font-medium">
                        {pm.verdict}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-500">
                      <span>Disciplina: <strong className="text-slate-300">{pm.disciplineScore}/10</strong></span>
                      <span>•</span>
                      <span className="text-indigo-400">Click para auditoría completa</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
