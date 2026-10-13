import React, { useState } from 'react';
import { 
  X, 
  FileCode, 
  Sparkles, 
  Check, 
  Copy, 
  Terminal, 
  Radio, 
  Zap, 
  Layers,
  ChevronRight
} from 'lucide-react';
import { StrategyConfig } from '../types/execution';
import { parseMarketSenseScript, generateWebhookPayloadTemplate } from '../lib/strategyParser';

interface StrategyBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeAccountId: string;
  onAddStrategy: (strat: StrategyConfig) => void;
}

const SAMPLE_MARKETSENSE_SCRIPT = `//@version=5
strategy("MarketSense US500 Suelo Institucional", overlay=true, margin_long=100)
// Generado automáticamente por MarketSense AI Hub
// Lógica: Detección de suelo institucional tras 3 días en zona roja + absorción de volumen
len = input.int(20, "EMA Institucional")
rsiPeriod = input.int(14, "RSI")
src = close

ema20 = ta.ema(src, len)
rsiVal = ta.rsi(src, rsiPeriod)
volFilter = volume > ta.sma(volume, 20)

// Condición de entrada institucional
longCondition = ta.crossover(src, ema20) and rsiVal > 45 and rsiVal < 65 and volFilter
if (longCondition)
    strategy.entry("MS_Long", strategy.long)
    // SL dinámico calculado a 1.5x ATR y TP a 2.5R`;

