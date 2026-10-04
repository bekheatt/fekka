// Turns parsed bank SMS into Fekka expenses / incomes: picks a category, converts foreign currency,
// and skips messages that were already logged.
import type { Data, Expense, Income } from '../../store';
import { uid } from '../../store';
import { t } from '../../i18n';
import type { ParsedTx } from './parse';

// Common Egyptian shops and services → category. Your own picks (Data.merchantCats) always win.
const KEYWORDS: [string, RegExp][] = [
  ['Food', /(carrefour|spinneys|seoudi|metro market|kazyon|hyper|oscar|gourmet|kheir zaman|awlad ragab|fathalla|talabat|elmenus|breadfast|instashop|rabbit|mcdonald|kfc|burger|hardee|pizza|domino|papa john|starbucks|costa|cilantro|cafe|coffee|bakery|restaurant|food|grill|koshary|abou|tbs|cook door|مطعم|سوبر ماركت|ماركت|كافيه|مخبز|بقاله)/i],
  ['Transport', /(uber|careem|didi|indrive|swvl|halan|bolt|taxi|petrol|fuel|gas station|wataniya|watanya|chillout|misr petroleum|mobil|shell|total|emarat misr|parking|toll|metro ticket|بنزين|وقود|موقف|بنزينه)/i],
  ['Bills', /(vodafone(?! cash)|orange(?! cash)|etisalat(?! cash)|e&|\bwe\b|telecom egypt|fawry|electric|كهرباء|water|مياه|natural gas|petrotrade|town gas|internet|انترنت|فوري|tedata|school fee|tuition|اشتراك)/i],
  ['Shopping', /(amazon|noon|jumia|shein|zara|h&m|lc waikiki|defacto|max fashion|ikea|centrepoint|b\.tech|btech|2b|raya|apple\.com|apple store|city ?stars|mall|cairo festival|ملابس|مول)/i],
  ['Health', /(pharma|صيدلي|el ezaby|ezaby|seif|misr pharmacies|19011|hospital|مستشفي|clinic|عياده|alfa lab|al borg|البرج|lab|dental|doctor|vezeeta|دكتور)/i],
  ['Fun', /(netflix|spotify|anghami|shahid|osn|watch ?it|yango play|youtube|google play|app store|itunes|playstation|psn|steam|xbox|cinema|vox|imax|سينما|gym|fitness|club)/i],
];

export const isTransfer = (tx: ParsedTx) => tx.channel === 'instapay' || tx.channel === 'wallet' || tx.channel === 'transfer';

export const merchantKey = (party?: string) => (party ?? '').toLowerCase().replace(/[^a-z0-9؀-ۿ]+/g, ' ').trim();

export function guessCategory(tx: ParsedTx, learned?: Record<string, string>) {
  const key = merchantKey(tx.party);
  if (key && learned?.[key]) return learned[key];
  // match the shop name; only look at the whole message when there is no name (avoids words like "total")
  const hay = tx.party || tx.text;
  for (const [cat, re] of KEYWORDS) if (re.test(hay)) return cat;
  return isTransfer(tx) ? 'Transfers' : 'Other';
}

// Amount in L.E (foreign card purchases use today's rate when Fekka has one)
export function inPounds(tx: ParsedTx, rates: Record<string, number>) {
  const r = tx.currency === 'EGP' ? 1 : rates[tx.currency.toLowerCase()];
  return r ? Math.round(tx.amount * r * 100) / 100 : tx.amount;
}

export function describe(tx: ParsedTx) {
  const who = tx.party;
  if (tx.channel === 'atm') return t('Cash withdrawal');
  if (tx.kind === 'income') return who ? t('Transfer from {x}', { x: who }) : t('Money received');
  if (tx.channel === 'instapay' || tx.channel === 'wallet' || tx.channel === 'transfer') return who ? t('Transfer to {x}', { x: who }) : t('Transfer');
  return who ?? t('Card payment');
}

export const isLogged = (d: Data, fp: string) => d.expenses.some(e => e.src === fp) || d.incomes.some(i => i.src === fp);

export type Pick = { tx: ParsedTx; cat: string };

// Adds the picked transactions; returns the new ids so the caller can undo
export function logTransactions(d: Data, picks: Pick[]): { next: Data; ids: string[] } {
  const expenses: Expense[] = [], incomes: Income[] = [], ids: string[] = [];
  const learned = { ...(d.merchantCats ?? {}) };
  const seen = new Set<string>();
  for (const { tx, cat } of picks) {
    if (seen.has(tx.fingerprint) || isLogged(d, tx.fingerprint)) continue;
    seen.add(tx.fingerprint);
    const id = uid();
    ids.push(id);
    const date = (tx.date ?? new Date()).toISOString();
    const amount = inPounds(tx, d.rates);
    const foreign = tx.currency !== 'EGP' ? ` (${tx.currency} ${tx.amount})` : '';
    if (tx.kind === 'income') incomes.push({ id, source: describe(tx), monthly: amount, oneOff: date, src: tx.fingerprint, transfer: isTransfer(tx) || undefined });
    else {
      expenses.push({ id, cat, amount, note: describe(tx) + foreign, date, src: tx.fingerprint });
      const key = merchantKey(tx.party);
      if (key) learned[key] = cat;
    }
  }
  return {
    next: { ...d, expenses: [...expenses, ...d.expenses], incomes: [...d.incomes, ...incomes], merchantCats: learned },
    ids,
  };
}

// Removes what came from these messages (by fingerprint)
export const undoLogged = (d: Data, fps: string[]): Data =>
  ({ ...d, expenses: d.expenses.filter(e => !e.src || !fps.includes(e.src)), incomes: d.incomes.filter(i => !i.src || !fps.includes(i.src)) });

// A transaction the server read from a bank message (it keeps no message text)
export function fromInbox(row: { fingerprint: string; received_at: string; tx: { kind: 'expense' | 'income'; amount: number; currency: string; party: string | null; channel: string; date: string | null } }): ParsedTx {
  // "2026-09-30T20:48" is the time the bank wrote, read as this phone's local time; no date → when it arrived
  const m = row.tx.date?.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  const date = m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) : new Date(row.received_at);
  return {
    kind: row.tx.kind, amount: row.tx.amount, currency: row.tx.currency, party: row.tx.party ?? undefined,
    channel: row.tx.channel as ParsedTx['channel'], date, fingerprint: row.fingerprint, text: '',
  };
}
