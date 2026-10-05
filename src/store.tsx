import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onCloudUser } from './cloud/supabase';
import { loadSyncState, startSync, stopSync, push, pull, withDevice } from './cloud/sync';
import { Appearance, AppState } from 'react-native';
import { DEFAULT_RATES, PROVIDERS, BILL_TYPES, LOAN_TYPES, applyTheme, isDark, setHidden, le, C } from './theme';
import * as Notifications from 'expo-notifications';
import { setLang, t } from './i18n';

export type Installment = { id: string; provider: string; item: string; monthly: number; monthsLeft: number; dueDay: number; paidMonths?: string[] };
// Mortgages can also track the property: name = nickname (e.g. "Sahel chalet"), price = property price, paid = paid so far
export type Loan = { id: string; type: string; lender: string; monthly: number; remaining: number; dueDay: number; paidMonths?: string[]; name?: string; price?: number; paid?: number };
export type Bill = { id: string; cat: string; name: string; amount: number; dueDay: number; paidMonths?: string[] };
export type Gameya = { id: string; name: string; monthly: number; members: number; myTurn: number; start: string; dueDay: number; paidMonths?: string[] };
export type Goal = { id: string; name: string; icon: string; unit: string; target: number; saved: number; deadline?: string; history?: { date: string; amount: number }[] };
export type Expense = { id: string; cat: string; amount: number; note: string; date: string; receipt?: string; src?: string }; // src = fingerprint of the bank SMS it came from
export type PriceAlert = { id: string; kind: string; dir: 'above' | 'below'; price: number; active: boolean; firedAt?: string };
// oneOff = ISO date for a single payment (freelance job, bonus, Eid money); otherwise it repeats monthly
export type Income = { id: string; source: string; monthly: number; day?: number; oneOff?: string; src?: string; transfer?: boolean }; // transfer = arrived by InstaPay / wallet / bank transfer
export type Saving = { id: string; kind: string; qty: number; name?: string; price?: number };
export type Work = 'employee' | 'freelancer' | 'business' | 'student' | 'retired' | 'other';
export type Settings = { name: string; lang: 'en' | 'ar'; theme: 'system' | 'light' | 'dark'; accent?: 'blue' | 'purple'; lock: boolean; notify: boolean; since: string; onboarded: boolean; work?: Work; hideAmounts?: boolean; account?: 'guest' | 'google' | 'apple' | 'email'; email?: string; uid?: string;
  smsKey?: string;       // personal key in the iPhone Shortcut link (this phone only)
  smsAutoKeep?: boolean; // add transactions from bank messages without asking
  toured?: boolean;      // false = show the first-run tour on Home (new users, or 'Replay tour')
};

export type Data = {
  installments: Installment[]; loans: Loan[]; bills: Bill[]; gameyas: Gameya[]; goals: Goal[];
  expenses: Expense[]; incomes: Income[]; savings: Saving[];
  rates: Record<string, number>; ratesUpdated?: string; settings: Settings;
  alerts: PriceAlert[];
  merchantCats?: Record<string, string>; // category you picked for a shop, remembered for the next bank SMS
  scoreHistory?: Record<string, number>; // Financial Health Score per month (YYYY-MM)
  partHistory?: Record<string, Record<string, number>>; // each score part per month, for the up/down arrows
};

type RateStatus = 'idle' | 'loading' | 'ok' | 'error';

const defaultSettings = (): Settings => ({ name: '', lang: 'en', theme: 'system', lock: false, notify: false, since: new Date().toISOString(), onboarded: false });
const empty = (): Data => ({ installments: [], loans: [], bills: [], gameyas: [], goals: [], expenses: [], incomes: [], savings: [], rates: DEFAULT_RATES, settings: defaultSettings(), alerts: [] });
const KEY = 'fekka.v1';
const OUNCE = 31.1035;

// Signed in with a real online account (not a guest)
export const hasAccount = (s: Settings) => (s.account === 'email' || s.account === 'google') && !!s.uid;

