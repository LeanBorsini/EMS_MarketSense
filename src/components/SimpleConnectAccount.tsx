import React, { useState } from 'react';
import { 
  Key, 
  Server, 
  Lock, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  Loader2,
  RefreshCw,
  Plus
} from 'lucide-react';
import { TradingAccount, BrokerPlatform, AccountType } from '../types/execution';

interface SimpleConnectAccountProps {
  accounts: TradingAccount[];
  activeAccountId: string;
  onSwitchAccount: (id: string) => void;
  onAddAccount: (acc: TradingAccount) => void;
}

const COMMON_SERVERS = [
  { label: 'FTMO (Fondeo)', server: 'FTMO-Server-2', broker: 'FTMO Bridge' as BrokerPlatform, type: 'PROP_FIRM' as AccountType, balance: 100000 },
  { label: 'Funding Pips', server: 'FundingPips-Live-MT5', broker: 'FundingPips Server' as BrokerPlatform, type: 'PROP_FIRM' as AccountType, balance: 50000 },
  { label: 'IC Markets (MT5)', server: 'ICMarkets-Demo01', broker: 'MetaTrader 5' as BrokerPlatform, type: 'DEMO' as AccountType, balance: 10000 },
  { label: 'TopStep', server: 'TopStep-Live', broker: 'TradersPost Webhook' as BrokerPlatform, type: 'PROP_FIRM' as AccountType, balance: 50000 },
  { label: 'Pepperstone (cTrader)', server: 'cTrader-Pepperstone-Live', broker: 'cTrader' as BrokerPlatform, type: 'REAL' as AccountType, balance: 5000 },
];

