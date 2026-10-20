import React from 'react';
import { 
  X, 
  ShieldAlert, 
  Layers, 
  Smartphone, 
  Terminal, 
  Download, 
  RefreshCw, 
  PlusCircle,
  HelpCircle,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { TradingAccount } from '../types/execution';
import { APP_FEATURES } from '../config/features';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: TradingAccount[];
  activeAccountId: string;
  onSwitchAccount: (id: string) => void;
  onNavigateToConnect?: () => void;
  onOpenSync: () => void;
  onOpenPwa: () => void;
  onOpenRunnerGuide: () => void;
  onOpenManualOrder: () => void;
  onPanicKillSwitch: () => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  onClose,
  accounts,
  activeAccountId,
  onSwitchAccount,
  onNavigateToConnect,
  onOpenSync,
  onOpenPwa,
  onOpenRunnerGuide,
  onOpenManualOrder,
  onPanicKillSwitch,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="ivory-card rounded-2xl w-full max-w-md border border-[#DDD8CD] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#EAE5DA]">
          <h3 className="font-serif text-lg font-bold text-[#191C21]">
            Ajustes y Opciones Avanzadas
          </h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-[#8C9098] hover:text-[#191C21] hover:bg-[#EFECE4] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* Quick Account Switcher */}
          <div className="space-y-2">
            <span className="font-bold text-[#191C21] block">
              Cambiar Cuenta Activa:
            </span>
            <div className="space-y-1.5">
              {accounts.map(acc => (
                <div
                  key={acc.id}
                  onClick={() => {
                    onSwitchAccount(acc.id);
                    onClose();
                  }}
                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                    acc.id === activeAccountId
                      ? 'bg-[#EBF2EC] border-[#2E4A35] text-[#2E4A35]'
                      : 'bg-[#FDFCF9] border-[#E6E1D6] hover:bg-[#F3EFE6] text-[#575B62]'
                  }`}
                >
                  <div>
                    <div className="font-semibold">{acc.name}</div>
                    <div className="text-[10px] text-[#8C9098] font-mono">#{acc.accountNumber}</div>
                  </div>
                  <div className="font-mono font-bold">
                    ${acc.currentEquity.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                  </div>
                </div>
              ))}
            </div>

            {onNavigateToConnect && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToConnect();
                }}
                className="w-full py-2 px-3 text-center text-xs font-semibold text-[#2E4A35] bg-[#EBF2EC] hover:bg-[#D7E8DA] rounded-xl border border-[#C5DDCB] transition flex items-center justify-center gap-1.5 cursor-pointer mt-1"
              >
                <span>Gestionar, Vincular o Remover Cuentas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Tools Menu */}
          <div className="space-y-1.5 pt-2 border-t border-[#EAE5DA]">
            {APP_FEATURES.enableManualTradePlacer && (
              <button
                onClick={() => {
                  onClose();
                  onOpenManualOrder();
                }}
                className="w-full p-2.5 rounded-xl bg-[#FDFCF9] border border-[#E6E1D6] hover:bg-[#F3EFE6] flex items-center justify-between font-semibold text-[#191C21] transition"
              >
                <div className="flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-[#2E4A35]" />
                  <span>Abrir Orden Manual de Prueba</span>
                </div>
                <span className="text-[10px] text-[#8C9098]">Calculador de Lote</span>
              </button>
            )}

            {APP_FEATURES.enableCloudDeviceSync && (
              <button
                onClick={() => {
                  onClose();
                  onOpenSync();
                }}
                className="w-full p-2.5 rounded-xl bg-[#FDFCF9] border border-[#E6E1D6] hover:bg-[#F3EFE6] flex items-center justify-between font-semibold text-[#191C21] transition"
              >
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#2E4A35]" />
                  <span>Sincronizar con otro Móvil o PC</span>
                </div>
                <span className="text-[10px] text-[#2E4A35] font-semibold bg-[#EBF2EC] px-2 py-0.5 rounded-md">Código de 5 Dígitos</span>
              </button>
            )}

            <button
              onClick={() => {
                onClose();
                onOpenPwa();
              }}
              className="w-full p-2.5 rounded-xl bg-[#FDFCF9] border border-[#E6E1D6] hover:bg-[#F3EFE6] flex items-center justify-between font-semibold text-[#191C21] transition"
            >
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-[#2E4A35]" />
                <span>Instalar Aplicación (PWA)</span>
              </div>
              <span className="text-[10px] text-[#8C9098]">Pantalla de Inicio</span>
            </button>

            {APP_FEATURES.enableUnattendedVpsGuide && (
              <button
                onClick={() => {
                  onClose();
                  onOpenRunnerGuide();
                }}
                className="w-full p-2.5 rounded-xl bg-[#FDFCF9] border border-[#E6E1D6] hover:bg-[#F3EFE6] flex items-center justify-between font-semibold text-[#191C21] transition"
              >
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#2E4A35]" />
                  <span>Guía Desatendida 24/7 (Oracle / VPS)</span>
                </div>
                <span className="text-[10px] text-[#8C9098]">Opción Gratis</span>
              </button>
            )}
          </div>

          {/* Emergency Panic Button */}
          {APP_FEATURES.enableRiskCircuitBreaker && (
            <div className="pt-2 border-t border-[#EAE5DA]">
              <button
                onClick={() => {
                  onPanicKillSwitch();
                  onClose();
                }}
                className="w-full p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 flex items-center justify-center gap-2 font-bold text-xs transition cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Cierre de Pánico: Cerrar Todo y Pausar Bot</span>
              </button>
              <p className="text-[10px] text-[#8C9098] text-center mt-1">
                Úsalo solo si quieres cerrar todas las órdenes vivas de inmediato.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
