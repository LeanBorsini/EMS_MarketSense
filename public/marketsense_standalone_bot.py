#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
  EMS-MarketSense · Bot Autónomo 100% Python para MetaTrader 5
=============================================================================
  CONEXIÓN DIRECTA CON CREDENCIALES: Sin intermediarios ni simulaciones.
  
  ¿Por qué en Python es tan fácil y directo?
  Porque este script corre en tu propia máquina (Windows o VPS) donde está 
  instalado MetaTrader 5, comunicándose mediante la librería nativa de MetaQuotes.
  Tu saldo real se lee directamente del broker.

  Requisitos:
    pip install MetaTrader5 requests

  Ejecución:
    python marketsense_standalone_bot.py
=============================================================================
"""

import time
import sys
import threading
import json
from datetime import datetime

try:
    import MetaTrader5 as mt5
except ImportError:
    print("=" * 65)
    print("❌ ERROR: La librería 'MetaTrader5' no está instalada.")
    print("👉 Ejecuta en tu terminal de comandos: pip install MetaTrader5 requests")
    print("=" * 65)
    sys.exit(1)

try:
    import requests
except ImportError:
    requests = None

# =============================================================================
# 1. CREDENCIALES Y CONFIGURACIÓN DEL BROKER (Coloca tus datos reales aquí)
# =============================================================================
LOGIN = 50198273                   # Tu número de cuenta MT5 (entero)
PASSWORD = "TU_PASSWORD_AQUI"      # Tu contraseña del broker
SERVER = "ICMarketsSC-Demo"        # Nombre del servidor de tu broker
SYMBOL = "US500"                   # Símbolo para operar (ej: US500, EURUSD, BTCUSD)

# =============================================================================
# 2. GESTIÓN DE RIESGO INSTITUCIONAL
# =============================================================================
USE_FIXED_LOTS = False             # Si es False calcula % exacto de tu saldo real
FIXED_LOTS = 0.1                   # Lotes fijos si USE_FIXED_LOTS = True
RISK_PERCENT = 1.0                 # Porcentaje de riesgo del saldo real por trade (1.0 = 1%)
AUTO_BREAKEVEN_PIPS = 15           # Pips en ganancia para mover Stop Loss a Breakeven (+1 pip)
MAGIC_NUMBER = 202610              # Identificador único de órdenes del bot
MAX_OPEN_TRADES = 2                # Máximo de operaciones simultáneas

# =============================================================================
# 3. MODOS DE OPERACIÓN
# =============================================================================
ENABLE_AUTONOMOUS_STRATEGY = True  # Estrategia EMA automática interna (Sin TradingView)
ENABLE_LOCAL_WEBHOOK = True        # Servidor HTTP local para recibir alertas TradingView sin expiración
LOCAL_WEBHOOK_PORT = 5000          # Puerto local (ej: http://localhost:5000/webhook)

# Sincronización opcional con el panel web / app móvil de MarketSense
WEB_SYNC_URL = "http://localhost:3000/api/mt5/sync"
SYNC_INTERVAL_SECONDS = 2


# =============================================================================
# 4. FUNCIONES DE CONEXIÓN Y CUENTA
# =============================================================================
def conectar_metatrader():
    print("\n" + "=" * 65)
    print("🚀 [1/3] Inicializando terminal MetaTrader 5...")
    if not mt5.initialize():
        print(f"❌ Error al inicializar MT5: {mt5.last_error()}")
        print("👉 Asegúrate de tener instalado MetaTrader 5 en este equipo.")
        return False

    print(f"🔑 [2/3] Conectando credenciales: Cuenta #{LOGIN} en '{SERVER}'...")
    authorized = mt5.login(login=int(LOGIN), password=str(PASSWORD), server=str(SERVER))
    
    if not authorized:
        print(f"⚠️ Aviso de login directo: {mt5.last_error()}")
        print("   Intentando leer la cuenta activa actualmente en el terminal...")
    
    acc = mt5.account_info()
    if acc is None:
        print(f"❌ No se pudo conectar a la cuenta: {mt5.last_error()}")
        print("   Verifica que el número de cuenta, contraseña y servidor sean correctos.")
        return False

    print("=" * 65)
    print("✅ [3/3] ¡CONEXIÓN EXITOSA! DATOS REALES DE TU BROKER:")
    print(f"   👤 Titular:       {acc.name}")
    print(f"   🏦 Broker:        {acc.company}")
    print(f"   🔢 Cuenta:        #{acc.login} ({acc.server})")
    print(f"   💰 Saldo Real:    ${acc.balance:,.2f} {acc.currency}")
    print(f"   📈 Equidad Real:  ${acc.equity:,.2f} {acc.currency}")
    print(f"   🛡️ Margen Libre:  ${acc.margin_free:,.2f} {acc.currency}")
    print(f"   ⚡ Apalancamiento: 1:{acc.leverage}")
    print("=" * 65 + "\n")
    return True


def sincronizar_con_panel_web():
    """Envía telemetría en tiempo real al panel web de MarketSense."""
    if not requests or not WEB_SYNC_URL:
        return
    
    try:
        acc = mt5.account_info()
        if not acc:
            return
            
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
        requests.post(WEB_SYNC_URL, json=payload, timeout=2.0)
    except Exception:
        pass


# =============================================================================
# 5. CÁLCULO DE LOTAJE INSTITUCIONAL Y EJECUCIÓN
# =============================================================================
def resolver_simbolo(nombre):
    """Resuelve el nombre exacto del símbolo en el broker (sufijos como .pro, .cash, etc.)."""
    info = mt5.symbol_info(nombre)
    if info:
        return nombre
    
    alternativas = [
        nombre, nombre + ".cash", nombre + "m", nombre + ".pro",
        "US500", "SPX500", "SP500", "USA500", "US500Cash",
        "EURUSD", "EURUSDm", "EURUSD.pro", "BTCUSD"
    ]
    for alt in alternativas:
        if mt5.symbol_info(alt):
            return alt
    return nombre


def calcular_lote_por_riesgo(simbolo, sl_pips):
    """Calcula el tamaño de posición exacto arriesgando el porcentaje configurado."""
    if USE_FIXED_LOTS:
        return FIXED_LOTS

    acc = mt5.account_info()
    sym_info = mt5.symbol_info(simbolo)
    if not acc or not sym_info or sl_pips <= 0:
        return FIXED_LOTS

    balance = acc.balance
    riesgo_usd = (balance * RISK_PERCENT) / 100.0
    
    tick_value = sym_info.trade_tick_value
    tick_size = sym_info.trade_tick_size
    point = sym_info.point
    
    if tick_value == 0 or tick_size == 0:
        return FIXED_LOTS

    valor_pip_lote = (tick_value / tick_size) * (point * 10)
    if valor_pip_lote <= 0:
        return FIXED_LOTS

    lotes_calculados = riesgo_usd / (sl_pips * valor_pip_lote)
    
    step = sym_info.volume_step
    vol_min = sym_info.volume_min
    vol_max = sym_info.volume_max
    
    lotes_normalizados = round(lotes_calculados / step) * step
    lotes_final = max(vol_min, min(vol_max, lotes_normalizados))
    return round(lotes_final, 2)


def abrir_orden(accion, simbolo=SYMBOL, stop_pips=25, tp_pips=50, comentario="MarketSense PyBot"):
    """Ejecuta una orden Buy o Sell en el broker con Stop Loss y Take Profit."""
    sym = resolver_simbolo(simbolo)
    
    if not mt5.symbol_select(sym, True):
        print(f"❌ No se pudo habilitar el símbolo {sym} en MT5")
        return False

    sym_info = mt5.symbol_info(sym)
    if not sym_info:
        print(f"❌ Símbolo no encontrado: {sym}")
        return False

    posiciones = mt5.positions_get(symbol=sym)
    if posiciones and len([p for p in posiciones if p.magic == MAGIC_NUMBER]) >= MAX_OPEN_TRADES:
        print(f"⚠️ Límite de {MAX_OPEN_TRADES} operaciones alcanzado para {sym}. No se abre nueva posición.")
        return False

    tick = mt5.symbol_info_tick(sym)
    if not tick:
        print(f"❌ No hay cotización de ticks para {sym}")
        return False

    lotes = calcular_lote_por_riesgo(sym, stop_pips)
    point = sym_info.point

    if accion.upper() == "BUY":
        tipo_orden = mt5.ORDER_TYPE_BUY
        precio = tick.ask
        sl = precio - (stop_pips * point * 10)
        tp = precio + (tp_pips * point * 10)
    elif accion.upper() == "SELL":
        tipo_orden = mt5.ORDER_TYPE_SELL
        precio = tick.bid
        sl = precio + (stop_pips * point * 10)
        tp = precio - (tp_pips * point * 10)
    else:
        print(f"❌ Acción inválida: {accion}")
        return False

    solicitud = {
        "action": mt5.TRADE_ACTION_DEAL,
        "symbol": sym,
        "volume": lotes,
        "type": tipo_orden,
        "price": precio,
        "sl": sl,
        "tp": tp,
        "deviation": 20,
        "magic": MAGIC_NUMBER,
        "comment": comentario,
        "type_time": mt5.ORDER_TIME_GTC,
        "type_filling": mt5.ORDER_FILLING_IOC,
    }

    resultado = mt5.order_send(solicitud)
    if resultado.retcode != mt5.TRADE_RETCODE_DONE:
        solicitud["type_filling"] = mt5.ORDER_FILLING_FOK
        resultado = mt5.order_send(solicitud)

    if resultado.retcode == mt5.TRADE_RETCODE_DONE:
        print(f"\n🎯 [ORDEN EJECUTADA] {accion.upper()} {lotes} lotes en {sym} @ {precio:.5f}")
        print(f"   🛑 Stop Loss: {sl:.5f} | 🎯 Take Profit: {tp:.5f} | Ticket #{resultado.order}")
        return True
    else:
        print(f"❌ Fallo al ejecutar {accion}: {resultado.comment} (código {resultado.retcode})")
        return False


# =============================================================================
# 6. AUTO-BREAKEVEN: PROTECCIÓN DE CAPITAL AUTOMÁTICA
# =============================================================================
def gestionar_auto_breakeven():
    """Mueve el Stop Loss a precio de entrada + 1 pip cuando la posición gana X pips."""
    posiciones = mt5.positions_get()
    if not posiciones:
        return

    for p in posiciones:
        if p.magic != MAGIC_NUMBER:
            continue

        sym_info = mt5.symbol_info(p.symbol)
        if not sym_info:
            continue

        point = sym_info.point
        ganancia_pips = AUTO_BREAKEVEN_PIPS * point * 10
        pip_proteccion = 1.0 * point * 10

        if p.type == mt5.ORDER_TYPE_BUY:
            if p.price_current >= (p.price_open + ganancia_pips) and p.sl < p.price_open:
                nuevo_sl = p.price_open + pip_proteccion
                req = {
                    "action": mt5.TRADE_ACTION_SLTP,
                    "position": p.ticket,
                    "symbol": p.symbol,
                    "sl": nuevo_sl,
                    "tp": p.tp,
                }
                res = mt5.order_send(req)
                if res.retcode == mt5.TRADE_RETCODE_DONE:
                    print(f"🛡️ [AUTO-BREAKEVEN] Stop Loss movido a entrada +1 pip para BUY #{p.ticket}")

        elif p.type == mt5.ORDER_TYPE_SELL:
            if p.price_current <= (p.price_open - ganancia_pips) and (p.sl > p.price_open or p.sl == 0):
                nuevo_sl = p.price_open - pip_proteccion
                req = {
                    "action": mt5.TRADE_ACTION_SLTP,
                    "position": p.ticket,
                    "symbol": p.symbol,
                    "sl": nuevo_sl,
                    "tp": p.tp,
                }
                res = mt5.order_send(req)
                if res.retcode == mt5.TRADE_RETCODE_DONE:
                    print(f"🛡️ [AUTO-BREAKEVEN] Stop Loss movido a entrada +1 pip para SELL #{p.ticket}")


# =============================================================================
# 7. ESTRATEGIA AUTÓNOMA INTERNA (OPCIONAL - SIN TRADINGVIEW)
# =============================================================================
ultima_barra = None

def ejecutar_estrategia_autonoma():
    """Estrategia basada en medias móviles exponenciales nativas de MT5."""
    global ultima_barra
    sym = resolver_simbolo(SYMBOL)
    
    rates = mt5.copy_rates_from_pos(sym, mt5.TIMEFRAME_M15, 0, 60)
    if rates is None or len(rates) < 55:
        return

    barra_actual = rates[-1]['time']
    if barra_actual == ultima_barra:
        return
    ultima_barra = barra_actual

    closes = [r['close'] for r in rates]
    
    def calcular_ema(datos, periodo):
        k = 2.0 / (periodo + 1)
        ema = [datos[0]]
        for precio in datos[1:]:
            ema.append(precio * k + ema[-1] * (1 - k))
        return ema

    ema_rapida = calcular_ema(closes, 20)
    ema_lenta = calcular_ema(closes, 50)

    if ema_rapida[-2] <= ema_lenta[-2] and ema_rapida[-1] > ema_lenta[-1]:
        print(f"📈 [ESTRATEGIA] Cruce EMA Alcista detectado en {sym} M15")
        abrir_orden("BUY", sym, stop_pips=20, tp_pips=40, comentario="PyBot Cruce EMA")

    elif ema_rapida[-2] >= ema_lenta[-2] and ema_rapida[-1] < ema_lenta[-1]:
        print(f"📉 [ESTRATEGIA] Cruce EMA Bajista detectado en {sym} M15")
        abrir_orden("SELL", sym, stop_pips=20, tp_pips=40, comentario="PyBot Cruce EMA")


# =============================================================================
# 8. SERVIDOR HTTP LOCAL PARA SEÑALES TRADINGVIEW (SIN VENCIMIENTO)
# =============================================================================
def iniciar_servidor_webhook_local():
    """Servidor HTTP ligero incorporado para recibir alertas de TradingView localmente."""
    from http.server import HTTPServer, BaseHTTPRequestHandler

    class WebhookHandler(BaseHTTPRequestHandler):
        def do_POST(self):
            try:
                length = int(self.headers.get('content-length', 0))
                body = self.rfile.read(length).decode('utf-8')
                data = json.loads(body)
                
                accion = data.get("action", "BUY")
                simbolo = data.get("symbol", SYMBOL)
                contratos = float(data.get("contracts", FIXED_LOTS))
                
                print(f"\n🔔 [SEÑAL WEBHOOK RECIBIDA] {accion} en {simbolo} ({contratos} lotes)")
                abrir_orden(accion, simbolo, comentario="TV Webhook Py")

                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"status":"ok","executed":true}')
            except Exception as e:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(f'{{"error":"{str(e)}"}}'.encode('utf-8'))

        def log_message(self, format, *args):
            return

    server = HTTPServer(('0.0.0.0', LOCAL_WEBHOOK_PORT), WebhookHandler)
    print(f"🌐 [WEBHOOK SERVER] Escuchando alertas en http://localhost:{LOCAL_WEBHOOK_PORT}/webhook")
    server.serve_forever()


# =============================================================================
# 9. BUCLE PRINCIPAL DE EJECUCIÓN (24/7)
# =============================================================================
def main():
    if not conectar_metatrader():
        return

    if ENABLE_LOCAL_WEBHOOK:
        t_webhook = threading.Thread(target=iniciar_servidor_webhook_local, daemon=True)
        t_webhook.start()

    print("🤖 Bot en vigilancia activa. Presiona Ctrl + C para detener.\n")

    contador = 0
    while True:
        try:
            gestionar_auto_breakeven()

            if ENABLE_AUTONOMOUS_STRATEGY:
                ejecutar_estrategia_autonoma()

            sincronizar_con_panel_web()

            contador += 1
            if contador % 15 == 0:
                acc = mt5.account_info()
                if acc:
                    hora = datetime.now().strftime("%H:%M:%S")
                    print(f"[{hora}] Cuenta #{acc.login} | Saldo: ${acc.balance:,.2f} | Equidad: ${acc.equity:,.2f} | Flotante: ${acc.profit:,.2f}")

            time.sleep(SYNC_INTERVAL_SECONDS)

        except KeyboardInterrupt:
            print("\n🛑 Bot detenido por el usuario.")
            mt5.shutdown()
            break
        except Exception as e:
            print(f"⚠️ Excepción en bucle: {e}")
            time.sleep(2)

if __name__ == "__main__":
    main()
