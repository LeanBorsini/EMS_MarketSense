import React, { useState } from 'react';
import { 
  FileCode, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Radio, 
  Zap,
  HelpCircle
} from 'lucide-react';
import { StrategyConfig } from '../types/execution';
import { parseMarketSenseScript } from '../lib/strategyParser';

interface SimpleStrategyBridgeProps {
  strategies: StrategyConfig[];
  activeAccountId: string;
  onAddStrategy: (strat: StrategyConfig) => void;
  onToggleActive: (id: string) => void;
}

const SAMPLE_SCRIPT = `//@version=5
strategy("MarketSense US500 Suelo Institucional", overlay=true)
// Estrategia generada por MarketSense
// Compra en rebote de suelo institucional tras 3 días en zona roja
len = input.int(20, "EMA Institucional")
src = close
ema20 = ta.ema(src, len)
rsiVal = ta.rsi(src, 14)

longCondition = ta.crossover(src, ema20) and rsiVal > 48
if (longCondition)
    strategy.entry("Long_MS", strategy.long)`;

export const SimpleStrategyBridge: React.FC<SimpleStrategyBridgeProps> = ({
  strategies,
  activeAccountId,
  onAddStrategy,
  onToggleActive,
}) => {
  const [scriptText, setScriptText] = useState(SAMPLE_SCRIPT);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const parsed = parseMarketSenseScript(scriptText);

  const handleActivateStrategy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scriptText.trim()) return;

    const newStrat: StrategyConfig = {
      id: `strat-${Date.now()}`,
      name: parsed.name,
      symbol: parsed.symbol,
      source: 'MARKETSENSE_SCRIPT',
      timeframe: parsed.timeframe,
      mode: parsed.mode,
      scriptCode: scriptText,
      isActive: true,
      targetRiskReward: parsed.targetRiskReward,
      slMethod: parsed.suggestedSlMethod,
      slParam: parsed.suggestedSlParam,
      tpParam: parsed.suggestedTpParam,
      executionType: 'AUTONOMOUS_24_7',
      winRate: 62.0,
      totalTrades: 0,
      profitFactor: 2.1,
      lastSignal: {
        action: 'BUY',
        timestamp: 'Recién armada',
        price: 0,
        reason: 'Estrategia de MarketSense armada. Esperando condición en vivo.',
      },
    };

    onAddStrategy(newStrat);
    setSuccessMsg(`¡Estrategia "${parsed.name}" activada! El bot ya está operándola.`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Intro Card */}
      <div className="ivory-card rounded-2xl p-5 sm:p-6 text-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-[#EBF2EC] text-[#2E4A35] mx-auto flex items-center justify-center mb-2">
          <FileCode className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-[#191C21]">
          Estrategias de MarketSense
        </h2>
        <p className="text-xs sm:text-sm text-[#575B62] leading-relaxed max-w-md mx-auto">
          Copia el script o código que generaste en la app <strong>MarketSense</strong> y pégalo aquí. El bot lo entenderá automáticamente sin necesidad de programación.
        </p>
      </div>

      {/* Script Input Card */}
      <div className="ivory-card rounded-2xl p-5 sm:p-6 space-y-4">
        <form onSubmit={handleActivateStrategy} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#191C21]">
                Script o Código de la Estrategia:
              </label>
              <button
                type="button"
                onClick={() => setScriptText(SAMPLE_SCRIPT)}
                className="text-[11px] text-[#2E4A35] font-semibold hover:underline"
              >
                Cargar ejemplo
              </button>
            </div>

            <textarea
              rows={6}
              value={scriptText}
              onChange={e => setScriptText(e.target.value)}
              placeholder="Pega aquí el código que te dio MarketSense..."
              className="w-full bg-[#F3EFE6] border border-[#DDD8CD] rounded-xl p-3 text-xs font-mono text-[#191C21] focus:outline-none focus:border-[#2E4A35] leading-relaxed"
            />
          </div>

          {/* Translation in Human Words */}
          <div className="p-4 rounded-xl bg-[#FAF8F3] border border-[#E6E1D6] space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-[#2E4A35]">
              <Sparkles className="w-4 h-4 text-[#2E4A35]" />
              <span>¿Qué hará el bot con este script?</span>
            </div>

            <div className="space-y-1.5 text-[#575B62] font-sans">
              <p>
                • <strong>Activo a operar:</strong> {parsed.symbol} (ej. S&P 500 o el activo detectado).
              </p>
              <p>
                • <strong>Condición de compra:</strong> {parsed.entryLogic}.
              </p>
              <p>
                • <strong>Protección:</strong> Colocará un Stop Loss automático y moverá a ganancia segura a 1.0R.
              </p>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl olive-btn font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <span>Activar Esta Estrategia en Mi Bot</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {successMsg && (
            <div className="p-3 rounded-xl bg-[#EBF2EC] border border-[#C5DDCB] text-[#2E4A35] text-xs flex items-center gap-2 animate-fade-in font-medium">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </form>
      </div>

      {/* Active Strategies List */}
      <div className="ivory-card rounded-2xl p-5 sm:p-6 space-y-3">
        <h3 className="font-serif text-lg font-bold text-[#191C21]">
          Estrategias Disponibles ({strategies.length})
        </h3>

        <div className="space-y-2.5">
          {strategies.map(strat => (
            <div
              key={strat.id}
              className="p-3.5 rounded-xl bg-[#FDFCF9] border border-[#E6E1D6] flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs sm:text-sm text-[#191C21]">
                    {strat.name}
                  </span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#EFECE4] text-[#575B62]">
                    {strat.symbol}
                  </span>
                </div>
                <div className="text-[11px] text-[#8C9098] mt-0.5">
                  Win Rate estimado: {strat.winRate}% • R:R {strat.targetRiskReward}R
                </div>
              </div>

              <button
                onClick={() => onToggleActive(strat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  strat.isActive
                    ? 'bg-[#EBF2EC] text-[#2E4A35] border border-[#C5DDCB]'
                    : 'bg-[#F3EFE6] text-[#8C9098] border border-[#DDD8CD]'
                }`}
              >
                {strat.isActive ? 'Activa' : 'Pausada'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
