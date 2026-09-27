/**
 * Financial Health Score Calculation Engine
 *
 * Implements the scoring methodology from FINANCIAL_HEALTH_SCORE_SPEC.md
 */

import {
  UserFinancialData,
  HealthScoreBreakdown,
  HealthScoreResult,
  ScoreLabel,
  ScoreColor,
} from './types';

// Currency conversion rates (in production, fetch these from a real source)
const EXCHANGE_RATES = {
  USD_TO_EGP: 48, // Example rate, update dynamically
  EUR_TO_EGP: 52, // Example rate, update dynamically
  GOLD_PRICE_PER_GRAM_EGP: 2500, // Example, update dynamically
};

/**
 * Calculate Installment Load Score (40% weight)
 * load_ratio = monthly_bnpl_payments / monthly_income
 */
function calculateInstallmentLoadScore(data: UserFinancialData): number {
  if (data.monthlyIncome <= 0) return 0;

  const totalMonthlyPayments = data.installments.reduce(
    (sum, inst) => sum + inst.monthlyPayment,
    0
  );

  const loadRatio = totalMonthlyPayments / data.monthlyIncome;

  if (loadRatio <= 0.2) return 100;
  if (loadRatio <= 0.35) return 80;
  if (loadRatio <= 0.5) return 60;
  if (loadRatio <= 0.7) return 40;
  return 20;
}

/**
 * Calculate Emergency Fund Score (20% weight)
 * months_covered = liquid_savings / monthly_expenses
 */
function calculateEmergencyFundScore(data: UserFinancialData): number {
  if (data.monthlyExpenses <= 0) return 0;

  const monthsCovered = data.savingsEGP / data.monthlyExpenses;

  if (monthsCovered >= 6) return 100;
  if (monthsCovered >= 3) return 80;
  if (monthsCovered >= 1) return 60;
  if (monthsCovered > 0) return 40;
  return 0;
}

/**
 * Calculate Debt-to-Assets Score (15% weight)
 * net_worth = total_assets - total_debt
 */
function calculateDebtToAssetsScore(data: UserFinancialData): number {
  // Calculate total debt
  const bnplDebt = data.installments.reduce(
    (sum, inst) => sum + inst.monthlyPayment * inst.remainingMonths,
    0
  );
  const loanDebt = data.loans.reduce(
    (sum, loan) => sum + loan.monthlyPayment * loan.remainingMonths,
    0
  );
  const totalDebt = bnplDebt + loanDebt;

  // Calculate total assets (in EGP)
  const goldValueEGP = data.goldGrams * EXCHANGE_RATES.GOLD_PRICE_PER_GRAM_EGP;
  const forexValueEGP =
    data.savingsUSD * EXCHANGE_RATES.USD_TO_EGP +
    data.savingsEUR * EXCHANGE_RATES.EUR_TO_EGP;
  const totalAssets = data.savingsEGP + goldValueEGP + forexValueEGP;

  const netWorth = totalAssets - totalDebt;

  if (netWorth > totalDebt * 2) return 100; // 2:1 ratio
  if (netWorth > totalDebt) return 80; // 1:1 ratio
  if (netWorth > 0) return 60; // Positive net worth
  if (netWorth > totalDebt * -0.5) return 40; // Debt < 2x assets
  return 20; // Deeply indebted
}

/**
 * Calculate Savings Diversity Score (15% weight)
 * Penalizes if any single asset class > 60% of total
 */
function calculateSavingsDiversityScore(data: UserFinancialData): number {
  const goldValueEGP = data.goldGrams * EXCHANGE_RATES.GOLD_PRICE_PER_GRAM_EGP;
  const forexValueEGP =
    data.savingsUSD * EXCHANGE_RATES.USD_TO_EGP +
    data.savingsEUR * EXCHANGE_RATES.EUR_TO_EGP;

  const totalSavings =
    data.savingsEGP + goldValueEGP + forexValueEGP;

  if (totalSavings === 0) return 0;

  const egpPct = data.savingsEGP / totalSavings;
  const goldPct = goldValueEGP / totalSavings;
  const forexPct = forexValueEGP / totalSavings;

  const maxPct = Math.max(egpPct, goldPct, forexPct);

  if (maxPct <= 0.6) return 100;
  if (maxPct <= 0.7) return 80;
  if (maxPct <= 0.85) return 60;
  return 40;
}