export type CloudStatus = 'off' | 'saving' | 'saved' | 'error';
type Ctx = {
  d: Data; set: (fn: (d: Data) => Data) => void;
  refreshRates: () => Promise<void>; rateStatus: RateStatus;
  togglePaid: (kind: DueKind, id: string) => void;
  version: number; // bumps when theme/language changes → app redraws
  reset: () => void;
  redoSetup: () => void;
  adopt: (saved: object, account: Partial<Settings>) => void;
  cloudStatus: CloudStatus; cloudError: string;
  signInAs: (uid: string, account: Partial<Settings>) => Promise<void>;
  flush: () => Promise<unknown>;
};
const Store = createContext<Ctx>(null as any);

export const uid = () => Math.random().toString(36).slice(2, 10);
export const ym = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
export const monthsBetween = (a: string, b: string) => {
  const [ay, am] = a.split('-').map(Number); const [by, bm] = b.split('-').map(Number);
  return (by - ay) * 12 + (bm - am);
};

export const savingValue = (x: Saving, rates: Record<string, number>) =>
  x.kind === 'custom' ? x.qty * (x.price ?? 1) : x.qty * (rates[x.kind] ?? 0);
export const goalValue = (g: Goal, rates: Record<string, number>) => g.saved * (rates[g.unit] ?? 1);

export const isPropertyLoan = (l: Loan) => l.type === 'Mortgage' && (l.price ?? 0) > 0;
// How much of the property you own: what you've paid, never more than its price
export const propertyOwned = (l: Loan) => Math.min(l.price ?? 0, Math.max(0, l.paid ?? 0));

export function gameyaStatus(g: Gameya) {
  const round = monthsBetween(g.start, ym()) + 1; // 1-based
  const paid = g.paidMonths?.length ?? 0;
  const received = round >= g.myTurn;
  const net = paid * g.monthly - (received ? g.monthly * g.members : 0);
  return { round, paid, received, net, active: round >= 1 && round <= g.members, payout: g.monthly * g.members, finished: round > g.members };
}

export const ALERT_NAMES: Record<string, string> = { gold21: 'Gold 21K', gold24: 'Gold 24K', usd: 'US Dollar', eur: 'Euro' };

const resolveTheme = (s: Settings) => (s.theme === 'system' ? (Appearance.getColorScheme() === 'dark' ? 'dark' : 'light') : s.theme);
const paint = (s: Settings) => applyTheme(resolveTheme(s), s.accent === 'purple' ? 'purple' : 'blue');

// Free sources, no key needed: open.er-api.com (USD/EUR→EGP), api.gold-api.com (gold $/oz)
async function fetchLiveRates() {
  const [fx, gold] = await Promise.all([
    fetch('https://open.er-api.com/v6/latest/USD').then(r => r.json()),
    fetch('https://api.gold-api.com/price/XAU').then(r => r.json()),
  ]);
  const usd = fx?.rates?.EGP, eurPerUsd = fx?.rates?.EUR, ounceUsd = gold?.price;
  if (!usd || !eurPerUsd || !ounceUsd) throw new Error('bad data');
  const gold24 = (ounceUsd * usd) / OUNCE;
  return { usd, eur: usd / eurPerUsd, gold24, gold21: gold24 * (21 / 24) };
}

