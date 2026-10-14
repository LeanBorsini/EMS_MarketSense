import React from 'react';
import { 
  Power, 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  DollarSign,
  Lock,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { TradingAccount, TradeOrder, MarketTicker, MT5LiveSyncInfo } from '../types/execution';
import { formatPrice } from '../lib/symbolResolver';

interface SimpleBotControlProps {
  activeAccount: TradingAccount;
  isDaemonRunning: boolean;
  onToggleDaemon: () => void;
  openTrades: TradeOrder[];
  tickers: Record<string, MarketTicker>;
  onCloseTrade: (tradeId: string) => void;
  onMoveToBreakeven: (tradeId: string) => void;
  onOpenJournalDetail: (trade: TradeOrder) => void;
  onNavigateToStrategy: () => void;
  onUpdateBalance?: (newBalance: number) => void;
  onSyncMetaTraderNow?: () => void;
  isSyncingMT5?: boolean;
  mt5SyncInfo?: MT5LiveSyncInfo;
}

export const SimpleBotControl: React.FC<SimpleBotControlProps> = ({
  activeAccount,
  isDaemonRunning,
  onToggleDaemon,
  openTrades,
  tickers,
  onCloseTrade,
  onMoveToBreakeven,
  onOpenJournalDetail,
  onNavigateToStrategy,
  onUpdateBalance,
  onSyncMetaTraderNow,
  isSyncingMT5,
  mt5SyncInfo,
}) => {

  const isCircuitBreaker = activeAccount.status === 'CIRCUIT_BREAKER';
  const dailyPnL = activeAccount.currentEquity - activeAccount.startOfDayBalance;
  const isDailyPositive = dailyPnL >= 0;

  return (
    <div className="max-w-xl mx-auto space-y-5">
      {/* 1. Large Friendly Master Switch */}
      <div className="ivory-card rounded-2xl p-5 sm:p-6 text-center space-y-4">
        <div>
          <span className="text-[11px] uppercase tracking-wider text-[#8C9098] font-bold font-mono">
            Estado de Operativa Automática
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#191C21] mt-1">
            {isDaemonRunning ? 'Bot en Vigilancia Activa 24/7' : 'Bot Pausado'}
          </h2>
          <p className="text-xs sm:text-sm text-[#575B62] max-w-md mx-auto mt-1 leading-relaxed">
            {isDaemonRunning 
              ? 'El bot está conectado a tu cuenta, analizando los precios en tiempo real y gestionando los límites de pérdida.' 
              : 'El bot no abrirá operaciones mientras esté en pausa. Puedes encenderlo con el botón de abajo.'}
          </p>
        </div>

        {/* Big On/Off button */}
        <button
          onClick={onToggleDaemon}
          className={`w-full py-4 px-6 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-3 transition-all cursor-pointer shadow-md ${
            isDaemonRunning
              ? 'bg-[#2E4A35] text-[#F8F6F0] hover:bg-[#243B2B] shadow-[#2E4A35]/20'
              : 'bg-[#EAE5DA] text-[#191C21] hover:bg-[#DFD9CD] border border-[#DDD8CD]'
          }`}
        >
          <Power className={`w-5 h-5 ${isDaemonRunning ? 'text-[#A9D1B2] animate-pulse' : 'text-[#8C9098]'}`} />
          <span>{isDaemonRunning ? 'BOT ENCENDIDO (Toca para pausar)' : 'ENCENDER BOT AHORA'}</span>
        </button>
      </div>

      {/* 2. Automated MetaTrader Balance & Today's Earnings Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Balance Card - Synchronized with MetaTrader */}
        <div className="ivory-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#2E4A35] ring-2 ring-[#2E4A35]/20 animate-pulse" />
              <span className="text-xs font-semibold text-[#575B62]">
                Saldo MetaTrader 5
              </span>
            </div>
            {onSyncMetaTraderNow && (
              <button
                onClick={onSyncMetaTraderNow}
                disabled={isSyncingMT5}
                className="text-[11px] text-[#2E4A35] font-semibold hover:underline cursor-pointer flex items-center gap-1 disabled:opacity-50"
                title="Sincronizar lectura con MetaTrader ahora"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncingMT5 ? 'animate-spin text-[#2E4A35]' : ''}`} />
                <span>{isSyncingMT5 ? 'Leyendo...' : 'Sincronizar'}</span>
              </button>
            )}
          </div>

          <div className="my-2">
            <div className="font-mono text-xl sm:text-2xl font-bold text-[#191C21]">
              ${activeAccount.currentEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#8C9098] font-mono mt-0.5">
              <span className="truncate max-w-[110px] sm:max-w-none">{activeAccount.serverName || 'ICMarkets-Demo01'}</span>
              <span className="text-[10px] text-[#2E4A35] font-sans font-semibold bg-[#EBF2EC] px-1.5 py-0.5 rounded">
                ⚡ Auto-Sync {activeAccount.lastPingMs || 8}ms
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#EAE5DA] flex items-center justify-between text-[11px] text-[#575B62]">
            <span>Margen Libre:</span>
            <span className="font-mono font-semibold text-[#191C21]">
              ${(mt5SyncInfo?.marginFree ?? activeAccount.currentBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </span>
          </div>
        </div>

        {/* Today's Profit */}
        <div className="ivory-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <span className="text-xs font-semibold text-[#575B62]">
            Resultado de Hoy
          </span>
          <div className="my-2">
            <div className={`font-mono text-xl sm:text-2xl font-bold ${
              isDailyPositive ? 'text-[#2E4A35]' : 'text-rose-700'
            }`}>
              {isDailyPositive ? '+' : ''}${dailyPnL.toFixed(2)}
            </div>
            <div className="text-[11px] text-[#575B62] flex items-center gap-1 mt-0.5">
              {isDailyPositive ? (
                <>
                  <TrendingUp className="w-3 h-3 text-[#2E4A35]" />
                  <span>Día en positivo</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-3 h-3 text-rose-600" />
                  <span>Controlado por stop</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Plain Language Safety Guarantee */}
      <div className="ivory-card rounded-2xl p-4 sm:p-5 flex items-start gap-3 bg-[#FAF8F3]">
        <div className="w-9 h-9 rounded-xl bg-[#EBF2EC] text-[#2E4A35] flex items-center justify-center flex-shrink-0 mt-0.5">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="text-xs text-[#575B62] space-y-1">
          <span className="font-semibold text-[#191C21] text-xs block">
            Protección de Cuenta de Fondeo Activada
          </span>
          <p className="leading-relaxed">
            Si la cuenta llegara a perder más de <strong>${activeAccount.riskRules.maxDailyLossUsd.toLocaleString()} USD (2.0%)</strong> en el día, el bot cerrará todo y se apagará solo. De esta manera, <strong>nunca rozarás el límite del 4.5%</strong> de la firma de fondeo.
          </p>
        </div>
      </div>

      {/* 4. Active Operation Card in Simple Language */}
      <div className="ivory-card rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#EAE5DA] pb-3">
          <h3 className="font-serif text-lg font-bold text-[#191C21]">
            Operación en Curso
          </h3>
          <span className="text-xs font-mono text-[#8C9098]">
            {openTrades.length} activa
          </span>
        </div>

        {openTrades.length === 0 ? (
          <div className="py-6 text-center text-[#575B62] space-y-2">
            <div className="w-10 h-10 rounded-full bg-[#F3EFE6] text-[#8C9098] mx-auto flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <p className="text-xs sm:text-sm font-medium text-[#191C21]">
              No hay ninguna orden abierta en este momento.
            </p>
            <p className="text-xs text-[#8C9098] max-w-sm mx-auto leading-relaxed">
              El bot está vigilando los gráficos con paciencia. En cuanto se cumplan las reglas de tu estrategia de MarketSense, abrirá la posición con Stop Loss y Take Profit automáticos.
            </p>
            <div className="pt-2">
              <button
                onClick={onNavigateToStrategy}
                className="text-xs text-[#2E4A35] font-semibold hover:underline"
              >
                Ver o cambiar estrategia vinculada →
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {openTrades.map(trade => {
              const ticker = tickers[trade.symbol];
              const currentPrice = trade.currentPrice || (ticker ? ticker.price : trade.openPrice);
              const isWin = trade.netPnL >= 0;

              return (
                <div key={trade.id} className="p-4 rounded-xl bg-[#FDFCF9] border border-[#E6E1D6] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm sm:text-base text-[#191C21]">
                          {trade.direction === 'BUY' ? 'Comprando' : 'Vendiendo'} {trade.symbol}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#EBF2EC] text-[#2E4A35] font-mono font-bold">
                          {trade.isAutonomous ? 'Por Bot' : 'Manual'}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#8C9098] font-mono mt-0.5">
                        Entrada: {formatPrice(trade.openPrice, trade.symbol)} • Actual: {formatPrice(currentPrice, trade.symbol)}
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <div className={`text-base sm:text-lg font-bold ${isWin ? 'text-[#2E4A35]' : 'text-rose-700'}`}>
                        {isWin ? '+' : ''}${trade.netPnL.toFixed(2)}
                      </div>
                      <div className="text-[11px] text-[#575B62]">
                        {trade.rMultiple >= 0 ? '+' : ''}{trade.rMultiple.toFixed(2)}R
                      </div>
                    </div>
                  </div>

                  {/* Protection Status in Human Words */}
                  <div className="p-3 rounded-lg bg-[#F3EFE6] border border-[#E2DCD0] text-xs text-[#191C21] space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-[#2E4A35]">
                      <CheckCircle2 className="w-4 h-4 text-[#2E4A35]" />
                      <span>
                        {trade.breakevenMoved ? '¡Ganancia Asegurada (Breakeven)!' : 'Stop Loss Activo y Protegido'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#575B62] leading-relaxed">
                      {trade.breakevenMoved
                        ? 'El bot ya movió el Stop Loss al precio de entrada (+1 pip). Aunque el mercado caiga de golpe, no puedes perder dinero en esta operación.'
                        : 'Si el precio avanza un poco más, el bot moverá el Stop Loss automáticamente para asegurar que no pierdas nada.'}
                    </p>
                  </div>

                  {/* One-click Close action */}
                  <div className="flex items-center justify-between pt-1">
                    {!trade.breakevenMoved ? (
                      <button
                        onClick={() => onMoveToBreakeven(trade.id)}
                        className="text-xs text-[#2E4A35] font-semibold hover:underline"
                      >
                        Asegurar ganancia ahora
                      </button>
                    ) : (
                      <span className="text-xs text-[#8C9098]">Riesgo: 0 USD</span>
                    )}

                    <button
                      onClick={() => onCloseTrade(trade.id)}
                      className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition"
                    >
                      Cerrar y Tomar Beneficio
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
