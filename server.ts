import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

import { webhookRouter } from './server/routes/webhookRoutes';
import { mt5Router } from './server/routes/mt5Routes';
import { syncRouter } from './server/routes/syncRoutes';
import { aiRouter } from './server/routes/aiRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// ==========================================
// Modular Subsystem API Routers
// (Easily add, modify, or remove any domain module)
// ==========================================
app.use('/api/webhook', webhookRouter);
app.use('/api/mt5', mt5Router);
app.use('/api/sync', syncRouter);
app.use('/api/ai', aiRouter);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', time: new Date().toISOString() });
});

// ==========================================
// Vite Dev Middleware & Static File Server
// ==========================================
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const distPath = path.resolve(process.cwd(), 'dist');

  if (isProd && fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`[EMS-MarketSense Engine] Running modular server on port ${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
