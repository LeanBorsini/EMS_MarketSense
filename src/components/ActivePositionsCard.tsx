import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  XCircle, 
  Plus, 
  Clock, 
  Zap, 
  AlertCircle,
  Maximize2
} from 'lucide-react';
import { TradeOrder, MarketTicker } from '../types/execution';
import { formatPrice } from '../lib/symbolResolver';

interface ActivePositionsCardProps {
  openTrades: TradeOrder[];
  tickers: Record<string, MarketTicker>;
  onCloseTrade: (tradeId: string) => void;
  onMoveToBreakeven: (tradeId: string) => void;
  onOpenNewTradeModal: () => void;
  onOpenJournalDetail: (trade: TradeOrder) => void;
}

export const ActivePositionsCard: React.FC<ActivePositionsCardProps> = ({
  openTrades,
  tickers,
  onCloseTrade,
  onMoveToBreakeven,
  onOpenNewTradeModal,
  onOpenJournalDetail,
}) => {
  return (
    <div className="tactile-card rounded-xl p-4 sm:p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="font-heading text-lg sm:text-xl font-bold text-white tracking-tight">
              Posiciones Abiertas en Mercado
            </h2>
            <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700">
              {openTrades.length} activas
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Supervisión automática de Stop Loss, Take Profit y Trailing Breakeven 24/7
          </p>
        </div>

        <button
          onClick={onOpenNewTradeModal}
          className="flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-md transition-all active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Orden Manual / Test</span>
        </button>
      </div>

      {openTrades.length === 0 ? (
        <div className="py-12 text-center text-slate-500 flex flex-col items-center">
          <Zap className="w-8 h-8 text-slate-600 mb-2" />
          <p className="text-sm font-medium text-slate-400">No hay operaciones abiertas en este momento.</p>
          <p className="text-xs text-slate-500 max-w-md mt-1">
            El motor autónomo 24/7 está escaneando los mercados para disparar señales según las reglas de MarketSense.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4 sm:mx-0 mt-3">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-400 font-mono text-[11px] uppercase">
                <th className="py-2.5 px-3">Símbolo & Tipo</th>
                <th className="py-2.5 px-3">Lotes</th>
                <th className="py-2.5 px-3">Entrada / Actual</th>
                <th className="py-2.5 px-3">Stop Loss</th>
                <th className="py-2.5 px-3">Take Profit</th>
                <th className="py-2.5 px-3">P&L Flotante (R)</th>
                <th className="py-2.5 px-3 text-right">Gestión Rápida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {openTrades.map(trade => {
                const ticker = tickers[trade.symbol];
                const currentPrice = trade.currentPrice || (ticker ? ticker.price : trade.openPrice);
                const isBuy = trade.direction === 'BUY';
                const isProfitable = trade.netPnL >= 0;

                return (
                  <tr key={trade.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Symbol & Direction */}
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isBuy ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60' : 'bg-red-950/80 text-red-400 border border-red-800/60'
                        }`}>
                          {trade.direction}
                        </span>
                        <div>
                          <div className="font-bold text-slate-100 text-sm flex items-center gap-1">
                            {trade.symbol}
                            {trade.isAutonomous ? (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                                BOT IA
                              </span>
                            ) : (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400">
                                MANUAL
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 font-sans">
                            {trade.openTime.substring(11, 19)} UTC
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Lot Size */}
                    <td className="py-3 px-3 text-slate-200 font-bold">
                      {trade.lotSize.toFixed(2)}
                    </td>

                    {/* Entry / Current Price */}
                    <td className="py-3 px-3">
                      <div className="text-slate-300 font-medium">
                        {formatPrice(trade.openPrice, trade.symbol)}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <span>Act: {formatPrice(currentPrice, trade.symbol)}</span>
                        {isBuy ? (
                          currentPrice >= trade.openPrice ? <TrendingUp className="w-3 h-3 text-emerald-400" /> : <TrendingDown className="w-3 h-3 text-red-400" />
                        ) : (
                          currentPrice <= trade.openPrice ? <TrendingUp className="w-3 h-3 text-emerald-400" /> : <TrendingDown className="w-3 h-3 text-red-400" />
                        )}
                      </div>
                    </td>

                    {/* Stop Loss */}
                    <td className="py-3 px-3">
                      <div className="text-red-400 font-medium">
                        {formatPrice(trade.sl, trade.symbol)}
                      </div>
                      {trade.breakevenMoved ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/40 px-1 rounded border border-emerald-800/40">
                          <ShieldCheck className="w-2.5 h-2.5" /> Breakeven OK
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">
                          Riesgo activo
                        </span>
                      )}
                    </td>

                    {/* Take Profit */}
                    <td className="py-3 px-3">
                      <div className="text-emerald-400 font-medium">
                        {formatPrice(trade.tp, trade.symbol)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Objetivo técnico
                      </div>
                    </td>

                    {/* PnL & R-Multiple */}
                    <td className="py-3 px-3">
                      <div className={`text-sm font-bold ${isProfitable ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isProfitable ? '+' : ''}${trade.netPnL.toFixed(2)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        <span className="font-semibold text-amber-300">
                          {trade.rMultiple >= 0 ? '+' : ''}{trade.rMultiple.toFixed(2)}R
                        </span>
                        <span className="text-slate-600 ml-1">
                          (Neto con spread)
                        </span>
                      </div>
                    </td>

                    {/* Action Controls */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {!trade.breakevenMoved && (
                          <button
                            onClick={() => onMoveToBreakeven(trade.id)}
                            className="px-2 py-1 rounded bg-indigo-950 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 text-[11px] font-medium transition-all"
                            title="Mover Stop Loss a precio de entrada +1 pip"
                          >
                            Breakeven
                          </button>
                        )}

                        <button
                          onClick={() => onCloseTrade(trade.id)}
                          className="px-2 py-1 rounded bg-red-950 hover:bg-red-900 border border-red-800 text-red-300 text-[11px] font-medium transition-all"
                          title="Cerrar orden a mercado"
                        >
                          Cerrar
                        </button>

                        <button
                          onClick={() => onOpenJournalDetail(trade)}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                          title="Ver auditoría técnica de la orden"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
