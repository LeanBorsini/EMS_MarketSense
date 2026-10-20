export interface PendingOrder {
  id: string;
  accountId: string;
  symbol: string;
  action: 'BUY' | 'SELL';
  contracts: number;
  stopLoss?: number;
  takeProfit?: number;
  timestamp: string;
}

export interface WebhookSignalLog {
  id: string;
  accountId: string;
  symbol: string;
  action: 'BUY' | 'SELL';
  contracts: number;
  stopLoss?: number;
  takeProfit?: number;
  receivedAt: string;
  source: string;
  executedByEA: boolean;
}

export interface MT5SyncTelemetry {
  login: string;
  server: string;
  broker: string;
  balance: number;
  equity: number;
  marginFree: number;
  floatingProfit: number;
  currency: string;
  leverage: number;
  lastSync: string;
  pingMs: number;
  connected: boolean;
  syncSource: 'EA_MQL5' | 'PYTHON_BRIDGE' | 'DIRECT_GATEWAY';
}

export interface SyncRoom {
  code: string;
  state: any;
  createdAt: number;
  lastUpdated: number;
  devices: number;
  hostDevice?: string;
  guestDevice?: string;
}

export interface AILearningAuditResult {
  marketRegime: string;
  winRate: number;
  profitFactor: number;
  totalTradesAnalyzed: number;
  overallHealthStatus: 'HEALTHY' | 'NEEDS_CALIBRATION' | 'DEGRADED';
  maeAnalysis: {
    averageMaePips: number;
    verdict: string;
    stopLossCalibrationRecommendation: string;
  };
  mfeAnalysis: {
    averageMfePips: number;
    verdict: string;
    takeProfitAndBreakevenRecommendation: string;
  };
  adaptationRoadmap: {
    title: string;
    description: string;
    suggestedChange: string;
    impact: 'HIGH' | 'MEDIUM' | 'LOW';
  }[];
  institutionalVerdict: string;
}