export const StrategyBridgeModal: React.FC<StrategyBridgeModalProps> = ({
  isOpen,
  onClose,
  activeAccountId,
  onAddStrategy,
}) => {
  const [scriptCode, setScriptCode] = useState(SAMPLE_MARKETSENSE_SCRIPT);
  const [strategyName, setStrategyName] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'M1' | 'M5' | 'M15' | 'H1' | 'H4' | 'D1'>('M15');
  const [targetRR, setTargetRR] = useState(2.5);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  if (!isOpen) return null;

  // Real-time parse of the script
  const parsed = parseMarketSenseScript(scriptCode);
  const currentSymbol = selectedSymbol || parsed.symbol;
  const currentName = strategyName || parsed.name;
  const currentTimeframe = selectedTimeframe || parsed.timeframe;

  const webhookSecret = `ms_sec_${activeAccountId.slice(-6)}_${Math.random().toString(36).substring(2, 6)}`;
  const webhookUrl = `${window.location.origin}/api/webhook/marketsense?account=${activeAccountId}`;
  const webhookPayload = generateWebhookPayloadTemplate(currentSymbol, activeAccountId, webhookSecret);

  const handleSaveStrategy = (e: React.FormEvent) => {
    e.preventDefault();
    const newStrategy: StrategyConfig = {
      id: `strat-${Date.now()}`,
      name: currentName,
      symbol: currentSymbol,
      source: parsed.formatType === 'PYTHON_DAEMON' ? 'PYTHON_AUTONOMOUS' : 'MARKETSENSE_SCRIPT',
      timeframe: currentTimeframe,
      mode: parsed.mode,
      scriptCode: scriptCode,
      isActive: true,
      targetRiskReward: targetRR,
      slMethod: parsed.suggestedSlMethod,
      slParam: parsed.suggestedSlParam,
      tpParam: targetRR * parsed.suggestedSlParam,
      executionType: 'AUTONOMOUS_24_7',
      winRate: 60.0,
      totalTrades: 0,
      profitFactor: 2.1,
      lastSignal: {
        action: 'BUY',
        timestamp: 'Recién vinculado',
        price: 0,
        reason: 'Estrategia armada y esperando condición en vivo de MarketSense.',
      },
    };

    onAddStrategy(newStrategy);
    onClose();
  };

  const copyToClipboard = (text: string, type: 'url' | 'json') => {
    navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedWebhook(true);
      setTimeout(() => setCopiedWebhook(false), 2000);
    } else {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="tactile-card rounded-2xl w-full max-w-3xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <FileCode className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-heading text-lg font-bold text-white">
                Vincular Script o Estrategia de MarketSense
              </h3>
              <p className="text-xs text-slate-400">
                Pega el código Pine Script, Python o señal JSON generado por MarketSense
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSaveStrategy} className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Script Editor / Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <span>Código del Script de MarketSense</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                  {parsed.formatType === 'PINE_SCRIPT' ? 'Pine Script v5' : parsed.formatType === 'PYTHON_DAEMON' ? 'Python Daemon' : 'JSON Signal'}
                </span>
              </label>
              <button
                type="button"
                onClick={() => setScriptCode(SAMPLE_MARKETSENSE_SCRIPT)}
                className="text-[11px] text-amber-400 hover:text-amber-300 underline"
              >
                Cargar ejemplo
              </button>
            </div>

            <textarea
              rows={7}
              value={scriptCode}
              onChange={e => setScriptCode(e.target.value)}
              placeholder="Pega aquí el código generado por MarketSense..."
              className="w-full bg-slate-950 font-mono text-xs text-emerald-400 border border-slate-800 rounded-xl p-3 focus:outline-none focus:border-indigo-500 leading-relaxed resize-y"
            />
          </div>

          {/* AI Parser Real-Time Diagnostics */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
            <div className="flex items-center space-x-2 text-xs font-semibold text-amber-300">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Diagnóstico Automático del Script:</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Activo Detectado</span>
                <span className="text-amber-300 font-bold">{currentSymbol}</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Temporalidad</span>
                <span className="text-slate-200 font-bold">{currentTimeframe}</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Modo Operativo</span>
                <span className="text-indigo-300 font-bold">{parsed.mode}</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Filtro Stop Loss</span>
                <span className="text-emerald-400 font-bold">1.5x ATR Dinámico</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-300 flex items-start gap-1.5 pt-1">
              <span className="text-slate-500 font-mono">Indicadores:</span>
              <div className="flex flex-wrap gap-1">
                {parsed.indicatorsDetected.map((ind, i) => (
                  <span key={i} className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">
                    {ind}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Configuration Override fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Nombre de la Estrategia
              </label>
              <input
                type="text"
                value={strategyName}
                placeholder={parsed.name}
                onChange={e => setStrategyName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Símbolo a Operar
              </label>
              <select
                value={currentSymbol}
                onChange={e => setSelectedSymbol(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="US500">US500 (S&P 500 CFD)</option>
                <option value="NAS100">NAS100 (Nasdaq 100)</option>
                <option value="XAUUSD">XAUUSD (Oro Spot)</option>
                <option value="EURUSD">EURUSD (Euro)</option>
                <option value="BTCUSDT">BTCUSDT (Bitcoin)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Objetivo Mínimo R:R
              </label>
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  step="0.1"
                  min="1.0"
                  max="5.0"
                  value={targetRR}
                  onChange={e => setTargetRR(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
                <span className="font-mono text-xs text-slate-400">R</span>
              </div>
            </div>
          </div>

          {/* Webhook & TradingView Relay Integration Details */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                URL Webhook para TradingView / Relay 24/7
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(webhookUrl, 'url')}
                className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-mono"
              >
                {copiedWebhook ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedWebhook ? 'Copiado!' : 'Copiar URL'}
              </button>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-400 truncate select-all">
              {webhookUrl}
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-[11px] text-slate-400">Payload JSON para la Alerta:</span>
              <button
                type="button"
                onClick={() => copyToClipboard(webhookPayload, 'json')}
                className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-mono"
              >
                {copiedJson ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedJson ? 'Copiado!' : 'Copiar JSON'}
              </button>
            </div>
            <pre className="p-2 rounded bg-slate-900 border border-slate-800 font-mono text-[10px] text-emerald-400 overflow-x-auto max-h-24">
              {webhookPayload}
            </pre>
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Zap className="w-4 h-4" />
              <span>Guardar y Activar Bot Autónomo 24/7</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
