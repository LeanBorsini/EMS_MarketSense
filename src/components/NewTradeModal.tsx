import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Calculator, 
  ShieldCheck, 
  AlertTriangle,
  Zap,
  DollarSign
} from 'lucide-react';
import { TradingAccount, TradeOrder, MarketTicker } from '../types/execution';
import { calculatePositionSize } from '../lib/riskCalculator';
import { formatPrice } from '../lib/symbolResolver';

interface NewTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeAccount: TradingAccount;
  tickers: Record<string, MarketTicker>;
  onExecuteTrade: (trade: Omit<TradeOrder, 'id' | 'openTime' | 'currentPrice' | 'grossPnL' | 'netPnL' | 'rMultiple' | 'maePips' | 'mfePips' | 'breakevenMoved' | 'status'>) => void;
}

export const NewTradeModal: React.FC<NewTradeModalProps> = ({
  isOpen,
  onClose,
  activeAccount,
  tickers,
  onExecuteTrade,
}) => {
  const [symbol, setSymbol] = useState('US500');
  const [direction, setDirection] = useState<'BUY' | 'SELL'>('BUY');
  const [entryPrice, setEntryPrice] = useState<number>(0);
  const [stopLoss, setStopLoss] = useState<number>(0);
  const [takeProfit, setTakeProfit] = useState<number>(0);
  const [riskPercent, setRiskPercent] = useState<number>(activeAccount.riskRules.maxRiskPerTradePercent);

  const currentTicker = tickers[symbol] || { price: 5800, bid: 5799.8, ask: 5800.2 };

  useEffect(() => {
    const p = direction === 'BUY' ? currentTicker.ask : currentTicker.bid;
    setEntryPrice(p);

    const slDist = symbol === 'EURUSD' ? 0.0015 : symbol === 'XAUUSD' ? 6.0 : symbol === 'BTCUSDT' ? 500 : 12.0;
    const tpDist = slDist * 2.5;

    if (direction === 'BUY') {
      setStopLoss(Math.round((p - slDist) * 100) / 100);
      setTakeProfit(Math.round((p + tpDist) * 100) / 100);
    } else {
      setStopLoss(Math.round((p + slDist) * 100) / 100);
      setTakeProfit(Math.round((p - tpDist) * 100) / 100);
    }
  }, [symbol, direction]);

  if (!isOpen) return null;

  const posCalc = calculatePositionSize(
    activeAccount,
    symbol,
    entryPrice,
    stopLoss,
    takeProfit,
    direction,
    riskPercent
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!posCalc.isAllowed) return;

    onExecuteTrade({
      accountId: activeAccount.id,
      symbol,
      direction,
      lotSize: posCalc.lotSize,
      openPrice: entryPrice,
      sl: stopLoss,
      originalSl: stopLoss,
      tp: takeProfit,
      spreadCost: posCalc.estimatedSpreadCost,
      commissionCost: posCalc.estimatedCommissionCost,
      isAutonomous: false,
      notes: `Orden manual ingresada con calculador de riesgo. R:R objetivo de ${posCalc.riskRewardRatio.toFixed(1)}R.`,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="ivory-card rounded-2xl w-full max-w-lg border border-[#DDD8CD] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#EAE5DA]">
          <div className="flex items-center space-x-2">
            <Calculator className="w-5 h-5 text-[#2E4A35]" />
            <div>
              <h3 className="font-serif text-lg font-bold text-[#191C21]">
                Calculador de Orden Manual
              </h3>
              <p className="text-xs text-[#575B62]">
                Calcula automáticamente el lote exacto según tu saldo
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-[#8C9098] hover:text-[#191C21] hover:bg-[#EFECE4] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* Symbol & Direction selector */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-[#191C21] block mb-1">
                Instrumento
              </label>
              <select
                value={symbol}
                onChange={e => setSymbol(e.target.value)}
                className="w-full bg-[#F3EFE6] border border-[#DDD8CD] rounded-xl px-3 py-2 font-mono text-[#191C21] focus:outline-none focus:border-[#2E4A35]"
              >
                <option value="US500">US500 (S&P 500 CFD)</option>
                <option value="NAS100">NAS100 (Nasdaq 100 CFD)</option>
                <option value="XAUUSD">XAUUSD (Oro Spot / Dólar)</option>
                <option value="EURUSD">EURUSD (Euro Forex)</option>
                <option value="BTCUSDT">BTCUSDT (Bitcoin Spot)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-[#191C21] block mb-1">
                Dirección
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDirection('BUY')}
                  className={`py-2 rounded-xl font-bold font-mono transition-all flex items-center justify-center gap-1 ${
                    direction === 'BUY'
                      ? 'bg-[#2E4A35] text-[#F8F6F0] shadow-sm'
                      : 'bg-[#F3EFE6] text-[#575B62] border border-[#DDD8CD]'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" /> Compra
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('SELL')}
                  className={`py-2 rounded-xl font-bold font-mono transition-all flex items-center justify-center gap-1 ${
                    direction === 'SELL'
                      ? 'bg-rose-700 text-white shadow-sm'
                      : 'bg-[#F3EFE6] text-[#575B62] border border-[#DDD8CD]'
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5" /> Venta
                </button>
              </div>
            </div>
          </div>

          {/* Pricing input fields */}
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="font-semibold text-[#191C21] block mb-1">
                Precio Entrada
              </label>
              <input
                type="number"
                step="any"
                required
                value={entryPrice}
                onChange={e => setEntryPrice(Number(e.target.value))}
                className="w-full bg-[#F3EFE6] border border-[#DDD8CD] rounded-xl px-2.5 py-1.5 font-mono text-[#191C21] focus:outline-none focus:border-[#2E4A35]"
              />
            </div>

            <div>
              <label className="font-semibold text-rose-700 block mb-1">
                Stop Loss
              </label>
              <input
                type="number"
                step="any"
                required
                value={stopLoss}
                onChange={e => setStopLoss(Number(e.target.value))}
                className="w-full bg-rose-50 border border-rose-200 rounded-xl px-2.5 py-1.5 font-mono text-rose-800 focus:outline-none focus:border-rose-400"
              />
            </div>

            <div>
              <label className="font-semibold text-[#2E4A35] block mb-1">
                Take Profit
              </label>
              <input
                type="number"
                step="any"
                required
                value={takeProfit}
                onChange={e => setTakeProfit(Number(e.target.value))}
                className="w-full bg-[#EBF2EC] border border-[#C5DDCB] rounded-xl px-2.5 py-1.5 font-mono text-[#2E4A35] focus:outline-none focus:border-[#2E4A35]"
              />
            </div>
          </div>

          {/* Mathematical Calculation Result Box */}
          <div className="p-3.5 rounded-xl bg-[#FAF8F3] border border-[#E6E1D6] space-y-2">
            <div className="flex items-center justify-between font-semibold text-[#191C21]">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#2E4A35]" />
                Lote Recomendado por Regla de Riesgo:
              </span>
              <span className="font-mono text-[#2E4A35] font-bold">
                {posCalc.lotSize.toFixed(2)} lotes
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 font-mono text-center pt-1">
              <div className="p-2 rounded-lg bg-[#F8F6F0] border border-[#EAE5DA]">
                <span className="text-[10px] text-[#8C9098] uppercase block">Riesgo Total</span>
                <span className="text-rose-700 font-bold">-${posCalc.exactRiskUsd.toFixed(2)}</span>
              </div>

              <div className="p-2 rounded-lg bg-[#F8F6F0] border border-[#EAE5DA]">
                <span className="text-[10px] text-[#8C9098] uppercase block">Ganancia Obj.</span>
                <span className="text-[#2E4A35] font-bold">+${posCalc.potentialRewardUsd.toFixed(2)}</span>
              </div>

              <div className="p-2 rounded-lg bg-[#F8F6F0] border border-[#EAE5DA]">
                <span className="text-[10px] text-[#8C9098] uppercase block">Ratio R:R</span>
                <span className="text-[#191C21] font-bold">1:{posCalc.riskRewardRatio.toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* Warning banner if not allowed */}
          {!posCalc.isAllowed && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{posCalc.warningReason}</span>
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={!posCalc.isAllowed}
              className={`w-full py-3 px-4 rounded-xl font-bold transition-all shadow-md ${
                posCalc.isAllowed
                  ? 'olive-btn cursor-pointer'
                  : 'bg-[#EAE5DA] text-[#8C9098] cursor-not-allowed'
              }`}
            >
              Colocar Orden con Stop Loss Blindado
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
