import { PendingOrder, WebhookSignalLog, MT5SyncTelemetry, SyncRoom } from './types';

class ServerStore {
  private pendingOrders: PendingOrder[] = [];
  private webhookSignalsHistory: WebhookSignalLog[] = [];
  private syncRooms: Map<string, SyncRoom> = new Map();

  private latestMT5State: MT5SyncTelemetry = {
    login: 'Pendiente Enlace',
    server: 'Servidor MT5',
    broker: 'MetaTrader 5 Real',
    balance: 0.00,
    equity: 0.00,
    marginFree: 0.00,
    floatingProfit: 0.00,
    currency: 'USD',
    leverage: 100,
    lastSync: new Date().toISOString(),
    pingMs: 0,
    connected: false,
    syncSource: 'DIRECT_GATEWAY',
  };

  constructor() {
    // Periodically clean up old sync rooms after 48h
    setInterval(() => {
      const now = Date.now();
      for (const [code, room] of this.syncRooms.entries()) {
        if (now - room.lastUpdated > 48 * 60 * 60 * 1000) {
          this.syncRooms.delete(code);
        }
      }
    }, 30 * 60 * 1000);
  }

  // --- MT5 State ---
  public getMT5State(): MT5SyncTelemetry {
    return { ...this.latestMT5State };
  }

  public updateMT5State(partial: Partial<MT5SyncTelemetry>): MT5SyncTelemetry {
    this.latestMT5State = {
      ...this.latestMT5State,
      ...partial,
      lastSync: new Date().toISOString(),
    };
    return { ...this.latestMT5State };
  }

  public setMT5Balance(balance: number, login?: string, server?: string): MT5SyncTelemetry {
    if (login) this.latestMT5State.login = String(login);
    if (server) this.latestMT5State.server = String(server);
    this.latestMT5State.balance = balance;
    this.latestMT5State.equity = balance;
    this.latestMT5State.marginFree = balance;
    this.latestMT5State.floatingProfit = 0;
    this.latestMT5State.connected = true;
    this.latestMT5State.lastSync = new Date().toISOString();
    return { ...this.latestMT5State };
  }

  // --- Pending Orders ---
  public addPendingOrder(order: PendingOrder): void {
    this.pendingOrders.push(order);
  }

  public getPendingOrdersCount(accountId?: string): number {
    if (!accountId) return this.pendingOrders.length;
    return this.pendingOrders.filter(o => o.accountId === accountId).length;
  }

  public popNextPendingOrder(accountId?: string): PendingOrder | null {
    if (this.pendingOrders.length === 0) return null;
    if (!accountId) {
      return this.pendingOrders.shift() || null;
    }
    const idx = this.pendingOrders.findIndex(o => o.accountId === accountId || o.accountId === 'all');
    if (idx !== -1) {
      const [order] = this.pendingOrders.splice(idx, 1);
      return order;
    }
    return null;
  }

  // --- Webhook Signals ---
  public addWebhookSignal(signal: WebhookSignalLog): void {
    this.webhookSignalsHistory.unshift(signal);
    if (this.webhookSignalsHistory.length > 50) {
      this.webhookSignalsHistory.pop();
    }
  }

  public getWebhookSignals(limit: number = 20): WebhookSignalLog[] {
    return this.webhookSignalsHistory.slice(0, limit);
  }

  public markSignalExecuted(orderId: string): void {
    const sig = this.webhookSignalsHistory.find(s => s.id === orderId);
    if (sig) {
      sig.executedByEA = true;
    }
  }

  // --- Device Sync Rooms ---
  public getRoom(code: string): SyncRoom | undefined {
    return this.syncRooms.get(code.trim().toUpperCase());
  }

  public setRoom(code: string, room: SyncRoom): void {
    this.syncRooms.set(code.trim().toUpperCase(), room);
  }

  public deleteRoom(code: string): boolean {
    return this.syncRooms.delete(code.trim().toUpperCase());
  }

  public hasRoom(code: string): boolean {
    return this.syncRooms.has(code.trim().toUpperCase());
  }
}

export const serverStore = new ServerStore();
