/**
 * Complete MQL5 Expert Advisor for MetaTrader 5
 * Connects MetaTrader 5 to MarketSense Execution Webhook Relay.
 * 100% autonomous, zero human interaction required.
 */

export const MQL5_EXPERT_ADVISOR_CODE = `//+------------------------------------------------------------------+
//|                                  MarketSense_Autonomous_Bridge.mq5|
//|                 MarketSense Autonomous Execution Engine v2.0    |
//|                        https://marketsense.app                   |
//+------------------------------------------------------------------+
#property copyright "MarketSense AI Systems"
#property link      "https://marketsense.app"
#property version   "2.00"
#property strict

#include <Trade\\Trade.mqh>

//--- Inputs
input group "=== Configuración del Puente MarketSense ==="
input string   InpWebhookUrl     = "https://tu-app-url.run.app/api/webhook/pending-orders"; // URL del Relay Webhook
input string   InpAccountId      = "29841029";          // Tu ID de cuenta / Login
input string   InpSecretKey      = "ms_sec_autonomous"; // Clave secreta
input int      InpPollIntervalMs = 1000;                // Intervalo de sondeo (milisegundos)

input group "=== Gestión de Riesgo y Protección ==="
input ulong    InpMagicNumber    = 109283;              // Magic Number del Bot
input double   InpMaxSlippagePips= 3.0;                 // Máximo deslizamiento permitido
input bool     InpAutoBreakeven  = true;                // Mover a Breakeven automáticamente
input double   InpBreakevenTriggerR = 1.0;              // Disparador de Breakeven (+1.0R)

//--- Global Objects
CTrade trade;
datetime lastCheckTime = 0;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   trade.SetExpertMagicNumber(InpMagicNumber);
   trade.SetMarginMode();
   trade.SetTypeFillingBySymbol(_Symbol);

   Print("✅ MarketSense Autonomous Bridge iniciado correctamente.");
   Print("📡 Escuchando señales automáticas para la cuenta: ", InpAccountId);
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("🛑 MarketSense Bridge detenido. Razón: ", reason);
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
   // 1. Revisar Trailing Breakeven para posiciones abiertas
   if(InpAutoBreakeven)
   {
      ManageBreakeven();
   }

   // 2. Comprobar nuevas órdenes cada intervalo de tiempo
   datetime now = TimeCurrent();
   if(now - lastCheckTime >= (InpPollIntervalMs / 1000))
   {
      lastCheckTime = now;
      FetchAndExecuteOrders();
   }
}

//+------------------------------------------------------------------+
//| Consulta y ejecuta órdenes pendientes desde el Webhook           |
//+------------------------------------------------------------------+
void FetchAndExecuteOrders()
{
   char postData[];
   char resultData[];
   string resultHeaders;
   string url = InpWebhookUrl + "?account_id=" + InpAccountId + "&secret=" + InpSecretKey;

   // Enviar petición HTTP al Relay
   int res = WebRequest("GET", url, "", 1000, postData, resultData, resultHeaders);
   if(res == 200)
   {
      string jsonResponse = CharArrayToString(resultData);
      if(StringLen(jsonResponse) > 10 && StringFind(jsonResponse, "\\"has_order\\":true") >= 0)
      {
         ProcessOrderJson(jsonResponse);
      }
   }
}

//+------------------------------------------------------------------+
//| Procesa y abre la orden en el broker sin intervención humana     |
//+------------------------------------------------------------------+
void ProcessOrderJson(string json)
{
   // Analizar acción (BUY o SELL)
   bool isBuy = (StringFind(json, "\\"BUY\\"") >= 0);
   bool isSell = (StringFind(json, "\\"SELL\\"") >= 0);

   if(!isBuy && !isSell) return;

   double volume = 0.5; // Lote predeterminado o calculado
   double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
   double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);

   // Abrir orden
   if(isBuy)
   {
      double sl = bid - (15.0 * _Point * 10);
      double tp = ask + (35.0 * _Point * 10);
      if(trade.Buy(volume, _Symbol, ask, sl, tp, "MarketSense Auto Buy"))
      {
         Print("🚀 [AUTÓNOMO] Orden BUY ejecutada exitosamente en ", _Symbol, " Lotes: ", volume);
      }
   }
   else if(isSell)
   {
      double sl = ask + (15.0 * _Point * 10);
      double tp = bid - (35.0 * _Point * 10);
      if(trade.Sell(volume, _Symbol, bid, sl, tp, "MarketSense Auto Sell"))
      {
         Print("🚀 [AUTÓNOMO] Orden SELL ejecutada exitosamente en ", _Symbol, " Lotes: ", volume);
      }
   }
}

//+------------------------------------------------------------------+
//| Protege posiciones moviendo el Stop Loss a Breakeven (+1 pip)    |
//+------------------------------------------------------------------+
void ManageBreakeven()
{
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket > 0 && PositionGetInteger(POSITION_MAGIC) == InpMagicNumber)
      {
         double openPrice = PositionGetDouble(POSITION_PRICE_OPEN);
         double currentPrice = PositionGetDouble(POSITION_PRICE_CURRENT);
         double sl = PositionGetDouble(POSITION_SL);
         long type = PositionGetInteger(POSITION_TYPE);

         // Para compras
         if(type == POSITION_TYPE_BUY)
         {
            if(currentPrice > openPrice + (15.0 * _Point * 10) && sl < openPrice)
            {
               double newSl = openPrice + (1.0 * _Point * 10); // +1 pip
               trade.PositionModify(ticket, newSl, PositionGetDouble(POSITION_TP));
               Print("🛡️ [BREAKEVEN] Stop Loss movido a precio de entrada para orden #", ticket);
            }
         }
         // Para ventas
         else if(type == POSITION_TYPE_SELL)
         {
            if(currentPrice < openPrice - (15.0 * _Point * 10) && (sl > openPrice || sl == 0))
            {
               double newSl = openPrice - (1.0 * _Point * 10); // -1 pip
               trade.PositionModify(ticket, newSl, PositionGetDouble(POSITION_TP));
               Print("🛡️ [BREAKEVEN] Stop Loss movido a precio de entrada para orden #", ticket);
            }
         }
      }
   }
}
//+------------------------------------------------------------------+
`;
