import React, { useState } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  Save, 
  ChevronDown, 
  ChevronUp,
  Brain,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  ArrowRight,
  AlertTriangle,
  RotateCw
} from 'lucide-react';
import { TradeOrder } from '../types/execution';

interface SimpleJournalProps {
  trades: TradeOrder[];
  onSaveNotes: (tradeId: string, notes: string) => void;
}

interface AuditResult {
  marketRegime: string;
  winRate: number;
  profitFactor: number;
  totalTradesAnalyzed: number;
  overallHealthStatus: 'HEALTHY' | 'NEEDS_CALIBRATION' | 'DEGRADED';
  maeAnalysis: {
    averageMaePips: number;
    verdict: string;
    stopLossCalibrationRecommendation: string;
  };
  mfeAnalysis: {
    averageMfePips: number;
    verdict: string;
    takeProfitAndBreakevenRecommendation: string;
  };
  adaptationRoadmap: {
    title: string;
    description: string;
    suggestedChange: string;
    impact: 'HIGH' | 'MEDIUM' | 'LOW';
  }[];
  institutionalVerdict: string;
}

export const SimpleJournal: React.FC<SimpleJournalProps> = ({ trades, onSaveNotes }) => {
  const closedTrades = trades.filter(t => t.status === 'CLOSED');
  const [expandedId, setExpandedId] = useState<string | null>(closedTrades[0]?.id || null);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [savedSuccessId, setSavedSuccessId] = useState<string | null>(null);

  // AI Learning Audit State
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [auditSource, setAuditSource] = useState<string>('');
  const [showLearningArchitecture, setShowLearningArchitecture] = useState(true);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const handleNoteChange = (id: string, text: string) => {
    setNoteInputs(prev => ({ ...prev, [id]: text }));
  };

  const handleSaveNote = (id: string) => {
    const text = noteInputs[id];
    if (text !== undefined) {
      onSaveNotes(id, text);
      setSavedSuccessId(id);
      setTimeout(() => setSavedSuccessId(null), 2500);
    }
  };

  const handleRunAiAudit = async () => {
    setIsLoadingAudit(true);
    try {
      const res = await fetch('/api/ai/audit-learning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trades }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.audit) {
          setAuditResult(data.audit);
          setAuditSource(data.source || 'AI_ENGINE');
        }
      }
    } catch (e) {
      console.warn('Error running AI audit', e);
    } finally {
      setIsLoadingAudit(false);
    }
  };

  const totalPnL = closedTrades.reduce((acc, t) => acc + t.netPnL, 0);
  const winCount = closedTrades.filter(t => t.netPnL > 0).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* 1. Header Card */}
      <div className="ivory-card rounded-2xl p-5 sm:p-6 text-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-[#EBF2EC] text-[#2E4A35] mx-auto flex items-center justify-center mb-2">
          <BookOpen className="w-6 h-6" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-[#191C21]">
          Diario Cuantitativo y Motor de Aprendizaje
        </h1>
        <p className="text-xs sm:text-sm text-[#575B62] leading-relaxed max-w-lg mx-auto">
          Aquí se registra el comportamiento forense de cada operación. El sistema analiza desviaciones, comisiones de broker y excursiones de precio (MAE/MFE) para calibrar la estrategia de forma continua.
        </p>

        {/* Totals banner */}
        <div className="flex justify-center gap-6 pt-3 border-t border-[#EAE5DA] mt-3 font-mono text-xs">
          <div>
            <span className="text-[#8C9098]">Ganancia Neta: </span>
            <span className={`font-bold ${totalPnL >= 0 ? 'text-[#2E4A35]' : 'text-rose-700'}`}>
              ${totalPnL.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-[#8C9098]">Efectividad: </span>
            <span className="font-bold text-[#191C21]">
              {closedTrades.length > 0 ? ((winCount / closedTrades.length) * 100).toFixed(0) : 0}% ganadoras
            </span>
          </div>
          <div>
            <span className="text-[#8C9098]">Operaciones: </span>
            <span className="font-bold text-[#191C21]">{closedTrades.length} cerradas</span>
          </div>
        </div>
      </div>

      {/* 2. Architecture Explainer Card: ¿Cuál es la parte que se encarga del aprendizaje? */}
      <div className="ivory-card rounded-2xl p-5 sm:p-6 border-2 border-[#2E4A35]/25 bg-gradient-to-br from-[#FDFCF9] to-[#EBF2EC] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-[#2E4A35]" />
            <h2 className="font-serif text-base sm:text-lg font-bold text-[#191C21]">
              ¿Cómo aprende y se adapta el bot conforme opera?
            </h2>
          </div>
          <button
            onClick={() => setShowLearningArchitecture(prev => !prev)}
            className="text-xs font-semibold text-[#2E4A35] hover:underline cursor-pointer"
          >
            {showLearningArchitecture ? 'Ocultar detalles' : 'Ver arquitectura'}
          </button>
        </div>

        {showLearningArchitecture && (
          <div className="space-y-3 pt-1 text-xs">
            <p className="text-[#575B62] leading-relaxed">
              En fondos cuantitativos profesionales, un bot <strong>NUNCA debe modificar su código al azar</strong> tras una pérdida (lo que causaría sobreajuste o <em>overfitting</em> catastrófico). En su lugar, nuestra solución cuenta con <strong>4 módulos específicos</strong> encargados del aprendizaje y la autoprotección:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Módulo 1 */}
              <div className="p-3.5 rounded-xl bg-white border border-[#DDD8CD] space-y-1.5 shadow-sm">
                <div className="flex items-center gap-2 text-[#2E4A35] font-bold">
                  <Activity className="w-4 h-4" />
                  <span>1. Diagnóstico Forense MAE / MFE</span>
                </div>
                <p className="text-[#575B62] leading-relaxed text-[11px]">
                  <strong>MAE (Máxima Excursión Adversa):</strong> Mide cuánto retrocedió el precio antes de ganar. Si el MAE es alto, la entrada fue prematura.
                  <br />
                  <strong>MFE (Máxima Excursión Favorable):</strong> Detecta si el trade alcanzó +2R o +3R antes de retroceder, indicando cuándo mover a Breakeven.
                </p>
              </div>

              {/* Módulo 2 */}
              <div className="p-3.5 rounded-xl bg-white border border-[#DDD8CD] space-y-1.5 shadow-sm">
                <div className="flex items-center gap-2 text-[#2E4A35] font-bold">
                  <Zap className="w-4 h-4" />
                  <span>2. Calibración Adaptativa ATR</span>
                </div>
                <p className="text-[#575B62] leading-relaxed text-[11px]">
                  El bot de Python y el EA ajustan automáticamente la distancia de Stop Loss y la activación de <strong>Auto-Breakeven (+1 pip)</strong> en función de la volatilidad real (ATR), evitando que el ruido de mercado expulse posiciones válidas.
                </p>
              </div>

              {/* Módulo 3 */}
              <div className="p-3.5 rounded-xl bg-white border border-[#DDD8CD] space-y-1.5 shadow-sm">
                <div className="flex items-center gap-2 text-[#2E4A35] font-bold">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>3. Cortacircuitos (Circuit Breaker)</span>
                </div>
                <p className="text-[#575B62] leading-relaxed text-[11px]">
                  <strong>Tu garantía de seguridad:</strong> Si el mercado cambia bruscamente de régimen (ej. noticias macro hostiles) y acumula 2 pérdidas en el día, el bot <strong>se apaga solo</strong> automáticamente para no poner en riesgo tu capital.
                </p>
              </div>

              {/* Módulo 4 */}
              <div className="p-3.5 rounded-xl bg-white border border-[#DDD8CD] space-y-1.5 shadow-sm">
                <div className="flex items-center gap-2 text-[#2E4A35] font-bold">
                  <Sparkles className="w-4 h-4" />
                  <span>4. Auditoría y Tuning con IA</span>
                </div>
                <p className="text-[#575B62] leading-relaxed text-[11px]">
                  Cada lote de operaciones es analizado por el motor de IA para detectar patrones ocultos de fallo (horarios con spreads tóxicos, pares desalineados) y generar recomendaciones cuantitativas exactas.
                </p>
              </div>
            </div>

            {/* Run Audit Button */}
            <div className="pt-2">
              <button
                onClick={handleRunAiAudit}
                disabled={isLoadingAudit}
                className="w-full py-3 px-4 rounded-xl bg-[#2E4A35] hover:bg-[#233a2a] text-[#F8F6F0] font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-60"
              >
                {isLoadingAudit ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin text-[#A9D1B2]" />
                    <span>Auditando operaciones y calculando adaptación...</span>
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 text-[#A9D1B2]" />
                    <span>Ejecutar Auditoría de Aprendizaje Cuantitativo con IA</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. AI Learning Audit Results Panel */}
      {auditResult && (
        <div className="ivory-card rounded-2xl p-5 sm:p-6 border-2 border-[#2E4A35] bg-white space-y-4 shadow-md">
          <div className="flex items-center justify-between border-b border-[#EAE5DA] pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#2E4A35]" />
              <h3 className="font-serif text-base font-bold text-[#191C21]">
                Informe de Aprendizaje y Calibración
              </h3>
            </div>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
              auditResult.overallHealthStatus === 'HEALTHY'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : auditResult.overallHealthStatus === 'NEEDS_CALIBRATION'
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-rose-100 text-rose-800 border border-rose-300'
            }`}>
              {auditResult.overallHealthStatus === 'HEALTHY' ? 'Estado Óptimo' : 'Requiere Calibración'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#FAF8F3] border border-[#E7E2D8]">
              <span className="text-[10px] uppercase font-bold text-[#8C9098] block">Régimen de Mercado</span>
              <span className="font-bold text-[#191C21] text-xs mt-0.5 block">
                {auditResult.marketRegime}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#FAF8F3] border border-[#E7E2D8]">
              <span className="text-[10px] uppercase font-bold text-[#8C9098] block">Métricas Auditadas</span>
              <span className="font-mono text-xs font-bold text-[#2E4A35] mt-0.5 block">
                {auditResult.winRate}% Acierto · Profit Factor {auditResult.profitFactor} · {auditResult.totalTradesAnalyzed} Trades
              </span>
            </div>
          </div>

          {/* MAE & MFE Breakdown */}
          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-[#EBF2EC] border border-[#C5DDCB] space-y-1">
              <span className="font-bold text-[#2E4A35] block">
                🎯 Análisis de Entradas (MAE: {auditResult.maeAnalysis.averageMaePips} pips):
              </span>
              <p className="text-[#3F434A] leading-relaxed">
                {auditResult.maeAnalysis.verdict}
              </p>
              <p className="text-[11px] text-[#2E4A35] font-semibold mt-1">
                💡 Calibración: {auditResult.maeAnalysis.stopLossCalibrationRecommendation}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF8F3] border border-[#E7E2D8] space-y-1">
              <span className="font-bold text-[#8C6D23] block">
                📈 Análisis de Salidas y Breakeven (MFE: {auditResult.mfeAnalysis.averageMfePips} pips):
              </span>
              <p className="text-[#575B62] leading-relaxed">
                {auditResult.mfeAnalysis.verdict}
              </p>
              <p className="text-[11px] text-[#8C6D23] font-semibold mt-1">
                💡 Calibración: {auditResult.mfeAnalysis.takeProfitAndBreakevenRecommendation}
              </p>
            </div>
          </div>

          {/* Adaptation Roadmap */}
          <div className="space-y-2 pt-2 border-t border-[#EAE5DA]">
            <span className="text-xs font-bold text-[#191C21] block">
              Hoja de Ruta de Adaptación Continua:
            </span>
            <div className="space-y-2">
              {auditResult.adaptationRoadmap.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-white border border-[#DDD8CD] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#191C21]">{item.title}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#FAF8F3] border border-[#DDD8CD] text-[#575B62]">
                      Impacto {item.impact}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#575B62] leading-relaxed">
                    {item.description}
                  </p>
                  <div className="text-[11px] text-[#2E4A35] font-semibold flex items-center gap-1 pt-0.5">
                    <ArrowRight className="w-3 h-3 text-[#2E4A35]" />
                    <span>Ajuste: {item.suggestedChange}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Institutional Verdict */}
          <div className="p-3.5 rounded-xl bg-[#2E4A35] text-[#F8F6F0] space-y-1 text-xs">
            <span className="font-bold flex items-center gap-1.5 text-[#A9D1B2]">
              <ShieldCheck className="w-4 h-4" />
              Veredicto Institucional Cuantitativo
            </span>
            <p className="text-[#EBF2EC] leading-relaxed text-[11px]">
              {auditResult.institutionalVerdict}
            </p>
          </div>
        </div>
      )}

      {/* 4. Trades List */}
      <div className="space-y-3">
        <h3 className="font-serif text-sm font-bold text-[#191C21] px-1">
          Historial Forense de Operaciones ({closedTrades.length})
        </h3>

        {closedTrades.length === 0 ? (
          <div className="ivory-card rounded-2xl p-8 text-center text-[#8C9098]">
            <p className="text-sm">Todavía no hay operaciones cerradas registradas.</p>
            <p className="text-xs text-[#575B62] mt-1">
              En cuanto tu bot de Python o MetaTrader 5 complete una operación, verás aquí su análisis forense post-mortem.
            </p>
          </div>
        ) : (
          closedTrades.map(trade => {
            const isWin = trade.netPnL > 0;
            const isExpanded = expandedId === trade.id;
            const pm = trade.postMortem;
            const noteValue = noteInputs[trade.id] !== undefined ? noteInputs[trade.id] : (trade.notes || '');

            return (
              <div 
                key={trade.id}
                className="ivory-card rounded-2xl p-4 sm:p-5 space-y-3 transition-all"
              >
                {/* Header: Clickable summary */}
                <div 
                  onClick={() => toggleExpand(trade.id)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                      isWin ? 'bg-[#EBF2EC] text-[#2E4A35]' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {isWin ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#191C21]">
                          {trade.direction === 'BUY' ? 'Compra' : 'Venta'} de {trade.symbol}
                        </span>
                        <span className="text-[10px] text-[#8C9098] font-mono">
                          {trade.openTime.substring(0, 10)}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#575B62] truncate max-w-[200px] sm:max-w-xs">
                        {pm?.verdict || 'Operación finalizada.'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right font-mono">
                      <div className={`font-bold text-sm sm:text-base ${isWin ? 'text-[#2E4A35]' : 'text-rose-700'}`}>
                        {isWin ? '+' : ''}${trade.netPnL.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-[#8C9098]">
                        {trade.rMultiple >= 0 ? '+' : ''}{trade.rMultiple.toFixed(1)}R
                      </div>
                    </div>

                    {isExpanded ? <ChevronUp className="w-4 h-4 text-[#8C9098]" /> : <ChevronDown className="w-4 h-4 text-[#8C9098]" />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="pt-3 border-t border-[#EAE5DA] space-y-3 text-xs">
                    {/* Plain Language Explanation */}
                    <div className="p-3 rounded-xl bg-[#FAF8F3] border border-[#E6E1D6] space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-[#2E4A35]">
                        <Sparkles className="w-4 h-4 text-[#2E4A35]" />
                        <span>Diagnóstico Forense de la Operación:</span>
                      </div>
                      <p className="text-[#575B62] leading-relaxed">
                        {pm?.rootCause || 'El precio completó el ciclo previsto en la estrategia.'}
                      </p>
                      {pm?.aiTuningTip && (
                        <div className="pt-1 text-[#2E4A35] font-medium">
                          💡 <strong>Consejo de adaptación:</strong> {pm.aiTuningTip}
                        </div>
                      )}
                    </div>

                    {/* Excursion metrics & Cost Breakdown */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                      <div className="p-2 rounded-lg bg-white border border-[#DDD8CD]">
                        <span className="text-[#8C9098] block text-[10px]">MAE (Retroceso)</span>
                        <span className="font-bold text-[#191C21]">{trade.maePips.toFixed(1)} pips</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white border border-[#DDD8CD]">
                        <span className="text-[#8C9098] block text-[10px]">MFE (Ganancia Máx)</span>
                        <span className="font-bold text-[#2E4A35]">{trade.mfePips.toFixed(1)} pips</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white border border-[#DDD8CD]">
                        <span className="text-[#8C9098] block text-[10px]">Fricción Broker</span>
                        <span className="font-bold text-[#575B62]">${(trade.commissionCost + trade.spreadCost).toFixed(2)}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white border border-[#DDD8CD]">
                        <span className="text-[#8C9098] block text-[10px]">Ejecución</span>
                        <span className="font-bold text-[#191C21]">{trade.isAutonomous ? 'Bot Autónomo' : 'Manual'}</span>
                      </div>
                    </div>

                    {/* User Notes Input */}
                    <div className="space-y-1.5 pt-1">
                      <label className="text-[11px] font-semibold text-[#191C21] block">
                        Tus notas y reflexiones sobre esta operación:
                      </label>
                      <textarea
                        rows={2}
                        value={noteValue}
                        onChange={e => handleNoteChange(trade.id, e.target.value)}
                        placeholder="Ej. Esta operación respetó el nivel sin dudar; buena respuesta al Breakeven..."
                        className="w-full bg-[#F3EFE6] border border-[#DDD8CD] rounded-xl p-2.5 text-xs text-[#191C21] focus:outline-none focus:border-[#2E4A35]"
                      />

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-[#2E4A35] font-medium">
                          {savedSuccessId === trade.id && '✅ ¡Nota guardada en tu diario!'}
                        </span>
                        <button
                          onClick={() => handleSaveNote(trade.id)}
                          className="px-3 py-1 rounded-lg bg-[#2E4A35] text-[#F8F6F0] font-semibold text-xs hover:bg-[#243B2B] transition flex items-center gap-1 cursor-pointer"
                        >
                          <Save className="w-3 h-3" />
                          <span>Guardar Mi Nota</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
