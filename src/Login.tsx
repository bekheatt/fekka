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
import { Sheet, Field, Bubble } from './ui';
import { APP_NAME, TAGLINE } from './brand';
import { signInEmail, signUpEmail, signInGoogle, CloudUser } from './cloud/supabase';

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
  const { set, signInAs } = useStore();
  const [emailOpen, setEmailOpen] = useState(false);
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);

  // After any sign-in: bring back saved data, or start the account from this device's data
  const signedIn = async (u: CloudUser, kind: 'email' | 'google') => {
    await signInAs(u.uid, { account: kind, email: u.email, uid: u.uid });
  };

  const google = async () => {
    tap();
    setBusy(true);
    try {
      const u = await signInGoogle();
      if (u) await signedIn(u, 'google');
    } catch (e: any) {
      const m = String(e?.message ?? e);
      say(t('Sign-in failed'), /provider is not enabled/i.test(m) ? t('Google sign-in is not switched on yet.') : friendly(m));
    } finally { setBusy(false); }
  };

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
      await signedIn(u, 'email');
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
      <View style={s.brand}>
        <Logo size={96} animated />
        <Text style={s.name}>{APP_NAME}</Text>
        <Text style={s.tag}>{t(TAGLINE)}</Text>
      </View>

      {/* A peek at what the app tracks */}
      <View style={s.art} pointerEvents="none">
        <View style={s.glow} />
        <Float style={{ top: 6, left: 4, transform: [{ rotate: '4deg' }] }} icon="phone-portrait" color="#2F8BE6" label={t('Phone installment')} value="L.E 1,850" />
        <Float style={{ top: 78, right: 2, transform: [{ rotate: '-3deg' }] }} icon="diamond" color="#E0AA3E" label={t('Gold 21K · 40g')} value="L.E 249K" />
        <Float style={{ top: 152, left: 22, transform: [{ rotate: '2deg' }] }} icon="flash" color="#F2B53A" label={t('Electricity')} value={t('Paid ✓')} />
        <View style={[s.score, { top: 0, right: 14, transform: [{ rotate: '-6deg' }] }]}>
          <Text style={s.scoreNum}>72</Text>
          <Text style={s.scoreTxt}>{t('Health')}</Text>
        </View>
      </View>

      <View style={s.copy}>
        <Text style={s.h1}>{t('Know where every\npound goes')}</Text>
        <Text style={s.p}>{t('Installments, bills, gold and savings —\nall in one calm place.')}</Text>
      </View>

      <View style={s.buttons}>
        <Pressable onPress={() => soon('Apple')} style={({ pressed }) => [s.btn, s.apple, pressed && s.pressed]}>
          <Ionicons name="logo-apple" size={20} color="#fff" />
          <Text style={[s.btnTxt, { color: '#fff' }]}>{t('Continue with Apple')}</Text>
        </Pressable>

        <Pressable onPress={busy ? undefined : google} style={({ pressed }) => [s.btn, s.google, pressed && s.pressed]}>
          {busy ? <ActivityIndicator color={C.primary} /> : <Ionicons name="logo-google" size={18} color="#4285F4" />}
          <Text style={[s.btnTxt, { color: '#14294A' }]}>{t('Continue with Google')}</Text>
        </Pressable>

        <View style={s.links}>
          <Pressable onPress={guest} hitSlop={8}><Text style={s.link}>{t('Continue as guest')}</Text></Pressable>
          <Text style={s.sep}>·</Text>
          <Pressable onPress={() => { tap(); setEmailOpen(true); }} hitSlop={8}><Text style={s.link}>{t('Use email')}</Text></Pressable>
        </View>

        <View style={s.privacy}>
          <Ionicons name="lock-closed" size={12} color={C.sub} />
          <Text style={s.note}>{t('Your data stays private and locked to you')}</Text>
        </View>
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

// Small floating card in the login illustration
const Float = ({ style, icon, color, label, value }: any) => (
  <View style={[s.float, style]}>
    <Bubble icon={icon} color={color} size={34} />
    <View><Text style={s.floatLabel}>{label}</Text><Text style={s.floatVal}>{value}</Text></View>
  </View>
);

const s = themed(() => StyleSheet.create({
  brand: { alignItems: 'center', marginTop: 18 },
  name: { fontSize: 26, fontWeight: '700', color: C.navy, letterSpacing: -0.5, marginTop: 6 },
  tag: { fontSize: 13, color: C.sub, fontWeight: '500', marginTop: 2 },
  art: { flex: 1, minHeight: 200, maxHeight: 240, marginTop: 12 },
  glow: { position: 'absolute', alignSelf: 'center', top: 0, width: 230, height: 230, borderRadius: 115, backgroundColor: C.pale, opacity: 0.45 },
  float: { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card, borderRadius: 18, paddingVertical: 10, paddingHorizontal: 12,
    shadowColor: '#14294A', shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  floatLabel: { fontSize: 11, color: C.sub, fontWeight: '500' },
  floatVal: { fontSize: 14, color: C.ink, fontWeight: '600' },
  score: { position: 'absolute', backgroundColor: C.primary, borderRadius: 18, paddingVertical: 8, paddingHorizontal: 14, alignItems: 'center',
    shadowColor: '#003366', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  scoreNum: { color: '#fff', fontSize: 22, fontWeight: '700' },
  scoreTxt: { color: C.pale, fontSize: 11, fontWeight: '500' },
  copy: { alignItems: 'center', marginTop: 8 },
  links: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, paddingTop: 6 },
  link: { fontSize: 15, fontWeight: '600', color: C.primary },
  sep: { color: C.sub },
  privacy: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 },
  wrap: { flex: 1, backgroundColor: C.bg, paddingHorizontal: 24 },
  top: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  h1: { fontSize: 28, fontWeight: '700', color: C.ink, textAlign: 'center', letterSpacing: -0.5, lineHeight: 33 },
  p: { fontSize: 15, color: C.sub, marginTop: 8, textAlign: 'center', lineHeight: 21 },
  buttons: { paddingBottom: 16, paddingTop: 22, gap: 12 },
  btn: { height: 54, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  apple: { backgroundColor: '#000' },
  google: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#DCE5F2' },
  guest: { backgroundColor: C.soft },
  email: { backgroundColor: C.primary },
  switchTxt: { fontSize: 14, color: C.primary, textAlign: 'center', fontWeight: '600', marginBottom: 20 },
  pressed: { opacity: 0.75 },
  btnTxt: { fontSize: 16, fontWeight: '600' },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 2 },
  orLine: { flex: 1, height: 1, backgroundColor: C.line },
  orTxt: { fontSize: 13, color: C.sub },
  note: { fontSize: 12, color: C.sub, textAlign: 'center' },
}));
