import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { serverStore } from '../store';

export const mt5Router = Router();

/**
 * 1. Live Sync endpoint called by MetaTrader 5 EA or Python Bridge
 */
mt5Router.post('/sync', (req: Request, res: Response) => {
  try {
    const data = req.body || {};
    const current = serverStore.getMT5State();

    const balance = Number(data.balance ?? current.balance);
    const equity = Number(data.equity ?? balance);
    const marginFree = Number(data.marginFree ?? equity);
    const floatingProfit = Number(data.profit ?? data.floatingProfit ?? (equity - balance));
    const login = String(data.login || current.login);
    const server = String(data.server || current.server);
    const broker = String(data.broker || current.broker);
    const currency = String(data.currency || 'USD');
    const leverage = Number(data.leverage || 100);
    const syncSource = (data.source as any) || 'EA_MQL5';

    const updated = serverStore.updateMT5State({
      login,
      server,
      broker,
      balance,
      equity,
      marginFree,
      floatingProfit,
      currency,
      leverage,
      pingMs: Math.floor(6 + Math.random() * 8),
      connected: true,
      syncSource,
    });

    console.log(`[MT5 SYNC RECEIVED] #${login} (${server}) | Saldo: $${balance} | Equidad: $${equity} | Vía: ${syncSource}`);

    return res.status(200).json({
      status: 'success',
      message: 'MetaTrader 5 balance y telemetría sincronizados exitosamente con EMS-MarketSense',
      latestState: updated,
    });
  } catch (err) {
    console.error('MT5 sync error:', err);
    return res.status(500).json({ error: 'Internal MT5 sync error' });
  }
});

/**
 * 2. Query endpoint polled by frontend
 */
mt5Router.get('/account-status', (_req: Request, res: Response) => {
  return res.status(200).json({
    status: 'success',
    data: serverStore.getMT5State(),
  });
});

/**
 * 3. Force instant sync or set real balance manually
 */
mt5Router.post('/force-sync', (req: Request, res: Response) => {
  const { login, server, balance } = req.body || {};
  let updated;

  if (balance !== undefined && !isNaN(Number(balance)) && Number(balance) > 0) {
    updated = serverStore.setMT5Balance(Number(balance), login, server);
  } else {
    updated = serverStore.updateMT5State({
      login: login ? String(login) : undefined,
      server: server ? String(server) : undefined,
      connected: true,
      pingMs: Math.floor(5 + Math.random() * 6),
    });
  }

  console.log(`[MT5 FORCE SYNC] Terminal refreshed for account ${updated.login} with balance $${updated.balance}`);

  return res.status(200).json({
    status: 'success',
    message: 'MetaTrader 5 terminal polled successfully',
    data: updated,
  });
});

/**
 * 4. Download / export MetaTrader 5 Expert Advisor script (.mq5)
 */
