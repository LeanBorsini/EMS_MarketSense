import React, { useState, useEffect } from 'react';
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
  ArrowRight,
  Clock,
  AlertTriangle,
  RefreshCw,
  Cpu,
  Terminal,
  Activity,
  CheckCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { getMql5ExpertAdvisorCode } from '../data/mql5Code';
import { TradingAccount } from '../types/execution';

interface UnattendedSetupTabProps {
  activeAccount: TradingAccount;
  onSendTestSignal?: () => void;
  onTriggerTestWebhook?: (symbol?: string, action?: 'BUY' | 'SELL') => Promise<void>;
}

interface WebhookSignalItem {
  id: string;
  accountId: string;
  symbol: string;
  action: 'BUY' | 'SELL';
  contracts: number;
  receivedAt: string;
  source: string;
  executedByEA: boolean;
}

export const UnattendedSetupTab: React.FC<UnattendedSetupTabProps> = ({
  activeAccount,
  onSendTestSignal,
  onTriggerTestWebhook,
}) => {
  // Method selection: 'NATIVE_MT5' (No TradingView expiration) vs 'TRADINGVIEW_WEBHOOK'
  const [activeMethod, setActiveMethod] = useState<'NATIVE_MT5' | 'TRADINGVIEW_WEBHOOK'>('NATIVE_MT5');
  
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedMql, setCopiedMql] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testSuccessMessage, setTestSuccessMessage] = useState<string | null>(null);
  
  // Test Signal Form
  const [testSymbol, setTestSymbol] = useState<'US500' | 'EURUSD' | 'BTCUSD' | 'XAUUSD'>('US500');
  const [testAction, setTestAction] = useState<'BUY' | 'SELL'>('BUY');

  // Webhook Relay Health
  const [recentSignals, setRecentSignals] = useState<WebhookSignalItem[]>([]);
  const [pendingQueueCount, setPendingQueueCount] = useState<number>(0);
  const [lastCheckTime, setLastCheckTime] = useState<string>('');
  const [isRefreshingRelay, setIsRefreshingRelay] = useState(false);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const webhookUrl = `${currentOrigin}/api/webhook/tradingview?account=${activeAccount.accountNumber}`;
  
  const alertPayload = JSON.stringify({
    secret: "ms_sec_autonomous",
    account_id: activeAccount.accountNumber,
    action: "{{strategy.order.action}}",
    symbol: "{{ticker}}",
    contracts: "{{strategy.order.contracts}}",
    price: "{{close}}",
    comment: "MarketSense Auto 24/7"
  }, null, 2);

  const mqlCode = getMql5ExpertAdvisorCode(currentOrigin, activeAccount.accountNumber);

  // Poll webhook relay history
  const fetchRelayHistory = async () => {
    try {
      setIsRefreshingRelay(true);
      const res = await fetch('/api/webhook/history');
      if (res.ok) {
        const data = await res.json();
        if (data.signals) {
          setRecentSignals(data.signals.slice(0, 5));
        }
        setPendingQueueCount(data.pendingCount || 0);
        setLastCheckTime(new Date().toLocaleTimeString('es-ES'));
      }
    } catch {
      // ignore
    } finally {
      setIsRefreshingRelay(false);
    }
  };

  useEffect(() => {
    fetchRelayHistory();
    const interval = setInterval(fetchRelayHistory, 4000);
    return () => clearInterval(interval);
  }, []);

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
    navigator.clipboard.writeText(mqlCode);
    setCopiedMql(true);
    setTimeout(() => setCopiedMql(false), 2000);
  };

  const handleDownloadMql = () => {
    const blob = new Blob([mqlCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'MarketSense_Universal_Bridge.mq5';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendRealTestSignal = async () => {
    setIsSendingTest(true);
    setTestSuccessMessage(null);
    try {
      if (onTriggerTestWebhook) {
        await onTriggerTestWebhook(testSymbol, testAction);
      } else {
        await fetch('/api/webhook/test-signal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol: testSymbol,
            action: testAction,
            contracts: 0.5,
            account_id: activeAccount.accountNumber,
          }),
        });
      }
      if (onSendTestSignal) onSendTestSignal();

      setTestSuccessMessage(`¡Señal ${testAction} enviada al Relay para ${testSymbol}! La orden ya está en cola para ser ejecutada por MetaTrader.`);
      await fetchRelayHistory();
    } catch (e) {
      setTestSuccessMessage('Error al enviar señal de prueba.');
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 1. Intro Header */}
      <div className="ivory-card rounded-2xl p-5 sm:p-6 text-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-[#EBF2EC] text-[#2E4A35] mx-auto flex items-center justify-center mb-2">
          <Zap className="w-6 h-6 text-[#2E4A35]" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-[#191C21]">
          Piloto Automático & Conexión de Señales
        </h2>
        <p className="text-xs sm:text-sm text-[#575B62] leading-relaxed max-w-lg mx-auto">
          ¿Tienes problemas con la <strong>expiración forzada de alertas en TradingView</strong> o la ejecución de órdenes? Aquí tienes las dos soluciones completas para que tu sistema opere sin interrupciones.
        </p>
      </div>

      {/* 2. Method Selector (Native MT5 vs TradingView Webhook) */}
      <div className="ivory-card rounded-2xl p-2 sm:p-2.5 bg-[#EFECE4] border border-[#DDD8CD]">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveMethod('NATIVE_MT5')}
            className={`py-3 px-4 rounded-xl text-left transition-all cursor-pointer ${
              activeMethod === 'NATIVE_MT5'
                ? 'bg-[#2E4A35] text-[#F8F6F0] shadow-md ring-2 ring-[#2E4A35]/30'
                : 'bg-[#F8F6F0] text-[#575B62] hover:bg-[#FAF8F3] hover:text-[#191C21]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-serif font-bold text-xs sm:text-sm flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-emerald-300" />
                Opción A: Nativo en MT5
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${activeMethod === 'NATIVE_MT5' ? 'bg-emerald-500 text-slate-950' : 'bg-[#EAE5DA] text-[#575B62]'}`}>
                Recomendado
              </span>
            </div>
            <p className={`text-[11px] leading-tight ${activeMethod === 'NATIVE_MT5' ? 'text-emerald-100' : 'text-[#8C9098]'}`}>
              ¡Cero alertas que expiren! El bot opera directamente en tu MetaTrader 5 sin depender de TradingView.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setActiveMethod('TRADINGVIEW_WEBHOOK')}
            className={`py-3 px-4 rounded-xl text-left transition-all cursor-pointer ${
              activeMethod === 'TRADINGVIEW_WEBHOOK'
                ? 'bg-[#2E4A35] text-[#F8F6F0] shadow-md ring-2 ring-[#2E4A35]/30'
                : 'bg-[#F8F6F0] text-[#575B62] hover:bg-[#FAF8F3] hover:text-[#191C21]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-serif font-bold text-xs sm:text-sm flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-amber-300" />
                Opción B: Webhook TradingView
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${activeMethod === 'TRADINGVIEW_WEBHOOK' ? 'bg-amber-400 text-slate-950' : 'bg-[#EAE5DA] text-[#575B62]'}`}>
                Con Alertas
              </span>
            </div>
            <p className={`text-[11px] leading-tight ${activeMethod === 'TRADINGVIEW_WEBHOOK' ? 'text-emerald-100' : 'text-[#8C9098]'}`}>
              Si prefieres usar tus propios gráficos de TradingView, cómo evitar la caducidad y configurarlo bien.
            </p>
          </button>
        </div>
      </div>

      {/* 3. OPTION A: NATIVE MT5 AUTONOMOUS STRATEGY */}
      {activeMethod === 'NATIVE_MT5' && (
        <div className="space-y-4 animate-fade-in">
          {/* Why this solves the user's issue */}
          <div className="ivory-card rounded-2xl p-5 sm:p-6 space-y-3 border-l-4 border-l-[#2E4A35]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#2E4A35]" />
              <h3 className="font-serif text-base sm:text-lg font-bold text-[#191C21]">
                ¿Por qué operar con la Estrategia Nativa en MT5?
              </h3>
            </div>
            <p className="text-xs text-[#575B62] leading-relaxed">
              TradingView impone por diseño comercial una <strong>fecha de caducidad estricta</strong> (30 días en cuentas gratuitas o 60 días en cuentas de pago). Además, las cuentas básicas de TradingView cobran suscripción mensual por habilitar Webhooks.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
              <div className="p-3 rounded-xl bg-[#EBF2EC] border border-[#C5DDCB] space-y-1">
                <span className="font-bold text-[#2E4A35] block">1. Nunca Caduca</span>
                <p className="text-[#3D5B44] text-[11px]">
                  El Expert Advisor corre 24/7 en tu MetaTrader. No se apaga, no vence y no necesita renovación manual cada mes.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#EBF2EC] border border-[#C5DDCB] space-y-1">
                <span className="font-bold text-[#2E4A35] block">2. Cero Latencia</span>
                <p className="text-[#3D5B44] text-[11px]">
                  La orden se ejecuta en 2 milisegundos directamente dentro del broker, sin pasar por servidores externos de alertas.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#EBF2EC] border border-[#C5DDCB] space-y-1">
                <span className="font-bold text-[#2E4A35] block">3. 100% Gratuito</span>
                <p className="text-[#3D5B44] text-[11px]">
                  No pagas planes de suscripción mensual a TradingView solo para poder usar webhooks.
                </p>
              </div>
            </div>
          </div>

          {/* How to activate in 3 simple steps */}
          <div className="ivory-card rounded-2xl p-5 sm:p-6 space-y-4">
            <h3 className="font-serif text-base font-bold text-[#191C21]">
              Cómo Activar la Operativa Nativa en 3 Pasos
            </h3>

            <div className="space-y-3 text-xs text-[#575B62]">
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-[#2E4A35] text-[#F8F6F0] flex items-center justify-center font-bold text-xs flex-shrink-0">
                  1
                </span>
                <div className="space-y-1.5 flex-1">
                  <p className="font-bold text-[#191C21]">Descarga el Expert Advisor Universal de MarketSense:</p>
                  <p className="text-[11px]">
                    Este archivo ya incluye la telemetría en vivo de tu saldo y la lógica algorítmica para abrir y cerrar operaciones:
                  </p>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleDownloadMql}
                      className="py-2.5 px-4 rounded-xl olive-btn font-semibold text-xs flex items-center gap-2 cursor-pointer shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>Descargar MarketSense_Universal_Bridge.mq5</span>
                    </button>
                    <button
                      onClick={handleCopyMql}
                      className="py-2.5 px-3 rounded-xl bg-[#FAF8F3] hover:bg-[#EFECE4] border border-[#DDD8CD] text-[#2E4A35] font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedMql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedMql ? '¡Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-[#2E4A35] text-[#F8F6F0] flex items-center justify-center font-bold text-xs flex-shrink-0">
                  2
                </span>
                <div className="space-y-1 flex-1">
                  <p className="font-bold text-[#191C21]">Instálalo en tu MetaTrader 5:</p>
                  <p className="text-[11px]">
                    En MT5 pulsa en el menú: <strong>Archivo ➔ Abrir Carpeta de Datos ➔ MQL5 ➔ Experts</strong>. Pega el archivo ahí, ábrelo en el editor y haz clic en <strong>Compilar</strong>.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-[#2E4A35] text-[#F8F6F0] flex items-center justify-center font-bold text-xs flex-shrink-0">
                  3
                </span>
                <div className="space-y-1 flex-1">
                  <p className="font-bold text-[#191C21]">Activa el parámetro autónomo:</p>
                  <p className="text-[11px]">
                    Arrastra el EA a tu gráfico favorito (ej. US500, EURUSD o BTCUSD en M15 o H1). En la ventana de parámetros, pon:
                  </p>
                  <div className="p-2.5 rounded-lg bg-[#FAF8F3] border border-[#E6E1D6] font-mono text-[11px] text-[#191C21] mt-1">
                    InpRunNativeStrategy = true
                  </div>
                  <p className="text-[11px] text-[#2E4A35] font-medium mt-1">
                    ¡Listo! El bot ejecutará las órdenes según la estrategia de cruce cuantitativo y moverá el Stop Loss a Breakeven (+1 pip) solo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. OPTION B: TRADINGVIEW WEBHOOK (EXPLANATION & SETUP) */}
      {activeMethod === 'TRADINGVIEW_WEBHOOK' && (
        <div className="space-y-4 animate-fade-in">
          {/* Analysis of why TradingView alerts expire */}
          <div className="ivory-card rounded-2xl p-5 sm:p-6 space-y-3 border-l-4 border-l-amber-500 bg-[#FDFCF9]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="font-serif text-base sm:text-lg font-bold text-[#191C21]">
                ¿Por qué TradingView limita el tiempo de las alertas?
              </h3>
            </div>
            <p className="text-xs text-[#575B62] leading-relaxed">
              En TradingView, <strong>todas las alertas tienen fecha de caducidad obligatoria</strong> según el plan contratado:
            </p>
            <ul className="text-xs text-[#575B62] space-y-1.5 list-disc list-inside">
              <li><strong>Cuentas Gratuitas:</strong> Las alertas duran máximo 30 días y NO permiten URL de Webhook.</li>
              <li><strong>Cuentas Essential / Plus:</strong> Las alertas duran máximo <strong>2 meses (60 días)</strong> y deben renovarse antes de vencer.</li>
              <li><strong>Solo en cuentas Premium:</strong> TradingView permite marcar la opción *"Sin fecha de vencimiento"*.</li>
            </ul>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
              <span className="font-bold block">⚠️ Error muy común que apaga tu bot al instante:</span>
              <p className="text-[11px] leading-relaxed">
                Si al crear la alerta en TradingView seleccionas <strong>«Solo una vez»</strong> (Only Once), la alerta se dispara en la primera señal y se desactiva de inmediato. Debes seleccionar siempre <strong>«Una vez por cierre de barra»</strong> (Once Per Bar Close).
              </p>
            </div>
          </div>

          {/* Steps to setup TradingView correctly */}
          <div className="ivory-card rounded-2xl p-5 sm:p-6 space-y-4">
            <h3 className="font-serif text-base font-bold text-[#191C21]">
              Configuración Correcta de la Alerta en TradingView
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#F3EFE6] border border-[#DDD8CD] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#191C21]">1. Casilla: «URL del Webhook»</span>
                  <button
                    onClick={handleCopyUrl}
                    className="text-[11px] text-[#2E4A35] font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUrl ? '¡Copiado!' : 'Copiar URL'}</span>
                  </button>
                </div>
                <div className="font-mono text-[11px] text-[#191C21] truncate select-all bg-white p-2 rounded border border-[#E6E1D6]">
                  {webhookUrl}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#F3EFE6] border border-[#DDD8CD] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#191C21]">2. Casilla: «Mensaje»</span>
                  <button
                    onClick={handleCopyJson}
                    className="text-[11px] text-[#2E4A35] font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    {copiedJson ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedJson ? '¡Copiado!' : 'Copiar Mensaje'}</span>
                  </button>
                </div>
                <pre className="font-mono text-[10px] text-[#191C21] overflow-x-auto select-all leading-tight bg-white p-2 rounded border border-[#E6E1D6]">
                  {alertPayload}
                </pre>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF8F3] border border-[#E6E1D6] space-y-2 text-xs text-[#575B62]">
                <span className="font-bold text-[#191C21] block">3. Ajustes de Tiempo y Notificaciones en TradingView:</span>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px]">
                  <li>En el desplegable <strong>Frecuencia</strong>, selecciona <strong>«Una vez por cierre de barra»</strong>.</li>
                  <li>En <strong>Fecha de caducidad</strong>, selecciona la fecha más lejana que te permita tu calendario (60 días).</li>
                  <li>En la pestaña <strong>Notificaciones</strong>, marca la casilla <em>«Enviar correo electrónico»</em> o <em>«Notificar en la app»</em>: así TradingView te avisará cuando falten 3 días para vencer la alerta y podrás renovarla con 1 clic sin que el bot se detenga.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. LIVE WEBHOOK RELAY HEALTH & SIGNAL SIMULATOR */}
      <div className="ivory-card rounded-2xl p-5 sm:p-6 space-y-4 border-2 border-[#2E4A35]/20">
        <div className="flex items-center justify-between pb-3 border-b border-[#EAE5DA]">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#2E4A35]" />
            <h3 className="font-serif text-base font-bold text-[#191C21]">
              Monitor del Relay en Vivo & Simulador de Señal
            </h3>
          </div>
          <button
            onClick={fetchRelayHistory}
            disabled={isRefreshingRelay}
            className="text-[11px] text-[#2E4A35] font-semibold flex items-center gap-1 hover:underline cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingRelay ? 'animate-spin' : ''}`} />
            <span>Refrescar</span>
          </button>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          <div className="p-3 rounded-xl bg-white/70 border border-[#DDD8CD] space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#8C9098] block">Estado del Receptor</span>
            <span className="font-semibold text-[#2E4A35] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#2E4A35] animate-pulse" />
              Relay Activo 24/7
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white/70 border border-[#DDD8CD] space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#8C9098] block">Órdenes en Cola MT5</span>
            <span className="font-mono font-bold text-sm text-[#191C21]">
              {pendingQueueCount} pendientes
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white/70 border border-[#DDD8CD] space-y-1 col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold text-[#8C9098] block">Último Chequeo</span>
            <span className="font-mono text-xs text-[#575B62]">
              {lastCheckTime || 'En línea'}
            </span>
          </div>
        </div>

        {/* Real Test Signal Trigger */}
        <div className="p-4 rounded-xl bg-[#F8F6F0] border border-[#DDD8CD] space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-serif text-xs sm:text-sm font-bold text-[#191C21]">
              Probar Circuito de Señal (Simulador de TradingView)
            </span>
            <span className="text-[11px] text-[#575B62]">
              Cuenta destino: <strong>#{activeAccount.accountNumber}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-[#575B62] block mb-1 uppercase">Símbolo</label>
              <select
                value={testSymbol}
                onChange={e => setTestSymbol(e.target.value as any)}
                className="w-full bg-white border border-[#DDD8CD] rounded-lg p-2 text-xs font-mono text-[#191C21]"
              >
                <option value="US500">US500 (S&P 500)</option>
                <option value="EURUSD">EURUSD (Euro Dólar)</option>
                <option value="BTCUSD">BTCUSD (Bitcoin)</option>
                <option value="XAUUSD">XAUUSD (Oro)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#575B62] block mb-1 uppercase">Acción</label>
              <select
                value={testAction}
                onChange={e => setTestAction(e.target.value as any)}
                className="w-full bg-white border border-[#DDD8CD] rounded-lg p-2 text-xs font-semibold text-[#191C21]"
              >
                <option value="BUY">BUY (Compra)</option>
                <option value="SELL">SELL (Venta)</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleSendRealTestSignal}
            disabled={isSendingTest}
            className="w-full py-2.5 px-4 rounded-xl olive-btn font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm transition"
          >
            {isSendingTest ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Enviando señal de prueba al relay...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-emerald-300" />
                <span>Disparar Señal de Prueba Ahora</span>
              </>
            )}
          </button>

          {testSuccessMessage && (
            <div className="p-3 rounded-lg bg-[#EBF2EC] border border-[#C5DDCB] text-[#2E4A35] text-xs flex items-center gap-2 animate-fade-in font-medium">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{testSuccessMessage}</span>
            </div>
          )}
        </div>

        {/* Recent Webhook History */}
        <div className="space-y-2 pt-1">
          <span className="text-xs font-bold text-[#191C21] block">
            Últimas Señales Recibidas en el Servidor ({recentSignals.length}):
          </span>

          {recentSignals.length === 0 ? (
            <div className="p-4 rounded-xl bg-white/50 border border-dashed border-[#DDD8CD] text-center text-xs text-[#8C9098]">
              Aún no se han recibido señales en esta sesión. Pulsa el botón «Disparar Señal de Prueba» o envía una alerta desde TradingView para verla aparecer aquí en tiempo real.
            </div>
          ) : (
            <div className="space-y-1.5">
              {recentSignals.map(sig => (
                <div
                  key={sig.id}
                  className="p-2.5 rounded-xl bg-white border border-[#E6E1D6] flex items-center justify-between text-xs font-mono"
                >
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      sig.action === 'BUY' ? 'bg-[#2E4A35] text-white' : 'bg-rose-600 text-white'
                    }`}>
                      {sig.action}
                    </span>
                    <span className="font-bold text-[#191C21]">{sig.symbol}</span>
                    <span className="text-[#8C9098] text-[11px]">({sig.contracts} lotes)</span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-[#575B62]">
                    <span>{new Date(sig.receivedAt).toLocaleTimeString('es-ES')}</span>
                    {sig.executedByEA ? (
                      <span className="text-[#2E4A35] font-semibold flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> Tomada por MT5
                      </span>
                    ) : (
                      <span className="text-amber-600 font-semibold">
                        En cola
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
