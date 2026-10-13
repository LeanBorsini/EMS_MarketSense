export type AccountType = 'PROP_FIRM' | 'DEMO' | 'REAL';

export type BrokerPlatform = 
  | 'MetaTrader 5' 
  | 'MetaTrader 4' 
  | 'cTrader' 
  | 'FTMO Bridge' 
  | 'FundingPips Server' 
  | 'TradersPost Webhook'
  | 'Interactive Brokers'
  | 'Crypto CCXT (Binance/Bybit)';

export interface AccountRiskRules {
  maxRiskPerTradePercent: number; // e.g., 0.5% or 1.0%
  maxRiskPerTradeUsd: number;     // e.g., $500
  maxDailyLossPercent: number;    // e.g., 2.0% (strict guardrail below prop firm's 4.5%)
  maxDailyLossUsd: number;        // e.g., $2,000
  maxTrailingDrawdownPercent: number; // e.g., 5.0%
  maxFloatingLossPercent: number; // e.g., 2.5%
  autoBreakevenAtR: number;       // e.g. 1.0 (move SL to entry when +1R)
  partialTpAtR: number;          // e.g. 2.0 (take 50% profit at +2R)
  trailingStopTriggerR?: number; // e.g. 1.5 R
  maxOpenTrades: number;         // e.g. 3
  spreadLimitPips: number;       // e.g. 2.5 pips
  circuitBreakerActive: boolean; // if triggered, halts all execution
  allowWeekendHolding: boolean;
}

export interface TradingAccount {
  id: string;
  name: string;
  type: AccountType;
  broker: BrokerPlatform;
  accountNumber: string;
  currency: 'USD' | 'EUR' | 'GBP';
  initialBalance: number;
  currentBalance: number;
  currentEquity: number;
  startOfDayBalance: number;
  dailyRealizedPnL: number;
  floatingPnL: number;
  status: 'CONNECTED' | 'DISCONNECTED' | 'CIRCUIT_BREAKER';
  serverName: string;
  lastPingMs: number;
  riskRules: AccountRiskRules;
}

export interface StrategyConfig {
  id: string;
  name: string;
  symbol: string;
  source: 'MARKETSENSE_SCRIPT' | 'TRADINGVIEW_WEBHOOK' | 'PYTHON_AUTONOMOUS' | 'JSON_SIGNAL';
  timeframe: 'M1' | 'M5' | 'M15' | 'H1' | 'H4' | 'D1';
  mode: 'INTRADAY' | 'SWING' | 'SCALPING';
  scriptCode: string;
  isActive: boolean;
  targetRiskReward: number; // e.g. 2.5
  slMethod: 'ATR' | 'SWING' | 'FIXED_PIPS' | 'PERCENT';
  slParam: number; // e.g. 1.5 for ATR or 15 for pips
  tpParam: number; // e.g. 3.0 for ATR or 35 for pips
  executionType: 'AUTONOMOUS_24_7' | 'HYBRID_APPROVAL';
  winRate: number;
  totalTrades: number;
  profitFactor: number;
  lastSignal?: {
    action: 'BUY' | 'SELL' | 'CLOSE';
    timestamp: string;
    price: number;
    reason: string;
  };
}

export interface TradeOrder {
  id: string;
  accountId: string;
  strategyId?: string;
  symbol: string;
  direction: 'BUY' | 'SELL';
  lotSize: number;
  openPrice: number;
  currentPrice: number;
  closePrice?: number;
  sl: number;
  tp: number;
  originalSl: number;
  breakevenMoved: boolean;
  status: 'OPEN' | 'CLOSED' | 'CANCELLED';
  openTime: string;
  closeTime?: string;
  grossPnL: number;
  spreadCost: number;
  commissionCost: number;
  netPnL: number;
  rMultiple: number;
  maePips: number; // Maximum Adverse Excursion (distancia desfavorable máxima hacia el SL)
  mfePips: number; // Maximum Favorable Excursion (máxima ganancia flotante antes de cerrar)
  isAutonomous: boolean; // true = IA / Bot, false = Humano discrecional
  notes?: string;
  postMortem?: {
    category: 
      | 'WIN_CLEAN' 
      | 'SL_HIT_VOLATILITY' 
      | 'SL_HIT_FALSE_BREAKOUT' 
      | 'COMMISSION_DRAG' 
      | 'EARLY_EXIT' 
      | 'NEWS_SPIKE'
      | 'TRAILING_SL_SAVED';
    verdict: string;
    rootCause: string;
    learningObservation: string;
    aiTuningTip: string;
    disciplineScore: number; // 1 to 10
  };
}

export interface MarketTicker {
  symbol: string;
  name: string;
  price: number;
  bid: number;
  ask: number;
  spreadPips: number;
  change24h: number;
  high24h: number;
  low24h: number;
  pipSize: number;
  pipValuePerLot: number;
  category: 'INDICES' | 'METALS' | 'FOREX' | 'CRYPTO';
}

export interface DaemonLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR' | 'EXECUTION';
  symbol?: string;
  message: string;
}

export interface ComparativeStats {
  period: 'ALL' | '30D' | '7D';
  ai: {
    totalTrades: number;
    winRate: number;
    profitFactor: number;
    netPnL: number;
    maxDailyDrawdown: number;
    avgR: number;
    adherenceToPlan: number; // %
  };
  human: {
    totalTrades: number;
    winRate: number;
    profitFactor: number;
    netPnL: number;
    maxDailyDrawdown: number;
    avgR: number;
    adherenceToPlan: number; // %
  };
}
