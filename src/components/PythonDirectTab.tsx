import React, { useState } from 'react';
import { 
  Download, 
  Copy, 
  Check, 
  Terminal, 
  Zap, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Lock, 
  Server, 
  Key, 
  DollarSign, 
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Laptop
} from 'lucide-react';
import { TradingAccount, MT5LiveSyncInfo } from '../types/execution';
import { getStandalonePythonBotCode } from '../data/pythonBotCode';

interface PythonDirectTabProps {
  activeAccount: TradingAccount;
  mt5SyncInfo?: MT5LiveSyncInfo;
  isSyncingMT5?: boolean;
  onSyncMetaTraderNow?: () => void;
  onUpdateBalance?: (accountId: string, newBalance: number) => void;
  onResetToRealCleanMode?: () => void;
}

export const PythonDirectTab: React.FC<PythonDirectTabProps> = ({
  activeAccount,
  mt5SyncInfo,
  isSyncingMT5,
  onSyncMetaTraderNow,
  onUpdateBalance,
  onResetToRealCleanMode,
}) => {
  const [copied, setCopied] = useState(false);
  const [login, setLogin] = useState(activeAccount.accountNumber !== 'Pendiente Enlace' ? activeAccount.accountNumber : '50198273');
  const [password, setPassword] = useState('');
  const [server, setServer] = useState(activeAccount.serverName || 'ICMarketsSC-Demo');
  const [symbol, setSymbol] = useState('US500');
  const [riskPercent, setRiskPercent] = useState(1.0);
  const [fixedLots, setFixedLots] = useState(0.1);
  const [useFixedLots, setUseFixedLots] = useState(false);
  const [autoBreakevenPips, setAutoBreakevenPips] = useState(15);
  const [enableAutonomousStrategy, setEnableAutonomousStrategy] = useState(true);
  const [enableLocalWebhook, setEnableLocalWebhook] = useState(true);
  const [customRealBalance, setCustomRealBalance] = useState<string>('');
  const [balanceSavedMsg, setBalanceSavedMsg] = useState(false);

  // Generate python code dynamically based on current user inputs
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const pythonScript = getStandalonePythonBotCode({
    login,
    password: password || 'TU_PASSWORD_AQUI',
    server,
    symbol,
    riskPercent,
    fixedLots,
    useFixedLots,
    autoBreakevenPips,
    magicNumber: 202610,
    webSyncUrl: `${currentOrigin}/api/mt5/sync`,
    enableAutonomousStrategy,
    enableLocalWebhookServer: enableLocalWebhook,
    localWebhookPort: 5000,
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(pythonScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([pythonScript], { type: 'text/x-python;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `marketsense_bot_${login || 'standalone'}.py`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSaveManualRealBalance = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(customRealBalance);
    if (!isNaN(val) && val > 0 && onUpdateBalance) {
      onUpdateBalance(activeAccount.id, val);
      // Also notify server
      fetch('/api/mt5/force-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ balance: val, login, server }),
      }).catch(() => {});
      
      setBalanceSavedMsg(true);
      setTimeout(() => setBalanceSavedMsg(false), 3000);
    }
  };

  const isLivePythonConnected = mt5SyncInfo?.connected && mt5SyncInfo?.syncSource === 'PYTHON_BRIDGE';

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* 1. Header with clear architecture explanation */}
      <div className="ivory-card rounded-2xl p-6 sm:p-7 border-2 border-[#2E4A35]/30 bg-gradient-to-br from-[#FDFCF9] to-[#EBF2EC] space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#2E4A35] text-white flex items-center justify-center font-mono font-bold text-lg shadow-sm">
            Py
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#2E4A35]/10 border border-[#2E4A35]/20 text-[#2E4A35] text-[11px] font-semibold mb-1">
              <Zap className="w-3 h-3 text-[#2E4A35]" />
              Conexión Nativa Directa
            </div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#191C21]">
              Operativa 100% en Python Directo
            </h1>
            <p className="text-xs sm:text-sm text-[#575B62]">
              Conecta tus credenciales con <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-[#DDD8CD] font-bold text-[#191C21]">mt5.login(...)</code> sin intermediarios ni simulaciones.
            </p>
          </div>
        </div>

        {/* The Honest Technical Answer */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-[#DDD8CD] space-y-3">
          <h2 className="text-xs sm:text-sm font-bold text-[#191C21] flex items-center gap-2">
            <span>💡</span>
            <span>¿Por qué antes era tan fácil conectar credenciales en Python y en una web es diferente?</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-relaxed">
            <div className="p-3 rounded-lg bg-[#EBF2EC] border border-[#C5DDCB]">
              <span className="font-bold text-[#2E4A35] block mb-1">
                🐍 En Python (En tu PC / VPS):
              </span>
              <p className="text-[#3F434A]">
                Python se ejecuta directamente dentro de tu sistema operativo Windows donde está instalado tu MetaTrader 5. La librería oficial <code className="font-mono font-bold">MetaTrader5</code> tiene acceso directo por IPC a la terminal del broker y ejecuta el inicio de sesión en 1 segundo con tu contraseña real. Lee tu saldo real instantáneamente.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[#FAF8F3] border border-[#E7E2D8]">
              <span className="font-bold text-[#8C6D23] block mb-1">
                🌐 En un Navegador Web (Chrome/Safari):
              </span>
              <p className="text-[#575B62]">
                Por estrictas políticas de ciberseguridad, los navegadores no pueden acceder a los programas instalados en tu disco duro ni abrir sockets binarios a brokers como ICMarkets o FTMO. Por eso, cualquier web necesita o bien un script local (Python o EA) o que introduzcas tu saldo.
              </p>
            </div>
          </div>
          <p className="text-[11px] text-[#575B62] pt-1">
            <strong>Nuestra solución:</strong> Tienes aquí el script en Python 100% terminado y listo para correr en tu máquina. Opera con tu saldo real, abre operaciones reales y si lo deseas, sincroniza en vivo con este panel para monitorearlo desde tu teléfono.
          </p>
        </div>
      </div>

      {/* 2. Live Telemetry Status Bar */}
      <div className="ivory-card rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className={`w-3.5 h-3.5 rounded-full ${
            isLivePythonConnected 
              ? 'bg-emerald-500 ring-4 ring-emerald-500/20 animate-pulse' 
              : 'bg-amber-400 ring-4 ring-amber-400/20'
          }`} />
          <div>
            <span className="text-xs font-semibold text-[#191C21] block">
              {isLivePythonConnected ? '🟢 Python Conectado y Transmitiendo en Vivo' : '⚪ Esperando que ejecutes el script en tu equipo'}
            </span>
            <span className="text-[11px] text-[#575B62]">
              {isLivePythonConnected 
                ? `Cuenta #${mt5SyncInfo?.login} | Saldo Real: $${mt5SyncInfo?.balance.toFixed(2)} | Ping: ${mt5SyncInfo?.pingMs}ms` 
                : 'Ejecuta el script de Python abajo para ver tu saldo real en vivo.'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {onSyncMetaTraderNow && (
            <button
              onClick={onSyncMetaTraderNow}
              disabled={isSyncingMT5}
              className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl bg-[#EFECE4] hover:bg-[#EAE5DA] border border-[#DDD8CD] text-xs font-semibold text-[#191C21] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingMT5 ? 'animate-spin text-[#2E4A35]' : ''}`} />
              <span>Verificar Conexión</span>
            </button>
          )}

          {onResetToRealCleanMode && (
            <button
              onClick={onResetToRealCleanMode}
              className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl bg-[#FAF8F3] hover:bg-[#EFECE4] border border-[#DDD8CD] text-xs font-semibold text-amber-800 flex items-center justify-center gap-1.5 cursor-pointer"
              title="Borra los datos de simulación demo para dejar el panel en cero"
            >
              <span>Limpiar Simulación</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Quick Fix: Set Real Balance directly in web UI (Eliminates the 100k demo confusion) */}
      <div className="ivory-card rounded-2xl p-5 border border-[#DDD8CD] bg-white space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[#2E4A35]" />
            <h3 className="font-serif text-sm font-bold text-[#191C21]">
              ¿Quieres fijar tu saldo real en este panel ahora mismo? (Sin esperar a Python)
            </h3>
          </div>
        </div>
        <p className="text-xs text-[#575B62]">
          Si tu cuenta tiene $5,000, $2,500 o $50,000 y no quieres ver los $100,000 ni los $2,200 de simulación en pantalla, escribe tu saldo aquí y se actualizará de inmediato con $0.00 de PnL de hoy.
        </p>

        <form onSubmit={handleSaveManualRealBalance} className="flex flex-col sm:flex-row items-center gap-2 pt-1">
          <div className="relative w-full sm:w-64">
            <span className="absolute left-3 top-2.5 text-xs text-[#8C9098] font-bold font-mono">$</span>
            <input
              type="number"
              step="any"
              placeholder="Ej: 5000"
              value={customRealBalance}
              onChange={(e) => setCustomRealBalance(e.target.value)}
              className="w-full pl-7 pr-3 py-2 rounded-xl border border-[#DDD8CD] bg-[#FAF8F3] text-sm font-mono font-bold text-[#191C21] focus:outline-none focus:ring-2 focus:ring-[#2E4A35]"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#2E4A35] hover:bg-[#233a2a] text-[#F8F6F0] font-semibold text-xs cursor-pointer shadow-sm transition"
          >
            Fijar Saldo Real en el Panel
          </button>
          {balanceSavedMsg && (
            <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> ¡Saldo actualizado!
            </span>
          )}
        </form>
      </div>

      {/* 4. Interactive Script Customizer */}
      <div className="ivory-card rounded-2xl p-5 sm:p-6 space-y-5">
        <div>
          <span className="text-[11px] uppercase tracking-wider text-[#8C9098] font-bold font-mono">
            Paso 1 · Personaliza tu Script de Python
          </span>
          <h2 className="font-serif text-lg font-bold text-[#191C21] mt-0.5">
            Configuración de Credenciales del Broker y Riesgo
          </h2>
          <p className="text-xs text-[#575B62] mt-0.5">
            Los valores que introduzcas aquí se escribirán automáticamente dentro de tu script de Python para que solo tengas que hacer clic y ejecutar.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#191C21] mb-1">
              Número de Cuenta MT5 (Login)
            </label>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="Ej: 50198273"
              className="w-full px-3 py-2 rounded-xl border border-[#DDD8CD] bg-[#FAF8F3] text-xs font-mono font-semibold text-[#191C21]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#191C21] mb-1">
              Servidor del Broker
            </label>
            <input
              type="text"
              value={server}
              onChange={(e) => setServer(e.target.value)}
              placeholder="Ej: ICMarketsSC-Demo, FTMO-Server"
              className="w-full px-3 py-2 rounded-xl border border-[#DDD8CD] bg-[#FAF8F3] text-xs font-mono font-semibold text-[#191C21]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#191C21] mb-1">
              Contraseña del Broker (Opcional aquí)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Escríbela aquí o déjala para editarla en tu PC"
              className="w-full px-3 py-2 rounded-xl border border-[#DDD8CD] bg-[#FAF8F3] text-xs font-mono font-semibold text-[#191C21]"
            />
            <span className="text-[10px] text-[#8C9098]">
              🔒 Si prefieres no escribirla en la web, puedes dejarla en blanco y ponerla en tu PC.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#191C21] mb-1">
              Símbolo para Operar
            </label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="Ej: US500, EURUSD, BTCUSD, NAS100"
              className="w-full px-3 py-2 rounded-xl border border-[#DDD8CD] bg-[#FAF8F3] text-xs font-mono font-semibold text-[#191C21]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#191C21] mb-1">
              Riesgo por Operación (% de Saldo Real)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="5.0"
                value={riskPercent}
                onChange={(e) => setRiskPercent(parseFloat(e.target.value) || 1.0)}
                className="w-24 px-3 py-2 rounded-xl border border-[#DDD8CD] bg-[#FAF8F3] text-xs font-mono font-bold text-[#191C21]"
              />
              <span className="text-xs text-[#575B62]">% del saldo</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#191C21] mb-1">
              Auto-Breakeven Institucional
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={autoBreakevenPips}
                onChange={(e) => setAutoBreakevenPips(parseInt(e.target.value) || 15)}
                className="w-24 px-3 py-2 rounded-xl border border-[#DDD8CD] bg-[#FAF8F3] text-xs font-mono font-bold text-[#191C21]"
              />
              <span className="text-xs text-[#575B62]">pips de ganancia para mover SL a entrada</span>
            </div>
          </div>
        </div>

        {/* Feature Switches */}
        <div className="pt-2 border-t border-[#EAE5DA] space-y-2.5">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={enableAutonomousStrategy}
              onChange={(e) => setEnableAutonomousStrategy(e.target.checked)}
              className="w-4 h-4 rounded text-[#2E4A35] accent-[#2E4A35]"
            />
            <span className="text-xs text-[#191C21] font-medium">
              <strong>Estrategia Autónoma Interna:</strong> El script de Python analiza velas M15 y ejecuta compras y ventas por sí solo sin depender de TradingView.
            </span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={enableLocalWebhook}
              onChange={(e) => setEnableLocalWebhook(e.target.checked)}
              className="w-4 h-4 rounded text-[#2E4A35] accent-[#2E4A35]"
            />
            <span className="text-xs text-[#191C21] font-medium">
              <strong>Servidor Local de Webhooks TradingView:</strong> Abre el puerto 5000 en tu máquina para recibir alertas ilimitadas sin caducidad.
            </span>
          </label>
        </div>

        {/* Action Buttons: Download & Copy */}
        <div className="flex flex-col sm:flex-row gap-3 pt-3">
          <button
            onClick={handleDownload}
            className="flex-1 py-3 px-4 rounded-xl bg-[#2E4A35] hover:bg-[#233a2a] text-[#F8F6F0] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md transition"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Bot Python Terminado (.py)</span>
          </button>

          <button
            onClick={handleCopy}
            className="py-3 px-4 rounded-xl bg-[#FAF8F3] hover:bg-[#EFECE4] border border-[#DDD8CD] text-[#191C21] font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-bold">¡Código Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-[#575B62]" />
                <span>Copiar Código al Portapapeles</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 5. Step by step Execution Guide in Windows */}
      <div className="ivory-card rounded-2xl p-5 sm:p-6 space-y-4">
        <div>
          <span className="text-[11px] uppercase tracking-wider text-[#8C9098] font-bold font-mono">
            Paso 2 · Cómo Ejecutarlo en Tu PC (Solo 3 Pasos)
          </span>
          <h2 className="font-serif text-lg font-bold text-[#191C21] mt-0.5">
            Guía de Inicio Inmediato
          </h2>
        </div>

        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-white border border-[#DDD8CD] flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-[#2E4A35] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              1
            </span>
            <div className="space-y-1 flex-1">
              <h3 className="text-xs font-bold text-[#191C21]">
                Instala las dependencias en la terminal de tu PC (CMD o PowerShell)
              </h3>
              <div className="bg-[#191C21] text-emerald-400 font-mono text-xs p-2.5 rounded-lg flex items-center justify-between">
                <code>pip install MetaTrader5 requests</code>
                <button
                  onClick={() => navigator.clipboard.writeText('pip install MetaTrader5 requests')}
                  className="text-slate-400 hover:text-white text-[11px] flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Copiar
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#DDD8CD] flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-[#2E4A35] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              2
            </span>
            <div className="space-y-1 flex-1">
              <h3 className="text-xs font-bold text-[#191C21]">
                Abre tu aplicación MetaTrader 5 en tu computadora
              </h3>
              <p className="text-xs text-[#575B62]">
                Asegúrate de que MetaTrader 5 esté abierto y que la opción <strong>"Permitir Trading Algorítmico"</strong> esté habilitada (botón verde en la barra de herramientas de MT5).
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#DDD8CD] flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-[#2E4A35] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              3
            </span>
            <div className="space-y-1 flex-1">
              <h3 className="text-xs font-bold text-[#191C21]">
                Ejecuta el script descargado
              </h3>
              <div className="bg-[#191C21] text-emerald-400 font-mono text-xs p-2.5 rounded-lg flex items-center justify-between">
                <code>python marketsense_bot_{login || 'standalone'}.py</code>
                <button
                  onClick={() => navigator.clipboard.writeText(`python marketsense_bot_${login || 'standalone'}.py`)}
                  className="text-slate-400 hover:text-white text-[11px] flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Copiar
                </button>
              </div>
              <p className="text-[11px] text-[#575B62] pt-1">
                Verás en la consola de tu PC cómo se conecta directamente a tu broker, imprime tu saldo real con centavos y empieza la vigilancia de mercado.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Guía 24/7 Desatendida: Cómo operar con tu PC apagada usando un VPS */}
      <div className="ivory-card rounded-2xl p-5 sm:p-6 border-2 border-[#2E4A35]/30 bg-gradient-to-br from-[#FDFCF9] to-[#EBF2EC] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#2E4A35] text-white flex items-center justify-center font-bold text-sm shadow-sm">
              ☁️
            </div>
            <div>
              <h2 className="font-serif text-sm sm:text-base font-bold text-[#191C21]">
                ¿Cómo mantener el bot trabajando 24/7 con tu PC apagada?
              </h2>
              <p className="text-[11px] text-[#575B62]">
                La solución profesional estándar: Un <strong>VPS (Servidor Privado Virtual)</strong> en la nube.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 text-xs leading-relaxed">
          <p className="text-[#3F434A]">
            Si apagas tu laptop o entra en suspensión, MetaTrader y Python se detienen. Para que opere <strong>día y noche sin que tu PC esté encendida</strong>, se utiliza un <strong>VPS</strong>: una computadora virtual en la nube (Windows) que está encendida los 365 días del año en un centro de datos con internet ultraveloz.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* Opción 1: VPS Gratis del Broker */}
            <div className="p-3.5 rounded-xl bg-white border border-[#DDD8CD] space-y-1.5 shadow-sm">
              <span className="font-bold text-[#2E4A35] block text-xs">
                1. VPS Gratis de tu Broker
              </span>
              <p className="text-[11px] text-[#575B62]">
                Brokers como <strong>ICMarkets, Pepperstone, Exness o HFM</strong> regalan un VPS patrocinado gratuito si tienes una cuenta real o cierto volumen mensual de trading. Puedes solicitarlo directo en su área de clientes.
              </p>
            </div>

            {/* Opción 2: MQL5 Virtual Hosting */}
            <div className="p-3.5 rounded-xl bg-white border border-[#DDD8CD] space-y-1.5 shadow-sm">
              <span className="font-bold text-[#191C21] block text-xs">
                2. Hosting Virtual de MT5 (1 Clic)
              </span>
              <p className="text-[11px] text-[#575B62]">
                En tu propio MetaTrader 5, haz clic derecho sobre tu cuenta en la ventana "Navegador" y selecciona <em>"Registrar un servidor virtual"</em>. Clona tu terminal y el bot a la nube de MetaQuotes en 1 minuto.
              </p>
            </div>

            {/* Opción 3: VPS Económico o Cloud */}
            <div className="p-3.5 rounded-xl bg-white border border-[#DDD8CD] space-y-1.5 shadow-sm">
              <span className="font-bold text-[#191C21] block text-xs">
                3. VPS Barato ($4 - $8/mes)
              </span>
              <p className="text-[11px] text-[#575B62]">
                Empresas como <strong>Contabo, ForexVPS o Kamatera</strong> ofrecen servidores Windows por unos pocos dólares al mes, o la capa gratuita de por vida de <strong>Oracle Cloud</strong>.
              </p>
            </div>
          </div>

          {/* Workflow en 3 pasos */}
          <div className="p-3.5 rounded-xl bg-white border border-[#C5DDCB] space-y-2">
            <span className="font-bold text-[#2E4A35] text-xs block">
              El flujo de trabajo en 3 pasos:
            </span>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-[#3F434A] pl-1 font-medium">
              <li>Te conectas al VPS desde tu PC o celular con la app gratuita <strong>"Escritorio Remoto" (Microsoft Remote Desktop)</strong>.</li>
              <li>Abres MetaTrader 5 o ejecutas <code className="bg-[#FAF8F3] px-1 py-0.5 rounded border border-[#DDD8CD] font-mono">python marketsense_standalone_bot.py</code> dentro del VPS.</li>
              <li><strong>Cierras la ventana de Escritorio Remoto y apagas tu PC.</strong> El bot sigue operando 24/7 en la nube y envía el saldo a este panel web para que lo consultes desde tu teléfono móvil cuando quieras.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
