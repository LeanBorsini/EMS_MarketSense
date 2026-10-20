import { useEffect, useRef, useCallback } from 'react';
import { SYSTEM_DEFAULTS } from '../config/features';

interface UseWebhookListenerOptions {
  enabled?: boolean;
  onLog?: (type: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | 'EXECUTION', message: string, symbol?: string) => void;
}

export function useWebhookListener({ enabled = true, onLog }: UseWebhookListenerOptions = {}) {
  const processedSignalIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled) return;
    let isMounted = true;

    const pollWebhookSignals = async () => {
      try {
        const res = await fetch('/api/webhook/history');
        if (!res.ok) return;
        const data = await res.json();
        if (!data.signals || !isMounted) return;

        for (const sig of data.signals) {
          if (!processedSignalIdsRef.current.has(sig.id)) {
            processedSignalIdsRef.current.add(sig.id);
            if (onLog) {
              onLog(
                'SUCCESS',
                `📡 [WEBHOOK RECIBIDO] ${sig.action} ${sig.contracts} en ${sig.symbol} (Cuenta #${sig.accountId}). Enrutado a MT5.`,
                sig.symbol
              );
            }
          }
        }
      } catch {
        // Silent background polling
      }
    };

    const interval = setInterval(pollWebhookSignals, SYSTEM_DEFAULTS.webhookPollIntervalMs);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [onLog]);

  const testWebhookSignal = useCallback(async (symbol = 'US500', action: 'BUY' | 'SELL' = 'BUY') => {
    try {
      const res = await fetch('/api/webhook/test-signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, action, contracts: 0.5 }),
      });
      if (res.ok) {
        if (onLog) {
          onLog('SUCCESS', `⚡ Señal de prueba [${action} ${symbol}] encolada en el servidor y despachada a MT5.`);
        }
      }
    } catch {
      if (onLog) {
        onLog('WARN', 'Fallo de red al disparar la señal de prueba Webhook.');
      }
    }
  }, [onLog]);

  return {
    testWebhookSignal,
  };
}
