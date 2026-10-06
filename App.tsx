import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable, StyleSheet, AppState } from 'react-native';
import { Text, FONTS } from './src/fonts';
import { useFonts } from 'expo-font';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Provider, useStore, hasAccount } from './src/store';
import { C, isDark, themed } from './src/theme';
import { t, locale } from './src/i18n';
import { tap } from './src/ui';
import { scheduleReminders } from './src/notify';
import Splash from './src/Splash';
import Lock, { authInProgress } from './src/Lock';
import Onboarding from './src/Onboarding';
import Login from './src/Login';
import Logo from './src/Logo';
import QuickAdd from './src/QuickAdd';
import * as Linking from 'expo-linking';
import Dashboard from './src/screens/Dashboard';
import Spend from './src/screens/Spend';
import Pay from './src/screens/Pay';
import Save from './src/screens/Save';
import Profile from './src/screens/Profile';
import Banner, { BannerInfo } from './src/features/SmsImport/Banner';
import { parseSms } from './src/features/SmsImport/parse';
import { guessCategory, describe, inPounds, isLogged, isTransfer, logTransactions, undoLogged, fromInbox, type Pick } from './src/features/SmsImport/log';
import InboxReview, { Pending } from './src/features/SmsImport/InboxReview';
import { prefetchCrowd, canShare, teach } from './src/features/SmsImport/crowd';
import { loadInbox, clearInbox } from './src/cloud/supabase';
import Tour, { tourRef } from './src/features/Tour/Tour';
import { le } from './src/theme';

// 'add' is the round + button in the middle; Profile opens from the avatar on Home
const TABS = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'spend', label: 'Spend', icon: 'wallet' },
  { key: 'add', label: '', icon: 'add' },
  { key: 'pay', label: 'Pay', icon: 'calendar' },
  { key: 'save', label: 'Save', icon: 'diamond' },
] as const;