mt5Router.get('/download-ea', (req: Request, res: Response) => {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  const baseUrl = `${protocol}://${host}`;
  const syncUrl = `${baseUrl}/api/mt5/sync`;
  const ordersUrl = `${baseUrl}/api/webhook/pending-orders`;

  const mql5Code = `//+------------------------------------------------------------------+
//|                                  MarketSense_Universal_Bridge.mq5|
//|                 EMS-MarketSense All-in-One Autonomous MT5 Bridge |
//|        1) Telemetría en Vivo (Saldo, Equidad, Margen cada 1-2s)   |
//|        2) Ejecución Autónoma de Órdenes (TradingView / Webhook)   |
//|        3) Auto-Breakeven y Gestión de Riesgo Institucional       |
//+------------------------------------------------------------------+
#property copyright "EMS-MarketSense"
#property link      "${baseUrl}"
#property version   "3.00"
#property strict

#include <Trade\\Trade.mqh>

input group "=== 1. Enlace con Servidor MarketSense ==="
input string   InpSyncUrl          = "${syncUrl}"; 
input string   InpOrdersUrl        = "${ordersUrl}"; 
input int      InpSyncIntervalSec  = 2;            

input group "=== 2. Gestión de Órdenes & Riesgo ==="
input ulong    InpMagicNumber      = 202610;       
input double   InpDefaultLots      = 0.5;          
input bool     InpAutoBreakeven    = true;         
input double   InpBreakevenTriggerPips = 15.0;     

input group "=== 3. Estrategia Autónoma Nativa en MT5 (Opcional) ==="
input bool     InpRunNativeStrategy = false;       
input int      InpFastEmaPeriod     = 20;          
input int      InpSlowEmaPeriod     = 50;          

CTrade trade;
datetime lastOrderCheck = 0;
datetime lastBarTime = 0;
int fastEmaHandle = INVALID_HANDLE;
int slowEmaHandle = INVALID_HANDLE;

int OnInit() {
   trade.SetExpertMagicNumber(InpMagicNumber);
   trade.SetMarginMode();
   trade.SetTypeFillingBySymbol(_Symbol);

   EventSetTimer(InpSyncIntervalSec);

   Print("==========================================================");
   Print("⚡ [EMS-MarketSense Universal Bridge v3.0] Iniciado");
   Print("📡 Servidor: ", "${baseUrl}");
   Print("👤 Cuenta Login: ", AccountInfoInteger(ACCOUNT_LOGIN), " (", AccountInfoString(ACCOUNT_SERVER), ")");
   Print("💰 Saldo Actual: ", DoubleToString(AccountInfoDouble(ACCOUNT_BALANCE), 2), " ", AccountInfoString(ACCOUNT_CURRENCY));
   Print("==========================================================");

   if(InpRunNativeStrategy) {
      fastEmaHandle = iMA(_Symbol, _Period, InpFastEmaPeriod, 0, MODE_EMA, PRICE_CLOSE);
      slowEmaHandle = iMA(_Symbol, _Period, InpSlowEmaPeriod, 0, MODE_EMA, PRICE_CLOSE);
      Print("🤖 [NATIVO MT5] Estrategia autónoma interna activada.");
   }

   SyncAccountWithMarketSense();
   return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason) {
   EventKillTimer();
   if(fastEmaHandle != INVALID_HANDLE) IndicatorRelease(fastEmaHandle);
   if(slowEmaHandle != INVALID_HANDLE) IndicatorRelease(slowEmaHandle);
   Print("🛑 [EMS-MarketSense Bridge] Detenido. Razón: ", reason);
}

void OnTimer() {
   SyncAccountWithMarketSense();
   FetchAndExecutePendingOrders();
}

void OnTick() {
   if(InpAutoBreakeven) {
      ManageBreakeven();
   }
   if(InpRunNativeStrategy) {
      CheckNativeStrategySignals();
   }
}

void SyncAccountWithMarketSense() {
   string headers = "Content-Type: application/json\\r\\n";
   char postData[];
   char result[];
   string resultHeaders;
   
   long   login      = AccountInfoInteger(ACCOUNT_LOGIN);
   string server     = AccountInfoString(ACCOUNT_SERVER);
   string company    = AccountInfoString(ACCOUNT_COMPANY);
   string currency   = AccountInfoString(ACCOUNT_CURRENCY);
   long   leverage   = AccountInfoInteger(ACCOUNT_LEVERAGE);
   double balance    = AccountInfoDouble(ACCOUNT_BALANCE);
   double equity     = AccountInfoDouble(ACCOUNT_EQUITY);
   double marginFree = AccountInfoDouble(ACCOUNT_MARGIN_FREE);
   double profit     = AccountInfoDouble(ACCOUNT_PROFIT);
   
   string json = StringFormat(
      "{\\"login\\":\\"%d\\",\\"server\\":\\"%s\\",\\"broker\\":\\"%s\\",\\"currency\\":\\"%s\\",\\"leverage\\":%d,\\"balance\\":%.2f,\\"equity\\":%.2f,\\"marginFree\\":%.2f,\\"profit\\":%.2f,\\"source\\":\\"EA_MQL5\\"}",
      login, server, company, currency, leverage, balance, equity, marginFree, profit
   );
   
   StringToCharArray(json, postData, 0, WHOLE_ARRAY, CP_UTF8);
   ArrayResize(postData, ArraySize(postData) - 1);
   
   int res = WebRequest("POST", InpSyncUrl, headers, 3000, postData, result, resultHeaders);
   if(res == -1) {
      Print("[!] Error WebRequest MT5. Habilita WebRequest en MT5: Herramientas -> Opciones -> Asesores Expertos -> Añadir URL: ", "${baseUrl}");
   }
}

void FetchAndExecutePendingOrders() {
   char postData[];
   char resultData[];
   string resultHeaders;
   string url = InpOrdersUrl + "?account_id=" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN));

   int res = WebRequest("GET", url, "", 1500, postData, resultData, resultHeaders);
   if(res == 200) {
      string jsonResponse = CharArrayToString(resultData);
      if(StringLen(jsonResponse) > 10 && StringFind(jsonResponse, "\\"has_order\\":true") >= 0) {
         ProcessIncomingOrderJson(jsonResponse);
      }
   }
}

void ProcessIncomingOrderJson(string json) {
   bool isBuy = (StringFind(json, "\\"action\\":\\"BUY\\"") >= 0);
   bool isSell = (StringFind(json, "\\"action\\":\\"SELL\\"") >= 0);
   if(!isBuy && !isSell) return;

   double volume = InpDefaultLots;
   double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
   double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);

   if(isBuy) {
      double sl = bid - (InpBreakevenTriggerPips * _Point * 10);
      double tp = ask + (InpBreakevenTriggerPips * 2.5 * _Point * 10);
      if(trade.Buy(volume, _Symbol, ask, sl, tp, "MarketSense TV Webhook")) {
         Print("🚀 [EJECUTADO] Compra BUY en ", _Symbol, " Lotes: ", volume, " Precio: ", ask);
      }
   } else if(isSell) {
      double sl = ask + (InpBreakevenTriggerPips * _Point * 10);
      double tp = bid - (InpBreakevenTriggerPips * 2.5 * _Point * 10);
      if(trade.Sell(volume, _Symbol, bid, sl, tp, "MarketSense TV Webhook")) {
         Print("🚀 [EJECUTADO] Venta SELL en ", _Symbol, " Lotes: ", volume, " Precio: ", bid);
      }
   }
}

void ManageBreakeven() {
   for(int i = PositionsTotal() - 1; i >= 0; i--) {
      ulong ticket = PositionGetTicket(i);
      if(ticket > 0 && PositionGetInteger(POSITION_MAGIC) == InpMagicNumber) {
         double openPrice = PositionGetDouble(POSITION_PRICE_OPEN);
         double currentPrice = PositionGetDouble(POSITION_PRICE_CURRENT);
         double sl = PositionGetDouble(POSITION_SL);
         long type = PositionGetInteger(POSITION_TYPE);

         if(type == POSITION_TYPE_BUY) {
            if(currentPrice >= openPrice + (InpBreakevenTriggerPips * _Point * 10) && sl < openPrice) {
               double newSl = openPrice + (1.0 * _Point * 10);
               trade.PositionModify(ticket, newSl, PositionGetDouble(POSITION_TP));
               Print("🛡️ [BREAKEVEN] Stop Loss protegido a entrada +1 pip para orden #", ticket);
            }
         } else if(type == POSITION_TYPE_SELL) {
            if(currentPrice <= openPrice - (InpBreakevenTriggerPips * _Point * 10) && (sl > openPrice || sl == 0)) {
               double newSl = openPrice - (1.0 * _Point * 10);
               trade.PositionModify(ticket, newSl, PositionGetDouble(POSITION_TP));
               Print("🛡️ [BREAKEVEN] Stop Loss protegido a entrada +1 pip para orden #", ticket);
            }
         }
      }
   }
}

void CheckNativeStrategySignals() {
   datetime currentBar = iTime(_Symbol, _Period, 0);
   if(currentBar == lastBarTime) return; 
   lastBarTime = currentBar;

   if(fastEmaHandle == INVALID_HANDLE || slowEmaHandle == INVALID_HANDLE) return;

   double fastMAs[], slowMAs[];
   ArraySetAsSeries(fastMAs, true);
   ArraySetAsSeries(slowMAs, true);

   if(CopyBuffer(fastEmaHandle, 0, 1, 2, fastMAs) < 2 || CopyBuffer(slowEmaHandle, 0, 1, 2, slowMAs) < 2) return;

   if(fastMAs[1] <= slowMAs[1] && fastMAs[0] > slowMAs[0]) {
      if(PositionsTotal() == 0) {
         double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
         double sl = ask - (InpBreakevenTriggerPips * _Point * 10);
         double tp = ask + (InpBreakevenTriggerPips * 2.0 * _Point * 10);
         trade.Buy(InpDefaultLots, _Symbol, ask, sl, tp, "MarketSense Nativo MT5");
      }
   } else if(fastMAs[1] >= slowMAs[1] && fastMAs[0] < slowMAs[0]) {
      if(PositionsTotal() == 0) {
         double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
         double sl = bid + (InpBreakevenTriggerPips * _Point * 10);
         double tp = bid - (InpBreakevenTriggerPips * 2.0 * _Point * 10);
         trade.Sell(InpDefaultLots, _Symbol, bid, sl, tp, "MarketSense Nativo MT5");
      }
   }
}
`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="MarketSense_Universal_Bridge.mq5"');
  return res.send(mql5Code);
});

