import { useState, useEffect } from 'react';
import { MarketTicker } from '../types/execution';
import { INITIAL_TICKERS } from '../data/mockMarketFeed';

interface UseMarketFeedProps {
  enabled?: boolean;
  intervalMs?: number;
}

export interface UseMarketFeedReturn {
  tickers: Record<string, MarketTicker>;
  setTickers: React.Dispatch<React.SetStateAction<Record<string, MarketTicker>>>;
  lastTickTime: Date;
}

/**
 * useMarketFeed: Modular hook providing market pricing feeds.
 * Can be cleanly swapped for live broker WebSockets or external quotation feeds.
 */
export function useMarketFeed({ enabled = true, intervalMs = 2000 }: UseMarketFeedProps = {}): UseMarketFeedReturn {
  const [tickers, setTickers] = useState<Record<string, MarketTicker>>(INITIAL_TICKERS);
  const [lastTickTime, setLastTickTime] = useState<Date>(new Date());

  useEffect(() => {
    if (!enabled) return;

    const timer = setInterval(() => {
      setLastTickTime(new Date());

      // Institutional micro-tick random walk (0.01% - 0.03%)
      setTickers(prevTickers => {
        const next: Record<string, MarketTicker> = { ...prevTickers };
        for (const sym of Object.keys(next)) {
          const item = next[sym];
          const variance = (Math.random() - 0.49) * (item.price * 0.0004);
          const newPrice = Math.round((item.price + variance) * 100) / 100;
          const spreadDiff = item.spreadPips * item.pipSize;

          next[sym] = {
            ...item,
            price: newPrice,
            bid: Math.round((newPrice - spreadDiff / 2) * 100) / 100,
            ask: Math.round((newPrice + spreadDiff / 2) * 100) / 100,
          };
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [enabled, intervalMs]);

  return { tickers, setTickers, lastTickTime };
}
