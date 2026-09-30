import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Alert, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './fonts';
import { C, themed } from './theme';
import { useStore } from './store';
import { t } from './i18n';
import { tap } from './ui';
import Logo from './Logo';
import { Sheet, Field } from './ui';
import { signInEmail, signUpEmail, loadUserData } from './cloud/supabase';

// Alert.alert does nothing in a web browser, so use the browser's own pop-up there
const say = (title: string, msg: string) =>
  Platform.OS === 'web' ? window.alert(`${title}\n\n${msg}`) : Alert.alert(title, msg);

// Supabase's messages, in plain words
const friendly = (m: string) =>
  /invalid login/i.test(m) ? t('Wrong email or password.')
  : /not confirmed/i.test(m) ? t('Please confirm your email first. Check your inbox for the link.')
  : /already registered/i.test(m) ? t('This email already has an account. Sign in instead.')
  : /password/i.test(m) && /6/.test(m) ? t('Password must be at least 6 characters.')
  : /rate limit/i.test(m) ? t('Too many tries. Wait a few minutes and try again.')
  : m;

// Sign-in screen. Email sign-in is real (Supabase); Apple and Google are look-only for now.
export default function Login() {
  const { set, adopt } = useStore();
  const [emailOpen, setEmailOpen] = useState(false);
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.includes('@')) return say(t('Check your email'), t('Please enter a valid email address.'));
    if (pw.length < 6) return say(t('Check your password'), t('Password must be at least 6 characters.'));
    setBusy(true);
    try {
      const u = mode === 'in' ? await signInEmail(email, pw) : await signUpEmail(email, pw);
      if (!u) {
        setMode('in');
        return say(t('Confirm your email'), t('We sent a link to {e}. Tap it, then come back and sign in.', { e: email.trim() }));
      }
      const account = { account: 'email' as const, email: u.email, uid: u.uid };
      const saved = await loadUserData(u.uid);
      if (saved) adopt(saved, account); // returning user: bring back their data
      else set(v => ({ ...v, settings: { ...v.settings, ...account } })); // new: this device's data becomes theirs
      setEmailOpen(false); setPw('');
    } catch (e: any) {
      say(t('Sign-in failed'), friendly(String(e?.message ?? e)));
    } finally { setBusy(false); }
  };

  const soon = (who: string) => {
    tap();
    say(t('Coming soon'), t('{who} sign-in is on the way. For now, continue as a guest.', { who }));
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

        <Pressable onPress={() => soon('Google')} style={({ pressed }) => [s.btn, s.google, pressed && s.pressed]}>
          <Ionicons name="logo-google" size={18} color="#4285F4" />
          <Text style={[s.btnTxt, { color: '#1F1F1F' }]}>{t('Continue with Google')}</Text>
        </Pressable>

        <Pressable onPress={() => { tap(); setEmailOpen(true); }} style={({ pressed }) => [s.btn, s.email, pressed && s.pressed]}>
          <Ionicons name="mail" size={18} color="#fff" />
          <Text style={[s.btnTxt, { color: '#fff' }]}>{t('Continue with email')}</Text>
        </Pressable>

        <View style={s.orRow}>
          <View style={s.orLine} />
          <Text style={s.orTxt}>{t('or')}</Text>
          <View style={s.orLine} />
        </View>

        <Pressable onPress={guest} style={({ pressed }) => [s.btn, s.guest, pressed && s.pressed]}>
          <Text style={[s.btnTxt, { color: C.primary }]}>{t('Continue as guest')}</Text>
        </Pressable>

        <Text style={s.note}>{t('With an account, your data is saved online and private to you. As a guest, it stays on this phone only.')}</Text>
      </View>

      <Sheet visible={emailOpen} title={t(mode === 'in' ? 'Sign in' : 'Create account')} onClose={() => setEmailOpen(false)}
        onSave={busy ? () => {} : submit} saveLabel={busy ? t('Please wait…') : t(mode === 'in' ? 'Sign in' : 'Create account')}>
        <Field label={t('Email')} value={email} onChangeText={setEmail} placeholder="you@example.com"
          keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" />
        <Field label={t('Password')} value={pw} onChangeText={setPw} placeholder="••••••" secureTextEntry
          autoCapitalize="none" autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
          hint={mode === 'up' ? t('At least 6 characters') : undefined} />
        {busy && <ActivityIndicator color={C.primary} style={{ marginBottom: 12 }} />}
        <Pressable onPress={() => { tap(); setMode(mode === 'in' ? 'up' : 'in'); }} style={{ paddingVertical: 8 }}>
          <Text style={s.switchTxt}>{t(mode === 'in' ? 'New to Fakka? Create an account' : 'Already have an account? Sign in')}</Text>
        </Pressable>
      </Sheet>
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
  email: { backgroundColor: C.primary },
  switchTxt: { fontSize: 14, color: C.primary, textAlign: 'center', fontWeight: '600', marginBottom: 20 },
  pressed: { opacity: 0.75 },
  btnTxt: { fontSize: 16, fontWeight: '600' },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 2 },
  orLine: { flex: 1, height: 1, backgroundColor: C.line },
  orTxt: { fontSize: 13, color: C.sub },
  note: { fontSize: 12, color: C.sub, textAlign: 'center', marginTop: 2 },
}));
