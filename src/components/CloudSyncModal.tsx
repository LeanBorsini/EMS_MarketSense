import React, { useState, useEffect } from 'react';
import { 
  X, 
  Smartphone, 
  Laptop, 
  Download, 
  Upload, 
  Check, 
  Copy, 
  ArrowRight,
  Loader2,
  RefreshCw,
  Zap,
  ShieldCheck,
  Share2,
  KeyRound,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { 
  exportFullAppState, 
  importFullAppState, 
  getFullAppStateObject, 
  applyFullAppStateObject 
} from '../lib/storage';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => void;
  initialCode?: string;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  onRefreshData,
  initialCode = '',
}) => {
  // Tabs: 'ENTER_CODE' (where user enters 5 digits from other device) vs 'SHOW_CODE' (where this device shows its 5 digits)
  const [activeTab, setActiveTab] = useState<'ENTER_CODE' | 'SHOW_CODE'>('ENTER_CODE');

  // Input code state
  const [inputCode, setInputCode] = useState(initialCode);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectSuccess, setConnectSuccess] = useState<string | null>(null);

  // Generated code state (5-digit numeric)
  const [generatedCode, setGeneratedCode] = useState<string>(() => {
    return Math.floor(10000 + Math.random() * 90000).toString();
  });
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<string | null>(null);
  const [connectedPeer, setConnectedPeer] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Backup file state
  const [fileStatus, setFileStatus] = useState<string | null>(null);

  // When initialCode is passed or found in URL, set it and switch to ENTER_CODE
  useEffect(() => {
    if (initialCode) {
      setInputCode(initialCode.trim().toUpperCase());
      setActiveTab('ENTER_CODE');
    }
  }, [initialCode]);

  // When switching to SHOW_CODE, publish current state to the 5-digit room
  useEffect(() => {
    if (!isOpen) return;

    if (activeTab === 'SHOW_CODE') {
      publishDeviceState(generatedCode);
    }
  }, [isOpen, activeTab, generatedCode]);

  // Polling to see if peer joined the room when in SHOW_CODE mode
  useEffect(() => {
    if (!isOpen || activeTab !== 'SHOW_CODE' || !generatedCode) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/sync/room/${generatedCode}/status`);
        if (res.ok) {
          const data = await res.json();
          if (data.devices >= 2) {
            setConnectedPeer(data.guestDevice || 'Móvil / PC secundario conectado');
          }
        }
      } catch (e) {
        // ignore polling errors
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [isOpen, activeTab, generatedCode]);

  if (!isOpen) return null;

  // Publish this device's full state under the 5-digit code
  const publishDeviceState = async (codeToUse: string) => {
    setIsPublishing(true);
    setPublishStatus(null);
    try {
      const stateObj = getFullAppStateObject();
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const deviceName = isMobile ? 'Dispositivo Móvil' : 'Ordenador PC';

      const res = await fetch('/api/sync/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: codeToUse,
          state: stateObj,
          deviceName,
        }),
      });

      if (res.ok) {
        setPublishStatus('Sesión activa en el servidor de sincronización');
      } else {
        setPublishStatus('Error al publicar sesión en la nube');
      }
    } catch (err) {
      setPublishStatus('Sin conexión con el relay de sincronización');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleGenerateNewCode = () => {
    const newCode = Math.floor(10000 + Math.random() * 90000).toString();
    setGeneratedCode(newCode);
    setConnectedPeer(null);
    publishDeviceState(newCode);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyDirectLink = () => {
    const url = `${window.location.origin}/?sync=${generatedCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // User enters the 5-digit code displayed on their other device
  const handleConnectWithCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = inputCode.trim().toUpperCase();
    if (!clean) {
      setConnectError('Por favor introduce el código de 5 dígitos.');
      return;
    }

    setIsConnecting(true);
    setConnectError(null);
    setConnectSuccess(null);

    try {
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const deviceName = isMobile ? 'Móvil Vinculado' : 'PC Vinculada';

      const res = await fetch(`/api/sync/room/${encodeURIComponent(clean)}?device=${encodeURIComponent(deviceName)}`);
      const data = await res.json();

      if (!res.ok || !data.found) {
        setConnectError(data.error || `No se encontró ninguna sesión con el código "${clean}". Comprueba que tu otro dispositivo tenga la app abierta.`);
        return;
      }

      // Apply state to localStorage
      const success = applyFullAppStateObject(data.state);
      if (success) {
        setConnectSuccess('¡Sesión emparejada y descargada con éxito! Sincronizando tu bot y cuentas...');
        setTimeout(() => {
          onRefreshData();
          onClose();
        }, 1200);
      } else {
        setConnectError('Los datos recibidos no pudieron procesarse correctamente.');
      }
    } catch (err: any) {
      setConnectError('Error de conexión con el servidor. Revisa tu conexión a internet.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDownloadBackup = () => {
    const json = exportFullAppState();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EMS-MarketSense-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importFullAppState(content);
        if (ok) {
          setFileStatus('✅ ¡Datos importados con éxito! Actualizando...');
          setTimeout(() => {
            onRefreshData();
            onClose();
          }, 1200);
        } else {
          setFileStatus('❌ Error al importar: Archivo no compatible.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="ivory-card rounded-2xl w-full max-w-lg border border-[#DDD8CD] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#EAE5DA] bg-[#FBF9F4]">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#EBF2EC] flex items-center justify-center text-[#2E4A35] border border-[#C5DDCB]">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#191C21] leading-tight">
                Sincronización PC y Móvil
              </h3>
              <p className="text-xs text-[#575B62]">
                Conecta ambos dispositivos usando tu código de 5 dígitos
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8C9098] hover:text-[#191C21] hover:bg-[#EFECE4] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="p-3 bg-[#F4EFE6] border-b border-[#E5DFD4] grid grid-cols-2 gap-2">
          <button
            onClick={() => setActiveTab('ENTER_CODE')}
            className={`py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'ENTER_CODE'
                ? 'bg-[#2E4A35] text-white shadow-sm'
                : 'bg-[#FAF8F3] text-[#575B62] hover:text-[#191C21] border border-[#DDD8CD]'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Ingresar Código (Conectar)</span>
          </button>

          <button
            onClick={() => setActiveTab('SHOW_CODE')}
            className={`py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'SHOW_CODE'
                ? 'bg-[#2E4A35] text-white shadow-sm'
                : 'bg-[#FAF8F3] text-[#575B62] hover:text-[#191C21] border border-[#DDD8CD]'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Mostrar Código (Compartir)</span>
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 text-xs">
          {/* TAB 1: ENTER CODE (THE PRIMARY FEATURE REQUESTED) */}
          {activeTab === 'ENTER_CODE' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-xl bg-[#FAF8F3] border border-[#E6E1D6] space-y-3">
                <div className="flex items-center gap-2 text-[#191C21] font-bold text-sm">
                  <Smartphone className="w-4 h-4 text-[#2E4A35]" />
                  <span>Ingresa el código que te muestra tu otro dispositivo</span>
                </div>
                <p className="text-[#575B62] leading-relaxed">
                  Abre esta app en tu PC o en tu otro móvil, pulsa en <strong>"Sincronizar"</strong> &rarr; <strong>"Mostrar Código"</strong> e introduce aquí los 5 dígitos para transferir tus cuentas, balance y bot:
                </p>

                <form onSubmit={handleConnectWithCode} className="space-y-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-[#575B62] uppercase tracking-wider mb-1.5">
                      Código de 5 Dígitos
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={8}
                        value={inputCode}
                        onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                        placeholder="Ej: 84920"
                        autoFocus
                        className="w-full text-center font-mono text-2xl sm:text-3xl font-bold tracking-[0.3em] py-3 px-4 rounded-xl bg-white border-2 border-[#2E4A35]/30 focus:border-[#2E4A35] text-[#2E4A35] outline-none shadow-inner placeholder:text-[#BBB6A8] placeholder:tracking-normal placeholder:text-lg transition"
                      />
                    </div>
                  </div>

                  {connectError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{connectError}</span>
                    </div>
                  )}

                  {connectSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{connectSuccess}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isConnecting || !inputCode.trim()}
                    className="w-full py-3 px-4 rounded-xl olive-btn font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Buscando y sincronizando sesión...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>Sincronizar y Conectar con este Código</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              <div className="p-3 rounded-xl bg-[#EFECE4] border border-[#DDD8CD] text-[11px] text-[#575B62] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#2E4A35] shrink-0" />
                <span>
                  La vinculación es instantánea y privada: el estado viaja directo a tu navegador sin almacenar contraseñas ni claves privadas.
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: SHOW CODE (TO SHARE FROM THIS DEVICE) */}
          {activeTab === 'SHOW_CODE' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-xl bg-[#FAF8F3] border border-[#E6E1D6] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#191C21] text-sm">
                    Código de este Dispositivo
                  </span>
                  <button
                    onClick={handleGenerateNewCode}
                    className="text-[11px] text-[#2E4A35] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Nuevo código</span>
                  </button>
                </div>

                <p className="text-[#575B62] leading-relaxed">
                  Introduce este número de 5 dígitos en tu otro dispositivo (móvil o PC) para que tome exactamente tu misma configuración:
                </p>

                {/* Big 5-digit PIN Box */}
                <div className="p-4 rounded-2xl bg-[#F3EFE6] border border-[#DDD8CD] flex flex-col items-center justify-center gap-2 shadow-inner">
                  <div className="text-[11px] uppercase tracking-wider text-[#8C9098] font-bold">
                    Código de 5 Dígitos
                  </div>
                  <div className="font-mono text-3xl sm:text-4xl font-extrabold tracking-[0.25em] text-[#2E4A35]">
                    {generatedCode}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={handleCopyCode}
                      className="px-3.5 py-1.5 rounded-lg olive-btn font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? '¡Copiado!' : 'Copiar Código'}</span>
                    </button>

                    <button
                      onClick={handleCopyDirectLink}
                      className="px-3 py-1.5 rounded-lg bg-[#FAF8F3] hover:bg-[#EFECE4] text-[#191C21] border border-[#DDD8CD] font-medium text-xs flex items-center gap-1.5 cursor-pointer"
                      title="Copiar enlace con código pre-cargado"
                    >
                      <Share2 className="w-3.5 h-3.5 text-[#575B62]" />
                      <span>{copiedLink ? '¡Enlace copiado!' : 'Copiar Enlace'}</span>
                    </button>
                  </div>
                </div>

                {/* Connection status indicator */}
                <div className="pt-1">
                  {connectedPeer ? (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping shrink-0" />
                      <span>🟢 ¡{connectedPeer}! Ambos dispositivos están sincronizados.</span>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-[#EFECE4] border border-[#DDD8CD] text-[#575B62] flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2E4A35] shrink-0" />
                      <span>Esperando que el otro dispositivo introduzca el código {generatedCode}...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Fallback Backup & Restore */}
          <div className="border-t border-[#EAE5DA] pt-3">
            <details className="group">
              <summary className="font-bold text-[#575B62] hover:text-[#191C21] cursor-pointer flex items-center justify-between text-xs py-1">
                <span>Respaldo manual en archivo JSON (Opcional)</span>
                <span className="text-[#8C9098] group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="p-3 mt-2 rounded-xl bg-[#FAF8F3] border border-[#E6E1D6] space-y-2">
                <p className="text-[#575B62] text-[11px]">
                  Si prefieres guardar una copia física de seguridad o transferirla sin internet:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleDownloadBackup}
                    className="py-2 px-3 rounded-xl bg-[#F8F6F0] hover:bg-[#EFECE4] text-[#191C21] font-semibold border border-[#DDD8CD] transition flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                  >
                    <Download className="w-3.5 h-3.5 text-[#575B62]" />
                    <span>Exportar JSON</span>
                  </button>

                  <label className="py-2 px-3 rounded-xl bg-[#EBF2EC] hover:bg-[#D7E8DA] text-[#2E4A35] font-semibold border border-[#C5DDCB] transition flex items-center justify-center gap-1.5 cursor-pointer text-xs">
                    <Upload className="w-3.5 h-3.5 text-[#2E4A35]" />
                    <span>Importar JSON</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                {fileStatus && (
                  <div className="text-xs font-semibold text-center text-[#2E4A35] pt-1">
                    {fileStatus}
                  </div>
                )}
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
};
