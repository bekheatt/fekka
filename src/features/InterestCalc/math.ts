// Interest math for Egyptian financing offers.
// Three ways offers are quoted:
//  • "L.E 2,500 a month for 12 months" (installment apps, shops) → we work out the hidden rate
//  • a FLAT yearly rate (common for car loans / personal loans in Egypt): interest is charged on the
//    full amount for the whole period, even as you pay it down, so it costs far more than it sounds
//  • a REDUCING (declining-balance) yearly rate: interest only on what you still owe — the fair comparison
// The "real yearly rate" we show is always the reducing-balance equivalent, so every offer can be compared.

export type RateKind = 'flat' | 'reducing';

export type Inputs = {
  price: number;       // full price of the thing (or amount you want to borrow if there's no down payment)
  down: number;        // down payment / advance
  months: number;
  fees: number;        // one-time admin / insurance fees paid upfront
  // either the monthly payment is known…
  monthly?: number;
  // …or the rate is known
  rate?: number;       // yearly %, e.g. 18
  kind?: RateKind;
};

export type Row = { month: number; payment: number; interest: number; principal: number; balance: number };

export type Result = {
  financed: number;    // price − down
  monthly: number;
  totalPaid: number;   // down + monthly × months + fees
  interest: number;    // what you pay on top of the price (interest + fees)
  interestOnly: number;
  extraPct: number;    // interest as % of the price
  realRate: number;    // yearly %, reducing-balance equivalent (includes fees)
  flatEquivalent: number; // the same deal expressed as a flat yearly %
  schedule: Row[];
};

// Payment for a normal (reducing) loan
export const payment = (P: number, rMonthly: number, n: number) =>
  n <= 0 ? 0 : rMonthly === 0 ? P / n : (P * rMonthly) / (1 - Math.pow(1 + rMonthly, -n));

// Payment for a flat-rate loan: interest = P × rate × years, spread evenly
export const flatPayment = (P: number, flatYearly: number, n: number) =>
  n <= 0 ? 0 : (P + P * (flatYearly / 100) * (n / 12)) / n;

// Monthly rate hidden in "borrow P, pay `pay` for n months" (bisection — always converges)
export function hiddenMonthlyRate(P: number, pay: number, n: number) {
  if (P <= 0 || n <= 0 || pay * n <= P) return 0;
  let lo = 0, hi = 1;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (payment(P, mid, n) > pay) hi = mid; else lo = mid;
  }
  return (lo + hi) / 2;
}

export function calculate(x: Inputs): Result | null {
  const price = Math.max(0, x.price), down = Math.min(Math.max(0, x.down), price), n = Math.round(x.months), fees = Math.max(0, x.fees);
  const financed = price - down;
  if (financed <= 0 || n <= 0) return null;

  let monthly: number;
  if (x.monthly && x.monthly > 0) monthly = x.monthly;
  else if (x.rate != null && x.rate >= 0) monthly = x.kind === 'flat' ? flatPayment(financed, x.rate, n) : payment(financed, x.rate / 100 / 12, n);
  else return null;

  // Rate on the loan itself (what the bank charges) — used for the month-by-month split
  const r = hiddenMonthlyRate(financed, monthly, n);
  // Real rate including fees: fees paid upfront mean you effectively receive less money
  const rReal = hiddenMonthlyRate(financed - fees, monthly, n);

  const schedule: Row[] = [];
  let bal = financed;
  for (let m = 1; m <= n; m++) {
    const interest = bal * r;
    const principal = Math.min(bal, monthly - interest);
    bal = Math.max(0, bal - principal);
    schedule.push({ month: m, payment: monthly, interest, principal, balance: m === n ? 0 : bal });
  }

  const totalPaid = down + monthly * n + fees;
  const interestOnly = Math.max(0, monthly * n - financed);
  const interest = totalPaid - price;
  return {
    financed, monthly, totalPaid, interest, interestOnly,
    extraPct: price > 0 ? (interest / price) * 100 : 0,
    realRate: rReal * 12 * 100,
    flatEquivalent: ((monthly * n + fees - financed) / financed) / (n / 12) * 100,
    schedule,
  };
}
