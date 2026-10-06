// Turns parsed bank SMS into Fekka expenses / incomes: picks a category, converts foreign currency,
// and skips messages that were already logged.
import type { Data, Expense, Income } from '../../store';
import { uid } from '../../store';
import { t } from '../../i18n';
import type { ParsedTx } from './parse';
import { dictionaryCategory, merchantKey } from './merchants';
import { canShare, crowdFor } from './crowd';

export const isTransfer = (tx: ParsedTx) => tx.channel === 'instapay' || tx.channel === 'wallet' || tx.channel === 'transfer';
export { merchantKey };

// Category for a transaction, most trusted first:
//   1. what you picked for this shop before (Data.merchantCats)
//   2. what 3+ Fekka users agree on (can correct the built-in list)
//   3. the built-in list of Egyptian shops (merchants.ts)
//   4. what 2 Fekka users agree on (fills in shops the list doesn't know)
//   5. Transfers for money sent to people, otherwise Other
export function guessCategory(tx: ParsedTx, learned?: Record<string, string>) {
  const key = merchantKey(tx.party);
  const mine = key ? learned?.[key] : undefined;
  if (mine && mine !== 'Other') return mine; // an old automatic "Other" shouldn't hide a better answer
  if (tx.party && canShare(tx)) {
    const crowd = crowdFor(key);
    if (crowd?.cat && crowd.n >= 3) return crowd.cat;
    const known = dictionaryCategory(tx.party);
    if (known) return known;
    if (crowd?.cat) return crowd.cat;
  }
  if (mine) return mine;
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

// chosen = the person picked this category themselves (not the automatic guess)
export type Pick = { tx: ParsedTx; cat: string; chosen?: boolean };

// Adds the picked transactions; returns the new ids so the caller can undo
export function logTransactions(d: Data, picks: Pick[]): { next: Data; ids: string[] } {
  const expenses: Expense[] = [], incomes: Income[] = [], ids: string[] = [];
  const learned = { ...(d.merchantCats ?? {}) };
  const seen = new Set<string>();
  for (const { tx, cat, chosen } of picks) {
    if (seen.has(tx.fingerprint) || isLogged(d, tx.fingerprint)) continue;
    seen.add(tx.fingerprint);
    const id = uid();
    ids.push(id);
    const date = (tx.date ?? new Date()).toISOString();
    const amount = inPounds(tx, d.rates);
    const foreign = tx.currency !== 'EGP' ? ` (${tx.currency} ${tx.amount})` : '';
    if (tx.kind === 'income') incomes.push({ id, source: describe(tx), monthly: amount, oneOff: date, src: tx.fingerprint, transfer: isTransfer(tx) || undefined });
    else {
      expenses.push({ id, cat, amount, note: describe(tx) + foreign, date, src: tx.fingerprint, shop: canShare(tx) ? tx.party : undefined });
      const key = merchantKey(tx.party);
      if (key && chosen) learned[key] = cat;
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
