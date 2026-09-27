// First screen when cloud is set up: Sign in with Apple / Google, or continue without an account
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { C, themed, isDark } from '../theme';
import { useStore } from '../store';
import { t } from '../i18n';
import { tap } from '../ui';
import Logo from '../Logo';
import { appleAvailable, googleAvailable, signInWithApple, signInWithGoogle, wasCancelled, inExpoGo } from './auth';
import { ask, tell } from './ask';

export default function SignIn() {
  const { set } = useStore();
  const [apple, setApple] = useState(false);
  const [busy, setBusy] = useState<null | 'apple' | 'google'>(null);
  const google = googleAvailable();

  useEffect(() => { appleAvailable().then(setApple); }, []);

  const run = async (which: 'apple' | 'google') => {
    tap();
    setBusy(which);
    try { await (which === 'apple' ? signInWithApple() : signInWithGoogle()); }
    catch (e: any) { if (!wasCancelled(e)) tell(t("Couldn't sign in"), t('Please try again.') + (e?.message ? `\n\n${e.message}` : '')); }
    finally { setBusy(null); }
  };

  const skip = () => { tap(); set(x => ({ ...x, settings: { ...x.settings, cloudSkipped: true } })); };

  return (
    <SafeAreaView style={s.wrap}>
      <View style={s.top}>
        <Logo size={96} />
        <Text style={s.title}>{t('Welcome to Fakka')}</Text>
        <Text style={s.sub}>{t('Sign in to back up your finances and keep them when you change phones.')}</Text>
      </View>

      <View style={s.bottom}>
        {apple && (
          busy === 'apple'
            ? <View style={[s.btn, { backgroundColor: isDark() ? '#fff' : '#000' }]}><ActivityIndicator color={isDark() ? '#000' : '#fff'} /></View>
            : <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={isDark() ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={16} style={s.btn} onPress={() => run('apple')} />
        )}
        {google && (
          <Pressable style={({ pressed }) => [s.btn, s.google, pressed && { opacity: 0.7 }]} onPress={() => run('google')} disabled={!!busy}>
            {busy === 'google' ? <ActivityIndicator color={C.ink} /> : <>
              <Ionicons name="logo-google" size={18} color={C.ink} />
              <Text style={s.googleTxt}>{t('Sign in with Google')}</Text>
            </>}
          </Pressable>
        )}
        {!apple && !google && (
          <Text style={s.note}>{t(inExpoGo || Platform.OS !== 'ios' ? 'Sign-in works in the full Fakka app. In Expo Go you can continue without an account.' : 'Sign-in is not available on this device.')}</Text>
        )}

        <Pressable onPress={skip} hitSlop={10} style={s.skip}>
          <Text style={s.skipTxt}>{t('Continue without an account')}</Text>
        </Pressable>

        <View style={s.privacy}>
          <Ionicons name="lock-closed" size={13} color={C.sub} />
          <Text style={s.privacyTxt}>{t('Only you can see your data. Fakka never sells or shares it.')}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = themed(() => StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg, paddingHorizontal: 24 },
  top: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: C.ink, marginTop: 24, textAlign: 'center' },
  sub: { fontSize: 16, color: C.sub, textAlign: 'center', marginTop: 10, lineHeight: 23, maxWidth: 320 },
  bottom: { paddingBottom: 18, gap: 12 },
  btn: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', width: '100%' },
  google: { flexDirection: 'row', gap: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.line },
  googleTxt: { fontSize: 17, fontWeight: '600', color: C.ink },
  note: { fontSize: 14, color: C.sub, textAlign: 'center', lineHeight: 20 },
  skip: { alignItems: 'center', paddingVertical: 10 },
  skipTxt: { fontSize: 16, color: C.primary, fontWeight: '600' },
  privacy: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  privacyTxt: { fontSize: 12, color: C.sub, textAlign: 'center' },
}));
