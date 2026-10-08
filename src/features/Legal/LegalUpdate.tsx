// Shown over the app when someone already using Fakka hasn't accepted the current Terms / Privacy Policy
// (people from before they existed, or after a new version). Also makes sure an account's
// acceptance reaches the server (legal_consents) if it couldn't be saved at sign-in, e.g. offline.
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../fonts';
import { C, themed } from '../../theme';
import { t } from '../../i18n';
import { tap, Bubble } from '../../ui';
import { useStore, hasAccount } from '../../store';
import { recordConsent } from '../../cloud/supabase';
import Agree from './Agree';
import { isCurrent, newConsent } from './consent';

export default function LegalUpdate({ active }: { active: boolean }) {
  const { d, set } = useStore();
  const st = d.settings;
  const online = hasAccount(st);
  const [agreedAt, setAgreedAt] = useState<string | null>(null);
  const [warn, setWarn] = useState(false);

  // Accepting the same versions twice is ignored by the server, so this is safe to repeat
  useEffect(() => {
    const c = st.consent;
    if (online && isCurrent(c)) recordConsent(c!, c!.via === 'guest' || !c!.via ? 'update' : c!.via).catch(() => {});
  }, [online, st.uid, st.consent?.at]);

  if (!active || !st.account || isCurrent(st.consent)) return null;

  const firstTime = !st.consent;
  const accept = () => {
    tap();
    if (!agreedAt) return setWarn(true);
    set(x => ({ ...x, settings: { ...x.settings, consent: newConsent(agreedAt, online ? 'update' : 'guest') } }));
  };

  return (
    <View style={[StyleSheet.absoluteFill, s.wrap]}>
      <SafeAreaView style={s.inner}>
        <View style={{ alignItems: 'center' }}>
          <Bubble icon="shield-checkmark" color={C.primary} size={64} />
          <Text style={s.h1} accessibilityRole="header">{t(firstTime ? 'Your privacy, in writing' : 'We updated our terms')}</Text>
          <Text style={s.p}>{t(firstTime
            ? 'Please read our Terms of Service and Privacy Policy. They explain what Fakka stores, where, and the choices you have.'
            : 'Please read the updated Terms of Service and Privacy Policy to keep using Fakka.')}</Text>
        </View>
        <View style={{ gap: 18 }}>
          <Agree on={!!agreedAt} onChange={v => { setAgreedAt(v ? new Date().toISOString() : null); if (v) setWarn(false); }} warn={warn} />
          <Pressable onPress={accept} accessibilityRole="button" accessibilityState={{ disabled: !agreedAt }}
            style={({ pressed }) => [s.btn, !agreedAt && { opacity: 0.45 }, pressed && { opacity: 0.8 }]}>
            <Text style={s.btnTxt}>{t('Continue')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = themed(() => StyleSheet.create({
  wrap: { backgroundColor: C.bg, zIndex: 150 },
  inner: { flex: 1, paddingHorizontal: 24, paddingTop: 70, paddingBottom: 24, justifyContent: 'space-between' },
  h1: { fontSize: 26, fontWeight: '700', color: C.ink, textAlign: 'center', marginTop: 20 },
  p: { fontSize: 15, color: C.sub, textAlign: 'center', lineHeight: 22, marginTop: 10 },
  btn: { height: 54, borderRadius: 16, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '600' },
}));
