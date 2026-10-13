import React from 'react';
import { 
  X, 
  Download, 
  Smartphone, 
  Laptop, 
  Share2, 
  PlusSquare, 
  CheckCircle2, 
  Zap 
} from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  onInstall: () => Promise<boolean>;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  isInstallable,
  isInstalled,
  isIOS,
  onInstall,
}) => {
  if (!isOpen) return null;

  const handleInstallClick = async () => {
    const success = await onInstall();
    if (success) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="ivory-card rounded-2xl w-full max-w-md border border-[#DDD8CD] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#EAE5DA]">
          <div className="flex items-center space-x-2">
            <Smartphone className="w-5 h-5 text-[#2E4A35]" />
            <div>
              <h3 className="font-serif text-lg font-bold text-[#191C21]">
                Instalar en Móvil o PC
              </h3>
              <p className="text-xs text-[#575B62]">
                Ten la aplicación como app nativa en tu pantalla de inicio
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
          {/* Status banner */}
          {isInstalled ? (
            <div className="p-3 rounded-xl bg-[#EBF2EC] border border-[#C5DDCB] text-[#2E4A35] flex items-center space-x-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-[#2E4A35] flex-shrink-0" />
              <span>Esta aplicación ya está instalada en tu dispositivo.</span>
            </div>
          ) : isInstallable ? (
            <div className="p-4 rounded-xl bg-[#FAF8F3] border border-[#E6E1D6] text-center space-y-3">
              <p className="text-[#191C21]">
                Tu navegador permite la instalación directa con un solo clic:
              </p>
              <button
                onClick={handleInstallClick}
                className="w-full py-3 px-4 rounded-xl olive-btn font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Instalar en Pantalla de Inicio</span>
              </button>
            </div>
          ) : null}

          {/* iOS Safari Instructions */}
          {isIOS && (
            <div className="p-4 rounded-xl bg-[#FAF8F3] border border-[#E6E1D6] space-y-2.5">
              <span className="font-bold text-[#191C21] flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-[#2E4A35]" />
                <span>Instalación en iPhone / iPad (Safari):</span>
              </span>

              <ol className="text-[#575B62] space-y-2 list-decimal list-inside leading-relaxed font-sans">
                <li>
                  Toca el botón <strong>Compartir</strong> <Share2 className="inline w-3.5 h-3.5 text-blue-600 mx-1" /> en la barra inferior de Safari.
                </li>
                <li>
                  Desliza hacia abajo y elige <strong>«Añadir a pantalla de inicio»</strong> <PlusSquare className="inline w-3.5 h-3.5 text-[#191C21] mx-1" />.
                </li>
                <li>
                  Toca <strong>«Añadir»</strong> arriba a la derecha. ¡Listo! Se abrirá a pantalla completa.
                </li>
              </ol>
            </div>
          )}

          {/* PC / Android Instructions */}
          {!isIOS && !isInstalled && !isInstallable && (
            <div className="p-4 rounded-xl bg-[#FAF8F3] border border-[#E6E1D6] space-y-2">
              <span className="font-bold text-[#191C21] flex items-center gap-1.5">
                <Laptop className="w-4 h-4 text-[#2E4A35]" />
                <span>En Ordenador (Chrome o Edge):</span>
              </span>

              <p className="text-[#575B62] leading-relaxed">
                Haz clic en el icono de instalación <Download className="inline w-3.5 h-3.5 text-[#2E4A35] mx-1" /> que aparece en la parte derecha de la barra de direcciones URL del navegador.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
