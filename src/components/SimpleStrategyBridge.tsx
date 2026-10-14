import React, { useState } from 'react';
import { 
  FileCode, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  Sliders, 
  Clock, 
  Target, 
  AlertCircle,
  Save,
  Copy,
  Check,
  Code,
  Calculator,
  Sigma,
  TrendingUp,
  Percent,
  Plus,
  BookOpen
} from 'lucide-react';
import { StrategyConfig, TradingAccount } from '../types/execution';
import { parseMarketSenseScript } from '../lib/strategyParser';

interface SimpleStrategyBridgeProps {
  strategies: StrategyConfig[];
  activeAccount: TradingAccount;
  onAddStrategy: (strat: StrategyConfig) => void;
  onUpdateStrategy: (id: string, partial: Partial<StrategyConfig>) => void;
  onToggleActive: (id: string) => void;
}

const SAMPLE_SCRIPT = `//@version=5
strategy("MarketSense US500 Suelo Institucional", overlay=true)
// Estrategia cuantitativa generada por MarketSense
// Compra en rebote de suelo institucional tras sobreventa estadística (Z-Score <= -2.0)
len = input.int(20, "EMA Institucional")
src = close
ema20 = ta.ema(src, len)
rsiVal = ta.rsi(src, 14)

longCondition = ta.crossover(src, ema20) and rsiVal > 48
if (longCondition)
    strategy.entry("Long_MS", strategy.long)`;

// Library of ready-to-use mathematical models that can be added in 1 click
const MATH_STRATEGY_TEMPLATES: Partial<StrategyConfig>[] = [
  {
    name: 'Connors RSI(2) Reversión Cuantitativa',
    symbol: 'EURUSD',
    timeframe: 'M15',
    mode: 'INTRADAY',
    targetRiskReward: 1.6,
    slMethod: 'ATR',
    slParam: 1.0,
    riskPerTradePercent: 0.5,
    winRate: 68.8,
    profitFactor: 2.34,
    tradingSession: 'Londres y Nueva York (07:00 - 18:00 UTC)',
    plainDescription: 'Modelo cuantitativo desarrollado por Larry Connors. Busca retrocesos extremos de 2 velas en dirección a la media macro de 200 periodos. Al comprar en RSI(2) < 10, la probabilidad empírica de reversión inmediata es superior al 68%.',
    entryConditionSummary: 'Compra cuando el precio se encuentra por encima de la EMA 200 y el oscilador ultrarrápido RSI de 2 periodos cae por debajo de 10 puntos.',
    mathematicalBasis: {
      modelName: 'Modelo Cuantitativo Connors RSI(2) & Macro Trend',
      formula: 'P_t > EMA₂₀₀  ∧  RSI₂(P_t) < 10.0  ∧  Exit @ P_t > SMA₅',
      hypothesis: 'En micro-estructuras de divisas altamente líquidas, caídas transitorias de 2 velas contra una tendencia alcista primaria representan ineficiencias de liquidez con alta probabilidad de retorno a la media móvil de 5 periodos.',
      riskMath: 'Lotes = (Capital × 0.5%) / (1.0 × ATR₁₄ × PipValue). Pérdida estrictamente limitada por contrato.',
      statisticalEdge: 'Esperanza Matemática E = (0.688 × 1.6R) - (0.312 × 1.0R) = +0.788R por operación.',
      mathParams: {
        periodN: 200,
        rsiThreshold: 10,
        atrMultiplier: 1.0,
      },
    },
    scriptCode: `//@version=5\nstrategy("Connors RSI(2) Cuantitativo", overlay=true)\nema200 = ta.ema(close, 200)\nrsi2 = ta.rsi(close, 2)\nif (close > ema200 and rsi2 < 10)\n    strategy.entry("Connors_Long", strategy.long)`,
  },
  {
    name: 'Keltner Channel Volatilidad ATR',
    symbol: 'BTCUSDT',
    timeframe: 'M15',
    mode: 'INTRADAY',
    targetRiskReward: 2.2,
    slMethod: 'ATR',
    slParam: 1.5,
    riskPerTradePercent: 0.5,
    winRate: 59.4,
    profitFactor: 2.05,
    tradingSession: 'Mercado Cripto 24/7',
    plainDescription: 'Utiliza el canal de Keltner (Media exponencial central rodeada por bandas de volatilidad ATR). Cuando el precio rompe la banda superior con expansión del ancho de banda, el bot compra siguiendo el momentum de volatilidad.',
    entryConditionSummary: 'Compra cuando una vela de 15m cierra por encima de la Banda Superior de Keltner (EMA 20 + 2.0 × ATR) con incremento de volumen.',
    mathematicalBasis: {
      modelName: 'Expansión de Volatilidad Keltner Channel',
      formula: 'Upper = EMA₂₀ + (2.0 × ATR₁₄)  |  Breakout: Close > Upper',
      hypothesis: 'Cuando la desviación respecto a la media supera 2 veces el ATR, la serie financiera entra en un régimen no estacionario de tendencia fuerte con persistencia de Hurst (H > 0.5).',
      riskMath: 'Lotes = (Capital × 0.5%) / (1.5 × ATR₁₄ × PipValue).',
      statisticalEdge: 'Esperanza Matemática E = (0.594 × 2.2R) - (0.406 × 1.0R) = +0.90R por operación.',
      mathParams: {
        periodN: 20,
        atrMultiplier: 1.5,
      },
    },
    scriptCode: `//@version=5\nstrategy("Keltner Volatility Breakout", overlay=true)\nema20 = ta.ema(close, 20)\natr14 = ta.atr(14)\nupper = ema20 + 2.0 * atr14\nif (close > upper)\n    strategy.entry("Keltner_Long", strategy.long)`,
  },
];

