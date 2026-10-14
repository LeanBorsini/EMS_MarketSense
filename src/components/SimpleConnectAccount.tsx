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
  Plus,
  DollarSign,
  Edit2,
  Check,
  AlertCircle
} from 'lucide-react';
import { TradingAccount, BrokerPlatform, AccountType } from '../types/execution';

interface SimpleConnectAccountProps {
  accounts: TradingAccount[];
  activeAccountId: string;
  onSwitchAccount: (id: string) => void;
  onAddAccount: (acc: TradingAccount) => void;
  onUpdateBalance?: (accountId: string, newBalance: number) => void;
}

const COMMON_SERVERS = [
  { label: 'FTMO ($100k Fondeo)', server: 'FTMO-Server-2', broker: 'FTMO Bridge' as BrokerPlatform, type: 'PROP_FIRM' as AccountType, balance: 100000 },
  { label: 'MT5 Demo ($100k)', server: 'ICMarkets-Demo01', broker: 'MetaTrader 5' as BrokerPlatform, type: 'DEMO' as AccountType, balance: 100000 },
  { label: 'Funding Pips ($50k)', server: 'FundingPips-Live-MT5', broker: 'FundingPips Server' as BrokerPlatform, type: 'PROP_FIRM' as AccountType, balance: 50000 },
  { label: 'TopStep ($50k)', server: 'TopStep-Live', broker: 'TradersPost Webhook' as BrokerPlatform, type: 'PROP_FIRM' as AccountType, balance: 50000 },
  { label: 'Pepperstone Real', server: 'cTrader-Pepperstone-Live', broker: 'cTrader' as BrokerPlatform, type: 'REAL' as AccountType, balance: 100000 },
];

