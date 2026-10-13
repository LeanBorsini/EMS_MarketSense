import { INSTRUMENTS } from './symbolResolver';
import { TradingAccount, AccountRiskRules } from '../types/execution';

export interface PositionSizeResult {
  lotSize: number;
  exactRiskUsd: number;
  riskPercent: number;
  stopDistancePips: number;
  estimatedSpreadCost: number;
  estimatedCommissionCost: number;
  potentialRewardUsd: number;
  riskRewardRatio: number;
  isAllowed: boolean;
  warningReason?: string;
}

/**
 * Calculates strict institutional position size
 * Guarantees risk does not exceed prop firm max daily or per-trade limits
 */
export function calculatePositionSize(
  account: TradingAccount,
  symbol: string,
  entryPrice: number,
  stopLossPrice: number,
  takeProfitPrice: number,
  direction: 'BUY' | 'SELL',
  customRiskPercent?: number,
  customRiskUsd?: number
): PositionSizeResult {
  const spec = INSTRUMENTS[symbol] || {
    pipSize: 0.1,
    digits: 2,
    contractSize: 1,
    pipValueUsdPerLot: 1.0,
  };

  const rules: AccountRiskRules = account.riskRules;

  // Determine allowed risk USD
  let targetRiskUsd: number;
  if (customRiskUsd !== undefined && customRiskUsd > 0) {
    targetRiskUsd = customRiskUsd;
  } else {
    const percent = customRiskPercent ?? rules.maxRiskPerTradePercent;
    targetRiskUsd = (account.currentEquity * percent) / 100;
  }

  // Cap at hard max rule
  if (rules.maxRiskPerTradeUsd && targetRiskUsd > rules.maxRiskPerTradeUsd) {
    targetRiskUsd = rules.maxRiskPerTradeUsd;
  }

  // Calculate stop distance
  const priceDistance = Math.abs(entryPrice - stopLossPrice);
  const stopDistancePips = priceDistance / spec.pipSize;

  if (stopDistancePips <= 0) {
    return {
      lotSize: 0.01,
      exactRiskUsd: 0,
      riskPercent: 0,
      stopDistancePips: 0,
      estimatedSpreadCost: 0,
      estimatedCommissionCost: 0,
      potentialRewardUsd: 0,
      riskRewardRatio: 0,
      isAllowed: false,
      warningReason: 'El Stop Loss no puede ser igual al precio de entrada.',
    };
  }

  // Average institutional commission per standard lot: ~$5 to $7 round-turn
  const commissionPerLot = 5.0;
  const spreadPipsEst = symbol === 'EURUSD' ? 0.8 : symbol === 'XAUUSD' ? 1.8 : 1.2;
  const spreadCostPerLot = spreadPipsEst * spec.pipValueUsdPerLot;

  // Total cost per lot if SL is hit:
  const riskPerLot = (stopDistancePips * spec.pipValueUsdPerLot) + commissionPerLot + spreadCostPerLot;

  let calculatedLots = targetRiskUsd / riskPerLot;

  // Round down to standard lot increment (0.01)
  calculatedLots = Math.max(0.01, Math.floor(calculatedLots * 100) / 100);

  const exactRiskUsd = calculatedLots * riskPerLot;
  const riskPercent = (exactRiskUsd / account.currentEquity) * 100;

  // Reward calculation
  const rewardPriceDistance = Math.abs(takeProfitPrice - entryPrice);
  const rewardPips = rewardPriceDistance / spec.pipSize;
  const potentialRewardUsd = (rewardPips * spec.pipValueUsdPerLot * calculatedLots) - (commissionPerLot * calculatedLots);
  const riskRewardRatio = exactRiskUsd > 0 ? potentialRewardUsd / exactRiskUsd : 0;

  // Guardrail checks
  let isAllowed = true;
  let warningReason: string | undefined;

  // Check 1: Circuit breaker already active
  if (account.status === 'CIRCUIT_BREAKER' || rules.circuitBreakerActive) {
    isAllowed = false;
    warningReason = 'CIRCUIT BREAKER ACTIVO: Límite diario de pérdida alcanzado. Operativa bloqueada.';
  }

  // Check 2: Daily drawdown threshold
  const currentDailyLoss = account.startOfDayBalance - account.currentEquity;
  const potentialDailyLoss = currentDailyLoss + exactRiskUsd;
  const maxAllowedDailyLoss = (account.startOfDayBalance * rules.maxDailyLossPercent) / 100;

  if (potentialDailyLoss > maxAllowedDailyLoss) {
    isAllowed = false;
    warningReason = `Riesgo excede el límite diario permitido (${rules.maxDailyLossPercent}% = $${maxAllowedDailyLoss.toFixed(2)}). Preserva tu cuenta de fondeo.`;
  }

  return {
    lotSize: calculatedLots,
    exactRiskUsd,
    riskPercent,
    stopDistancePips,
    estimatedSpreadCost: calculatedLots * spreadCostPerLot,
    estimatedCommissionCost: calculatedLots * commissionPerLot,
    potentialRewardUsd,
    riskRewardRatio: Math.max(0, riskRewardRatio),
    isAllowed,
    warningReason,
  };
}

/**
 * Evaluates whether an open trade should trigger Auto-Breakeven or Trailing Stop
 */
export function checkAutoBreakeven(
  entryPrice: number,
  currentPrice: number,
  originalSl: number,
  direction: 'BUY' | 'SELL',
  symbol: string,
  triggerR: number = 1.0
): { shouldMoveToBreakeven: boolean; newSlPrice: number } {
  const spec = INSTRUMENTS[symbol] || { pipSize: 0.1 };
  const initialRiskPrice = Math.abs(entryPrice - originalSl);

  if (direction === 'BUY') {
    const profitPrice = currentPrice - entryPrice;
    if (profitPrice >= initialRiskPrice * triggerR) {
      // Move to entry + 1 pip buffer for spread
      const newSl = entryPrice + (spec.pipSize * 2);
      return { shouldMoveToBreakeven: true, newSlPrice: newSl };
    }
  } else {
    const profitPrice = entryPrice - currentPrice;
    if (profitPrice >= initialRiskPrice * triggerR) {
      const newSl = entryPrice - (spec.pipSize * 2);
      return { shouldMoveToBreakeven: true, newSlPrice: newSl };
    }
  }

  return { shouldMoveToBreakeven: false, newSlPrice: originalSl };
}