export function Provider({ children }: { children: React.ReactNode }) {
  const [d, setD] = useState<Data>(empty);
  const [ready, setReady] = useState(false);
  const [version, setVersion] = useState(0);
  const [rateStatus, setRateStatus] = useState<RateStatus>('idle');

  const refreshRates = useCallback(async () => {
    setRateStatus('loading');
    try {
      const r = await fetchLiveRates();
      setD(x => {
        const rates: Record<string, number> = { ...x.rates, ...r, egp: 1 };
        const alerts = x.alerts.map(a => {
          const now = rates[a.kind];
          const hit = a.active && now && (a.dir === 'above' ? now >= a.price : now <= a.price);
          if (!hit) return a;
          Notifications.scheduleNotificationAsync({
            content: { title: t(a.dir === 'above' ? '{k} is above {p}' : '{k} is below {p}', { k: t(ALERT_NAMES[a.kind] ?? a.kind), p: le(a.price) }), body: t('Now: {x}', { x: le(now) }) },
            trigger: null,
          }).catch(() => {});
          return { ...a, active: false, firedAt: new Date().toISOString() };
        });
        return { ...x, rates, alerts, ratesUpdated: new Date().toISOString() };
      });
      setRateStatus('ok');
    } catch { setRateStatus('error'); }
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(s => {
      const base = empty();
      const loaded: Data = s ? { ...base, ...JSON.parse(s) } : base;
      const hadSettings = loaded.settings && 'onboarded' in loaded.settings;
      loaded.settings = { ...base.settings, ...(loaded.settings ?? {}) };
      // People who used Fakka before onboarding existed skip it
      if (!hadSettings) loaded.settings.onboarded = [loaded.incomes, loaded.expenses, loaded.installments, loaded.loans, loaded.savings].some(a => a.length > 0);
      // Transfers logged from bank SMS before the Transfers category existed
      loaded.expenses = loaded.expenses.map(e => (e.src && e.cat === 'Other' && /^(Transfer|تحويل)/.test(e.note) ? { ...e, cat: 'Transfers' } : e));
      setLang(loaded.settings.lang);
      setHidden(!!loaded.settings.hideAmounts);
      paint(loaded.settings);
      setD(loaded);
      loadSyncState(hasAccount(loaded.settings) ? loaded.settings.uid : undefined).finally(() => setReady(true));
      refreshRates();
    });
  }, []);

  useEffect(() => { if (ready) AsyncStorage.setItem(KEY, JSON.stringify(d)); }, [d, ready]);

  // Signed in with an account: keep this phone and the account's online copy in step.
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>('off');
  const [cloudError, setCloudError] = useState('');
  const dRef = useRef(d);
  dRef.current = d;
  const online = ready && hasAccount(d.settings);

  // Data from another phone arrived: show it (keeping this phone's own settings)
  const applyRemote = (merged: any) => setD(x => {
    const next: Data = withDevice({ ...empty(), ...merged }, x);
    const s = next.settings, p = x.settings;
    if (s.theme !== p.theme || s.accent !== p.accent || s.lang !== p.lang || s.hideAmounts !== p.hideAmounts) {
      setLang(s.lang); setHidden(!!s.hideAmounts); paint(s);
      setTimeout(() => setVersion(v => v + 1), 0);
    }
    return next;
  });

  const fail = (e: any) => { setCloudStatus('error'); setCloudError(String(e?.message ?? e)); };
  const sendChanges = () => push(() => dRef.current)
    .then(merged => { if (merged) applyRemote(merged); setCloudStatus('saved'); setCloudError(''); })
    .catch(fail);
  const getChanges = () => pull(() => dRef.current)
    .then(merged => { if (merged) applyRemote(merged); return sendChanges(); })
    .catch(fail);

  // Send changes a moment after each edit
  useEffect(() => {
    if (!online) { setCloudStatus('off'); return; }
    setCloudStatus('saving');
    const id = setTimeout(sendChanges, 1500);
    return () => clearTimeout(id);
  }, [d, online]);

  // Fetch other phones' changes: on opening, when coming back to the app, and every minute while open
  useEffect(() => {
    if (!online) return;
    getChanges();
    const timer = setInterval(() => { if (AppState.currentState === 'active') getChanges(); }, 60 * 1000);
    const sub = AppState.addEventListener('change', st => { if (st === 'active') getChanges(); });
    return () => { clearInterval(timer); sub.remove(); };
  }, [online]);

  // After signing in: bring back the account's data, or start the account from what's on this phone
  const signInAs = async (uid: string, account: Partial<Settings>) => {
    const saved = await startSync(uid);
    if (saved) adopt(saved, account);
    else set(v => ({ ...v, settings: { ...v.settings, ...account } }));
  };

  // Last save before signing out (resolves even when offline)
  const flush = () => push(() => dRef.current).catch(() => null);

  // If the online sign-in ends (expired or signed out elsewhere), go back to the sign-in screen
  useEffect(() => {
    if (!ready) return;
    return onCloudUser(u => {
      setD(x => {
        if (!hasAccount(x.settings)) return x;
        if (!u) { stopSync(); return { ...x, settings: { ...x.settings, account: undefined } }; }
        return x.settings.uid === u.uid ? x : { ...x, settings: { ...x.settings, uid: u.uid, email: u.email } };
      });
    });
  }, [ready]);

  // Refresh prices (and check price alerts) whenever you come back after 15+ minutes
  useEffect(() => {
    const sub = AppState.addEventListener('change', st => {
      if (st !== 'active') return;
      const last = d.ratesUpdated ? Date.parse(d.ratesUpdated) : 0;
      if (Date.now() - last > 15 * 60 * 1000) refreshRates();
    });
    return () => sub.remove();
  }, [d.ratesUpdated]);

  // Follow phone dark/light when theme = system
  useEffect(() => {
    const sub = Appearance.addChangeListener(() => {
      // iOS fires this when the app goes to the background or a Face ID prompt shows —
      // only redraw if the colours really changed, and only while the app is on screen.
      if (d.settings.theme !== 'system' || AppState.currentState !== 'active') return;
      const next = resolveTheme(d.settings);
      if (next !== (isDark() ? 'dark' : 'light')) { applyTheme(next); setVersion(v => v + 1); }
    });
    return () => sub.remove();
  }, [d.settings.theme]);

  const set = (fn: (d: Data) => Data) => setD(prev => {
    const next = fn(prev);
    if (next.settings !== prev.settings) {
      const s = next.settings, p = prev.settings;
      if (s.theme !== p.theme || s.accent !== p.accent || s.lang !== p.lang || s.hideAmounts !== p.hideAmounts) {
        setLang(s.lang);
        setHidden(!!s.hideAmounts);
        paint(s);
        setTimeout(() => setVersion(v => v + 1), 0);
      }
    }
    return next;
  });

  const togglePaid = (kind: DueKind, id: string) => set(x => {
    const m = ym();
    const flip = (arr?: string[]) => (arr ?? []).includes(m) ? (arr ?? []).filter(k => k !== m) : [...(arr ?? []), m];
    const was = (arr?: string[]) => (arr ?? []).includes(m);
    if (kind === 'inst') return { ...x, installments: x.installments.map(i => i.id !== id ? i : { ...i, paidMonths: flip(i.paidMonths), monthsLeft: Math.max(0, i.monthsLeft + (was(i.paidMonths) ? 1 : -1)) }) };
    if (kind === 'loan') return { ...x, loans: x.loans.map(l => l.id !== id ? l : { ...l, paidMonths: flip(l.paidMonths), remaining: Math.max(0, l.remaining + (was(l.paidMonths) ? l.monthly : -l.monthly)), paid: l.price ? Math.max(0, (l.paid ?? 0) + (was(l.paidMonths) ? -l.monthly : l.monthly)) : l.paid }) };
    if (kind === 'bill') return { ...x, bills: x.bills.map(b => b.id !== id ? b : { ...b, paidMonths: flip(b.paidMonths) }) };
    return { ...x, gameyas: x.gameyas.map(g => g.id !== id ? g : { ...g, paidMonths: flip(g.paidMonths) }) };
  });

  // Replace everything with the data saved in the person's account (after signing in)
  const adopt = (saved: object, account: Partial<Settings>) => {
    const base = empty();
    const loaded: Data = { ...base, ...(saved as Data), rates: d.rates, ratesUpdated: d.ratesUpdated };
    loaded.settings = { ...base.settings, ...(loaded.settings ?? {}), ...account };
    setLang(loaded.settings.lang);
    setHidden(!!loaded.settings.hideAmounts);
    paint(loaded.settings);
    setD(loaded);
    setVersion(v => v + 1);
  };

  const reset = () => { stopSync(); const e = empty(); e.settings = { ...e.settings, lang: d.settings.lang, theme: d.settings.theme, accent: d.settings.accent }; setD(e); };
  const redoSetup = () => set(x => ({ ...x, settings: { ...x.settings, onboarded: false } }));

  if (!ready) return null;
  return <Store.Provider value={{ d, set, refreshRates, rateStatus, togglePaid, version, reset, redoSetup, adopt, cloudStatus, cloudError, signInAs, flush }}>{children}</Store.Provider>;
}

