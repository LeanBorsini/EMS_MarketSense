import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  Sparkles, 
  ShieldCheck, 
  Save, 
  TrendingUp, 
  TrendingDown 
} from 'lucide-react';
import { TradeOrder } from '../types/execution';
import { formatPrice } from '../lib/symbolResolver';

interface TradeJournalDetailModalProps {
  trade: TradeOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveNotes: (tradeId: string, notes: string) => void;
}

export const TradeJournalDetailModal: React.FC<TradeJournalDetailModalProps> = ({
  trade,
  isOpen,
  onClose,
  onSaveNotes,
}) => {
  if (!isOpen || !trade) return null;

  const [notes, setNotes] = useState(trade.notes || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const pm = trade.postMortem || {
    category: trade.netPnL >= 0 ? 'WIN_CLEAN' : 'SL_HIT_VOLATILITY',
    verdict: trade.netPnL >= 0 ? 'Operación favorable completada.' : 'Operación cerrada por límite técnico.',
    rootCause: 'Dinámica de precios y liquidez intradía.',
    learningObservation: `R-Múltiplo final de ${trade.rMultiple.toFixed(2)}R. MAE registrado: ${trade.maePips} pips.`,
    aiTuningTip: 'Revisar la volatilidad previa a la sesión.',
    disciplineScore: 9,
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveNotes(trade.id, notes);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const isWin = trade.netPnL > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="ivory-card rounded-2xl w-full max-w-lg border border-[#DDD8CD] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#EAE5DA]">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-[#2E4A35]" />
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-serif text-lg font-bold text-[#191C21]">
                  Detalle de la Operación
                </h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  trade.direction === 'BUY'
                    ? 'bg-[#EBF2EC] text-[#2E4A35] border border-[#C5DDCB]'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {trade.direction} {trade.symbol}
                </span>
              </div>
              <p className="text-xs text-[#8C9098] font-mono mt-0.5">
                {trade.openTime}
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

        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-3 gap-2.5 font-mono text-center">
            <div className="p-3 rounded-xl bg-[#FAF8F3] border border-[#E6E1D6]">
              <span className="text-[10px] text-[#8C9098] uppercase block">Resultado</span>
              <span className={`text-base font-bold ${isWin ? 'text-[#2E4A35]' : 'text-rose-700'}`}>
                {isWin ? '+' : ''}${trade.netPnL.toFixed(2)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF8F3] border border-[#E6E1D6]">
              <span className="text-[10px] text-[#8C9098] uppercase block">R-Múltiplo</span>
              <span className="text-base font-bold text-[#191C21]">
                {trade.rMultiple >= 0 ? '+' : ''}{trade.rMultiple.toFixed(1)}R
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF8F3] border border-[#E6E1D6]">
              <span className="text-[10px] text-[#8C9098] uppercase block">Coste Total</span>
              <span className="text-base font-bold text-[#575B62]">
                ${(trade.commissionCost + trade.spreadCost).toFixed(2)}
              </span>
            </div>
          </div>

          {/* AI Quantitative Diagnosis in Human Language */}
          <div className="p-4 rounded-xl bg-[#FAF8F3] border border-[#E6E1D6] space-y-2.5">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#2E4A35]">
              <Sparkles className="w-4 h-4 text-[#2E4A35]" />
              <span>Diagnóstico de la Estrategia:</span>
            </div>

            <div>
              <p className="text-xs text-[#191C21] leading-relaxed font-semibold">
                {pm.verdict}
              </p>
              <p className="text-xs text-[#575B62] leading-relaxed mt-1">
                {pm.rootCause}
              </p>
            </div>

            {pm.aiTuningTip && (
              <div className="pt-2 border-t border-[#EAE5DA] text-[#2E4A35] font-medium leading-relaxed">
                💡 <strong>Sugerencia de adaptación:</strong> {pm.aiTuningTip}
              </div>
            )}
          </div>

          {/* User Reflection & Notes */}
          <form onSubmit={handleSave} className="space-y-2">
            <label className="font-semibold text-[#191C21] block">
              Tus Notas y Reflexiones Personales:
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="¿Cómo te sentiste con esta operación? Escribe tus observaciones..."
              className="w-full bg-[#F3EFE6] border border-[#DDD8CD] rounded-xl p-3 text-xs text-[#191C21] focus:outline-none focus:border-[#2E4A35] leading-relaxed"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-[#2E4A35] font-medium">
                {savedSuccess && '✅ ¡Notas guardadas!'}
              </span>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl olive-btn font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Notas</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
