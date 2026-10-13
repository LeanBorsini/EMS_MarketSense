import React, { useState } from 'react';
import { 
  Radio, 
  Download, 
  Copy, 
  Check, 
  Zap, 
  Sparkles, 
  CheckCircle2, 
  ExternalLink, 
  HelpCircle,
  FileCode,
  ShieldCheck,
  PlayCircle,
  ArrowRight
} from 'lucide-react';
import { MQL5_EXPERT_ADVISOR_CODE } from '../data/mql5Code';
import { TradingAccount } from '../types/execution';

interface UnattendedSetupTabProps {
  activeAccount: TradingAccount;
  onSendTestSignal: () => void;
}

export const UnattendedSetupTab: React.FC<UnattendedSetupTabProps> = ({
  activeAccount,
  onSendTestSignal,
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedMql, setCopiedMql] = useState(false);
  const [testSent, setTestSent] = useState(false);

  const webhookUrl = `${window.location.origin}/api/webhook/tradingview?account=${activeAccount.accountNumber}`;
  const alertPayload = JSON.stringify({
    secret: "ms_sec_autonomous",
    account_id: activeAccount.accountNumber,
    action: "{{strategy.order.action}}",
    symbol: "{{ticker}}",
    contracts: "{{strategy.order.contracts}}",
    price: "{{close}}",
    comment: "MarketSense Auto 24/7"
  }, null, 2);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(alertPayload);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleCopyMql = () => {
    navigator.clipboard.writeText(MQL5_EXPERT_ADVISOR_CODE);
    setCopiedMql(true);
    setTimeout(() => setCopiedMql(false), 2000);
  };

  const handleDownloadMql = () => {
    const blob = new Blob([MQL5_EXPERT_ADVISOR_CODE], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'MarketSense_Autonomous_Bridge.mq5';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleTestClick = () => {
    onSendTestSignal();
    setTestSent(true);
    setTimeout(() => setTestSent(false), 4000);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Intro Header */}
      <div className="ivory-card rounded-2xl p-5 sm:p-6 text-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-[#EBF2EC] text-[#2E4A35] mx-auto flex items-center justify-center mb-2">
          <Zap className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-[#191C21]">
          Piloto Automático 24/7 (Cero Clics Manuales)
        </h2>
        <p className="text-xs sm:text-sm text-[#575B62] leading-relaxed max-w-md mx-auto">
          Sigue estos <strong>4 pasos simples</strong> una sola vez. A partir de ahí, cuando MarketSense detecte una oportunidad, la orden se abrirá en tu broker sola, sin que toques tu móvil ni estés pendiente.
        </p>
      </div>

      {/* Step 1: Download MQL5 EA */}
      <div className="ivory-card rounded-2xl p-5 sm:p-6 space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#2E4A35] text-[#F8F6F0] flex items-center justify-center font-bold text-xs">
            1
          </span>
          <h3 className="font-serif text-lg font-bold text-[#191C21]">
            El Receptor para MetaTrader 5
          </h3>
        </div>

        <p className="text-xs text-[#575B62] leading-relaxed">
          Este archivo es el que se queda escuchando en tu cuenta de MetaTrader para abrir las órdenes de MarketSense con Stop Loss y Take Profit fijos:
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleDownloadMql}
            className="py-2.5 px-3 rounded-xl olive-btn font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Archivo .mq5</span>
          </button>

          <button
            onClick={handleCopyMql}
            className="py-2.5 px-3 rounded-xl bg-[#F8F6F0] hover:bg-[#EFECE4] text-[#191C21] font-semibold text-xs border border-[#DDD8CD] transition flex items-center justify-center gap-2"
          >
            {copiedMql ? <Check className="w-4 h-4 text-[#2E4A35]" /> : <Copy className="w-4 h-4 text-[#575B62]" />}
            <span>{copiedMql ? '¡Código Copiado!' : 'Copiar Código'}</span>
          </button>
        </div>

        <div className="p-3 rounded-xl bg-[#FAF8F3] border border-[#E6E1D6] text-xs space-y-1">
          <span className="font-bold text-[#191C21] block">¿Dónde se guarda en tu MetaTrader 5?</span>
          <p className="text-[#575B62] leading-relaxed">
            Abre MetaTrader 5 y pulsa en el menú arriba:  
            <strong className="text-[#191C21]"> Archivo ➔ Abrir Carpeta de Datos ➔ MQL5 ➔ Experts</strong>.  
            Pega el archivo ahí y reinicia MetaTrader.
          </p>
        </div>
      </div>

      {/* Step 2: Enable Algorithmic Trading in MT5 */}
      <div className="ivory-card rounded-2xl p-5 sm:p-6 space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#2E4A35] text-[#F8F6F0] flex items-center justify-center font-bold text-xs">
            2
          </span>
          <h3 className="font-serif text-lg font-bold text-[#191C21]">
            Permitir Trading Algorítmico en MetaTrader
          </h3>
        </div>

        <p className="text-xs text-[#575B62] leading-relaxed">
          Por seguridad, MetaTrader viene con un candado para que nadie opere sin tu permiso. Desbloquéalo en 2 segundos:
        </p>

        <div className="p-3.5 rounded-xl bg-[#FAF8F3] border border-[#E6E1D6] space-y-2 text-xs text-[#575B62]">
          <p>
            1. En la barra superior de MetaTrader 5, haz clic en el botón con un icono de play verde que dice <strong>«Trading Algorítmico»</strong>.
          </p>
          <p>
            2. Ve a <strong>Herramientas ➔ Opciones ➔ Asesores Expertos</strong> y marca la casilla <em>«Permitir WebRequest para las URLs listadas»</em>.
          </p>
        </div>
      </div>

      {/* Step 3: Configure TradingView Alert */}
      <div className="ivory-card rounded-2xl p-5 sm:p-6 space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#2E4A35] text-[#F8F6F0] flex items-center justify-center font-bold text-xs">
            3
          </span>
          <h3 className="font-serif text-lg font-bold text-[#191C21]">
            En TradingView: Crear la Alerta Automática
          </h3>
        </div>

        <p className="text-xs text-[#575B62] leading-relaxed">
          En TradingView, haz clic en el icono del reloj (<strong>Crear Alerta</strong>) sobre tu estrategia de MarketSense y rellena estos dos campos:
        </p>

        <div className="space-y-3 pt-1">
          {/* Webhook URL */}
          <div className="p-3 rounded-xl bg-[#F3EFE6] border border-[#DDD8CD] space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#191C21]">Casilla: «URL del Webhook»</span>
              <button
                onClick={handleCopyUrl}
                className="text-[11px] text-[#2E4A35] font-semibold flex items-center gap-1 hover:underline cursor-pointer"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUrl ? '¡URL Copiada!' : 'Copiar URL'}</span>
              </button>
            </div>
            <div className="font-mono text-[11px] text-[#575B62] truncate select-all">
              {webhookUrl}
            </div>
          </div>

          {/* Alert Message */}
          <div className="p-3 rounded-xl bg-[#F3EFE6] border border-[#DDD8CD] space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#191C21]">Casilla: «Mensaje»</span>
              <button
                onClick={handleCopyJson}
                className="text-[11px] text-[#2E4A35] font-semibold flex items-center gap-1 hover:underline cursor-pointer"
              >
                {copiedJson ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedJson ? '¡Mensaje Copiado!' : 'Copiar Mensaje'}</span>
              </button>
            </div>
            <pre className="font-mono text-[10px] text-[#191C21] overflow-x-auto select-all leading-tight">
              {alertPayload}
            </pre>
          </div>
        </div>
      </div>

      {/* Step 4: Test it */}
      <div className="ivory-card rounded-2xl p-5 sm:p-6 space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#2E4A35] text-[#F8F6F0] flex items-center justify-center font-bold text-xs">
            4
          </span>
          <h3 className="font-serif text-lg font-bold text-[#191C21]">
            Prueba de Conexión en Vivo
          </h3>
        </div>

        <p className="text-xs text-[#575B62] leading-relaxed">
          Envía una señal de prueba simulada para confirmar que el receptor responde correctamente:
        </p>

        <button
          onClick={handleTestClick}
          className="w-full py-3 px-4 rounded-xl olive-btn font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md"
        >
          <Zap className="w-4 h-4 text-amber-300" />
          <span>Enviar Señal de Prueba Ahora</span>
        </button>

        {testSent && (
          <div className="p-3.5 rounded-xl bg-[#EBF2EC] border border-[#C5DDCB] text-[#2E4A35] text-xs flex items-center gap-2 animate-fade-in font-medium">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>
              ¡Prueba Exitosa! La señal simulada llegó al puente. Tu sistema está 100% armado para operar desatendido.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
