// Financial Health Score (0-100), calculated from the app's real data.
// Method and weights: docs/FINANCIAL_HEALTH_SCORE_SPEC.md
import type { Data } from '../../store';
import { savingValue } from '../../store';
import { t as tr } from '../../i18n';

export type Totals = {
  income: number; instMonthly: number; loanMonthly: number; committed: number;
  spent: number; assets: number; debt: number;
};

export type PartKey = 'load' | 'emergency' | 'networth' | 'diversity' | 'stability';
export type Part = { key: PartKey; label: string; weight: number; score: number; detail: string; tip: string };
export type Band = 'Excellent' | 'Healthy' | 'Fair' | 'Warning' | 'Critical';
export type HealthScore = { score: number; band: Band; parts: Part[] };

export const WEIGHTS: Record<PartKey, number> = { load: 0.4, emergency: 0.2, networth: 0.15, diversity: 0.15, stability: 0.1 };

const pct = (x: number) => `${Math.round(x * 100)}%`;

// 1. How much of your income already goes to installments and loans
function loadPart(t: Totals): Part {
  const ratio = (t.instMonthly + t.loanMonthly) / t.income;
  const score = ratio <= 0.2 ? 100 : ratio <= 0.35 ? 80 : ratio <= 0.5 ? 60 : ratio <= 0.7 ? 40 : 20;
  return {
    key: 'load', label: 'Installment load', weight: WEIGHTS.load, score,
    detail: tr('{x} of your income goes to installments & loans', { x: pct(ratio) }),
    tip: ratio > 0.35 ? tr('Avoid new installments until this drops below 35%') : tr('Keep new installments under 20% of income'),
  };
}

// 2. How many months your cash, dollars and euros could cover your monthly outgoings
function emergencyPart(d: Data, t: Totals): Part {
  const liquid = d.savings.filter(s => ['egp', 'usd', 'eur'].includes(s.kind)).reduce((s, x) => s + savingValue(x, d.rates), 0);
  const monthly = Math.max(t.committed + t.spent, t.income * 0.5, 1);
  const months = liquid / monthly;
  const score = months >= 6 ? 100 : months >= 3 ? 80 : months >= 1 ? 60 : months > 0 ? 40 : 0;
  return {
    key: 'emergency', label: 'Emergency fund', weight: WEIGHTS.emergency, score,
    detail: tr('Your cash covers {n} months of expenses', { n: months.toFixed(1) }),
    tip: months < 3 ? tr('Build cash to cover 3 months of expenses') : tr('Great safety net, keep it up'),
  };
}

// 3. What you own compared to what you owe
function networthPart(t: Totals): Part {
  const net = t.assets - t.debt;
  let score: number;
  if (t.debt === 0) score = t.assets > 0 ? 100 : 60;
  else if (net > t.debt * 2) score = 100;
  else if (net > t.debt) score = 80;
  else if (net > 0) score = 60;
  else if (net > -t.debt * 0.5) score = 40;
  else score = 20;
  return {
    key: 'networth', label: 'Own vs owe', weight: WEIGHTS.networth, score,
    detail: t.debt === 0 ? tr('You have no debt') : net >= 0 ? tr('You own more than you owe') : tr('You owe more than you own'),
    tip: net < 0 ? tr('Pay down debt before adding new savings goals') : tr('Your net worth is positive'),
  };
}

// 4. Whether savings are spread across cash, foreign currency and gold
function diversityPart(d: Data): Part {
  const groups: Record<string, number> = {};
  const group = (k: string) => (k.startsWith('gold') ? 'gold' : k === 'usd' || k === 'eur' ? 'fx' : k === 'egp' ? 'egp' : 'other');
  d.savings.forEach(s => { groups[group(s.kind)] = (groups[group(s.kind)] ?? 0) + savingValue(s, d.rates); });
  const total = Object.values(groups).reduce((a, b) => a + b, 0);
  if (total <= 0) return { key: 'diversity', label: 'Savings mix', weight: WEIGHTS.diversity, score: 0, detail: tr('No savings added yet'), tip: tr('Start saving. Even a little gold or dollars helps') };
  const max = Math.max(...Object.values(groups)) / total;
  const score = max <= 0.6 ? 100 : max <= 0.7 ? 80 : max <= 0.85 ? 60 : 40;
  return {
    key: 'diversity', label: 'Savings mix', weight: WEIGHTS.diversity, score,
    detail: tr('{x} of your savings is in one type', { x: pct(max) }),
    tip: max > 0.7 ? tr('Spread savings across pounds, gold and dollars') : tr('Nicely spread savings'),
  };
}

// 5. How predictable your income is
function stabilityPart(d: Data): Part {
  const byWork: Record<string, number> = { employee: 100, retired: 100, business: 70, freelancer: 60, student: 50, other: 60 };
  let score = byWork[d.settings.work ?? 'other'] ?? 60;
  const recurring = d.incomes.filter(i => !i.oneOff).length;
  if (recurring === 0) score = Math.min(score, 40);
  else if (recurring >= 2) score = Math.min(100, score + 10); // more than one steady income
  return {
    key: 'stability', label: 'Income stability', weight: WEIGHTS.stability, score,
    detail: recurring === 0 ? tr('No regular monthly income') : tr(recurring > 1 ? '{n} regular income sources' : '1 regular income source', { n: recurring }),
    tip: score < 70 ? tr('A second steady income would make you safer') : tr('Your income is steady'),
  };
}

export const bandOf = (score: number): Band =>
  score >= 85 ? 'Excellent' : score >= 70 ? 'Healthy' : score >= 50 ? 'Fair' : score >= 30 ? 'Warning' : 'Critical';

// Returns null when there's no income yet — the score can't mean anything without it
export function calculateHealthScore(d: Data, t: Totals): HealthScore | null {
  if (t.income <= 0) return null;
  const parts = [loadPart(t), emergencyPart(d, t), networthPart(t), diversityPart(d), stabilityPart(d)];
  const score = Math.round(parts.reduce((s, p) => s + p.score * p.weight, 0));
  return { score, band: bandOf(score), parts };
}