export const useStore = () => useContext(Store);

// ---------- Everything due each month, in one list ----------
export type DueKind = 'inst' | 'loan' | 'bill' | 'gameya';
export type DueItem = { id: string; kind: DueKind; name: string; by: string; amount: number; day: number; color: string; icon: string; paid: boolean };

export function dueItems(d: Data): DueItem[] {
  const m = ym();
  const paid = (arr?: string[]) => (arr ?? []).includes(m);
  const out: DueItem[] = [];
  d.installments.forEach(i => { if (i.monthsLeft > 0 || paid(i.paidMonths)) out.push({ id: i.id, kind: 'inst', name: i.item, by: i.provider, amount: i.monthly, day: i.dueDay, color: PROVIDERS.find(p => p.name === i.provider)?.color ?? C.primary, icon: i.provider[0].toUpperCase(), paid: paid(i.paidMonths) }); });
  d.loans.forEach(l => { if (l.remaining > 0 || paid(l.paidMonths)) out.push({ id: l.id, kind: 'loan', name: l.name ? t(l.name) : t(l.type), by: l.lender, amount: l.monthly, day: l.dueDay, color: C.primary, icon: LOAN_TYPES.find(x => x.name === l.type)?.icon ?? 'cash', paid: paid(l.paidMonths) }); });
  d.bills.forEach(b => { const bt = BILL_TYPES.find(x => x.name === b.cat); out.push({ id: b.id, kind: 'bill', name: b.name || t(b.cat), by: t('Bill'), amount: b.amount, day: b.dueDay, color: bt?.color ?? C.sub, icon: bt?.icon ?? 'document-text', paid: paid(b.paidMonths) }); });
  d.gameyas.forEach(g => { if (gameyaStatus(g).active) out.push({ id: g.id, kind: 'gameya', name: g.name, by: t("Gam'eya"), amount: g.monthly, day: g.dueDay, color: '#8E6FE0', icon: 'people', paid: paid(g.paidMonths) }); });
  const today = new Date().getDate();
  return out.sort((a, b) => (a.paid === b.paid ? ((a.day - today + 31) % 31) - ((b.day - today + 31) % 31) : a.paid ? 1 : -1));
}

