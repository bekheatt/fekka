/**
 * Financial Health Score Feature
 *
 * Main exports for the Health Score feature
 */

export { FEATURE_FLAGS, isHealthScoreEnabled } from './config';
export { calculateHealthScore, getHealthScoreRecommendations } from './calculator';
export { useHealthScore } from './useHealthScore';
export type {
  HealthScoreBreakdown,
  HealthScoreResult,
  UserFinancialData,
  Installment,
  Loan,
  HealthScoreState,
  ScoreLabel,
  ScoreColor,
} from './types';
