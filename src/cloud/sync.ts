// Cloud sync: the phone is the main copy, Firestore is the backup that follows you to new phones.
// Data is split into small documents under users/{uid}/data/{docId}, and only changed ones are uploaded:
//   installments, loans, bills, gameyas, goals, incomes, savings, alerts, scoreHistory, profile,
//   and one document per month of expenses (exp-2026-09 …) so no document ever grows too big.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, doc, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore';
import { firebase } from './firebase';
import type { Data } from '../store';

type Docs = Record<string, { items: any }>;

const LISTS = ['installments', 'loans', 'bills', 'gameyas', 'goals', 'incomes', 'savings', 'alerts'] as const;
// Settings that belong to the person (follow them to a new phone). Lock, reminders, theme stay per-phone.
const PROFILE_KEYS = ['name', 'lang', 'work', 'since'] as const;

const clean = (x: any) => JSON.parse(JSON.stringify(x ?? null)); // Firestore rejects `undefined`

export function splitData(d: Data): Docs {
  const out: Docs = {};
  LISTS.forEach(k => { out[k] = { items: clean(d[k]) }; });
  out.scoreHistory = { items: clean(d.scoreHistory ?? {}) };
  out.profile = { items: clean(Object.fromEntries(PROFILE_KEYS.map(k => [k, (d.settings as any)[k] ?? null]))) };
  // Expenses by month. Receipt photos are files on this phone, so they aren't uploaded.
  const months: Record<string, any[]> = {};
  d.expenses.forEach(e => { const m = `exp-${e.date.slice(0, 7)}`; (months[m] ??= []).push(clean({ ...e, receipt: undefined })); });
  Object.entries(months).forEach(([m, items]) => { out[m] = { items }; });
  return out;
}

export function joinDocs(docs: Docs, local: Data): Data {
  const next: Data = { ...local };
  LISTS.forEach(k => { if (docs[k]) (next as any)[k] = docs[k].items ?? []; });
  if (docs.scoreHistory) next.scoreHistory = docs.scoreHistory.items ?? {};
  if (docs.profile) {
    const p = docs.profile.items ?? {};
    next.settings = { ...local.settings, ...Object.fromEntries(PROFILE_KEYS.filter(k => p[k] != null).map(k => [k, p[k]])) };
  }
  // Keep receipt photos already on this phone
  const receipts = Object.fromEntries(local.expenses.filter(e => e.receipt).map(e => [e.id, e.receipt]));
  const expenses = Object.keys(docs).filter(k => k.startsWith('exp-')).flatMap(k => docs[k].items ?? []);
  next.expenses = expenses.map((e: any) => (receipts[e.id] ? { ...e, receipt: receipts[e.id] } : e))
    .sort((a: any, b: any) => b.date.localeCompare(a.date));
  return next;
}

export const hasData = (d: Data) =>
  [d.installments, d.loans, d.bills, d.gameyas, d.goals, d.expenses, d.incomes, d.savings].some(a => a.length > 0);

const col = (uid: string) => collection(firebase().db, 'users', uid, 'data');

export async function downloadDocs(uid: string): Promise<Docs> {
  const snap = await getDocs(col(uid));
  const out: Docs = {};
  snap.forEach(s => { out[s.id] = s.data() as any; });
  return out;
}

// Remember what was last uploaded, so we only send what changed
const HASH_KEY = (uid: string) => `fekka.sync.${uid}`;
const fingerprint = (x: any) => JSON.stringify(x);

export async function upload(uid: string, d: Data, force = false) {
  const docs = splitData(d);
  const last: Record<string, string> = force ? {} : JSON.parse((await AsyncStorage.getItem(HASH_KEY(uid))) ?? '{}');
  const batch = writeBatch(firebase().db);
  let n = 0;
  const now: Record<string, string> = {};
  for (const [id, body] of Object.entries(docs)) {
    const f = fingerprint(body.items);
    now[id] = f;
    if (last[id] !== f) { batch.set(doc(col(uid), id), { items: body.items, updatedAt: serverTimestamp() }); n++; }
  }
  // A month whose expenses were all deleted: empty it in the cloud too
  for (const id of Object.keys(last)) {
    if (!(id in docs) && id.startsWith('exp-')) { batch.set(doc(col(uid), id), { items: [], updatedAt: serverTimestamp() }); n++; }
  }
  if (n) await batch.commit();
  await AsyncStorage.setItem(HASH_KEY(uid), JSON.stringify(now));
  return n;
}

// After downloading, what's in the cloud is what this phone has — nothing to re-upload
export async function markSynced(uid: string, d: Data) {
  const docs = splitData(d);
  await AsyncStorage.setItem(HASH_KEY(uid), JSON.stringify(Object.fromEntries(Object.entries(docs).map(([k, v]) => [k, fingerprint(v.items)]))));
}

// Same content on both sides?
export const sameData = (a: Data, docs: Docs) => {
  const mine = splitData(a);
  const keys = new Set([...Object.keys(mine), ...Object.keys(docs).filter(k => (docs[k].items ?? []).length !== 0 || !k.startsWith('exp-'))]);
  for (const k of keys) if (fingerprint(mine[k]?.items ?? null) !== fingerprint(docs[k]?.items ?? null)) return false;
  return true;
};

export async function deleteCloudData(uid: string) {
  const snap = await getDocs(col(uid));
  const batch = writeBatch(firebase().db);
  snap.forEach(s => batch.delete(s.ref));
  await batch.commit();
  await AsyncStorage.removeItem(HASH_KEY(uid));
}
