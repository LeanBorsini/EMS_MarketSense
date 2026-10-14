import React, { useState } from 'react';
import { 
  X, 
  Layers, 
  Plus, 
  Check, 
  ShieldAlert, 
  ShieldCheck, 
  Server, 
  Key, 
  Lock, 
  DollarSign, 
  Percent, 
  RefreshCw,
  Trash2 
} from 'lucide-react';
import { TradingAccount, BrokerPlatform, AccountType } from '../types/execution';

interface AccountManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: TradingAccount[];
  activeAccountId: string;
  onSwitchAccount: (id: string) => void;
  onUpdateRiskRules: (id: string, rules: Partial<TradingAccount['riskRules']>) => void;
  onAddAccount: (acc: TradingAccount) => void;
  onRemoveAccount?: (id: string) => void;
  onResetCircuitBreaker: (id: string) => void;
}

export const AccountManagerModal: React.FC<AccountManagerModalProps> = ({
  isOpen,
  onClose,
  accounts,
  activeAccountId,
  onSwitchAccount,
  onUpdateRiskRules,
  onAddAccount,
  onRemoveAccount,
  onResetCircuitBreaker,
}) => {
  const [activeTab, setActiveTab] = useState<'LIST' | 'RULES' | 'ADD'>('LIST');
  const activeAccount = accounts.find(a => a.id === activeAccountId) || accounts[0];

  // Form state for rules
  const [maxRiskPercent, setMaxRiskPercent] = useState(activeAccount.riskRules.maxRiskPerTradePercent);
  const [maxDailyLossPercent, setMaxDailyLossPercent] = useState(activeAccount.riskRules.maxDailyLossPercent);
  const [maxTrailingDrawdownPercent, setMaxTrailingDrawdownPercent] = useState(activeAccount.riskRules.maxTrailingDrawdownPercent);
  const [autoBreakevenAtR, setAutoBreakevenAtR] = useState(activeAccount.riskRules.autoBreakevenAtR);

  // Form state for new account
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<AccountType>('PROP_FIRM');
  const [newBroker, setNewBroker] = useState<BrokerPlatform>('MetaTrader 5');
  const [newAccountNum, setNewAccountNum] = useState('');
  const [newCurrency, setNewCurrency] = useState<'USD' | 'EUR'>('USD');
  const [newBalance, setNewBalance] = useState(100000);
  const [newServer, setNewServer] = useState('FTMO-Live-Server');

  if (!isOpen) return null;

  const handleSaveRules = () => {
    onUpdateRiskRules(activeAccount.id, {
      maxRiskPerTradePercent: maxRiskPercent,
      maxRiskPerTradeUsd: (activeAccount.initialBalance * maxRiskPercent) / 100,
      maxDailyLossPercent: maxDailyLossPercent,
      maxDailyLossUsd: (activeAccount.startOfDayBalance * maxDailyLossPercent) / 100,
      maxTrailingDrawdownPercent: maxTrailingDrawdownPercent,
      autoBreakevenAtR: autoBreakevenAtR,
    });
    setActiveTab('LIST');
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newAcc: TradingAccount = {
      id: `acc-${Date.now()}`,
      name: newName,
      type: newType,
      broker: newBroker,
      accountNumber: newAccountNum || Math.floor(1000000 + Math.random() * 9000000).toString(),
      currency: newCurrency,
      initialBalance: Number(newBalance),
      currentBalance: Number(newBalance),
      currentEquity: Number(newBalance),
      startOfDayBalance: Number(newBalance),
      dailyRealizedPnL: 0,
      floatingPnL: 0,
      status: 'CONNECTED',
      serverName: newServer,
      lastPingMs: 16,
      riskRules: {
        maxRiskPerTradePercent: 0.5,
        maxRiskPerTradeUsd: (Number(newBalance) * 0.5) / 100,
        maxDailyLossPercent: 2.0,
        maxDailyLossUsd: (Number(newBalance) * 2.0) / 100,
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

    onAddAccount(newAcc);
    setActiveTab('LIST');
    setNewName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="tactile-card rounded-2xl w-full max-w-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <h3 className="font-heading text-lg font-bold text-white">
              Gestor de Cuentas y Credenciales de Broker
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 pt-2">
          <button
            onClick={() => setActiveTab('LIST')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'LIST'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Cuentas Vinculadas ({accounts.length})
          </button>
          <button
            onClick={() => setActiveTab('RULES')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'RULES'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Reglas de Riesgo de Cuenta Activa
          </button>
          <button
            onClick={() => setActiveTab('ADD')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'ADD'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            + Conectar Nueva Cuenta
          </button>
        </div>

        {/* Content body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {activeTab === 'LIST' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Selecciona la cuenta que el motor autónomo 24/7 operará activamente. Puedes alternar en cualquier momento sin perder historial.
              </p>

              <div className="space-y-2.5">
                {accounts.map(acc => {
                  const isSelected = acc.id === activeAccountId;
                  const isCB = acc.status === 'CIRCUIT_BREAKER';

                  return (
                    <div
                      key={acc.id}
                      onClick={() => onSwitchAccount(acc.id)}
                      className={`rounded-xl p-3.5 border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/60 shadow-lg'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          isCB ? 'bg-red-500 animate-ping' : isSelected ? 'bg-amber-400' : 'bg-slate-600'
                        }`} />

                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-sm text-slate-100">
                              {acc.name}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              {acc.type === 'PROP_FIRM' ? 'CUENTA FONDEO' : acc.type}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">
                            {acc.broker} • Servidor: {acc.serverName} • N°: {acc.accountNumber}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end space-x-4 font-mono text-xs">
                        <div className="text-left sm:text-right">
                          <div className="font-bold text-slate-200">
                            ${acc.currentEquity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Riesgo: {acc.riskRules.maxRiskPerTradePercent}% | Drawdown máx: {acc.riskRules.maxDailyLossPercent}%
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isSelected ? (
                            <span className="px-2 py-1 rounded bg-amber-500 text-slate-950 font-bold text-[11px] flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Activa
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSwitchAccount(acc.id);
                              }}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer"
                            >
                              Activar
                            </button>
                          )}

                          {onRemoveAccount && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (accounts.length <= 1) {
                                  alert('No puedes eliminar la única cuenta vinculada. Conecta otra cuenta primero.');
                                  return;
                                }
                                if (confirm(`¿Desvincular la cuenta "${acc.name}"?`)) {
                                  onRemoveAccount(acc.id);
                                }
                              }}
                              className={`p-1 rounded text-xs transition cursor-pointer ${
                                accounts.length <= 1
                                  ? 'text-slate-600 cursor-not-allowed'
                                  : 'text-rose-400 hover:text-rose-300 hover:bg-rose-950/40'
                              }`}
                              title={accounts.length <= 1 ? 'Cuenta única (no se puede desvincular)' : 'Desvincular cuenta'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'RULES' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                <span className="font-bold text-amber-400">Protección Institucional de Fondeo:</span>
                {' '}Configura los límites para <strong>{activeAccount.name}</strong>. Si el flotante o la pérdida diaria toca estos valores, el bot suspende la operativa automáticamente antes de violar las reglas de la prop firm.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Max Risk Per Trade */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Riesgo Máximo por Operación (% Equity)
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">
                    El bot calcula automáticamente el lotaje exacto para que el Stop Loss cueste solo este porcentaje.
                  </p>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="3.0"
                      value={maxRiskPercent}
                      onChange={e => setMaxRiskPercent(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-amber-500"
                    />
                    <span className="font-mono text-slate-400">%</span>
                  </div>
                  <div className="text-[11px] font-mono text-amber-400/80 mt-1">
                    Equivale a: ~${((activeAccount.currentEquity * maxRiskPercent) / 100).toFixed(2)} USD
                  </div>
                </div>

                {/* Max Daily Loss (Circuit Breaker) */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Pérdida Diaria Máxima (Circuit Breaker %)
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Tope diario estricto. Recomendado: 1.5% - 2.0% (muy seguro frente al 4.5% o 5% de la firma).
                  </p>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      step="0.5"
                      min="1.0"
                      max="4.5"
                      value={maxDailyLossPercent}
                      onChange={e => setMaxDailyLossPercent(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-amber-500"
                    />
                    <span className="font-mono text-slate-400">%</span>
                  </div>
                  <div className="text-[11px] font-mono text-amber-400/80 mt-1">
                    Tope diario: ~${((activeAccount.startOfDayBalance * maxDailyLossPercent) / 100).toFixed(2)} USD
                  </div>
                </div>

                {/* Max Trailing Drawdown */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Drawdown Máximo de Cuenta (Trailing %)
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Límite total de pérdida histórica de la cuenta.
                  </p>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      step="0.5"
                      min="3.0"
                      max="12.0"
                      value={maxTrailingDrawdownPercent}
                      onChange={e => setMaxTrailingDrawdownPercent(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-amber-500"
                    />
                    <span className="font-mono text-slate-400">%</span>
                  </div>
                </div>

                {/* Auto Breakeven Trigger */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Disparo de Auto-Breakeven (R-Múltiplo)
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Al alcanzar este beneficio en R, el SL se mueve automáticamente a precio de entrada +1 pip.
                  </p>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      step="0.2"
                      min="0.5"
                      max="3.0"
                      value={autoBreakevenAtR}
                      onChange={e => setAutoBreakevenAtR(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-amber-500"
                    />
                    <span className="font-mono text-slate-400">R</span>
                  </div>
                </div>
              </div>

              {activeAccount.status === 'CIRCUIT_BREAKER' && (
                <div className="p-3 rounded-lg bg-red-950/80 border border-red-700 flex items-center justify-between">
                  <span className="text-xs text-red-200">
                    El Circuit Breaker se encuentra actualmente BLOQUEADO para esta cuenta.
                  </span>
                  <button
                    onClick={() => onResetCircuitBreaker(activeAccount.id)}
                    className="px-3 py-1 rounded bg-red-800 hover:bg-red-700 text-white text-xs font-semibold"
                  >
                    Desbloquear Manualmente
                  </button>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveRules}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all"
                >
                  Guardar Reglas de Riesgo
                </button>
              </div>
            </div>
          )}

          {activeTab === 'ADD' && (
            <form onSubmit={handleCreateAccount} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Nombre o Etiqueta
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. FTMO 100k Challenge #2"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Tipo de Cuenta
                  </label>
                  <select
                    value={newType}
                    onChange={e => setNewType(e.target.value as AccountType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="PROP_FIRM">Cuenta de Fondeo (Prop Firm)</option>
                    <option value="DEMO">Demo ECN</option>
                    <option value="REAL">Cuenta Real Personal</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Plataforma / Broker
                  </label>
                  <select
                    value={newBroker}
                    onChange={e => setNewBroker(e.target.value as BrokerPlatform)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="MetaTrader 5">MetaTrader 5 (MT5)</option>
                    <option value="MetaTrader 4">MetaTrader 4 (MT4)</option>
                    <option value="FTMO Bridge">FTMO Bridge Direct</option>
                    <option value="FundingPips Server">FundingPips Server</option>
                    <option value="cTrader">cTrader FIX/API</option>
                    <option value="TradersPost Webhook">TradersPost Webhook Relay</option>
                    <option value="Crypto CCXT (Binance/Bybit)">Crypto CCXT</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Balance Inicial ($ o €)
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="1000"
                    value={newBalance}
                    onChange={e => setNewBalance(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Servidor del Broker
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. FTMO-Live-Server / ICMarkets-Live01"
                    value={newServer}
                    onChange={e => setNewServer(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    N° de Cuenta / Login
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 10492834"
                    value={newAccountNum}
                    onChange={e => setNewAccountNum(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all"
                >
                  Vincular y Comenzar a Operar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