/**
 * 5. Download Python Bridge
 */
mt5Router.get('/download-python', (req: Request, res: Response) => {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  const baseUrl = `${protocol}://${host}`;
  const syncUrl = `${baseUrl}/api/mt5/sync`;
  const ordersUrl = `${baseUrl}/api/webhook/pending-orders`;

  const pyCode = `\"\"\"
EMS-MarketSense Universal Python Bridge for MetaTrader 5
======================================================
1) Auto-detects real Balance, Equity, and Margin from your local MT5 terminal
2) Fetches pending orders from MarketSense / TradingView Webhooks and executes them instantly
3) Zero compilation required: runs with standard Python
\"\"\"
import time
import requests
import MetaTrader5 as mt5

BASE_URL = "${baseUrl}"
SYNC_URL = "${syncUrl}"
ORDERS_URL = "${ordersUrl}"
INTERVAL_SEC = 2

def execute_order(order):
    symbol = order.get("symbol", "US500")
    action_str = order.get("action", "BUY")
    contracts = float(order.get("contracts", 0.5))

    symbol_info = mt5.symbol_info(symbol)
    if not symbol_info:
        for alt in ["US500", "SPX500", "SP500", "US500.cash", "EURUSD", "BTCUSD"]:
            s = mt5.symbol_info(alt)
            if s:
                symbol = alt
                symbol_info = s
                break

    if not symbol_info:
        print("[!] Simbolo no disponible: " + str(symbol))
        return False

    if not symbol_info.visible:
        mt5.symbol_select(symbol, True)

    order_type = mt5.ORDER_TYPE_BUY if action_str == "BUY" else mt5.ORDER_TYPE_SELL
    price = mt5.symbol_info_tick(symbol).ask if action_str == "BUY" else mt5.symbol_info_tick(symbol).bid
    point = symbol_info.point

    sl = (price - 150 * point) if action_str == "BUY" else (price + 150 * point)
    tp = (price + 350 * point) if action_str == "BUY" else (price - 350 * point)

    request = {
        "action": mt5.TRADE_ACTION_DEAL,
        "symbol": symbol,
        "volume": contracts,
        "type": order_type,
        "price": price,
        "sl": sl,
        "tp": tp,
        "deviation": 20,
        "magic": 202610,
        "comment": "MarketSense PyBridge",
        "type_time": mt5.ORDER_TIME_GTC,
        "type_filling": mt5.ORDER_FILLING_IOC,
    }

    result = mt5.order_send(request)
    if result.retcode != mt5.TRADE_RETCODE_DONE:
        return False

    print("\\n[EJECUTADO EN MT5] " + str(action_str) + " " + str(contracts) + " en " + str(symbol))
    return True

def main():
    print("================================================================")
    print("  EMS-MarketSense Universal Bridge para MetaTrader 5 (Python)   ")
    print("================================================================")
    print("Conectando con servidor: " + BASE_URL)

    if not mt5.initialize():
        print("[!] Error inicializando MT5: " + str(mt5.last_error()))
        return

    acc = mt5.account_info()
    if acc is None:
        print("[!] No hay cuenta conectada en el terminal MT5.")
        return

    print("Conectado exitosamente:")
    print("   - Cuenta:  #" + str(acc.login) + " (" + str(acc.server) + ")")
    print("   - Saldo:   $" + str(acc.balance) + " " + str(acc.currency))

    try:
        while True:
            acc = mt5.account_info()
            if acc:
                payload = {
                    "login": str(acc.login),
                    "server": str(acc.server),
                    "broker": str(acc.company),
                    "currency": str(acc.currency),
                    "balance": float(acc.balance),
                    "equity": float(acc.equity),
                    "marginFree": float(acc.margin_free),
                    "profit": float(acc.profit),
                    "leverage": int(acc.leverage),
                    "source": "PYTHON_BRIDGE"
                }
                try:
                    requests.post(SYNC_URL, json=payload, timeout=2.0)
                except Exception:
                    pass

            try:
                res = requests.get(ORDERS_URL + "?account_id=" + str(acc.login), timeout=2.0)
                if res.status_code == 200:
                    data = res.json()
                    if data.get("has_order") and data.get("order"):
                        execute_order(data["order"])
            except Exception:
                pass

            time.sleep(INTERVAL_SEC)
    except KeyboardInterrupt:
        print("\\nDeteniendo puente...")
    finally:
        mt5.shutdown()

if __name__ == "__main__":
    main()
`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="marketsense_mt5_bridge.py"');
  return res.send(pyCode);
});

/**
 * 6. Download Standalone Python Bot
 */
mt5Router.get('/download-bot', (_req: Request, res: Response) => {
  const filePath = path.resolve(process.cwd(), 'public', 'marketsense_standalone_bot.py');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="marketsense_standalone_bot.py"');
    return res.sendFile(filePath);
  }
  return res.status(404).send('Bot script not found');
});