/**
 * Calculate Income Stability Score (10% weight)
 * Salary = 100, business/freelance based on volatility
 */
function calculateIncomeStabilityScore(data: UserFinancialData): number {
  if (data.incomeType === 'salary') return 100;

  // If volatility data available, use it
  if (data.incomeVolatility !== undefined) {
    const coefficient = data.incomeVolatility;
    if (coefficient <= 0.15) return 80;
    if (coefficient <= 0.3) return 60;
    return 40;
  }

  // Default: business/freelance without data
  return 60;
}

/**
 * Calculate final Health Score
 */
export function calculateHealthScore(
  data: UserFinancialData,
  previousScore?: number
): HealthScoreResult {
  // Calculate component scores
  const breakdown: HealthScoreBreakdown = {
    installmentLoadScore: calculateInstallmentLoadScore(data),
    emergencyFundScore: calculateEmergencyFundScore(data),
    debtToAssetsScore: calculateDebtToAssetsScore(data),
    savingsDiversityScore: calculateSavingsDiversityScore(data),
    incomeStabilityScore: calculateIncomeStabilityScore(data),
  };

  // Calculate weighted final score
  const finalScore = Math.round(
    breakdown.installmentLoadScore * 0.4 +
      breakdown.emergencyFundScore * 0.2 +
      breakdown.debtToAssetsScore * 0.15 +
      breakdown.savingsDiversityScore * 0.15 +
      breakdown.incomeStabilityScore * 0.1
  );

  // Determine label and color
  const { label, color } = getScoreLabelAndColor(finalScore);
  const message = getScoreMessage(finalScore);

  // Calculate trend if previous score exists
  const trend = previousScore
    ? {
        previousScore,
        change: finalScore - previousScore,
        percentageChange:
          Math.round(((finalScore - previousScore) / previousScore) * 100 * 10) / 10,
      }
    : undefined;

  return {
    finalScore,
    breakdown,
    label,
    color,
    message,
    lastUpdated: new Date(),
    trend,
  };
}

/**
 * Determine score label and color based on final score
 */
function getScoreLabelAndColor(
  score: number
): { label: ScoreLabel; color: ScoreColor } {
  if (score >= 85) return { label: 'Excellent', color: '#10B981' };
  if (score >= 70) return { label: 'Healthy', color: '#34D399' };
  if (score >= 50) return { label: 'Fair', color: '#FBBF24' };
  if (score >= 30) return { label: 'Warning', color: '#F97316' };
  return { label: 'Critical', color: '#EF4444' };
}

/**
 * Get contextual message based on score
 */
function getScoreMessage(score: number): string {
  if (score >= 85)
    return "You're in great shape! Keep building your financial strength.";
  if (score >= 70)
    return 'On the right track. Stay consistent with your savings and payments.';
  if (score >= 50)
    return 'Room for improvement. Focus on reducing installment load or building emergency fund.';
  if (score >= 30)
    return 'Caution: your finances are fragile. Consider reducing new purchases.';
  return 'Critical: urgent action needed. Seek guidance or reduce commitments immediately.';
}

/**
 * Get actionable recommendations based on breakdown
 */
export function getHealthScoreRecommendations(
  breakdown: HealthScoreBreakdown
): string[] {
  const recommendations: string[] = [];

  // Sort by lowest scores first (highest impact improvements)
  const scores = [
    {
      name: 'Installment Load',
      score: breakdown.installmentLoadScore,
      action: 'Reduce installment payments or increase income',
    },
    {
      name: 'Emergency Fund',
      score: breakdown.emergencyFundScore,
      action: 'Build 3-month emergency fund in liquid savings',
    },
    {
      name: 'Debt-to-Assets',
      score: breakdown.debtToAssetsScore,
      action: 'Work toward positive net worth',
    },
    {
      name: 'Savings Diversity',
      score: breakdown.savingsDiversityScore,
      action: 'Diversify savings: hold gold, USD, and EGP',
    },
    {
      name: 'Income Stability',
      score: breakdown.incomeStabilityScore,
      action: 'Build multiple income streams or stabilize current income',
    },
  ];

  scores
    .sort((a, b) => a.score - b.score)
    .slice(0, 3) // Top 3 recommendations
    .forEach((item) => {
      if (item.score < 80) {
        recommendations.push(item.action);
      }
    });

  return recommendations;
}
