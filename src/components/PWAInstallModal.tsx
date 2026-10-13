import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Smartphone, 
  Laptop, 
  Share2, 
  PlusSquare, 
  CheckCircle2, 
  Copy, 
  Check, 
  Globe, 
  ExternalLink 
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
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  // Use the shared pre-deploy URL or current origin
  const appPublicUrl = window.location.origin.includes('ais-dev-')
    ? window.location.origin.replace('ais-dev-', 'ais-pre-')
    : window.location.origin;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appPublicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

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
                Instalar y Compartir EMS-MarketSense
              </h3>
              <p className="text-xs text-[#575B62]">
                Usa la app en cualquier móvil o PC sin depender de AI Studio
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-[#8C9098] hover:text-[#191C21] hover:bg-[#EFECE4] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* Public Link Card */}
          <div className="p-4 rounded-xl bg-[#FAF8F3] border border-[#E6E1D6] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#191C21] flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-[#2E4A35]" />
                <span>Enlace Directo para Tu Móvil:</span>
              </span>
              <button
                onClick={handleCopyLink}
                className="text-[11px] text-[#2E4A35] font-semibold flex items-center gap-1 hover:underline cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-[#2E4A35]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? '¡Enlace Copiado!' : 'Copiar Enlace'}</span>
              </button>
            </div>

            <p className="text-[#575B62] leading-relaxed">
              <strong>No necesitas tener este editor abierto.</strong> Envía este enlace a tu WhatsApp o correo, ábrelo en tu teléfono y se ejecutará de forma independiente:
            </p>

            <div className="p-2.5 rounded-xl bg-[#F3EFE6] border border-[#DDD8CD] font-mono text-[11px] text-[#191C21] truncate select-all">
              {appPublicUrl}
            </div>
          </div>

          {/* Status banner */}
          {isInstalled ? (
            <div className="p-3 rounded-xl bg-[#EBF2EC] border border-[#C5DDCB] text-[#2E4A35] flex items-center space-x-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-[#2E4A35] flex-shrink-0" />
              <span>Esta aplicación ya está instalada en tu dispositivo.</span>
            </div>
          ) : isInstallable ? (
            <div className="p-4 rounded-xl bg-[#FAF8F3] border border-[#E6E1D6] text-center space-y-2.5">
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
          <div className="p-4 rounded-xl bg-[#FAF8F3] border border-[#E6E1D6] space-y-2.5">
            <span className="font-bold text-[#191C21] flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-[#2E4A35]" />
              <span>Cómo instalar en iPhone / iPad (Safari):</span>
            </span>

            <ol className="text-[#575B62] space-y-2 list-decimal list-inside leading-relaxed font-sans">
              <li>
                Abre el enlace de arriba en el navegador <strong>Safari</strong> de tu iPhone.
              </li>
              <li>
                Toca el botón <strong>Compartir</strong> <Share2 className="inline w-3.5 h-3.5 text-blue-600 mx-1" /> (el cuadradito con flecha hacia arriba abajo en la pantalla).
              </li>
              <li>
                Baja un poco y toca <strong>«Añadir a pantalla de inicio»</strong> <PlusSquare className="inline w-3.5 h-3.5 text-[#191C21] mx-1" />.
              </li>
              <li>
                Toca <strong>«Añadir»</strong> arriba a la derecha. ¡Listo! Se creará el icono de <strong>EMS-MarketSense</strong> en tu pantalla de inicio como una app normal.
              </li>
            </ol>
          </div>

          {/* PC / Android Instructions */}
          <div className="p-4 rounded-xl bg-[#FAF8F3] border border-[#E6E1D6] space-y-2">
            <span className="font-bold text-[#191C21] flex items-center gap-1.5">
              <Laptop className="w-4 h-4 text-[#2E4A35]" />
              <span>En Android o PC (Chrome / Edge):</span>
            </span>

            <p className="text-[#575B62] leading-relaxed">
              En Android, toca los 3 puntitos arriba a la derecha de Chrome y selecciona <strong>«Instalar aplicación»</strong> o <strong>«Añadir a la pantalla principal»</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