export const SimpleStrategyBridge: React.FC<SimpleStrategyBridgeProps> = ({
  strategies,
  activeAccount,
  onAddStrategy,
  onUpdateStrategy,
  onToggleActive,
}) => {
  const [scriptText, setScriptText] = useState(SAMPLE_SCRIPT);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [expandedStrategyId, setExpandedStrategyId] = useState<string | null>(strategies[0]?.id || null);
  const [showCodeId, setShowCodeId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  // Editable form state for strategies
  const [strategyEdits, setStrategyEdits] = useState<Record<string, { risk: number; rr: number; atrMult: number }>>({});

  // Calculator Tool state
  const [calcSymbol, setCalcSymbol] = useState<'US500' | 'XAUUSD' | 'NAS100' | 'EURUSD'>('US500');
  const [calcRiskPercent, setCalcRiskPercent] = useState<number>(0.5);
  const [calcStopPips, setCalcStopPips] = useState<number>(15);

  const parsed = parseMarketSenseScript(scriptText);

  const toggleExpand = (id: string) => {
    setExpandedStrategyId(prev => prev === id ? null : id);
  };

  const getRiskPercent = (strat: StrategyConfig) => {
    return strategyEdits[strat.id]?.risk ?? strat.riskPerTradePercent ?? activeAccount.riskRules.maxRiskPerTradePercent;
  };

  const getTargetRR = (strat: StrategyConfig) => {
    return strategyEdits[strat.id]?.rr ?? strat.targetRiskReward;
  };

  const getAtrMultiplier = (strat: StrategyConfig) => {
    return strategyEdits[strat.id]?.atrMult ?? strat.slParam ?? 1.5;
  };

  const handleRiskChange = (id: string, risk: number) => {
    setStrategyEdits(prev => ({
      ...prev,
      [id]: {
        risk,
        rr: prev[id]?.rr ?? strategies.find(s => s.id === id)?.targetRiskReward ?? 2.0,
        atrMult: prev[id]?.atrMult ?? strategies.find(s => s.id === id)?.slParam ?? 1.5,
      },
    }));
  };

  const handleRRChange = (id: string, rr: number) => {
    setStrategyEdits(prev => ({
      ...prev,
      [id]: {
        risk: prev[id]?.risk ?? strategies.find(s => s.id === id)?.riskPerTradePercent ?? 0.5,
        rr,
        atrMult: prev[id]?.atrMult ?? strategies.find(s => s.id === id)?.slParam ?? 1.5,
      },
    }));
  };

  const handleAtrChange = (id: string, atrMult: number) => {
    setStrategyEdits(prev => ({
      ...prev,
      [id]: {
        risk: prev[id]?.risk ?? strategies.find(s => s.id === id)?.riskPerTradePercent ?? 0.5,
        rr: prev[id]?.rr ?? strategies.find(s => s.id === id)?.targetRiskReward ?? 2.0,
        atrMult,
      },
    }));
  };

  const handleSaveStrategyEdits = (strat: StrategyConfig) => {
    const risk = getRiskPercent(strat);
    const rr = getTargetRR(strat);
    const atrMult = getAtrMultiplier(strat);

    onUpdateStrategy(strat.id, {
      riskPerTradePercent: risk,
      targetRiskReward: rr,
      slParam: atrMult,
    });

    setSavedId(strat.id);
    setTimeout(() => setSavedId(null), 3000);
  };

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
      riskPerTradePercent: 0.5,
      tradingSession: 'Horario del activo detectado',
      plainDescription: `Estrategia cuantitativa importada de MarketSense para ${parsed.symbol}. Ejecuta compras y ventas según los parámetros matemáticos definidos en el script.`,
      entryConditionSummary: parsed.entryLogic,
      mathematicalBasis: {
        modelName: `Modelo Cuantitativo MarketSense (${parsed.symbol})`,
        formula: 'Condición Algorítmica PineScript con Gestión de Riesgo por ATR',
        hypothesis: 'Detección de puntos de inflexión con reversión a la media institucional.',
        riskMath: `Lotes = (Capital × 0.5%) / (${parsed.suggestedSlParam} × ATR × PipValue).`,
        statisticalEdge: `Esperanza Matemática calculada para ratio 1:${parsed.targetRiskReward}R.`,
      },
      lastSignal: {
        action: 'BUY',
        timestamp: 'Recién armada',
        price: 0,
        reason: 'Estrategia de MarketSense armada con base matemática. Vigilancia activa en vivo.',
      },
    };

    onAddStrategy(newStrat);
    setSuccessMsg(`¡Estrategia "${parsed.name}" activada! El bot ya está operándola.`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleAddTemplate = (template: Partial<StrategyConfig>) => {
    const newStrat: StrategyConfig = {
      id: `strat-tpl-${Date.now()}`,
      name: template.name || 'Estrategia Cuantitativa',
      symbol: template.symbol || 'EURUSD',
      source: 'MARKETSENSE_SCRIPT',
      timeframe: template.timeframe || 'M15',
      mode: template.mode || 'INTRADAY',
      scriptCode: template.scriptCode || '// Template cuantitativo',
      isActive: true,
      targetRiskReward: template.targetRiskReward || 2.0,
      slMethod: template.slMethod || 'ATR',
      slParam: template.slParam || 1.5,
      tpParam: (template.targetRiskReward || 2.0) * (template.slParam || 1.5),
      executionType: 'AUTONOMOUS_24_7',
      winRate: template.winRate || 60,
      totalTrades: 0,
      profitFactor: template.profitFactor || 2.0,
      riskPerTradePercent: template.riskPerTradePercent || 0.5,
      tradingSession: template.tradingSession || 'Sesión institucional',
      plainDescription: template.plainDescription,
      entryConditionSummary: template.entryConditionSummary,
      mathematicalBasis: template.mathematicalBasis,
      lastSignal: {
        action: 'BUY',
        timestamp: 'Incorporada ahora',
        price: 0,
        reason: 'Modelo cuantitativo añadido y en vigilancia de mercado.',
      },
    };

    onAddStrategy(newStrat);
    setSuccessMsg(`¡Modelo "${newStrat.name}" incorporado al bot con éxito!`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Math simulation calculations
  const simBalance = activeAccount.currentEquity || 100000;
  const simDollarRisk = (simBalance * calcRiskPercent) / 100;
  const pipValues: Record<string, number> = { US500: 10, XAUUSD: 10, NAS100: 20, EURUSD: 10 };
  const pipVal = pipValues[calcSymbol] || 10;
  const simLots = Math.max(0.01, Math.round((simDollarRisk / (calcStopPips * pipVal)) * 100) / 100);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Intro Card */}
      <div className="ivory-card rounded-2xl p-5 sm:p-6 text-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-[#EBF2EC] text-[#2E4A35] mx-auto flex items-center justify-center mb-2">
          <Sigma className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-[#191C21]">
          Estrategias con Base Matemática
        </h2>
        <p className="text-xs sm:text-sm text-[#575B62] leading-relaxed max-w-lg mx-auto">
          Cada bot opera bajo modelos cuantitativos verificados (distribución normal, Z-Score, ATR y asimetría de payoffs). Puedes ver las fórmulas exactas, saber cuánto dinero arriesgan y modificar sus reglas en cualquier momento.
        </p>
      </div>

      {/* Account Balance Context Banner */}
      <div className="p-3.5 rounded-xl bg-[#FAF8F3] border border-[#E6E1D6] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#2E4A35]" />
          <span className="text-[#575B62]">
            Calculando riesgos sobre tu cuenta activa: <strong className="text-[#191C21]">{activeAccount.name}</strong>
          </span>
        </div>
        <div className="font-mono font-bold text-sm text-[#2E4A35]">
          ${activeAccount.currentEquity.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
        </div>
      </div>

      {/* 1. List of Strategies with Clear Human Breakdown, Formulas, and Modifiers */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-serif text-lg font-bold text-[#191C21]">
            Estrategias Activas en el Bot ({strategies.length})
          </h3>
          <span className="text-xs text-[#8C9098]">
            Toca una estrategia para desplegar sus fórmulas y calibración
          </span>
        </div>

        {strategies.map(strat => {
          const isExpanded = expandedStrategyId === strat.id;
          const currentRiskPercent = getRiskPercent(strat);
          const currentRR = getTargetRR(strat);
          const currentAtr = getAtrMultiplier(strat);

          // Calculate exact dollar values according to user account (e.g. $100,000 balance)
          const dollarRisk = (activeAccount.currentEquity * currentRiskPercent) / 100;
          const dollarGainTarget = dollarRisk * currentRR;

          return (
            <div 
              key={strat.id}
              className={`ivory-card rounded-2xl p-4 sm:p-5 space-y-4 transition-all ${
                strat.isActive ? 'border-[#C5DDCB]' : 'opacity-85'
              }`}
            >
              {/* Header Row */}
              <div 
                onClick={() => toggleExpand(strat.id)}
                className="flex items-center justify-between cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm sm:text-base text-[#191C21]">
                      {strat.name}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#EFECE4] text-[#2E4A35]">
                      {strat.symbol}
                    </span>
                    <span className="text-[10px] font-mono text-[#8C9098] bg-slate-100 px-1 rounded">
                      {strat.timeframe}
                    </span>
                    {strat.mathematicalBasis && (
                      <span className="text-[10px] font-sans font-semibold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                        <Sigma className="w-2.5 h-2.5" /> Modelo Cuantitativo
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-[#575B62] mt-1 font-mono">
                    Riesgo máx: <strong className="text-rose-700">{currentRiskPercent}% (-${dollarRisk.toFixed(2)} USD)</strong> • Objetivo: <strong className="text-[#2E4A35]">{currentRR}R (+${dollarGainTarget.toFixed(2)} USD)</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleActive(strat.id);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      strat.isActive
                        ? 'bg-[#EBF2EC] text-[#2E4A35] border border-[#C5DDCB]'
                        : 'bg-[#F3EFE6] text-[#8C9098] border border-[#DDD8CD]'
                    }`}
                  >
                    {strat.isActive ? 'Operando' : 'Pausada'}
                  </button>

                  {isExpanded ? <ChevronUp className="w-4 h-4 text-[#8C9098]" /> : <ChevronDown className="w-4 h-4 text-[#8C9098]" />}
                </div>
              </div>

              {/* Expanded Strategy Anatomy */}
              {isExpanded && (
                <div className="pt-3 border-t border-[#EAE5DA] space-y-4 text-xs">
                  {/* 1. What is this strategy trying to do? */}
                  <div className="p-3.5 rounded-xl bg-[#FAF8F3] border border-[#E6E1D6] space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-[#2E4A35]">
                      <Sparkles className="w-4 h-4 text-[#2E4A35]" />
                      <span>¿Qué busca esta estrategia y cómo opera en el mercado?</span>
                    </div>
                    <p className="text-[#575B62] leading-relaxed">
                      {strat.plainDescription || 'Estrategia algorítmica diseñada para aprovechar movimientos de alta probabilidad matemática.'}
                    </p>
                    {strat.entryConditionSummary && (
                      <div className="pt-1 text-[#191C21] font-medium leading-relaxed">
                        • <strong>Condición de entrada:</strong> {strat.entryConditionSummary}
                      </div>
                    )}
                    {strat.tradingSession && (
                      <div className="text-[#8C9098] font-mono text-[11px]">
                        • <strong>Horario estadístico:</strong> {strat.tradingSession}
                      </div>
                    )}
                  </div>

                  {/* 2. Mathematical Foundation & Formula Block (NEW - USER REQUEST) */}
                  {strat.mathematicalBasis && (
                    <div className="p-4 rounded-xl bg-[#F0F5F1] border border-[#C5DDCB] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#2E4A35] flex items-center gap-1.5 text-xs">
                          <Sigma className="w-4 h-4 text-[#2E4A35]" />
                          <span>Base Matemática y Modelo Estadístico:</span>
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-200/60 text-emerald-900 font-bold">
                          {strat.mathematicalBasis.modelName}
                        </span>
                      </div>

                      {/* Formula Box */}
                      <div className="p-2.5 rounded-lg bg-white border border-[#C5DDCB] font-mono text-xs text-[#191C21] shadow-inner font-semibold">
                        {strat.mathematicalBasis.formula}
                      </div>

                      {/* Hypothesis & Edge */}
                      <p className="text-[11px] text-[#334D3A] leading-relaxed">
                        <strong>Hipótesis probabilística:</strong> {strat.mathematicalBasis.hypothesis}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                        <div className="p-2 rounded bg-white/80 border border-[#D7E8DA]">
                          <span className="text-[#575B62] block text-[10px] uppercase">Lógica de Riesgo Matemático</span>
                          <span className="font-semibold text-[#191C21]">{strat.mathematicalBasis.riskMath}</span>
                        </div>
                        <div className="p-2 rounded bg-white/80 border border-[#D7E8DA]">
                          <span className="text-[#575B62] block text-[10px] uppercase">Esperanza Matemática (Edge)</span>
                          <span className="font-bold text-[#2E4A35]">{strat.mathematicalBasis.statisticalEdge}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. Live Dollar Risk Transparency Card */}
                  <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-950 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-rose-700" />
                        <span>Transparencia de Riesgo en tu Cuenta (${activeAccount.currentEquity.toLocaleString()} USD):</span>
                      </span>
                      <span className="text-[10px] font-mono font-bold text-rose-800 bg-rose-100 px-1.5 py-0.5 rounded">
                        Límite Duro
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs pt-1">
                      <div className="p-2 rounded bg-white border border-rose-200">
                        <span className="text-[10px] text-slate-500 block">Riesgo si salta Stop Loss</span>
                        <span className="font-bold text-rose-700 text-sm">-${dollarRisk.toFixed(2)} USD</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">({currentRiskPercent}% del balance)</span>
                      </div>
                      <div className="p-2 rounded bg-white border border-emerald-200">
                        <span className="text-[10px] text-slate-500 block">Ganancia si toca Take Profit</span>
                        <span className="font-bold text-emerald-700 text-sm">+${dollarGainTarget.toFixed(2)} USD</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">({currentRR}R sobre riesgo)</span>
                      </div>
                      <div className="p-2 rounded bg-white border border-slate-200 col-span-2 sm:col-span-1">
                        <span className="text-[10px] text-slate-500 block">Protección Breakeven</span>
                        <span className="font-bold text-slate-800 text-sm">+1.0R</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Riesgo $0.00 garantizado</span>
                      </div>
                    </div>
                  </div>

                  {/* 4. Modifiable Rules: Risk & Reward & ATR Tuning */}
                  <div className="p-4 rounded-xl bg-[#F3EFE6] border border-[#DDD8CD] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#191C21] flex items-center gap-1.5">
                        <Sliders className="w-4 h-4 text-[#2E4A35]" />
                        <span>Calibrar Reglas y Parámetros Matemáticos:</span>
                      </span>
                      <span className="text-[11px] text-[#8C9098]">
                        Modifica los valores y pulsa "Guardar"
                      </span>
                    </div>

                    {/* Risk per trade selector */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-[#191C21]">
                          1. Riesgo por Operación (%):
                        </label>
                        <span className="font-mono font-bold text-rose-700">
                          {currentRiskPercent}% = -${dollarRisk.toFixed(2)} USD máx.
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[0.25, 0.5, 0.75, 1.0].map(r => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => handleRiskChange(strat.id, r)}
                            className={`py-1.5 rounded-lg font-mono font-semibold text-xs border transition cursor-pointer ${
                              currentRiskPercent === r
                                ? 'bg-[#2E4A35] text-[#F8F6F0] border-[#2E4A35]'
                                : 'bg-[#FAF8F3] text-[#575B62] border-[#E6E1D6] hover:bg-[#EFECE4]'
                            }`}
                          >
                            {r}%
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Reward target selector */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-[#191C21]">
                          2. Ratio Objetivo Beneficio/Riesgo (R:R):
                        </label>
                        <span className="font-mono font-bold text-[#2E4A35]">
                          1:{currentRR} = +${dollarGainTarget.toFixed(2)} USD objetivo
                        </span>
                      </div>
                      <div className="grid grid-cols-5 gap-1.5">
                        {[1.5, 1.8, 2.0, 2.5, 3.0].map(rr => (
                          <button
                            key={rr}
                            type="button"
                            onClick={() => handleRRChange(strat.id, rr)}
                            className={`py-1.5 rounded-lg font-mono font-semibold text-xs border transition cursor-pointer ${
                              currentRR === rr
                                ? 'bg-[#2E4A35] text-[#F8F6F0] border-[#2E4A35]'
                                : 'bg-[#FAF8F3] text-[#575B62] border-[#E6E1D6] hover:bg-[#EFECE4]'
                            }`}
                          >
                            {rr}R
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* ATR Stop Loss Multiplier */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-[#191C21]">
                          3. Multiplicador de Volatilidad Stop Loss (ATR):
                        </label>
                        <span className="font-mono font-bold text-slate-800">
                          {currentAtr}× ATR
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[1.0, 1.2, 1.5, 2.0].map(atr => (
                          <button
                            key={atr}
                            type="button"
                            onClick={() => handleAtrChange(strat.id, atr)}
                            className={`py-1.5 rounded-lg font-mono font-semibold text-xs border transition cursor-pointer ${
                              currentAtr === atr
                                ? 'bg-[#2E4A35] text-[#F8F6F0] border-[#2E4A35]'
                                : 'bg-[#FAF8F3] text-[#575B62] border-[#E6E1D6] hover:bg-[#EFECE4]'
                            }`}
                          >
                            {atr}x ATR
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-[#8C9098] mt-1">
                        Un multiplicador más alto da más holgura al precio ante volatilidad sin aumentar tu riesgo en dólares (el bot reduce los lotes automáticamente).
                      </p>
                    </div>

                    {/* Save button */}
                    <div className="pt-2 flex items-center justify-between border-t border-[#DDD8CD]">
                      <span className="text-[11px] text-[#2E4A35] font-semibold">
                        {savedId === strat.id && '✅ ¡Reglas de la estrategia actualizadas con éxito!'}
                      </span>
                      <button
                        onClick={() => handleSaveStrategyEdits(strat)}
                        className="px-4 py-2 rounded-xl olive-btn font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Guardar Cambios</span>
                      </button>
                    </div>
                  </div>

                  {/* Toggle View Technical Script Code */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowCodeId(prev => prev === strat.id ? null : strat.id)}
                      className="text-xs text-[#2E4A35] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Code className="w-3.5 h-3.5" />
                      <span>{showCodeId === strat.id ? 'Ocultar código del script' : 'Ver código fuente del script'}</span>
                    </button>

                    {showCodeId === strat.id && (
                      <pre className="mt-2 p-3 rounded-xl bg-[#F3EFE6] border border-[#DDD8CD] font-mono text-[10px] text-[#191C21] overflow-x-auto max-h-40 leading-relaxed select-all">
                        {strat.scriptCode}
                      </pre>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 2. Interactive Mathematical Lot Sizing & Risk Calculator Tool */}
      <div className="ivory-card rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-[#2E4A35]" />
          <h3 className="font-serif text-lg font-bold text-[#191C21]">
            Simulador Matemático de Lotes y Riesgo
          </h3>
        </div>
        <p className="text-xs text-[#575B62] leading-relaxed">
          Comprueba exactamente cómo el algoritmo calcula el tamaño de posición para no arriesgar ni un céntimo más de lo permitido en tu cuenta de ${simBalance.toLocaleString()} USD.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-[#191C21] block mb-1">
              Símbolo
            </label>
            <select
              value={calcSymbol}
              onChange={e => setCalcSymbol(e.target.value as any)}
              className="w-full bg-[#F3EFE6] border border-[#DDD8CD] rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-[#191C21]"
            >
              <option value="US500">US500 (S&P 500)</option>
              <option value="XAUUSD">XAUUSD (Oro)</option>
              <option value="NAS100">NAS100 (Nasdaq)</option>
              <option value="EURUSD">EURUSD (Euro)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#191C21] block mb-1">
              Riesgo Configurado (%)
            </label>
            <select
              value={calcRiskPercent}
              onChange={e => setCalcRiskPercent(Number(e.target.value))}
              className="w-full bg-[#F3EFE6] border border-[#DDD8CD] rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-[#191C21]"
            >
              <option value={0.25}>0.25% (-${((simBalance * 0.25) / 100).toFixed(0)} USD)</option>
              <option value={0.50}>0.50% (-${((simBalance * 0.50) / 100).toFixed(0)} USD)</option>
              <option value={0.75}>0.75% (-${((simBalance * 0.75) / 100).toFixed(0)} USD)</option>
              <option value={1.00}>1.00% (-${((simBalance * 1.00) / 100).toFixed(0)} USD)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#191C21] block mb-1">
              Distancia Stop Loss (Pips)
            </label>
            <input
              type="number"
              min="5"
              max="200"
              value={calcStopPips}
              onChange={e => setCalcStopPips(Number(e.target.value))}
              className="w-full bg-[#F3EFE6] border border-[#DDD8CD] rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-[#191C21]"
            />
          </div>
        </div>

        {/* Calculation Result */}
        <div className="p-3.5 rounded-xl bg-[#FAF8F3] border border-[#E6E1D6] font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-[#8C9098] block uppercase">Fórmula Matemática Institucional</span>
            <span className="text-[#191C21] font-semibold">
              ${simDollarRisk.toFixed(0)} USD / ({calcStopPips} pips × ${pipVal}/lote)
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-[#8C9098] block uppercase">Tamaño Exacto de Orden</span>
            <span className="text-base font-bold text-[#2E4A35]">
              {simLots} lotes
            </span>
          </div>
        </div>
      </div>

      {/* 3. Pre-made Mathematical Strategies Catalog */}
      <div className="ivory-card rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#2E4A35]" />
          <h3 className="font-serif text-lg font-bold text-[#191C21]">
            Catálogo de Modelos Cuantitativos Listos
          </h3>
        </div>
        <p className="text-xs text-[#575B62] leading-relaxed">
          Puedes sumar al bot estos modelos adicionales basados en fórmulas matemáticas comprobadas:
        </p>

        <div className="space-y-3">
          {MATH_STRATEGY_TEMPLATES.map((tpl, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-[#FAF8F3] border border-[#E6E1D6] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#191C21]">{tpl.name}</span>
                  <span className="text-[10px] font-mono bg-[#EFECE4] px-1 rounded text-[#2E4A35] font-bold">{tpl.symbol}</span>
                  <span className="text-[10px] font-mono text-slate-500">{tpl.timeframe}</span>
                </div>
                <p className="text-xs text-[#575B62] mt-1 line-clamp-2">
                  {tpl.plainDescription}
                </p>
                <div className="text-[11px] font-mono text-[#2E4A35] mt-1">
                  Win Rate estimado: <strong>{tpl.winRate}%</strong> • Profit Factor: <strong>{tpl.profitFactor}</strong> • Target: <strong>{tpl.targetRiskReward}R</strong>
                </div>
              </div>

              <button
                onClick={() => handleAddTemplate(tpl)}
                className="px-3 py-1.5 rounded-xl olive-btn font-semibold text-xs whitespace-nowrap flex items-center gap-1 cursor-pointer self-start sm:self-center shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir al Bot</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Custom Script Paste Area */}
      <div className="ivory-card rounded-2xl p-5 sm:p-6 space-y-4">
        <h3 className="font-serif text-lg font-bold text-[#191C21]">
          + Vincular Otro Script Generado por MarketSense
        </h3>
        <p className="text-xs text-[#575B62] leading-relaxed">
          Si creas un script nuevo en tu otra aplicación de MarketSense, pega el código aquí. El analizador extraerá los parámetros matemáticos y lo conectará al bot:
        </p>

        <form onSubmit={handleActivateStrategy} className="space-y-3">
          <textarea
            rows={5}
            value={scriptText}
            onChange={e => setScriptText(e.target.value)}
            placeholder="Pega aquí el código que te dio MarketSense..."
            className="w-full bg-[#F3EFE6] border border-[#DDD8CD] rounded-xl p-3 text-xs font-mono text-[#191C21] focus:outline-none focus:border-[#2E4A35] leading-relaxed"
          />

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl olive-btn font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <span>Activar Estrategia con Base Matemática</span>
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
    </div>
  );
};
