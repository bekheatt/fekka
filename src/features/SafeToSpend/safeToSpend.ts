// "Safe to spend today": what you can spend today and still cover every payment this month.
// Pure logic (no screens), so it's easy to test and to remove.
//
//   free this month = income − all of this month's payments (paid or not) − spending so far
//   today's budget  = (free this month + what you already spent today) ÷ days left including today
//   left for today  = today's budget − spent today
//   tomorrow        = what's free after today ÷ the days after today (if you stop spending now)

export type SafeToSpend =
  | { state: 'no-income' }
  | { state: 'over'; overBy: number }
  | { state: 'ok'; today: number; budget: number; spentToday: number; tomorrow: number | null; daysLeft: number };

export function safeToSpend(input: { income: number; left: number; spentToday: number }, now = new Date()): SafeToSpend {
  const { income, left, spentToday } = input;
  if (income <= 0) return { state: 'no-income' };
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = lastDay - now.getDate() + 1; // including today
  const pool = left + spentToday;                 // free money at the start of today
  if (pool <= 0) return { state: 'over', overBy: -left };
  const budget = pool / daysLeft;
  const today = budget - spentToday;
  const tomorrow = daysLeft > 1 ? Math.max(0, left) / (daysLeft - 1) : null;
  return { state: 'ok', today, budget, spentToday, tomorrow, daysLeft };
}