export const daysUntil = (day: number) => {
  const today = new Date().getDate();
  return day >= today ? day - today : day + 30 - today;
};

export function useTotals() {
  const { d } = useStore();
  const m = ym();
  const due = dueItems(d);
  const sum = (k: DueKind) => due.filter(x => x.kind === k).reduce((s, x) => s + x.amount, 0);
  const income = d.incomes.filter(i => !i.oneOff || ym(new Date(i.oneOff)) === m).reduce((s, i) => s + i.monthly, 0);
  const instMonthly = sum('inst'), loanMonthly = sum('loan'), billsMonthly = sum('bill'), gameyaMonthly = sum('gameya');
  const committed = instMonthly + loanMonthly + billsMonthly + gameyaMonthly;
  const spent = d.expenses.filter(e => ym(new Date(e.date)) === m).reduce((s, e) => s + e.amount, 0);
  const gNet = d.gameyas.reduce((s, g) => s + gameyaStatus(g).net, 0);
  const holdings = d.savings.reduce((s, x) => s + savingValue(x, d.rates), 0);
  const goalsSaved = d.goals.reduce((s, g) => s + goalValue(g, d.rates), 0);
  // A mortgage with a property price: the part you've paid is yours (an asset). Its balance is already
  // taken out of that share, so it isn't subtracted again from net worth.
  const property = d.loans.filter(isPropertyLoan).reduce((s, l) => s + propertyOwned(l), 0);
  const assets = holdings + goalsSaved + property + Math.max(0, gNet);
  const debt = d.installments.reduce((s, i) => s + i.monthly * i.monthsLeft, 0) + d.loans.filter(l => !isPropertyLoan(l)).reduce((s, l) => s + l.remaining, 0) + Math.max(0, -gNet);
  const left = income - committed - spent;
  const unpaid = due.filter(x => !x.paid);
  return { property, income, instMonthly, loanMonthly, billsMonthly, gameyaMonthly, committed, spent, assets, debt, netWorth: assets - debt, left, holdings, goalsSaved, due, unpaid };
}
