import { AppFeatureFlags, APP_FEATURES } from './features';

export type TabId = 'BOT' | 'PYTHON' | 'SETUP' | 'CONNECT' | 'STRATEGY' | 'JOURNAL';

export interface AppModuleDefinition {
  id: TabId;
  label: string;
  shortLabel: string;
  icon: string;
  badge?: string;
  featureFlag: keyof AppFeatureFlags | 'always';
  description: string;
  canBeDisabled: boolean;
}

/**
 * MODULE_REGISTRY: Single source of truth for all pluggable UI tabs & features.
 * 
 * To permanently remove or disable a module in the future:
 * 1. Either set its feature flag to false in `features.ts`, OR
 * 2. Remove its entry from this array.
 * The Navigation Header, routing, and drawer items will automatically adjust
 * with ZERO broken links, orphan styles, or type errors.
 */
export const MODULE_REGISTRY: AppModuleDefinition[] = [
  {
    id: 'BOT',
    label: 'Mi Bot',
    shortLabel: 'Bot',
    icon: '🤖',
    featureFlag: 'always',
    description: 'Panel de control principal, balance en vivo y posiciones activas',
    canBeDisabled: false,
  },
  {
    id: 'PYTHON',
    label: 'Python Directo',
    shortLabel: 'Python',
    icon: '🐍',
    badge: 'Nativo',
    featureFlag: 'enablePythonDirect',
    description: 'Bot autónomo local 100% Python con conexión nativa por credenciales MT5',
    canBeDisabled: true,
  },
  {
    id: 'SETUP',
    label: 'Piloto 24/7',
    shortLabel: '24/7',
    icon: '⚡',
    badge: 'VPS',
    featureFlag: 'enableTradingViewWebhooks',
    description: 'Configuración desatendida para correr en la nube sin PC encendida',
    canBeDisabled: true,
  },
  {
    id: 'CONNECT',
    label: 'Cuentas',
    shortLabel: 'Cuentas',
    icon: '🔗',
    featureFlag: 'enableMetaTraderEA',
    description: 'Gestor multi-broker, vinculación de credenciales y sincronización',
    canBeDisabled: true,
  },
  {
    id: 'STRATEGY',
    label: 'Estrategias',
    shortLabel: 'Estrategias',
    icon: '📜',
    featureFlag: 'enableAiStrategyAudit',
    description: 'Puente de estrategias algorítmicas cuantitativas y reglas de entrada',
    canBeDisabled: true,
  },
  {
    id: 'JOURNAL',
    label: 'Diario',
    shortLabel: 'Diario',
    icon: '📓',
    featureFlag: 'enableTradingJournal',
    description: 'Registro de post-mortem institucional, métricas R y notas de disciplina',
    canBeDisabled: true,
  },
];

/**
 * Filter modules based on current active feature flags
 */
export function getAvailableModules(flags: AppFeatureFlags = APP_FEATURES): AppModuleDefinition[] {
  return MODULE_REGISTRY.filter(mod => {
    if (mod.featureFlag === 'always') return true;
    return !!flags[mod.featureFlag];
  });
}
