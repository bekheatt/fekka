// "Can I afford it?" — judges a purchase against the person's real numbers.
// Pure logic (no screens) so it can be tested on its own.

export type Money = {
  income: number;        // regular monthly income
  committed: number;     // installments + loans + bills + gam'eya each month
  debtMonthly: number;   // installments + loans only (for the installment-load rule)
  spending: number;      // typical monthly day-to-day spending
  leftThisMonth: number; // what's still free this month after commitments and spending so far
  cash: number;          // pounds, dollars and euros you could use right away
};

export type Verdict = 'yes' | 'careful' | 'no' | 'unknown';
export type Result = {
  verdict: Verdict;
  headline: string;            // English key, translated by the screen
  reasons: { key: string; vars?: Record<string, number | string>; good: boolean }[];
  tip?: { key: string; vars?: Record<string, number | string> };
  numbers: Record<string, number>;
};

const SAFE_LOAD = 0.35;  // installments + loans above 35% of income is risky (same line as the Health Score)
const MAX_LOAD = 0.5;
const CUSHION_MONTHS = 3; // emergency cash worth 3 months of outgoings

const monthsToSave = (amount: number, surplus: number) => (surplus > 0 ? Math.ceil(amount / surplus) : Infinity);

// ---------- One-time purchase ----------
export function oneTime(m: Money, price: number): Result {
  const outgoings = m.committed + m.spending;
  const surplus = m.income - outgoings;              // what a normal month leaves over
  const cushion = outgoings * CUSHION_MONTHS;
  // Whatever this month's leftover can't cover comes out of savings
  const fromSavings = Math.max(0, price - Math.max(0, m.leftThisMonth));
  const cashAfter = m.cash - fromSavings;
  const numbers = { price, surplus, cash: m.cash, cashAfter, cushion, leftThisMonth: m.leftThisMonth, fromSavings };
  if (m.income <= 0) return { verdict: 'unknown', headline: 'Add your income first', reasons: [], numbers };

  const reasons: Result['reasons'] = [];
  const fromThisMonth = m.leftThisMonth >= price;
  reasons.push(fromThisMonth
    ? { key: "It fits in what's left this month ({x})", vars: { x: m.leftThisMonth }, good: true }
    : { key: "It's more than what's left this month ({x})", vars: { x: Math.max(0, m.leftThisMonth) }, good: false });
  reasons.push(fromSavings === 0
    ? { key: 'Your savings stay untouched', good: true }
    : cashAfter >= cushion
    ? { key: 'Your savings stay above a 3-month safety net', good: true }
    : cashAfter >= outgoings
      ? { key: 'Your savings would drop below a 3-month safety net', good: false }
      : cashAfter >= 0
        ? { key: 'It would leave you less than 1 month of expenses in savings', good: false }
        : { key: "You don't have enough savings to cover it", good: false });

  const n = monthsToSave(price, surplus);
  let verdict: Verdict;
  if (fromThisMonth || cashAfter >= cushion) verdict = 'yes';
  else if (cashAfter >= outgoings || n <= 3) verdict = 'careful';
  else verdict = 'no';

  let tip: Result['tip'];
  if (verdict !== 'yes') {
    if (surplus <= 0) tip = { key: 'Your monthly outgoings already match or exceed your income. Cut spending before buying this.' };
    else if (Number.isFinite(n)) tip = { key: 'Put aside {x} a month and you can buy it in {n} months without touching your savings.', vars: { x: Math.ceil(price / n), n } };
  }
  const headline = verdict === 'yes' ? 'Yes, you can afford it' : verdict === 'careful' ? 'You can, but it would stretch you' : 'Not right now';
  return { verdict, headline, reasons, tip, numbers };
}

// ---------- Installment plan ----------
export function installment(m: Money, monthly: number, months: number, down = 0): Result {
  const outgoings = m.committed + m.spending;
  const surplus = m.income - outgoings;
  const surplusAfter = surplus - monthly;
  const load = m.income > 0 ? m.debtMonthly / m.income : 0;
  const loadAfter = m.income > 0 ? (m.debtMonthly + monthly) / m.income : 0;
  const total = down + monthly * Math.max(0, months);
  const numbers = { monthly, months, down, total, surplus, surplusAfter, load, loadAfter, cash: m.cash };
  if (m.income <= 0) return { verdict: 'unknown', headline: 'Add your income first', reasons: [], numbers };

  const reasons: Result['reasons'] = [];
  const pct = (x: number) => Math.round(x * 100);
  reasons.push({
    key: 'Installments & loans would take {a}% of your income (now {b}%)',
    vars: { a: pct(loadAfter), b: pct(load) },
    good: loadAfter <= SAFE_LOAD,
  });
  reasons.push(surplusAfter > 0
    ? { key: 'You would still have {x} left each month', vars: { x: surplusAfter }, good: surplusAfter >= m.income * 0.1 }
    : { key: 'Your monthly outgoings would be {x} more than your income', vars: { x: -surplusAfter }, good: false });
  const downOk = down <= 0 || m.cash - down >= outgoings;
  if (down > 0) reasons.push(downOk
    ? { key: 'You have the cash for the down payment', good: true }
    : { key: 'The down payment would leave you less than 1 month of expenses in savings', good: false });

  let verdict: Verdict;
  if (loadAfter <= SAFE_LOAD && surplusAfter >= m.income * 0.1 && downOk) verdict = 'yes';
  else if (loadAfter <= MAX_LOAD && surplusAfter > 0) verdict = 'careful';
  else verdict = 'no';

  let tip: Result['tip'];
  if (verdict !== 'yes' && m.income > 0) {
    const room = Math.floor(Math.min(m.income * SAFE_LOAD - m.debtMonthly, surplus - m.income * 0.1));
    tip = room > 0
      ? { key: 'A comfortable installment for you is up to {x} a month. Try a longer plan or a bigger down payment.', vars: { x: room } }
      : { key: 'Your current installments already take most of your room. Finish one before starting another.' };
  }
  const headline = verdict === 'yes' ? 'Yes, this installment fits' : verdict === 'careful' ? 'Possible, but it would be tight' : "This installment doesn't fit right now";
  return { verdict, headline, reasons, tip, numbers };
}

// Typical monthly spending: average of the last 3 complete months that have expenses,
// or this month so far scaled to a full month if there's no history yet.
export function typicalSpending(expenses: { amount: number; date: string }[], today = new Date()): number {
  const key = (d: Date) => d.getFullYear() * 12 + d.getMonth();
  const now = key(today);
  const byMonth = new Map<number, number>();
  for (const e of expenses) {
    const k = key(new Date(e.date));
    byMonth.set(k, (byMonth.get(k) ?? 0) + e.amount);
  }
  const past = [1, 2, 3].map(i => byMonth.get(now - i)).filter((x): x is number => x !== undefined);
  const thisMonth = byMonth.get(now) ?? 0;
  const daysIn = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const projected = today.getDate() >= 7 ? (thisMonth / today.getDate()) * daysIn : thisMonth;
  if (past.length) return Math.max(past.reduce((a, b) => a + b, 0) / past.length, thisMonth);
  return projected;
}
