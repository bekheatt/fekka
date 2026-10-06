// What other Fekka users put each shop under (Supabase merchant_votes), cached on the phone.
// Only shop names from card payments are ever shared: never people's names from transfers or wallet numbers.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadCrowd, voteMerchant } from '../../cloud/supabase';
import { merchantKey } from './merchants';
import type { ParsedTx } from './parse';

type Entry = { cat: string; n: number; at: number }; // cat '' = nobody has agreed on this shop yet
const KEY = 'fekka.crowd';
const FRESH = 3 * 864e5; // ask again after 3 days
let cache: Record<string, Entry> = {};
let loaded: Promise<void> | null = null;
const load = () => (loaded ??= AsyncStorage.getItem(KEY).then(s => { cache = s ? JSON.parse(s) : {}; }).catch(() => {}));
const save = () => AsyncStorage.setItem(KEY, JSON.stringify(cache)).catch(() => {});

// A shop (not a person) that can be shared
export const canShare = (tx: Pick<ParsedTx, 'party' | 'channel'>) =>
  !!tx.party && !['instapay', 'wallet', 'transfer', 'atm'].includes(tx.channel) && !/^01\d{9}$/.test(tx.party);

export const crowdFor = (key: string) => cache[key];

// Look up the shops in these transactions (skips ones checked recently). Safe to call offline or as a guest.
export async function prefetchCrowd(txs: ParsedTx[]) {
  await load();
  const now = Date.now();
  const keys = [...new Set(txs.filter(canShare).map(t => merchantKey(t.party)))]
    .filter(k => k.length >= 2 && !(cache[k] && now - cache[k].at < FRESH));
  if (!keys.length) return;
  try {
    const rows = await loadCrowd(keys);
    for (const k of keys) cache[k] = { cat: '', n: 0, at: now };
    for (const r of rows) cache[r.merchant_key] = { cat: r.category, n: r.votes, at: now };
    save();
  } catch { /* offline or signed out: the built-in list still works */ }
}

// The person chose a category for a shop: add their vote for everyone (their own pick lives in Data.merchantCats)
export function teach(shop: string, cat: string) {
  const key = merchantKey(shop);
  if (key.length < 2) return;
  voteMerchant(key, cat).catch(() => {});
}
