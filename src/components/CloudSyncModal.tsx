import React, { useState } from 'react';
import { 
  X, 
  Smartphone, 
  Laptop, 
  Download, 
  Upload, 
  Check, 
  Copy, 
  ShieldCheck, 
  FileJson
} from 'lucide-react';
import { exportFullAppState, importFullAppState } from '../lib/storage';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  onRefreshData,
}) => {
  const [syncCode, setSyncCode] = useState(() => {
    return 'MS-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  });
  const [copied, setCopied] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(syncCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadBackup = () => {
    const json = exportFullAppState();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marketsense-execution-backup-${new Date().toISOString().slice(0, 10)}.json`;
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
          setImportStatus('✅ ¡Datos sincronizados con éxito!');
          onRefreshData();
          setTimeout(() => setImportStatus(null), 3000);
        } else {
          setImportStatus('❌ Error al importar: Archivo JSON no válido.');
        }
      }
    };
    reader.readAsText(file);
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
                Sincronizar PC y Móvil
              </h3>
              <p className="text-xs text-[#575B62]">
                Ten la misma sesión y bot en todos tus dispositivos
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
          {/* Pairing Code */}
          <div className="p-4 rounded-xl bg-[#FAF8F3] border border-[#E6E1D6] space-y-2.5">
            <span className="font-bold text-[#191C21] block">
              1. Código de Emparejamiento Rápido
            </span>
            <p className="text-[#575B62] leading-relaxed">
              Abre la app en tu otro dispositivo y usa este código para vincular la misma sesión:
            </p>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#F3EFE6] border border-[#DDD8CD]">
              <div className="font-mono text-xl font-bold tracking-widest text-[#2E4A35]">
                {syncCode}
              </div>
              <button
                onClick={handleCopyCode}
                className="px-3 py-1.5 rounded-lg olive-btn font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          {/* Backup / Restore */}
          <div className="p-4 rounded-xl bg-[#FAF8F3] border border-[#E6E1D6] space-y-2.5">
            <span className="font-bold text-[#191C21] block">
              2. Respaldo o Transferencia en Archivo
            </span>
            <p className="text-[#575B62] leading-relaxed">
              Descarga o carga todas tus cuentas y diario de operaciones en un clic:
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleDownloadBackup}
                className="py-2.5 px-3 rounded-xl bg-[#F8F6F0] hover:bg-[#EFECE4] text-[#191C21] font-semibold border border-[#DDD8CD] transition flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-[#575B62]" />
                <span>Exportar</span>
              </button>

              <label className="py-2.5 px-3 rounded-xl bg-[#EBF2EC] hover:bg-[#D7E8DA] text-[#2E4A35] font-semibold border border-[#C5DDCB] transition flex items-center justify-center gap-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-[#2E4A35]" />
                <span>Importar</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {importStatus && (
              <div className="text-xs font-semibold text-center text-[#2E4A35] pt-1">
                {importStatus}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
