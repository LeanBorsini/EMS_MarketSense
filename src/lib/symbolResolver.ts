/**
 * Universal Symbol Resolver for Trading & Execution
 * Maps symbols, calculates pip values, and converts broker specifications.
 */

export interface InstrumentSpec {
  symbol: string;
  name: string;
  category: 'INDICES' | 'METALS' | 'FOREX' | 'CRYPTO';
  pipSize: number;       // e.g. 0.01 for gold/indices, 0.0001 for EURUSD
  digits: number;        // decimal places
  contractSize: number;  // unit per 1 lot
  pipValueUsdPerLot: number;
  tradingViewSymbol: string;
}

export const INSTRUMENTS: Record<string, InstrumentSpec> = {
  US500: {
    symbol: 'US500',
    name: 'S&P 500 CFD (Efectivo)',
    category: 'INDICES',
    pipSize: 0.1,
    digits: 2,
    contractSize: 1,
    pipValueUsdPerLot: 1.0,
    tradingViewSymbol: 'FOREXCOM:SPXUSD',
  },
  NAS100: {
    symbol: 'NAS100',
    name: 'Nasdaq 100 CFD',
    category: 'INDICES',
    pipSize: 0.1,
    digits: 2,
    contractSize: 1,
    pipValueUsdPerLot: 1.0,
    tradingViewSymbol: 'FOREXCOM:NAS100',
  },
  XAUUSD: {
    symbol: 'XAUUSD',
    name: 'Oro Spot / Dólar (Gold)',
    category: 'METALS',
    pipSize: 0.01,
    digits: 2,
    contractSize: 100,
    pipValueUsdPerLot: 1.0,
    tradingViewSymbol: 'OANDA:XAUUSD',
  },
  EURUSD: {
    symbol: 'EURUSD',
    name: 'Euro / Dólar Estadounidense',
    category: 'FOREX',
    pipSize: 0.0001,
    digits: 5,
    contractSize: 100000,
    pipValueUsdPerLot: 10.0,
    tradingViewSymbol: 'FX:EURUSD',
  },
  GBPUSD: {
    symbol: 'GBPUSD',
    name: 'Libra Esterlina / Dólar',
    category: 'FOREX',
    pipSize: 0.0001,
    digits: 5,
    contractSize: 100000,
    pipValueUsdPerLot: 10.0,
    tradingViewSymbol: 'FX:GBPUSD',
  },
  BTCUSDT: {
    symbol: 'BTCUSDT',
    name: 'Bitcoin / Tether Spot',
    category: 'CRYPTO',
    pipSize: 1.0,
    digits: 2,
    contractSize: 1,
    pipValueUsdPerLot: 1.0,
    tradingViewSymbol: 'BINANCE:BTCUSDT',
  },
};

export function resolveTradingViewSymbol(symbol: string): string {
  const clean = (symbol || '').trim().toUpperCase();
  if (INSTRUMENTS[clean]) {
    return INSTRUMENTS[clean].tradingViewSymbol;
  }
  if (clean === 'GOLD' || clean === 'ORO' || clean === 'XAU') return 'OANDA:XAUUSD';
  if (clean === 'SPX' || clean === 'SP500') return 'FOREXCOM:SPXUSD';
  if (clean === 'NDX' || clean === 'NQ' || clean === 'NAS') return 'FOREXCOM:NAS100';
  if (clean === 'BTC' || clean === 'BITCOIN') return 'BINANCE:BTCUSDT';
  return clean;
}

export function formatPrice(price: number, symbol: string): string {
  const spec = INSTRUMENTS[symbol];
  const digits = spec ? spec.digits : 2;
  return price.toFixed(digits);
}
