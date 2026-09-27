/**
 * TypeScript Types for Financial Health Score
 */

export interface HealthScoreBreakdown {
  installmentLoadScore: number; // 0-100
  emergencyFundScore: number; // 0-100
  debtToAssetsScore: number; // 0-100
  savingsDiversityScore: number; // 0-100
  incomeStabilityScore: number; // 0-100
}

export interface HealthScoreResult {
  finalScore: number; // 0-100
  breakdown: HealthScoreBreakdown;
  label: ScoreLabel;
  color: ScoreColor;
  message: string;
  lastUpdated: Date;
  trend?: {
    previousScore: number;
    change: number; // +5, -3, etc.
    percentageChange: number; // +8.5%, -12%, etc.
  };
}

export type ScoreLabel =
  | 'Excellent'
  | 'Healthy'
  | 'Fair'
  | 'Warning'
  | 'Critical';

export type ScoreColor =
  | '#10B981' // Green (Excellent)
  | '#34D399' // Light Green (Healthy)
  | '#FBBF24' // Yellow (Fair)
  | '#F97316' // Orange (Warning)
  | '#EF4444'; // Red (Critical)

export interface UserFinancialData {
  monthlyIncome: number;
  incomeType: 'salary' | 'business' | 'freelance';

  // Installments & Loans
  installments: Installment[];
  loans: Loan[];

  // Savings
  savingsEGP: number;
  savingsUSD: number; // Will be converted to EGP
  savingsEUR: number; // Will be converted to EGP
  goldGrams: number; // Will be valued in EGP

  // Tracking
  monthlyExpenses: number; // Average of last 3 months
  incomeVolatility?: number; // Standard deviation of last 6 months income
}

export interface Installment {
  id: string;
  provider: 'valU' | 'Souhoola' | 'Klivvr' | 'Contact' | 'Other';
  monthlyPayment: number;
  remainingMonths: number;
  purchaseAmount?: number;
}

export interface Loan {
  id: string;
  name: string;
  monthlyPayment: number;
  remainingMonths: number;
  interestRate?: number;
}

export interface HealthScoreState {
  isCalculating: boolean;
  lastCalculatedAt: Date | null;
  error: string | null;
  data: HealthScoreResult | null;
}
