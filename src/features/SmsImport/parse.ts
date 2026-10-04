// Reads Egyptian bank / wallet SMS (Arabic or English) and pulls out one transaction.
// It doesn't know any bank's exact template: it looks for the parts every bank uses —
// an amount next to a currency, a direction word (خصم / إضافة / debited / credited…),
// the other side (عند X / إلى X / من X / at X), a date, and a reference number.

export type Channel = 'instapay' | 'card' | 'transfer' | 'wallet' | 'atm' | 'other';
export type ParsedTx = {
  kind: 'expense' | 'income';
  amount: number;
  currency: string;        // EGP, USD, EUR…
  party?: string;          // shop or person
  date?: Date;             // undefined when the message has no date (use "now")
  ref?: string;            // bank reference, used to skip duplicates
  last4?: string;          // card / account ending
  balance?: number;
  channel: Channel;
  fingerprint: string;     // same message → same fingerprint
  text: string;
};

// Arabic letters and digits → one spelling, so keywords match however the bank typed them
export const normalize = (s: string) => s
  .replace(/[٠-٩]/g, c => String(c.charCodeAt(0) - 0x0660))
  .replace(/[۰-۹]/g, c => String(c.charCodeAt(0) - 0x06f0))
  .replace(/٫/g, '.').replace(/٬/g, ',')
  .replace(/[إأآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
  .replace(/[\u064B-\u0652\u0640]/g, '')          // tashkeel and tatweel
  .replace(/[\u200E\u200F\u202A-\u202E]/g, '')    // invisible direction marks
  .replace(/[ \t\u00A0]+/g, ' ');

const CURRENCY: [RegExp, string][] = [
  [/^(egp|le|l\.e\.?|e£|جم|ج\.م\.?|جنيه|جنيها|جنيهات|جنيه مصري)$/i, 'EGP'],
  [/^(usd|us\$|\$|دولار)$/i, 'USD'],
  [/^(eur|€|يورو)$/i, 'EUR'],
  [/^(sar|ريال)$/i, 'SAR'],
  [/^(aed|درهم)$/i, 'AED'],
  [/^(gbp|£)$/i, 'GBP'],
];
const CUR = String.raw`(EGP|L\.E\.?|LE|E£|ج\.م\.?|جنيه مصري|جنيهات|جنيها|جنيه|جم|USD|US\$|\$|دولار|EUR|€|يورو|SAR|ريال|AED|درهم|GBP|£)`;
const NUM = String.raw`(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?)`;
const LETTER = 'A-Za-z\\u0600-\\u06FF';
// amount then currency ("500.00 جم", "1370.41EGP") or currency then amount ("EGP 1,000", "جم 20146.23")
const MONEY = `(?:${NUM}\\s?${CUR}(?![${LETTER}]))|(?:(?:^|[^${LETTER}])${CUR}\\s?${NUM})`;
const moneyRe = () => new RegExp(MONEY, 'gi'); // fresh each time: a shared /g regex remembers where it stopped

const BALANCE = /(رصيد|المتاح|متاح|available|avail|avl|bal\b|balance)/i;
const AMOUNT_HINT = /(بمبلغ|مبلغ|قيمه|amount|of|for|خصم|شراء|سحب|charged|debited|credited|purchase|spent|paid|sent|received)\s*[:.]?\s*$/i;

const SKIP = [
  /(otp|one.?time|verification|رمز التحقق|رمز المرور|كلمه السر|كلمه المرور|لا تشارك|do not share|don't share|password)/i,
  /(مرفوض|رفض|declined|failed|unsuccessful|لم تتم|فشل|insufficient|غير كاف|reversed|cancelled|تم الغاء)/i,
];

// Strong direction phrases first, then single words. "بطاقه الخصم" (debit card) is a card name, not a debit.
const OUT_STRONG = /(من حسابكم|من حسابك|من بطاقتك|من بطاقتكم|تحويل صادر|from your (?:account|card|a\/c)|transfer(?:red)? to|sent to)/i;
const IN_STRONG = /(لحسابكم|لحسابك|الي حسابكم|الي حسابك|في حسابكم|في حسابك|لبطاقتكم|لبطاقتك|تحويل وارد|to your (?:account|card|a\/c)|into your|received from)/i;
const OUT_WORDS = /(خصم|سحب|شراء|مشتريات|دفع|سداد|debited|debit(?! card)|charged|purchase|spent|withdraw|paid|payment of|sent|transferred)/gi;
const IN_WORDS = /(اضافه|اضيف|ايداع|وارد|استلام|استلمت|استرداد|credited|credit(?! card)|received|deposit|refund)/gi;

const PARTY_STOP = String.raw`(?=\s{2,}|\s+(?:يوم|في\s+\d|بتاريخ|تاريخ|الرصيد|المتاح|رصيد|رقم|بمبلغ|الساعه|للمزيد|عن طريق|باستخدام|on\s|at\s\d|ref|avl|avail|bal|date|using|via|card|with)|\s*[,;]|\.\s|\s+\d{1,2}[\/-]\d{1,2}|$)`;
const PARTY_AT = new RegExp(String.raw`(?:^|\s)(?:عند|لدي|at|@|merchant:?)\s+(.+?)` + PARTY_STOP, 'i');
const PARTY_TO = new RegExp(String.raw`(?:^|\s)(?:الي|to)\s+(.+?)` + PARTY_STOP, 'i');
const PARTY_FROM = new RegExp(String.raw`(?:^|\s)(?:من|from)\s+(.+?)` + PARTY_STOP, 'i');
const NOT_PARTY = /^(حساب|بطاق|رقم|your|card|account|a\/c|the|mobile payment|\d)/i;
const CAPS_RUN = /[A-Z][A-Z0-9&'.*\-]+(?: [A-Z][A-Z0-9&'.*\-]*)*/g;
const NOT_MERCHANT = new Set(['EGP', 'LE', 'USD', 'EUR', 'IPN', 'ATM', 'POS', 'OTP', 'SMS', 'CIB', 'NBE', 'QNB', 'HSBC', 'AAIB', 'ADIB', 'BM', 'EG', 'IBAN', 'REF', 'AVL', 'BAL', 'A/C']);

const tidyName = (raw: string) => {
  let s = raw.replace(/\s+/g, ' ').trim().replace(/[\s:,.\-]+$/, '').replace(/\s+\d+$/, '');
  // masked names: "MOHAMED G** E** A****" → "MOHAMED G. E. A."
  s = s.split(' ').map(w => (/\*/.test(w) ? (w.replace(/\*+/g, '') ? w.replace(/\*+/g, '')[0] + '.' : '') : w)).filter(Boolean).join(' ');
  if (/^[^a-z]*$/.test(s) && /[A-Z]/.test(s)) s = s.toLowerCase().replace(/(^|[\s.'&-])([a-z])/g, (_, p, c) => p + c.toUpperCase());
  return s.slice(0, 40).trim();
};

const findParty = (n: string, kind: 'expense' | 'income') => {
  const tries = kind === 'expense' ? [PARTY_AT, PARTY_TO] : [PARTY_FROM];
  for (const re of tries) {
    const m = n.match(re);
    const p = m?.[1].trim();
    if (p && /^01\d{9}$/.test(p.split(' ')[0])) return p.split(' ')[0]; // wallet transfers name a phone number
    if (p && !NOT_PARTY.test(p) && /[A-Za-z\u0600-\u06FF]{2}/.test(p)) return tidyName(p);
  }
  // fallback: the longest ALL-CAPS run that isn't a currency or bank code ("ORACLE IRELAND")
  const runs = (n.match(CAPS_RUN) ?? []).map(r => r.trim()).filter(r => !NOT_MERCHANT.has(r) && r.replace(/[^A-Z]/g, '').length >= 3);
  runs.sort((a, b) => b.length - a.length);
  return runs[0] ? tidyName(runs[0]) : undefined;
};

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

const findDate = (n: string, now: Date) => {
  const t = n.match(/(\d{1,2}):(\d{2})/);
  // "03-OCT", "3 Oct 2026"
  const w = n.match(/(?:^|[^\d])(\d{1,2})[\s\-\/]?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*(?:[\s\-\/,]+(\d{4}|\d{2})(?![\d:]))?/i);
  if (w) {
    const year = w[3] ? (w[3].length === 2 ? 2000 + +w[3] : +w[3]) : now.getFullYear();
    const d = new Date(year, MONTHS.indexOf(w[2].toLowerCase()), +w[1], t ? +t[1] : 12, t ? +t[2] : 0);
    if (!w[3] && d.getTime() > now.getTime() + 36e5 * 24) d.setFullYear(year - 1);
    return d;
  }
  const m = n.match(/(?:^|[^\d.,])(\d{1,2})([\/-])(\d{1,2})(?:\2(\d{2,4}))?(?![\d])/);
  if (!m) return undefined;
  let a = +m[1], b = +m[3];
  let day: number, month: number;
  if (a > 12) { day = a; month = b; }
  else if (b > 12) { day = b; month = a; }
  else if (m[2] === '-' && !m[4]) { month = a; day = b; }     // "09-30" style (month-day)
  else { day = a; month = b; }                                // "03/10/26" style (day/month)
  if (month < 1 || month > 12 || day < 1 || day > 31) return undefined;
  let year = m[4] ? (m[4].length === 2 ? 2000 + +m[4] : +m[4]) : now.getFullYear();
  const d = new Date(year, month - 1, day, t ? +t[1] : 12, t ? +t[2] : 0);
  // a date in the future is most likely last year's (or day/month swapped)
  if (d.getTime() > now.getTime() + 36e5 * 24) {
    const swapped = day <= 12 ? new Date(year, day - 1, month, d.getHours(), d.getMinutes()) : null;
    if (swapped && swapped.getTime() <= now.getTime() + 36e5 * 24) return swapped;
    if (!m[4]) d.setFullYear(year - 1);
  }
  return d;
};

const hash = (s: string) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };

export function parseSms(text: string, now = new Date()): ParsedTx | null {
  const n = normalize(text).trim();
  if (!n || SKIP.some(r => r.test(n))) return null;

  // Every amount + currency in the message; the balance ones are set aside
  const found: { v: number; cur: string; at: number; end: number }[] = [];
  for (const m of n.matchAll(moneyRe())) {
    const num = m[1] ?? m[4], cur = m[2] ?? m[3];
    const v = parseFloat(num.replace(/,/g, ''));
    const code = CURRENCY.find(([re]) => re.test(cur))?.[1] ?? 'EGP';
    if (v > 0) found.push({ v, cur: code, at: m.index!, end: m.index! + m[0].length });
  }
  if (!found.length) return null;
  const isBalance = (i: number) => BALANCE.test(n.slice(Math.max(i ? found[i - 1].end : 0, found[i].at - 30), found[i].at + 4));
  const spendable = found.map((f, i) => ({ ...f, bal: isBalance(i) })).filter(f => !f.bal);
  if (!spendable.length) return null; // balance-only message
  const hinted = spendable.find(f => AMOUNT_HINT.test(n.slice(Math.max(0, f.at - 20), f.at)));
  const money = hinted ?? spendable[0];
  const balance = found.find((_, i) => isBalance(i))?.v;

  // Direction
  const plain = n.replace(/بطاقه الخصم|debit card|credit card|بطاقه الائتمان/gi, '');
  let kind: 'expense' | 'income' | null = null;
  if (OUT_STRONG.test(plain) && !IN_STRONG.test(plain)) kind = 'expense';
  else if (IN_STRONG.test(plain) && !OUT_STRONG.test(plain)) kind = 'income';
  else {
    const out = (plain.match(OUT_WORDS) ?? []).length, inn = (plain.match(IN_WORDS) ?? []).length;
    if (out > inn) kind = 'expense'; else if (inn > out) kind = 'income';
  }
  if (!kind) return null;

  const channel: Channel =
    /(instapay|انستاباي|انستا باي|ipn|لحظي)/i.test(n) ? 'instapay'
    : /(vodafone cash|فودافون كاش|etisalat cash|اتصالات كاش|orange cash|اورنج كاش|we pay|محفظه|wallet)/i.test(n) ? 'wallet'
    : /(atm|صراف|سحب نقدي|cash withdrawal)/i.test(n) ? 'atm'
    : /(بطاقه|card|\*{2,}\d{4})/i.test(n) ? 'card'
    : /(تحويل|transfer)/i.test(n) ? 'transfer' : 'other';

  const ref = n.match(/(?:الرقم المرجعي|رقم مرجعي|رقم المرجع|مرجع|ref(?:erence)?(?:\s*(?:no|number|#))?)\s*[:.#]?\s*([A-Z0-9]{6,})/i)?.[1];
  const last4 = n.match(/(?:\*{2,}|ending(?: with| in)?|رقم|xx+)\s*(\d{4})(?!\d)/i)?.[1];

  return {
    kind, amount: money.v, currency: money.cur, party: findParty(n, kind), date: findDate(n, now),
    ref, last4, balance, channel, text,
    fingerprint: ref ? `ref:${ref}` : `sms:${hash(n.replace(/\s+/g, ''))}`,
  };
}

// A pasted block can hold many messages. A new message starts on a line that has its own amount.
export function splitMessages(block: string) {
  const out: string[] = [];
  const hasMoney = (s: string) => moneyRe().test(normalize(s));
  for (const line of block.split(/\r?\n/).map(l => l.trim()).filter(Boolean)) {
    if (out.length && !(hasMoney(line) && hasMoney(out[out.length - 1]))) out[out.length - 1] += ' ' + line;
    else out.push(line);
  }
  return out;
}
