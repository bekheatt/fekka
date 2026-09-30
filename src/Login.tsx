import React from 'react';
import { View, StyleSheet, Pressable, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './fonts';
import { C, themed } from './theme';
import { useStore } from './store';
import { t } from './i18n';
import { tap } from './ui';
import Logo from './Logo';
import { googleAvailable, signInWithGoogle } from './auth/google';
import { loadUserData } from './cloud/sync';

// Sign-in screen. Apple and Google are look-only for now; they will be
// wired to Firebase later (see the feature/firebase-auth branch).
// Alert.alert does nothing in a web browser, so use the browser's own pop-up there
const say = (title: string, msg: string) =>
  Platform.OS === 'web' ? window.alert(`${title}\n\n${msg}`) : Alert.alert(title, msg);

export default function Login() {
  const { set, adopt } = useStore();

  const soon = (who: string) => {
    tap();
    say(t('Coming soon'), t('{who} sign-in is on the way. For now, continue as a guest.', { who }));
  };

  const google = async () => {
    if (!googleAvailable) return soon('Google');
    tap();
    try {
      const u = await signInWithGoogle();
      const account = { account: 'google' as const, email: u.email, uid: u.uid };
      let saved: string | null = null;
      try { saved = await loadUserData(u.uid); }
      catch (e: any) { say(t("Couldn't reach your saved data"), String(e?.code ?? e?.message ?? e)); }
      if (saved) adopt(saved, account); // returning user: bring back their data
      // new user: start from what's on this device; it gets saved to their account
      else set(v => ({ ...v, settings: { ...v.settings, ...account, name: v.settings.name || u.name.split(' ')[0] } }));
    } catch (e: any) {
      const code = String(e?.code ?? e?.message ?? '');
      if (code.includes('popup-closed') || code.includes('cancelled-popup')) return;
      say(t('Sign-in failed'), code.includes('not-configured')
        ? t('Firebase is not set up yet. Add your keys in src/auth/firebaseConfig.ts.')
        : code);
    }
  };

  const guest = () => {
    tap();
    set(v => ({ ...v, settings: { ...v.settings, account: 'guest' } }));
  };

  return (
    <SafeAreaView style={s.wrap}>
      <View style={s.top}>
        <Logo size={120} animated />
        <Text style={s.h1}>{t('Welcome to Fakka')}</Text>
        <Text style={s.p}>{t('Understand your money, all in one place.')}</Text>
      </View>

      <View style={s.buttons}>
        <Pressable onPress={() => soon('Apple')} style={({ pressed }) => [s.btn, s.apple, pressed && s.pressed]}>
          <Ionicons name="logo-apple" size={20} color="#fff" />
          <Text style={[s.btnTxt, { color: '#fff' }]}>{t('Continue with Apple')}</Text>
        </Pressable>

        <Pressable onPress={google} style={({ pressed }) => [s.btn, s.google, pressed && s.pressed]}>
          <Ionicons name="logo-google" size={18} color="#4285F4" />
          <Text style={[s.btnTxt, { color: '#1F1F1F' }]}>{t('Continue with Google')}</Text>
        </Pressable>

        <View style={s.orRow}>
          <View style={s.orLine} />
          <Text style={s.orTxt}>{t('or')}</Text>
          <View style={s.orLine} />
        </View>

        <Pressable onPress={guest} style={({ pressed }) => [s.btn, s.guest, pressed && s.pressed]}>
          <Text style={[s.btnTxt, { color: C.primary }]}>{t('Continue as guest')}</Text>
        </Pressable>

        <Text style={s.note}>{t('As a guest, everything stays on this phone only.')}</Text>
      </View>
    </SafeAreaView>
  );
}

const s = themed(() => StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg, paddingHorizontal: 24 },
  top: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  h1: { fontSize: 28, fontWeight: '700', color: C.ink, marginTop: 26, textAlign: 'center' },
  p: { fontSize: 15, color: C.sub, marginTop: 8, textAlign: 'center', lineHeight: 21 },
  buttons: { paddingBottom: 24, gap: 12 },
  btn: { height: 54, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  apple: { backgroundColor: '#000' },
  google: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#DADCE0' },
  guest: { backgroundColor: C.soft },
  pressed: { opacity: 0.75 },
  btnTxt: { fontSize: 16, fontWeight: '600' },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 2 },
  orLine: { flex: 1, height: 1, backgroundColor: C.line },
  orTxt: { fontSize: 13, color: C.sub },
  note: { fontSize: 12, color: C.sub, textAlign: 'center', marginTop: 2 },
}));
