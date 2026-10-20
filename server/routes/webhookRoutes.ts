import { Router, Request, Response } from 'express';
import { serverStore } from '../store';
import { PendingOrder, WebhookSignalLog } from '../types';

export const webhookRouter = Router();

/**
 * 1. Webhook endpoint called by TradingView Alert
 */
webhookRouter.post('/tradingview', (req: Request, res: Response) => {
  try {
    const payload = req.body || {};
    const { action, symbol, account_id, contracts, stop_loss, take_profit, price } = payload;

    if (!action || !symbol) {
      return res.status(400).json({ error: 'Payload missing required action or symbol' });
    }

    const orderId = `ord-${Date.now()}`;
    const cleanAction: 'BUY' | 'SELL' = action.toUpperCase() === 'BUY' ? 'BUY' : 'SELL';
    const cleanContracts = Number(contracts) || 0.1;
    const accountId = String(account_id || req.query.account || 'all');

    const newOrder: PendingOrder = {
      id: orderId,
      accountId,
      symbol: String(symbol).toUpperCase(),
      action: cleanAction,
      contracts: cleanContracts,
      stopLoss: stop_loss ? Number(stop_loss) : undefined,
      takeProfit: take_profit ? Number(take_profit) : undefined,
      timestamp: new Date().toISOString(),
    };

    serverStore.addPendingOrder(newOrder);

    const logEntry: WebhookSignalLog = {
      id: orderId,
      accountId,
      symbol: newOrder.symbol,
      action: newOrder.action,
      contracts: cleanContracts,
      stopLoss: newOrder.stopLoss,
      takeProfit: newOrder.takeProfit,
      receivedAt: new Date().toISOString(),
      source: 'TRADINGVIEW_WEBHOOK',
      executedByEA: false,
    };
    serverStore.addWebhookSignal(logEntry);

    console.log(`[TRADINGVIEW WEBHOOK] Señal recibida: ${cleanAction} ${cleanContracts} en ${symbol} (Cuenta #${accountId})`);

    return res.status(200).json({
      status: 'success',
      message: 'Order received and queued for MetaTrader 5 execution',
      orderId,
      queuedAt: newOrder.timestamp,
    });
  } catch (err) {
    console.error('TradingView webhook error:', err);
    return res.status(500).json({ error: 'Internal webhook error' });
  }
});

/**
 * 2. Instant manual test signal trigger from the UI
 */
webhookRouter.post('/test-signal', (req: Request, res: Response) => {
  try {
    const { symbol = 'US500', action = 'BUY', accountId = 'demo-test', contracts = 0.5 } = req.body || {};
    const orderId = `test-${Date.now()}`;
    const cleanAction: 'BUY' | 'SELL' = action.toUpperCase() === 'BUY' ? 'BUY' : 'SELL';
    const cleanContracts = Number(contracts) || 0.5;

    const newOrder: PendingOrder = {
      id: orderId,
      accountId: String(accountId),
      symbol: String(symbol).toUpperCase(),
      action: cleanAction,
      contracts: cleanContracts,
      timestamp: new Date().toISOString(),
    };

    serverStore.addPendingOrder(newOrder);

    const logEntry: WebhookSignalLog = {
      id: orderId,
      accountId: String(accountId),
      symbol: newOrder.symbol,
      action: newOrder.action,
      contracts: cleanContracts,
      receivedAt: new Date().toISOString(),
      source: 'MANUAL_UI_TEST',
      executedByEA: false,
    };
    serverStore.addWebhookSignal(logEntry);

    console.log(`[TEST SIGNAL] Disparado: ${cleanAction} ${cleanContracts} en ${symbol} (Cuenta #${accountId})`);

    return res.status(200).json({
      status: 'success',
      message: 'Test signal enqueued successfully',
      orderId,
    });
  } catch (err) {
    console.error('Test signal error:', err);
    return res.status(500).json({ error: 'Failed to enqueue test signal' });
  }
});

/**
 * 3. Recent Webhook Signals History for the UI monitor
 */
webhookRouter.get('/history', (_req: Request, res: Response) => {
  return res.status(200).json({
    status: 'success',
    signals: serverStore.getWebhookSignals(15),
    pendingCount: serverStore.getPendingOrdersCount(),
  });
});

/**
 * 4. Polled by MetaTrader 5 EA or Python Bridge to execute orders
 */
webhookRouter.get('/pending-orders', (req: Request, res: Response) => {
  const accountId = req.query.account_id ? String(req.query.account_id) : undefined;
  const order = serverStore.popNextPendingOrder(accountId);

  if (!order) {
    return res.status(200).json({
      has_order: false,
      message: 'No pending orders',
    });
  }

  serverStore.markSignalExecuted(order.id);

  console.log(`[ORDER DISPATCHED TO MT5] ${order.action} ${order.contracts} en ${order.symbol} (#${order.id})`);

  return res.status(200).json({
    has_order: true,
    order: {
      id: order.id,
      action: order.action,
      symbol: order.symbol,
      contracts: order.contracts,
      stop_loss: order.stopLoss,
      take_profit: order.takeProfit,
      timestamp: order.timestamp,
    },
  });
});
