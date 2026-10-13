import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// In-memory queue for orders waiting to be picked up by MetaTrader 5 Expert Advisor
interface PendingOrder {
  id: string;
  accountId: string;
  symbol: string;
  action: 'BUY' | 'SELL';
  contracts: number;
  stopLoss?: number;
  takeProfit?: number;
  timestamp: string;
}

let pendingOrders: PendingOrder[] = [];

// 1. Webhook endpoint called by TradingView Alert
app.post('/api/webhook/tradingview', (req, res) => {
  try {
    const payload = req.body || {};
    const { action, symbol, account_id, contracts, stop_loss, take_profit } = payload;

    const newOrder: PendingOrder = {
      id: `ord-${Date.now()}`,
      accountId: account_id || 'default',
      symbol: symbol || 'US500',
      action: action === 'SELL' ? 'SELL' : 'BUY',
      contracts: Number(contracts) || 0.5,
      stopLoss: stop_loss ? Number(stop_loss) : undefined,
      takeProfit: take_profit ? Number(take_profit) : undefined,
      timestamp: new Date().toISOString(),
    };

    pendingOrders.push(newOrder);
    console.log(`[WEBHOOK RECEIVED] ${newOrder.action} ${newOrder.contracts} on ${newOrder.symbol} for account ${newOrder.accountId}`);

    return res.status(200).json({
      status: 'success',
      message: 'Order received by MarketSense autonomous relay',
      order: newOrder,
    });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: 'Internal webhook error' });
  }
});

// 2. Polling endpoint called by MetaTrader 5 Expert Advisor
app.get('/api/webhook/pending-orders', (req, res) => {
  const { account_id } = req.query;

  if (pendingOrders.length > 0) {
    const orderToExecute = pendingOrders.shift();
    return res.status(200).json({
      has_order: true,
      order: orderToExecute,
    });
  }

  return res.status(200).json({
    has_order: false,
    message: 'No pending orders at this moment',
  });
});

// 3. Test ping endpoint
app.post('/api/webhook/test', (req, res) => {
  return res.status(200).json({
    status: 'success',
    message: 'MarketSense 24/7 Webhook Relay is active and responding with low latency.',
  });
});

// Mount Vite or serve static
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const distPath = path.resolve(process.cwd(), 'dist');

  if (isProd && fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`MarketSense Autonomous Engine listening on port ${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
