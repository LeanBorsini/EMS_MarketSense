import { StrategyConfig } from '../types/execution';

export const INITIAL_STRATEGIES: StrategyConfig[] = [
  {
    id: 'strat-us500-rebound',
    name: 'MarketSense US500 Suelo Institucional',
    symbol: 'US500',
    source: 'MARKETSENSE_SCRIPT',
    timeframe: 'M15',
    mode: 'INTRADAY',
    scriptCode: `//@version=5
strategy("MarketSense US500 Suelo Institucional", overlay=true, margin_long=100)
// Conexión oficial de MarketSense
// Detecta acumulación tras 3 días en zona roja y absorción de volumen
len = input.int(20, "EMA Institucional")
src = close
ema20 = ta.ema(src, len)
rsiVal = ta.rsi(src, 14)

longCondition = ta.crossover(src, ema20) and rsiVal > 48 and rsiVal < 62
if (longCondition)
    strategy.entry("MS_Long", strategy.long)
    // Trailing y SL gestionado por el Hub de Ejecución`,
    isActive: true,
    targetRiskReward: 2.5,
    slMethod: 'ATR',
    slParam: 1.5,
    tpParam: 3.75,
    executionType: 'AUTONOMOUS_24_7',
    winRate: 64.2,
    totalTrades: 38,
    profitFactor: 2.18,
    lastSignal: {
      action: 'BUY',
      timestamp: 'Hoy 14:32 UTC',
      price: 5808.20,
      reason: 'Absorción de volumen en soporte 5800 + cruce EMA institucional',
    },
  },
  {
    id: 'strat-gold-asymmetry',
    name: 'MarketSense XAUUSD Rebote Oro',
    symbol: 'XAUUSD',
    source: 'MARKETSENSE_SCRIPT',
    timeframe: 'M5',
    mode: 'SCALPING',
    scriptCode: `//@version=5
strategy("MarketSense XAUUSD Rebote Oro", overlay=true)
// Filtro de liquidez en Londres/NY
sessionOpen = time(timeframe.period, "0800-1630")
atrVal = ta.atr(14)
pullback = low <= ta.lowest(low, 20)[1] and close > open

if (pullback and not na(sessionOpen))
    strategy.entry("Gold_Scalp", strategy.long)`,
    isActive: true,
    targetRiskReward: 1.8,
    slMethod: 'ATR',
    slParam: 1.2,
    tpParam: 2.16,
    executionType: 'AUTONOMOUS_24_7',
    winRate: 58.5,
    totalTrades: 52,
    profitFactor: 1.84,
    lastSignal: {
      action: 'BUY',
      timestamp: 'Ayer 15:10 UTC',
      price: 2648.50,
      reason: 'Rechazo de mínimos con mecha de absorción en sesión americana',
    },
  },
  {
    id: 'strat-nasdaq-breakout',
    name: 'MarketSense NAS100 Momentum Wall St',
    symbol: 'NAS100',
    source: 'PYTHON_AUTONOMOUS',
    timeframe: 'M15',
    mode: 'INTRADAY',
    scriptCode: `# marketsense_bot.py (Fedora / Cloud Runner)
import MetaTrader5 as mt5

def evaluate_nasdaq():
    candles = mt5.copy_rates_from_pos("NAS100", mt5.TIMEFRAME_M15, 0, 50)
    # Lógica de ruptura de rango inicial de apertura (IB 15m)
    pass`,
    isActive: false,
    targetRiskReward: 3.0,
    slMethod: 'SWING',
    slParam: 15.0,
    tpParam: 45.0,
    executionType: 'AUTONOMOUS_24_7',
    winRate: 51.0,
    totalTrades: 29,
    profitFactor: 1.95,
  },
];