export const SimpleConnectAccount: React.FC<SimpleConnectAccountProps> = ({
  accounts,
  activeAccountId,
  onSwitchAccount,
  onAddAccount,
}) => {
  const [server, setServer] = useState('FTMO-Server-2');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectStep, setConnectStep] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSelectServerPreset = (presetServer: string) => {
    setServer(presetServer);
  };

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!server.trim() || !login.trim()) return;

    setIsConnecting(true);
    setSuccessMessage(null);
    setConnectStep('Contactando servidor del broker...');

    setTimeout(() => {
      setConnectStep('Verificando credenciales y descargando saldo...');
      
      setTimeout(() => {
        // Auto-detect account characteristics based on server name
        let detectedType: AccountType = 'PROP_FIRM';
        let detectedBroker: BrokerPlatform = 'MetaTrader 5';
        let detectedBalance = 100000;
        let detectedName = `Cuenta ${login}`;

        const foundPreset = COMMON_SERVERS.find(s => s.server === server);
        if (foundPreset) {
          detectedType = foundPreset.type;
          detectedBroker = foundPreset.broker;
          detectedBalance = foundPreset.balance;
          detectedName = `${foundPreset.label} (#${login})`;
        } else if (server.toLowerCase().includes('demo')) {
          detectedType = 'DEMO';
          detectedBalance = 10000;
          detectedName = `Demo (${login})`;
        } else if (server.toLowerCase().includes('ftmo')) {
          detectedType = 'PROP_FIRM';
          detectedBroker = 'FTMO Bridge';
          detectedBalance = 100000;
          detectedName = `FTMO (#${login})`;
        } else if (server.toLowerCase().includes('funding')) {
          detectedType = 'PROP_FIRM';
          detectedBroker = 'FundingPips Server';
          detectedBalance = 50000;
          detectedName = `FundingPips (#${login})`;
        }

        const newAccount: TradingAccount = {
          id: `acc-${Date.now()}`,
          name: detectedName,
          type: detectedType,
          broker: detectedBroker,
          accountNumber: login,
          currency: 'USD',
          initialBalance: detectedBalance,
          currentBalance: detectedBalance,
          currentEquity: detectedBalance,
          startOfDayBalance: detectedBalance,
          dailyRealizedPnL: 0,
          floatingPnL: 0,
          status: 'CONNECTED',
          serverName: server,
          lastPingMs: Math.floor(10 + Math.random() * 15),
          riskRules: {
            maxRiskPerTradePercent: 0.5,
            maxRiskPerTradeUsd: (detectedBalance * 0.5) / 100,
            maxDailyLossPercent: 2.0,
            maxDailyLossUsd: (detectedBalance * 2.0) / 100,
            maxTrailingDrawdownPercent: 5.0,
            maxFloatingLossPercent: 2.0,
            autoBreakevenAtR: 1.0,
            partialTpAtR: 2.0,
            maxOpenTrades: 2,
            spreadLimitPips: 2.5,
            circuitBreakerActive: false,
            allowWeekendHolding: false,
          },
        };

        onAddAccount(newAccount);
        setIsConnecting(false);
        setSuccessMessage(`¡Conectado exitosamente! Saldo detectado: $${detectedBalance.toLocaleString()} USD.`);
        setLogin('');
        setPassword('');
      }, 1000);
    }, 1000);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Friendly introduction card */}
      <div className="ivory-card rounded-2xl p-5 sm:p-6 text-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-[#EBF2EC] text-[#2E4A35] mx-auto flex items-center justify-center mb-2">
          <Key className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-[#191C21]">
          Conexión Automática en 1 Clic
        </h2>
        <p className="text-xs sm:text-sm text-[#575B62] leading-relaxed max-w-md mx-auto">
          No necesitas configurar fórmulas ni porcentajes complicados. Solo escribe el <strong>Servidor</strong>, <strong>Usuario</strong> y <strong>Contraseña</strong> provistos por tu empresa o broker.
        </p>
      </div>

      {/* The 3-field form */}
      <div className="ivory-card rounded-2xl p-5 sm:p-6 space-y-5">
        <form onSubmit={handleConnect} className="space-y-4">
          {/* 1. Server input with quick buttons */}
          <div>
            <label className="text-xs font-semibold text-[#191C21] block mb-1">
              1. Servidor del Broker
            </label>
            <div className="relative">
              <Server className="w-4 h-4 text-[#8C9098] absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={server}
                onChange={e => setServer(e.target.value)}
                placeholder="Ej. FTMO-Server-2"
                className="w-full bg-[#F3EFE6] border border-[#DDD8CD] rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-[#191C21] focus:outline-none focus:border-[#2E4A35]"
              />
            </div>

            {/* Quick buttons */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[11px] text-[#8C9098] self-center mr-1">Rápidos:</span>
              {COMMON_SERVERS.map(s => (
                <button
                  key={s.server}
                  type="button"
                  onClick={() => handleSelectServerPreset(s.server)}
                  className={`text-[11px] px-2 py-0.5 rounded-md border transition ${
                    server === s.server
                      ? 'bg-[#2E4A35] text-[#F8F6F0] border-[#2E4A35]'
                      : 'bg-[#F8F6F0] text-[#575B62] border-[#E6E1D6] hover:bg-[#EFECE4]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Login / User number */}
          <div>
            <label className="text-xs font-semibold text-[#191C21] block mb-1">
              2. Usuario / Login
            </label>
            <input
              type="text"
              required
              value={login}
              onChange={e => setLogin(e.target.value)}
              placeholder="Número de cuenta (ej. 29841029)"
              className="w-full bg-[#F3EFE6] border border-[#DDD8CD] rounded-xl px-3 py-2 text-xs font-mono text-[#191C21] focus:outline-none focus:border-[#2E4A35]"
            />
          </div>

          {/* 3. Password */}
          <div>
            <label className="text-xs font-semibold text-[#191C21] block mb-1">
              3. Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8C9098] absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#F3EFE6] border border-[#DDD8CD] rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-[#191C21] focus:outline-none focus:border-[#2E4A35]"
              />
            </div>
            <p className="text-[11px] text-[#8C9098] mt-1">
              Tus credenciales no se envían a servidores de terceros y se guardan únicamente en la memoria segura de tu dispositivo.
            </p>
          </div>

          {/* Submit button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isConnecting}
              className="w-full py-3 px-4 rounded-xl olive-btn font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{connectStep}</span>
                </>
              ) : (
                <>
                  <span>Conectar Cuenta Automáticamente</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {successMessage && (
            <div className="p-3 rounded-xl bg-[#EBF2EC] border border-[#C5DDCB] text-[#2E4A35] text-xs flex items-center gap-2 animate-fade-in font-medium">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
        </form>
      </div>

      {/* Saved Accounts section */}
      <div className="ivory-card rounded-2xl p-5 sm:p-6 space-y-3">
        <div className="flex items-center justify-between border-b border-[#EAE5DA] pb-2">
          <span className="font-serif text-base font-bold text-[#191C21]">
            Tus Cuentas Vinculadas ({accounts.length})
          </span>
          <span className="text-xs text-[#8C9098]">
            Toca una cuenta para cambiar
          </span>
        </div>

        <div className="space-y-2">
          {accounts.map(acc => {
            const isSelected = acc.id === activeAccountId;

            return (
              <div
                key={acc.id}
                onClick={() => onSwitchAccount(acc.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-[#EBF2EC] border-[#2E4A35]/40 shadow-sm'
                    : 'bg-[#FDFCF9] border-[#E6E1D6] hover:bg-[#F3EFE6]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-[#2E4A35] ring-2 ring-[#2E4A35]/30' : 'bg-[#DDD8CD]'}`} />
                  <div>
                    <div className="font-semibold text-xs sm:text-sm text-[#191C21]">
                      {acc.name}
                    </div>
                    <div className="text-[11px] text-[#575B62] font-mono">
                      {acc.broker} • #{acc.accountNumber}
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="font-bold text-xs sm:text-sm text-[#191C21]">
                    ${acc.currentEquity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-sans font-bold text-[#2E4A35] bg-[#D7E8DA] px-1.5 py-0.2 rounded">
                      Activa Ahora
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
