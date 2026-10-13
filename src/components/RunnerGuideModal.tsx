import React, { useState } from 'react';
import { 
  X, 
  Terminal, 
  Cloud, 
  Server, 
  Check, 
  Copy, 
  CheckCircle2
} from 'lucide-react';

interface RunnerGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RunnerGuideModal: React.FC<RunnerGuideModalProps> = ({ isOpen, onClose }) => {
  const [copiedScript, setCopiedScript] = useState(false);

  if (!isOpen) return null;

  const pythonBotSnippet = `# marketsense_bot.py (Daemon 24/7)
import time
import MetaTrader5 as mt5

LOGIN = 29841029
PASSWORD = "YOUR_PASSWORD"
SERVER = "FTMO-Server-2"

def run_loop():
    if not mt5.initialize(login=LOGIN, password=PASSWORD, server=SERVER):
        print("Error de conexión:", mt5.last_error())
        return
    print("Conectado con éxito a la cuenta de fondeo. Motor en escucha 24/7...")
    while True:
        time.sleep(1)

if __name__ == "__main__":
    run_loop()`;

  const copySnippet = () => {
    navigator.clipboard.writeText(pythonBotSnippet);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="ivory-card rounded-2xl w-full max-w-lg border border-[#DDD8CD] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#EAE5DA]">
          <div className="flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-[#2E4A35]" />
            <div>
              <h3 className="font-serif text-lg font-bold text-[#191C21]">
                Guía de Ejecución Desatendida 24/7
              </h3>
              <p className="text-xs text-[#575B62]">
                Opciones para que opere incluso si apagas el móvil o la PC
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
          {/* Option A */}
          <div className="p-4 rounded-xl bg-[#FAF8F3] border border-[#E6E1D6] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#191C21] text-xs">
                Opción A: Oracle Cloud (100% Gratis de por vida)
              </span>
              <span className="font-mono text-[10px] bg-[#EBF2EC] text-[#2E4A35] px-1.5 py-0.5 rounded font-bold">
                0,00 €/mes
              </span>
            </div>
            <p className="text-[#575B62] leading-relaxed">
              Oracle Cloud ofrece servidores virtuales permanentes en su capa gratuita (Always Free). Puedes instalar el script y dejarlo corriendo en la nube día y noche sin coste alguno.
            </p>
          </div>

          {/* Option B */}
          <div className="p-4 rounded-xl bg-[#FAF8F3] border border-[#E6E1D6] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#191C21] text-xs">
                Opción B: En casa (PC vieja o Mini-PC)
              </span>
              <span className="font-mono text-[10px] bg-[#F3EFE6] text-[#575B62] px-1.5 py-0.5 rounded font-bold">
                Ahorro de luz
              </span>
            </div>
            <p className="text-[#575B62] leading-relaxed">
              Puedes dejar el script corriendo en tu ordenador durante las 4,5 horas de mayor volumen de Wall Street (13:00 a 17:30 UTC), consumiendo apenas ~3 € de electricidad al mes.
            </p>
          </div>

          {/* Script snippet */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#191C21]">Script Python:</span>
              <button
                onClick={copySnippet}
                className="text-[11px] text-[#2E4A35] font-semibold flex items-center gap-1 hover:underline"
              >
                {copiedScript ? <Check className="w-3 h-3 text-[#2E4A35]" /> : <Copy className="w-3 h-3" />}
                <span>{copiedScript ? 'Copiado!' : 'Copiar Script'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-[#F3EFE6] border border-[#DDD8CD] font-mono text-[11px] text-[#191C21] overflow-x-auto max-h-36 leading-relaxed">
              {pythonBotSnippet}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
