import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable, StyleSheet, AppState } from 'react-native';
import { Text, FONTS } from './src/fonts';
import { useFonts } from 'expo-font';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Provider, useStore } from './src/store';
import { C, isDark, themed } from './src/theme';
import { t } from './src/i18n';
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

// 'add' is the round + button in the middle; Profile opens from the avatar on Home
const TABS = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'spend', label: 'Spend', icon: 'wallet' },
  { key: 'add', label: '', icon: 'add' },
  { key: 'pay', label: 'Pay', icon: 'calendar' },
  { key: 'save', label: 'Save', icon: 'diamond' },
] as const;

function Shell() {
  const { d, version } = useStore();
  const [tab, setTab] = useState<string>('home');
  const [action, setAction] = useState<string | undefined>();
  const [splash, setSplash] = useState(true);
  const [locked, setLocked] = useState(d.settings.lock);
  const insets = useSafeAreaInsets();
  const [covered, setCovered] = useState(false); // hides numbers in the app switcher
  const [resume, setResume] = useState(0);       // tells the lock screen to ask again
  const [quick, setQuick] = useState<{ amount?: string; cat?: string } | null>(null);

  // fakka://add?amount=50&cat=Food opens quick add (used by widgets and iPhone Shortcuts)
  useEffect(() => {
    const handle = (url: string | null) => {
      if (!url) return;
      const { path, hostname, queryParams } = Linking.parse(url);
      if ((path ?? hostname ?? '').includes('add')) {
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
              <Pressable key="add" onPress={() => { tap(); setQuick({}); }} style={({ pressed }) => [s.plus, pressed && { transform: [{ scale: 0.94 }] }]}>
                <Ionicons name="add" size={28} color="#fff" />
              </Pressable>
            );
            const on = x.key === tab || (x.key === 'home' && tab === 'profile');
            return (
              <Pressable key={x.key} style={s.item} onPress={() => { tap(); go(x.key); }}>
                <Ionicons name={(on ? x.icon : `${x.icon}-outline`) as any} size={22} color={on ? C.primary : C.sub} />
                <Text style={[s.label, on && { color: C.primary }]} numberOfLines={1}>{t(x.label)}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <QuickAdd visible={!!quick} initial={quick ?? undefined} onClose={() => setQuick(null)} />

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
}));
