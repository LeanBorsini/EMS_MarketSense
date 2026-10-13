import React, { useState } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  MessageSquare, 
  Save, 
  Award,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { TradeOrder } from '../types/execution';
import { formatPrice } from '../lib/symbolResolver';

interface SimpleJournalProps {
  trades: TradeOrder[];
  onSaveNotes: (tradeId: string, notes: string) => void;
}

export const SimpleJournal: React.FC<SimpleJournalProps> = ({ trades, onSaveNotes }) => {
  const closedTrades = trades.filter(t => t.status === 'CLOSED');
  const [expandedId, setExpandedId] = useState<string | null>(closedTrades[0]?.id || null);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [savedSuccessId, setSavedSuccessId] = useState<string | null>(null);

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

  const totalPnL = closedTrades.reduce((acc, t) => acc + t.netPnL, 0);
  const winCount = closedTrades.filter(t => t.netPnL > 0).length;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Intro Card */}
      <div className="ivory-card rounded-2xl p-5 sm:p-6 text-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-[#EBF2EC] text-[#2E4A35] mx-auto flex items-center justify-center mb-2">
          <BookOpen className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-[#191C21]">
          Diario y Aprendizaje de Operaciones
        </h2>
        <p className="text-xs sm:text-sm text-[#575B62] leading-relaxed max-w-md mx-auto">
          Aquí queda registrado cada paso del bot: cuánto se ganó o perdió, el motivo exacto del resultado y tus notas para ir mejorando juntos.
        </p>

        {/* Simple totals banner */}
        <div className="flex justify-center gap-4 pt-3 border-t border-[#EAE5DA] mt-3 font-mono text-xs">
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
        </div>
      </div>

      {/* Trades List */}
      <div className="space-y-3">
        {closedTrades.length === 0 ? (
          <div className="ivory-card rounded-2xl p-8 text-center text-[#8C9098]">
            <p className="text-sm">Todavía no hay operaciones cerradas registradas.</p>
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
                        <span>¿Por qué se dio este resultado?</span>
                      </div>
                      <p className="text-[#575B62] leading-relaxed">
                        {pm?.rootCause || 'El precio completó el ciclo previsto en la estrategia.'}
                      </p>
                      {pm?.aiTuningTip && (
                        <div className="pt-1 text-[#2E4A35] font-medium">
                          💡 <strong>Consejo del bot:</strong> {pm.aiTuningTip}
                        </div>
                      )}
                    </div>

                    {/* Cost Breakdown */}
                    <div className="flex justify-between text-[11px] text-[#8C9098] font-mono px-1">
                      <span>Comisiones del broker: ${trade.commissionCost.toFixed(2)}</span>
                      <span>Coste de Spread: ${trade.spreadCost.toFixed(2)}</span>
                      <span>{trade.isAutonomous ? 'Operado por Bot' : 'Operado a mano'}</span>
                    </div>

                    {/* User Notes Input */}
                    <div className="space-y-1.5 pt-1">
                      <label className="text-[11px] font-semibold text-[#191C21] block">
                        Tus comentarios o sensaciones sobre este trade:
                      </label>
                      <textarea
                        rows={2}
                        value={noteValue}
                        onChange={e => handleNoteChange(trade.id, e.target.value)}
                        placeholder="Ej. Esta operación me gustó mucho porque respetó el nivel sin dudar..."
                        className="w-full bg-[#F3EFE6] border border-[#DDD8CD] rounded-xl p-2.5 text-xs text-[#191C21] focus:outline-none focus:border-[#2E4A35]"
                      />

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-[#2E4A35] font-medium">
                          {savedSuccessId === trade.id && '✅ ¡Nota guardada en tu diario!'}
                        </span>
                        <button
                          onClick={() => handleSaveNote(trade.id)}
                          className="px-3 py-1 rounded-lg bg-[#2E4A35] text-[#F8F6F0] font-semibold text-xs hover:bg-[#243B2B] transition flex items-center gap-1"
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
