# Arquitectura Modular, Factorizable y Mantenible · EMS-MarketSense

Este documento describe la arquitectura modular del sistema, diseñada con las mejores prácticas de ingeniería de software (SOLID, Clean Architecture, Facade Pattern, Feature Flags y desacoplamiento por dominios).

---

## 1. Principios de Diseño Aplicados

1. **Responsabilidad Única (SRP):**
   - El anterior "god-hook" `useTradingEngine.ts` ha sido refactorizado en un **patrón Fachada (Facade Pattern)** liviano (~80 líneas) que orquesta sub-hooks independientes y desacoplados:
     - `useAccountManager.ts`: Gestión de cuentas multi-broker, saldos, límites de riesgo y switches.
     - `useStrategyManager.ts`: Gestión de estrategias algorítmicas cuantitativas.
     - `useTradeExecution.ts`: Enrutamiento de órdenes manuales, cierres discrecionales, pánico de emergencia y notas de diario.
     - `useMarketFeed.ts`: Ingesta de ticks y fluctuación de precios institucionales.
     - `useAutonomousDaemon.ts`: Bucle de vigilancia 24/7 (Stop Loss, Take Profit, Auto-Breakeven a +1R).
     - `useMT5Telemetry.ts`: Sondeo de telemetría y handshake en vivo con MetaTrader 5.
     - `useWebhookListener.ts`: Escucha de alertas entrantes de TradingView.
     - `useLogger.ts`: Cola de eventos y auditoría del sistema con control de memoria.

2. **Feature Flags Centralizados (`src/config/features.ts`):**
   - Todos los módulos funcionales cuentan con un interruptor (`boolean`) en `APP_FEATURES`.
   - Si apagas una función (`enablePythonDirect: false`, `enableTradingJournal: false`, `enableTradingViewWebhooks: false`, etc.), la UI, navegación y los intervalos en segundo plano se suspenden automáticamente sin generar errores ni consumir CPU.

3. **Registro de Módulos Dinámico (`src/config/modules.ts`):**
   - La barra de navegación (`Header.tsx`), el enrutador (`App.tsx`) y los cajones de ajustes (`SettingsDrawer.tsx`) leen dinámicamente el `MODULE_REGISTRY`.
   - No hay botones ni pestañas "hardcodeadas".

4. **Backend Modular (`server/routes/`):**
   - `server.ts` actúa como orquestador ligero (<70 líneas).
   - Cada API reside en su propio router modular: `mt5Routes.ts`, `webhookRoutes.ts`, `syncRoutes.ts`, `aiRoutes.ts`.

---

## 2. Guía Rápida: Cómo Quitar o Deshabilitar Algo en el Futuro

### Opción A: Deshabilitar temporalmente con 1 línea
Abre `src/config/features.ts` y cambia el flag correspondiente a `false`:

```ts
export const APP_FEATURES: AppFeatureFlags = {
  enablePythonDirect: false,       // Oculta el bot de Python
  enableTradingViewWebhooks: false, // Oculta Piloto 24/7 / Webhooks
  enableTradingJournal: false,     // Oculta el Diario de Trading
  enableAiStrategyAudit: false,    // Oculta Estrategias
  // ...
};
```
*Efecto inmediato:* La pestaña desaparece del Header, el contenido se oculta de `App.tsx` y cualquier poller en segundo plano se detiene automáticamente.

### Opción B: Eliminar permanentemente un módulo del código
Si deseas borrar un componente o carpeta física:
1. Elimina su entrada del array `MODULE_REGISTRY` en `src/config/modules.ts`.
2. Elimina la importación y la línea `<Componente ... />` en `src/App.tsx`.
3. Borra el archivo `.tsx` en `src/components/`.
4. El resto de la aplicación compilará al 100% sin efectos secundarios.

---

## 3. Estructura de Directorios

```
src/
├── config/
│   ├── features.ts          # Feature flags y constantes del sistema
│   └── modules.ts           # Registro de pestañas y módulos de la UI
├── hooks/
│   ├── useTradingEngine.ts  # Fachada principal (Facade)
│   ├── useAccountManager.ts # Dominio: Cuentas y saldo
│   ├── useStrategyManager.ts# Dominio: Estrategias
│   ├── useTradeExecution.ts # Dominio: Órdenes y ejecuciones
│   ├── useMarketFeed.ts     # Dominio: Cotizaciones y ticks
│   ├── useAutonomousDaemon.ts# Dominio: Daemon 24/7 y Breakeven
│   ├── useMT5Telemetry.ts   # Dominio: MT5 Gateway & EA
│   ├── useWebhookListener.ts# Dominio: Webhooks TradingView
│   └── useLogger.ts         # Dominio: Logs del sistema
├── components/              # Componentes de presentación desacoplados
├── data/                    # Datos por defecto y generadores de código
├── lib/                     # Librerías puras (matemáticas de riesgo, storage, símbolos)
└── types/                   # Tipos TypeScript compartidos
server/
├── routes/                  # Routers modulares de Express
└── server.ts                # Entrypoint de desarrollo y producción
```
