/**
 * Complete MQL5 Expert Advisor for MetaTrader 5
 * All-in-One: Live Balance Telemetry Sync + Webhook Order Execution + Auto-Breakeven + Native Autonomous Strategy
 */

export const getMql5ExpertAdvisorCode = (origin?: string, accountId?: string) => {
  const currentOrigin = origin || (typeof window !== 'undefined' ? window.location.origin : 'https://tu-app-url.run.app');
  const cleanAccount = accountId || '12345678';
  const syncUrl = `${currentOrigin}/api/mt5/sync`;
  const ordersUrl = `${currentOrigin}/api/webhook/pending-orders`;

  return `//+------------------------------------------------------------------+
//|                                  MarketSense_Universal_Bridge.mq5|
//|                 EMS-MarketSense All-in-One Autonomous MT5 Bridge |
//|        1) Telemetría en Vivo (Saldo, Equidad, Margen cada 1-2s)   |
//|        2) Ejecución Autónoma de Órdenes (TradingView / Webhook)   |
//|        3) Auto-Breakeven y Gestión de Riesgo Institucional       |
//+------------------------------------------------------------------+
#property copyright "EMS-MarketSense"
#property link      "${currentOrigin}"
#property version   "3.00"
#property strict

#include <Trade\\Trade.mqh>

//--- Parámetros Configurables
input group "=== 1. Enlace con Servidor MarketSense ==="
input string   InpSyncUrl          = "${syncUrl}"; // URL Sincronización Telemetría
input string   InpOrdersUrl        = "${ordersUrl}"; // URL Sondeo de Órdenes
input int      InpSyncIntervalSec  = 2;            // Frecuencia de Sincronización (segundos)

input group "=== 2. Gestión de Órdenes & Riesgo ==="
input ulong    InpMagicNumber      = 202610;       // Magic Number identificador
input double   InpDefaultLots      = 0.5;          // Lote por defecto si la señal no especifica
input bool     InpAutoBreakeven    = true;         // Activar Auto-Breakeven institucional
input double   InpBreakevenTriggerPips = 15.0;     // Pips en positivo para mover a Breakeven (+1 pip)

input group "=== 3. Estrategia Autónoma Nativa en MT5 (Opcional) ==="
input bool     InpRunNativeStrategy = false;       // Operar autónomo en MT5 sin depender de TradingView
input int      InpFastEmaPeriod     = 20;          // Periodo EMA Rápida
input int      InpSlowEmaPeriod     = 50;          // Periodo EMA Lenta

//--- Variables Globales
CTrade trade;
datetime lastBarTime = 0;
int fastEmaHandle = INVALID_HANDLE;
int slowEmaHandle = INVALID_HANDLE;

//+------------------------------------------------------------------+
//| Inicialización del Expert Advisor                               |
//+------------------------------------------------------------------+
int OnInit() {
   trade.SetExpertMagicNumber(InpMagicNumber);
   trade.SetMarginMode();
   trade.SetTypeFillingBySymbol(_Symbol);

   EventSetTimer(InpSyncIntervalSec);

   Print("==========================================================");
   Print("⚡ [EMS-MarketSense Universal Bridge v3.0] Iniciado");
   Print("📡 Servidor: ", "${currentOrigin}");
   Print("👤 Cuenta Login: ", AccountInfoInteger(ACCOUNT_LOGIN), " (", AccountInfoString(ACCOUNT_SERVER), ")");
   Print("💰 Saldo Actual: ", DoubleToString(AccountInfoDouble(ACCOUNT_BALANCE), 2), " ", AccountInfoString(ACCOUNT_CURRENCY));
   Print("==========================================================");

   if(InpRunNativeStrategy) {
      fastEmaHandle = iMA(_Symbol, _Period, InpFastEmaPeriod, 0, MODE_EMA, PRICE_CLOSE);
      slowEmaHandle = iMA(_Symbol, _Period, InpSlowEmaPeriod, 0, MODE_EMA, PRICE_CLOSE);
      Print("🤖 [NATIVO MT5] Estrategia autónoma interna activada (Sin depender de alertas de TradingView).");
   }

   // Primera sincronización inmediata
   SyncAccountWithMarketSense();
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Desinicialización                                                |
//+------------------------------------------------------------------+
void OnDeinit(const int reason) {
   EventKillTimer();
   if(fastEmaHandle != INVALID_HANDLE) IndicatorRelease(fastEmaHandle);
   if(slowEmaHandle != INVALID_HANDLE) IndicatorRelease(slowEmaHandle);
   Print("🛑 [EMS-MarketSense Bridge] Detenido. Razón: ", reason);
}

//+------------------------------------------------------------------+
//| Temporizador (Se ejecuta cada InpSyncIntervalSec)                |
//+------------------------------------------------------------------+
void OnTimer() {
   // 1. Sincronizar saldo y telemetría en tiempo real con MarketSense
   SyncAccountWithMarketSense();

   // 2. Consultar y ejecutar órdenes pendientes del Webhook / TradingView
   FetchAndExecutePendingOrders();
}

//+------------------------------------------------------------------+
//| Tick del mercado (Para gestión de Breakeven y estrategia nativa)|
//+------------------------------------------------------------------+
void OnTick() {
   if(InpAutoBreakeven) {
      ManageBreakeven();
   }

   if(InpRunNativeStrategy) {
      CheckNativeStrategySignals();
   }
}

//+------------------------------------------------------------------+
//| 1. Sincronización de Telemetría con Servidor MarketSense         |
//+------------------------------------------------------------------+
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
      Print("[!] Error WebRequest MT5. Habilita WebRequest en MT5: Herramientas -> Opciones -> Asesores Expertos -> Añadir URL: ", "${currentOrigin}");
   }
}

//+------------------------------------------------------------------+
//| 2. Sondeo y Ejecución de Órdenes Pendientes del Webhook          |
//+------------------------------------------------------------------+
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

//+------------------------------------------------------------------+
//| Abre la orden recibida del Webhook con SL y TP calculados        |
//+------------------------------------------------------------------+
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
      } else {
         Print("[!] Error ejecutando BUY: ", trade.ResultRetcodeDescription());
      }
   } else if(isSell) {
      double sl = ask + (InpBreakevenTriggerPips * _Point * 10);
      double tp = bid - (InpBreakevenTriggerPips * 2.5 * _Point * 10);
      if(trade.Sell(volume, _Symbol, bid, sl, tp, "MarketSense TV Webhook")) {
         Print("🚀 [EJECUTADO] Venta SELL en ", _Symbol, " Lotes: ", volume, " Precio: ", bid);
      } else {
         Print("[!] Error ejecutando SELL: ", trade.ResultRetcodeDescription());
      }
   }
}

//+------------------------------------------------------------------+
//| 3. Protección de Posiciones: Auto-Breakeven (+1 pip de ganancia) |
//+------------------------------------------------------------------+
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

//+------------------------------------------------------------------+
//| 4. Estrategia Nativa Autónoma (Sin alertas de TradingView)        |
//+------------------------------------------------------------------+
void CheckNativeStrategySignals() {
   datetime currentBar = iTime(_Symbol, _Period, 0);
   if(currentBar == lastBarTime) return; // Solo 1 vez por barra cerrada
   lastBarTime = currentBar;

   if(fastEmaHandle == INVALID_HANDLE || slowEmaHandle == INVALID_HANDLE) return;

   double fastMAs[], slowMAs[];
   ArraySetAsSeries(fastMAs, true);
   ArraySetAsSeries(slowMAs, true);

   if(CopyBuffer(fastEmaHandle, 0, 1, 2, fastMAs) < 2 || CopyBuffer(slowEmaHandle, 0, 1, 2, slowMAs) < 2) return;

   // Cruce Alcista
   if(fastMAs[1] <= slowMAs[1] && fastMAs[0] > slowMAs[0]) {
      if(PositionsTotal() == 0) {
         double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
         double sl = ask - (InpBreakevenTriggerPips * _Point * 10);
         double tp = ask + (InpBreakevenTriggerPips * 2.0 * _Point * 10);
         trade.Buy(InpDefaultLots, _Symbol, ask, sl, tp, "MarketSense Nativo MT5");
         Print("🎯 [NATIVO MT5] Cruce EMA alcista detectado. Orden BUY abierta automáticamente.");
      }
   }
   // Cruce Bajista
   else if(fastMAs[1] >= slowMAs[1] && fastMAs[0] < slowMAs[0]) {
      if(PositionsTotal() == 0) {
         double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
         double sl = bid + (InpBreakevenTriggerPips * _Point * 10);
         double tp = bid - (InpBreakevenTriggerPips * 2.0 * _Point * 10);
         trade.Sell(InpDefaultLots, _Symbol, bid, sl, tp, "MarketSense Nativo MT5");
         Print("🎯 [NATIVO MT5] Cruce EMA bajista detectado. Orden SELL abierta automáticamente.");
      }
   }
}
`;
};

export const MQL5_EXPERT_ADVISOR_CODE = getMql5ExpertAdvisorCode();
