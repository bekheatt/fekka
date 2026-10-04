// Keeps one account's data in step across phones.
// Every save carries the version it was based on; if another phone saved in between,
// we fetch theirs, merge item by item (see merge.ts) and save the combined result.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadUserData, loadUserRev, saveUserData } from './supabase';
import { merge3 } from './merge';

type Meta = { uid: string; rev: number; base: any | null };
const KEY = 'fekka.sync';
let meta: Meta | null = null;

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const remember = () => AsyncStorage.setItem(KEY, JSON.stringify(meta)).catch(() => {});

// Things that belong to this phone only and never travel to other phones
const DEVICE_SETTINGS = ['account', 'email', 'uid', 'lock', 'notify', 'smsKey'] as const; // smsKey: the bank-SMS link key, only shown on the phone that made it

// The part of the app data that is shared between phones
export function shared(d: any) {
  const { rates, ratesUpdated, ...rest } = d;
  const settings = { ...d.settings };
  for (const k of DEVICE_SETTINGS) delete settings[k];
  // A full copy, so the "last synced" snapshot can never change along with the live data
  return JSON.parse(JSON.stringify({ ...rest, settings }));
}

// Put this phone's own bits back onto data that came from the server
export function withDevice(sharedData: any, local: any) {
  const own: any = {};
  for (const k of DEVICE_SETTINGS) own[k] = local.settings?.[k];
  return { ...sharedData, rates: local.rates, ratesUpdated: local.ratesUpdated, settings: { ...sharedData.settings, ...own } };
}

// One sync step at a time, so a save and a refresh never step on each other
let queue: Promise<unknown> = Promise.resolve();
const serial = <T,>(fn: () => Promise<T>): Promise<T> => {
  const next = queue.then(fn, fn);
  queue = next.catch(() => {});
  return next;
};

export async function loadSyncState(uid?: string) {
  try { meta = JSON.parse((await AsyncStorage.getItem(KEY)) ?? 'null'); } catch { meta = null; }
  if (!uid) return stopSync();
  // Signed in but no sync record yet (e.g. signed in before this update): the first refresh
  // combines this phone's data with the account's online copy, keeping everything from both.
  if (meta?.uid !== uid) { meta = { uid, rev: 0, base: null }; remember(); }
}

export function stopSync() {
  meta = null;
  AsyncStorage.removeItem(KEY).catch(() => {});
}

// After signing in: returns the account's saved data, or null for a brand-new account
export function startSync(uid: string): Promise<any | null> {
  return serial(async () => {
    const row = await loadUserData(uid);
    meta = { uid, rev: row?.rev ?? 0, base: row?.data ?? null };
    remember();
    return row?.data ?? null;
  });
}

// Send this phone's changes. Returns merged data if other phones' changes were folded in, else null.
export function push(getLocal: () => any): Promise<any | null> {
  return serial(async () => {
    if (!meta) return null;
    const original = shared(getLocal());
    let mine = original;
    if (meta.base && same(mine, meta.base)) return null; // nothing new to send
    for (let tries = 0; tries < 5; tries++) {
      const rev = await saveUserData(mine, meta.rev);
      if (rev >= 0) {
        meta = { ...meta, rev, base: mine };
        remember();
        return same(mine, original) ? null : mine;
      }
      // Another phone saved first: merge their version with ours and try again
      const row = await loadUserData(meta.uid);
      mine = merge3(meta.base, mine, row?.data ?? {});
      meta = { ...meta, rev: row?.rev ?? 0, base: row?.data ?? null };
    }
    throw new Error('Busy syncing, will try again');
  });
}

// Bring in changes made on other phones. Returns merged data if anything changed, else null.
export function pull(getLocal: () => any): Promise<any | null> {
  return serial(async () => {
    if (!meta) return null;
    const rev = await loadUserRev(meta.uid);   // cheap check first
    if (rev === null || rev === meta.rev) return null;
    const row = await loadUserData(meta.uid);
    if (!row || row.rev === meta.rev) return null;
    const local = shared(getLocal());
    const merged = merge3(meta.base, local, row.data);
    meta = { ...meta, rev: row.rev, base: row.data };
    remember();
    return same(merged, local) ? null : merged;
  });
}