function Shell() {
  const { d, set, version } = useStore();
  const dRef = useRef(d);
  dRef.current = d;
  const [tab, setTab] = useState<string>('home');
  const [action, setAction] = useState<string | undefined>();
  const [splash, setSplash] = useState(true);
  const [locked, setLocked] = useState(d.settings.lock);
  const insets = useSafeAreaInsets();
  const [covered, setCovered] = useState(false); // hides numbers in the app switcher
  const [resume, setResume] = useState(0);       // tells the lock screen to ask again
  const [quick, setQuick] = useState<{ amount?: string; cat?: string } | null>(null);
  const [banner, setBanner] = useState<BannerInfo | null>(null);

  // A bank SMS handed over by an iPhone Shortcuts automation: add it straight away, offer Undo
  const logSms = async (text: string) => {
    const tx = parseSms(text);
    const key = Date.now();
    if (tx) await prefetchCrowd([tx]);
    if (!tx) return setBanner({ key, title: t('Not a payment message'), sub: t('Nothing was added'), icon: 'information-circle', color: C.sub });
    if (isLogged(dRef.current, tx.fingerprint)) return setBanner({ key, title: t('Already added'), sub: describe(tx), icon: 'checkmark-circle', color: C.sub });
    set(x => logTransactions(x, [{ tx, cat: guessCategory(tx, x.merchantCats) }]).next);
    const income = tx.kind === 'income';
    setBanner({
      key, icon: isTransfer(tx) ? 'swap-horizontal' : income ? 'arrow-down' : 'arrow-up', color: income ? C.green : C.red,
      title: (income ? t('Added income') : t('Added expense')) + ' · ' + le(inPounds(tx, dRef.current.rates)),
      sub: describe(tx) + (income ? '' : ' · ' + t(guessCategory(tx, dRef.current.merchantCats)))
        + (tx.date && tx.date.toDateString() !== new Date().toDateString() ? ' · ' + tx.date.toLocaleDateString(locale(), { day: 'numeric', month: 'short' }) : ''),
      onUndo: () => set(x => undoLogged(x, [tx.fingerprint])),
    });
  };

  // Bank messages the server received while the app was closed (iPhone Shortcut → sms_inbox).
  // Whichever device opens first handles them; normal sync then brings them to the others.
  const [pending, setPending] = useState<Pending[]>([]);
  const checking = useRef(false);
  const keepFromInbox = (keep: Pick[], ids: string[]) => {
    if (keep.length) {
      set(x => logTransactions(x, keep).next);
      const fps = keep.map(k => k.tx.fingerprint);
      setBanner({
        key: Date.now(), icon: 'checkmark-circle', color: C.green,
        title: t('Added {n} from your bank messages', { n: keep.length }),
        sub: keep.slice(0, 2).map(k => describe(k.tx)).join(', ') + (keep.length > 2 ? '…' : ''),
        onUndo: () => set(x => undoLogged(x, fps)),
      });
    }
    clearInbox(ids).catch(() => {}); // if this fails, kept ones are skipped next time as already added
  };
  const checkInbox = async () => {
    const cur = dRef.current;
    if (checking.current || !hasAccount(cur.settings)) return;
    checking.current = true;
    try {
      const rows = await loadInbox();
      const known = rows.filter(r => isLogged(cur, r.fingerprint)).map(r => r.id);
      const fresh: Pending[] = rows.filter(r => !isLogged(cur, r.fingerprint)).map(r => ({ id: r.id, tx: fromInbox(r) }));
      if (known.length) clearInbox(known).catch(() => {});
      if (!fresh.length) return;
      await prefetchCrowd(fresh.map(p => p.tx));
      if (cur.settings.smsAutoKeep) keepFromInbox(fresh.map(p => ({ tx: p.tx, cat: guessCategory(p.tx, cur.merchantCats) })), fresh.map(p => p.id));
      else setPending(fresh);
    } catch { /* offline: try again next time the app opens */ }
    finally { checking.current = false; }
  };
  const reviewed = (keep: Pick[], alwaysKeep: boolean) => {
    keepFromInbox(keep, pending.map(p => p.id));
    keep.forEach(k => { if (k.chosen && canShare(k.tx)) teach(k.tx.party!, k.cat); });
    if (alwaysKeep) set(x => ({ ...x, settings: { ...x.settings, smsAutoKeep: true } }));
    setPending([]);
  };
  // after the splash / Face ID, and every time the app comes back to the front
  useEffect(() => {
    if (!splash && !locked && d.settings.onboarded) checkInbox();
  }, [splash, locked, resume, d.settings.onboarded, d.settings.uid]);

  // fakka://add?amount=50&cat=Food opens quick add (used by widgets and iPhone Shortcuts)
  // fakka://sms?text=<bank message> logs that message (iPhone Shortcuts message automation)
  useEffect(() => {
    const handle = (url: string | null) => {
      if (!url) return;
      const { path, hostname, queryParams } = Linking.parse(url);
      const where = `${hostname ?? ''}/${path ?? ''}`;
      if (where.includes('sms') && typeof queryParams?.text === 'string') logSms(queryParams.text);
      else if (where.includes('add')) {
        setQuick({ amount: queryParams?.amount as string | undefined, cat: queryParams?.cat as string | undefined });
      }
    };
    Linking.getInitialURL().then(handle);
    const sub = Linking.addEventListener('url', e => handle(e.url));
    return () => sub.remove();
  }, []);

  // Banking-style privacy: lock the moment you leave, hide content in the app switcher
  useEffect(() => {
    const sub = AppState.addEventListener('change', st => {
      if (authInProgress) return; // the Face ID sheet itself, not the user leaving
      if (st === 'inactive' || st === 'background') {
        setCovered(true);
        if (st === 'background' && d.settings.lock) setLocked(true);
      }
      if (st === 'active') {
        setCovered(false);
        setResume(r => r + 1);
      }
    });
    return () => sub.remove();
  }, [d.settings.lock]);

  // Keep payment reminders in sync with data
  useEffect(() => {
    const id = setTimeout(() => scheduleReminders(d), 800);
    return () => clearTimeout(id);
  }, [d.installments, d.loans, d.bills, d.gameyas, d.settings.notify, d.settings.lang]);

  const go = (k: string, a?: string) => { setTab(k); setAction(a); };
  useEffect(() => { if (d.settings.onboarded) setTab('home'); }, [d.settings.onboarded]);
  // "Replay tour" in Settings: go back to Home where the tour runs
  useEffect(() => { if (d.settings.toured === false) setTab('home'); }, [d.settings.toured]);
  const finishTour = () => set(x => ({ ...x, settings: { ...x.settings, toured: true } }));
  const clear = () => setAction(undefined);

  return (
    <View key={version} style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar style={splash || locked || isDark() ? 'light' : 'dark'} />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {tab === 'home' && <Dashboard go={go} />}
        {tab === 'spend' && <Spend action={action} clear={clear} />}
        {tab === 'pay' && <Pay action={action} clear={clear} />}
        {tab === 'save' && <Save action={action} clear={clear} />}
        {tab === 'profile' && <Profile />}
      </SafeAreaView>

      <View style={[s.barWrap, { paddingBottom: Math.max(insets.bottom, 12) }]} pointerEvents="box-none">
        <View style={s.bar}>
          {TABS.map(x => {
            if (x.key === 'add') return (
              <Pressable key="add" ref={tourRef('add')} collapsable={false} onPress={() => { tap(); setQuick({}); }} style={({ pressed }) => [s.plus, { borderRadius: 20 }, pressed && { transform: [{ scale: 0.94 }] }]}>
                <Ionicons name="add" size={28} color="#fff" />
              </Pressable>
            );
            const on = x.key === tab || (x.key === 'home' && tab === 'profile');
            return (
              <Pressable key={x.key} ref={tourRef(`tab-${x.key}`)} collapsable={false} style={s.item} onPress={() => { tap(); go(x.key); }}>
                <View style={[s.tabPill, on && { backgroundColor: C.primary + '1A' }]}>
                  <Ionicons name={(on ? x.icon : `${x.icon}-outline`) as any} size={22} color={on ? C.primary : C.sub} />
                </View>
                <Text style={[s.label, on && { color: C.primary }]} numberOfLines={1}>{t(x.label)}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <QuickAdd visible={!!quick} initial={quick ?? undefined} onClose={() => setQuick(null)} />
      <Banner info={banner} onHide={() => setBanner(null)} />
      {!splash && !locked && <InboxReview items={pending} onDone={reviewed} />}
      <Tour visible={d.settings.toured === false && d.settings.onboarded && !!d.settings.account && !splash && !locked && !covered && !quick && !pending.length && tab === 'home'} onDone={finishTour} />

      {!d.settings.onboarded && <View style={StyleSheet.absoluteFill}><Onboarding /></View>}
      {!d.settings.account && <View style={StyleSheet.absoluteFill}><Login /></View>}
      {locked && !splash && d.settings.onboarded && d.settings.account && <Lock resume={resume} onUnlock={() => setLocked(false)} />}
      {covered && !locked && <Cover />}
      {splash && <Splash onDone={() => setSplash(false)} />}
    </View>
  );
}

// Shown over everything while the app is in the app switcher
function Cover() {
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#003366', alignItems: 'center', justifyContent: 'center', zIndex: 200 }]}>
      <Logo size={110} />
    </View>
  );
}

export default function App() {
  // Wait for IBM Plex before drawing anything (the phone's launch screen stays up meanwhile)
  const [fontsReady, fontError] = useFonts(FONTS);
  if (!fontsReady && !fontError) return null;
  return (
    <SafeAreaProvider>
      <Provider>
        <Shell />
      </Provider>
    </SafeAreaProvider>
  );
}

const s = themed(() => StyleSheet.create({
  barWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16 },
  bar: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.tabBar, borderRadius: 28, paddingVertical: 10, paddingHorizontal: 8,
    shadowColor: '#14294A', shadowOpacity: 0.1, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
  item: { flex: 1, alignItems: 'center', gap: 3 },
  plus: { width: 54, height: 54, borderRadius: 20, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', marginHorizontal: 6,
    shadowColor: '#003366', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  label: { fontSize: 11, fontWeight: '600', color: C.sub },
  tabPill: { paddingHorizontal: 14, paddingVertical: 3, borderRadius: 999 },
}));