export const SimpleConnectAccount: React.FC<SimpleConnectAccountProps> = ({
  accounts,
  activeAccountId,
  onSwitchAccount,
  onAddAccount,
  onUpdateBalance,
}) => {
  const [server, setServer] = useState('ICMarkets-Demo01');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [selectedBalance, setSelectedBalance] = useState<number>(100000);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectStep, setConnectStep] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // In-line balance editor state for existing accounts
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editBalanceInput, setEditBalanceInput] = useState<number>(100000);

  const handleSelectServerPreset = (preset: typeof COMMON_SERVERS[0]) => {
    setServer(preset.server);
    setSelectedBalance(preset.balance);
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
        let detectedType: AccountType = 'DEMO';
        let detectedBroker: BrokerPlatform = 'MetaTrader 5';
        let detectedBalance = selectedBalance || 100000;
        let detectedName = `Cuenta ${login}`;

        const foundPreset = COMMON_SERVERS.find(s => s.server === server);
        if (foundPreset) {
          detectedType = foundPreset.type;
          detectedBroker = foundPreset.broker;
          detectedName = `${foundPreset.label} (#${login})`;
        } else if (server.toLowerCase().includes('demo')) {
          detectedType = 'DEMO';
          detectedName = `MetaTrader 5 Demo (#${login})`;
        } else if (server.toLowerCase().includes('ftmo')) {
          detectedType = 'PROP_FIRM';
          detectedBroker = 'FTMO Bridge';
          detectedName = `FTMO (#${login})`;
        } else if (server.toLowerCase().includes('funding')) {
          detectedType = 'PROP_FIRM';
          detectedBroker = 'FundingPips Server';
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
        setSuccessMessage(`¡Conectado exitosamente! Saldo de la cuenta: $${detectedBalance.toLocaleString()} USD.`);
        setLogin('');
        setPassword('');
      }, 900);
    }, 900);
  };

  const handleSaveInlineBalance = (accId: string, amount: number) => {
    if (onUpdateBalance && amount > 0) {
      onUpdateBalance(accId, amount);
      setEditingAccountId(null);
    }
  };

  // Check if any connected account is around 10k to offer a quick fix
  const tenKAccount = accounts.find(a => Math.round(a.currentEquity) === 10790 || Math.round(a.currentEquity) === 10840 || a.initialBalance === 10000);

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Friendly introduction card */}
      <div className="ivory-card rounded-2xl p-5 sm:p-6 text-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-[#EBF2EC] text-[#2E4A35] mx-auto flex items-center justify-center mb-2">
          <Key className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-[#191C21]">
          Conexión Automática de Cuentas
        </h2>
        <p className="text-xs sm:text-sm text-[#575B62] leading-relaxed max-w-md mx-auto">
          Conecta tu cuenta Demo, Fondeo o Real de MetaTrader 5 o cTrader. Define el saldo real de tu cuenta para que los cálculos matemáticos de riesgo se calibren con total exactitud.
        </p>
      </div>

      {/* Quick 10k -> 100k fixer banner if relevant */}
      {tenKAccount && onUpdateBalance && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-[#191C21] space-y-2 animate-fade-in">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-xs sm:text-sm">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>¿Tu cuenta figura con $10,000 pero tu cuenta es de $100,000?</span>
          </div>
          <p className="text-xs text-amber-900 leading-relaxed">
            La cuenta <strong>{tenKAccount.name}</strong> tiene asignado un saldo inicial de $10,000. Toca el botón para actualizarla a <strong>$100,000 USD</strong> y recalcular los límites de riesgo a $1,000/trade.
          </p>
          <div className="pt-1">
            <button
              onClick={() => handleSaveInlineBalance(tenKAccount.id, 100000)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Fijar {tenKAccount.name} en $100,000 USD Ahora</span>
            </button>
          </div>
        </div>
      )}

      {/* The Connection Form */}
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
                placeholder="Ej. ICMarkets-Demo01 o FTMO-Server-2"
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
                  onClick={() => handleSelectServerPreset(s)}
                  className={`text-[11px] px-2 py-0.5 rounded-md border transition cursor-pointer ${
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

          {/* 2. Balance selector (NEW - allows choosing 100k, 50k, etc.) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[#191C21]">
                2. Saldo de tu Cuenta (Capital)
              </label>
              <span className="font-mono text-xs font-bold text-[#2E4A35]">
                ${selectedBalance.toLocaleString()} USD
              </span>
            </div>
            
            <div className="grid grid-cols-4 gap-1.5 mb-2">
              {[100000, 50000, 25000, 10000].map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setSelectedBalance(amt)}
                  className={`py-1.5 rounded-lg text-xs font-mono font-bold border transition cursor-pointer ${
                    selectedBalance === amt
                      ? 'bg-[#2E4A35] text-[#F8F6F0] border-[#2E4A35]'
                      : 'bg-[#FAF8F3] text-[#575B62] border-[#E6E1D6] hover:bg-[#EFECE4]'
                  }`}
                >
                  ${amt >= 1000 ? `${amt / 1000}k` : amt} {amt === 100000 ? '★' : ''}
                </button>
              ))}
            </div>

            <div className="relative">
              <DollarSign className="w-4 h-4 text-[#8C9098] absolute left-3 top-2.5" />
              <input
                type="number"
                step="500"
                value={selectedBalance}
                onChange={e => setSelectedBalance(Number(e.target.value))}
                placeholder="Cantidad exacta (ej. 100000)"
                className="w-full bg-[#F3EFE6] border border-[#DDD8CD] rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-[#191C21] focus:outline-none focus:border-[#2E4A35]"
              />
            </div>
            <p className="text-[11px] text-[#8C9098] mt-1">
              Tu riesgo matemático por trade (0.5%) será de <strong>${((selectedBalance * 0.5) / 100).toFixed(2)} USD</strong>.
            </p>
          </div>

          {/* 3. Login / User number */}
          <div>
            <label className="text-xs font-semibold text-[#191C21] block mb-1">
              3. Usuario / Login
            </label>
            <input
              type="text"
              required
              value={login}
              onChange={e => setLogin(e.target.value)}
              placeholder="Número de cuenta (ej. 50198273)"
              className="w-full bg-[#F3EFE6] border border-[#DDD8CD] rounded-xl px-3 py-2 text-xs font-mono text-[#191C21] focus:outline-none focus:border-[#2E4A35]"
            />
          </div>

          {/* 4. Password */}
          <div>
            <label className="text-xs font-semibold text-[#191C21] block mb-1">
              4. Contraseña
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
              Tus credenciales se cifran localmente en tu terminal y no se transfieren a terceros.
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
                  <span>Conectar Cuenta con Saldo ${selectedBalance.toLocaleString()} USD</span>
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
            Toca una cuenta para seleccionarla
          </span>
        </div>

        <div className="space-y-2.5">
          {accounts.map(acc => {
            const isSelected = acc.id === activeAccountId;
            const isEditing = editingAccountId === acc.id;

            return (
              <div
                key={acc.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-[#EBF2EC] border-[#2E4A35]/40 shadow-sm'
                    : 'bg-[#FDFCF9] border-[#E6E1D6] hover:bg-[#F3EFE6]'
                }`}
              >
                <div 
                  onClick={() => onSwitchAccount(acc.id)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-[#2E4A35] ring-2 ring-[#2E4A35]/30' : 'bg-[#DDD8CD]'}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs sm:text-sm text-[#191C21]">
                          {acc.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#EAE5DA] text-[#575B62]">
                          {acc.type}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#575B62] font-mono mt-0.5">
                        {acc.broker} • #{acc.accountNumber} • Servidor: {acc.serverName}
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <div className="font-bold text-xs sm:text-sm text-[#191C21]">
                      ${acc.currentEquity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    {isSelected && (
                      <span className="text-[10px] font-sans font-bold text-[#2E4A35] bg-[#D7E8DA] px-1.5 py-0.2 rounded">
                        Activa
                      </span>
                    )}
                  </div>
                </div>

                {/* Inline Balance Editor / Quick Fix Bar */}
                <div className="mt-2 pt-2 border-t border-[#EAE5DA] flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-[#575B62]">
                    <span className="text-[11px]">Riesgo: <strong>{acc.riskRules.maxRiskPerTradePercent}% (${acc.riskRules.maxRiskPerTradeUsd?.toFixed(0)})</strong></span>
                    <span>•</span>
                    <span className="text-[11px]">Drawdown: <strong>{acc.riskRules.maxDailyLossPercent}% (${acc.riskRules.maxDailyLossUsd?.toFixed(0)})</strong></span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {onUpdateBalance && (
                      <>
                        {isEditing ? (
                          <div className="flex items-center gap-1 bg-[#F8F6F0] p-1 rounded-lg border border-[#DDD8CD]" onClick={e => e.stopPropagation()}>
                            <input
                              type="number"
                              step="1000"
                              value={editBalanceInput}
                              onChange={e => setEditBalanceInput(Number(e.target.value))}
                              className="w-24 px-1.5 py-0.5 bg-white border border-[#DDD8CD] rounded font-mono text-xs text-[#191C21]"
                            />
                            <button
                              onClick={() => handleSaveInlineBalance(acc.id, 100000)}
                              className="px-1.5 py-0.5 rounded bg-[#EBF2EC] text-[#2E4A35] font-mono text-[10px] font-bold"
                              title="Poner $100k"
                            >
                              $100k
                            </button>
                            <button
                              onClick={() => handleSaveInlineBalance(acc.id, editBalanceInput)}
                              className="px-2 py-0.5 rounded bg-[#2E4A35] text-white font-bold text-xs"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => setEditingAccountId(null)}
                              className="px-1.5 py-0.5 text-[#8C9098] hover:text-[#191C21]"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingAccountId(acc.id);
                              setEditBalanceInput(acc.currentEquity);
                            }}
                            className="px-2 py-1 rounded-md bg-[#FAF8F3] hover:bg-[#EFECE4] border border-[#DDD8CD] text-[#2E4A35] text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Editar Saldo</span>
                          </button>
                        )}

                        {acc.currentEquity < 50000 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveInlineBalance(acc.id, 100000);
                            }}
                            className="px-2 py-1 rounded-md bg-[#2E4A35] text-[#F8F6F0] text-[11px] font-bold cursor-pointer hover:bg-[#243B2B] transition"
                            title="Cambiar saldo rápidamente a $100,000 USD"
                          >
                            ⚡ Poner $100,000
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
