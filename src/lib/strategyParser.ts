import { StrategyConfig } from '../types/execution';

export interface ParsedStrategySummary {
  name: string;
  symbol: string;
  timeframe: 'M1' | 'M5' | 'M15' | 'H1' | 'H4' | 'D1';
  mode: 'INTRADAY' | 'SWING' | 'SCALPING';
  indicatorsDetected: string[];
  entryLogic: string;
  exitLogic: string;
  suggestedSlMethod: 'ATR' | 'SWING' | 'FIXED_PIPS' | 'PERCENT';
  suggestedSlParam: number;
  suggestedTpParam: number;
  targetRiskReward: number;
  formatType: 'PINE_SCRIPT' | 'PYTHON_DAEMON' | 'JSON_PAYLOAD' | 'FREE_TEXT';
}

export function parseMarketSenseScript(rawCode: string): ParsedStrategySummary {
  const text = rawCode.trim();
  const lower = text.toLowerCase();

  let formatType: ParsedStrategySummary['formatType'] = 'FREE_TEXT';
  if (text.includes('//@version') || text.includes('strategy(') || text.includes('ta.')) {
    formatType = 'PINE_SCRIPT';
  } else if (text.includes('import MetaTrader5') || text.includes('def ') || text.includes('mt5.')) {
    formatType = 'PYTHON_DAEMON';
  } else if (text.startsWith('{') && text.endsWith('}')) {
    formatType = 'JSON_PAYLOAD';
  }

  // Detect Symbol
  let symbol = 'US500';
  if (lower.includes('nas100') || lower.includes('nasdaq') || lower.includes('nq')) symbol = 'NAS100';
  else if (lower.includes('xauusd') || lower.includes('gold') || lower.includes('oro')) symbol = 'XAUUSD';
  else if (lower.includes('eurusd') || lower.includes('euro')) symbol = 'EURUSD';
  else if (lower.includes('btcusdt') || lower.includes('btc') || lower.includes('bitcoin')) symbol = 'BTCUSDT';
  else if (lower.includes('spx') || lower.includes('us500') || lower.includes('s&p')) symbol = 'US500';

  // Detect Timeframe
  let timeframe: 'M1' | 'M5' | 'M15' | 'H1' | 'H4' | 'D1' = 'M15';
  if (lower.includes('m1 ') || lower.includes('1m') || lower.includes('1 min')) timeframe = 'M1';
  else if (lower.includes('m5') || lower.includes('5m') || lower.includes('5 min')) timeframe = 'M5';
  else if (lower.includes('m15') || lower.includes('15m') || lower.includes('15 min')) timeframe = 'M15';
  else if (lower.includes('h1') || lower.includes('1h') || lower.includes('1 hour') || lower.includes('60m')) timeframe = 'H1';
  else if (lower.includes('h4') || lower.includes('4h')) timeframe = 'H4';
  else if (lower.includes('d1') || lower.includes('daily') || lower.includes('diario')) timeframe = 'D1';

  // Detect Indicators
  const indicators: string[] = [];
  if (lower.includes('rsi')) indicators.push('RSI (Fuerza Relativa)');
  if (lower.includes('ema') || lower.includes('media')) indicators.push('EMA Institucional');
  if (lower.includes('atr')) indicators.push('ATR (Volatilidad Real)');
  if (lower.includes('vwap')) indicators.push('VWAP');
  if (lower.includes('volume') || lower.includes('volumen')) indicators.push('Filtro de Volumen');
  if (lower.includes('suelo') || lower.includes('soporte') || lower.includes('rebote')) indicators.push('Soporte Institucional MarketSense');
  if (indicators.length === 0) indicators.push('Acción de Precio Pura');

  // Mode
  const mode: 'INTRADAY' | 'SWING' | 'SCALPING' = 
    timeframe === 'M1' || timeframe === 'M5' ? 'SCALPING' :
    timeframe === 'D1' || timeframe === 'H4' ? 'SWING' : 'INTRADAY';

  // Logic summary
  const entryLogic = lower.includes('suelo') || lower.includes('rebote') 
    ? 'Detección de suelo institucional con confirmación de volumen y vela alcista'
    : 'Ruptura de rango de volatilidad con filtro de tendencia superior';

  const exitLogic = 'Stop Loss dinámico + Breakeven a 1.0R + Take Profit en 2.5R';

  // Generate strategy name
  let name = `MarketSense ${symbol} ${mode}`;
  const titleMatch = text.match(/strategy\s*\(\s*["']([^"']+)["']/i);
  if (titleMatch && titleMatch[1]) {
    name = titleMatch[1];
  }

  return {
    name,
    symbol,
    timeframe,
    mode,
    indicatorsDetected: indicators,
    entryLogic,
    exitLogic,
    suggestedSlMethod: 'ATR',
    suggestedSlParam: 1.5,
    suggestedTpParam: 3.0,
    targetRiskReward: 2.0,
    formatType,
  };
}

export function generateWebhookPayloadTemplate(symbol: string, accountId: string, secretKey: string) {
  return JSON.stringify({
    secret: secretKey,
    account_id: accountId,
    action: "{{strategy.order.action}}", // BUY or SELL
    symbol: symbol,
    contracts: "{{strategy.order.contracts}}",
    price: "{{strategy.order.price}}",
    stop_loss: "{{plot_0}}", // o precio dinámico
    take_profit: "{{plot_1}}",
    comment: "MarketSense Auto Execution",
  }, null, 2);
}
