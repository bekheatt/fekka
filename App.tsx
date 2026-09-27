import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable, Text, StyleSheet, AppState } from 'react-native';
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
import Logo from './src/Logo';
import QuickAdd from './src/QuickAdd';
import * as Linking from 'expo-linking';
import Dashboard from './src/screens/Dashboard';
import Spend from './src/screens/Spend';
import Pay from './src/screens/Pay';
import Save from './src/screens/Save';
import Profile from './src/screens/Profile';

const TABS = [
  { key: 'home', label: 'Home', icon: 'grid' },
  { key: 'spend', label: 'Spend', icon: 'receipt' },
  { key: 'pay', label: 'Pay', icon: 'calendar' },
  { key: 'save', label: 'Save', icon: 'diamond' },
  { key: 'profile', label: 'Profile', icon: 'person-circle' },
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

      <View style={[s.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        {TABS.map(x => {
          const on = x.key === tab;
          return (
            <Pressable key={x.key} style={s.item} onPress={() => { tap(); go(x.key); }}>
              <Ionicons name={(on ? x.icon : `${x.icon}-outline`) as any} size={22} color={on ? C.primary : C.sub} />
              <Text style={[s.label, on && { color: C.primary }]} numberOfLines={1}>{t(x.label)}</Text>
            </Pressable>
          );
        })}
      </View>

      {d.settings.onboarded && (
        <Pressable onPress={() => { tap(); setQuick({}); }} style={[s.fab, { bottom: Math.max(insets.bottom, 10) + 66 }]}>
          <Ionicons name="add" size={32} color="#fff" />
        </Pressable>
      )}
      <QuickAdd visible={!!quick} initial={quick ?? undefined} onClose={() => setQuick(null)} />

      {!d.settings.onboarded && <View style={StyleSheet.absoluteFill}><Onboarding /></View>}
      {locked && !splash && d.settings.onboarded && <Lock resume={resume} onUnlock={() => setLocked(false)} />}
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
  return (
    <SafeAreaProvider>
      <Provider>
        <Shell />
      </Provider>
    </SafeAreaProvider>
  );
}

const s = themed(() => StyleSheet.create({
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', backgroundColor: C.tabBar, paddingTop: 10, borderTopWidth: 1, borderColor: C.line },
  item: { flex: 1, alignItems: 'center', gap: 4 },
  fab: { position: 'absolute', right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#003366', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  label: { fontSize: 11, fontWeight: '600', color: C.sub },
}));
