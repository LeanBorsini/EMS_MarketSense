/**
 * Application Feature Flags & Modular Configuration
 * 
 * Central registry to enable, disable, or toggle modular features.
 * In the future, if you wish to remove or deprecate any feature (such as TradingView webhooks,
 * device pairing, or simulation mode), you can simply toggle its flag here or safely remove
 * its corresponding module without affecting the rest of the application.
 */

export interface AppFeatureFlags {
  /** 100% Standalone Python Bot for local MetaTrader 5 execution */
  enablePythonDirect: boolean;

  /** Native MetaTrader 5 Expert Advisor (.mq5) universal bridge */
  enableMetaTraderEA: boolean;

  /** External webhook receiver for TradingView alerts */
  enableTradingViewWebhooks: boolean;

  /** 5-digit device-to-device pairing relay for phone/desktop sync */
  enableCloudDeviceSync: boolean;

  /** AI-powered quantitative strategy audit and adaptation analysis */
  enableAiStrategyAudit: boolean;

  /** Algorithmic trading execution daemon (tick updates, auto-breakeven, trailing stops) */
  enableTradingDaemon: boolean;

  /** Built-in manual trade execution and risk ticket order placing */
  enableManualTradePlacer: boolean;

  /** Maximum risk rules enforcement (daily loss limit, max drawdown, circuit breaker) */
  enableRiskCircuitBreaker: boolean;

  /** Trade journal, post-mortem analysis and execution notes */
  enableTradingJournal: boolean;

  /** Unattended 24/7 cloud runner guide (Oracle Cloud / VPS / systemd) */
  enableUnattendedVpsGuide: boolean;
}

export const APP_FEATURES: AppFeatureFlags = {
  enablePythonDirect: true,
  enableMetaTraderEA: true,
  enableTradingViewWebhooks: true,
  enableCloudDeviceSync: true,
  enableAiStrategyAudit: true,
  enableTradingDaemon: true,
  enableManualTradePlacer: true,
  enableRiskCircuitBreaker: true,
  enableTradingJournal: true,
  enableUnattendedVpsGuide: true,
};

export const SYSTEM_DEFAULTS = {
  defaultRiskPercent: 0.5,
  defaultDailyLossPercent: 2.0,
  defaultTrailingDrawdownPercent: 5.0,
  defaultBreakevenTriggerPips: 15.0,
  defaultMagicNumber: 202610,
  telemetryPollIntervalMs: 2500,
  webhookPollIntervalMs: 2000,
};
