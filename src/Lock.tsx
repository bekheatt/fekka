import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';
import Logo from './Logo';
import { t } from './i18n';

// True while the Face ID / passcode sheet is on screen, so the app
// doesn't treat that as "left the app" and lock itself again.
export let authInProgress = false;
// Also used while the camera / photo picker is open, so taking a receipt photo doesn't lock the app
export const pauseLock = (on: boolean) => { authInProgress = on; };

export async function canUseLock() {
  const hw = await LocalAuthentication.hasHardwareAsync();
  const level = await LocalAuthentication.getEnrolledLevelAsync();
  return hw && level !== LocalAuthentication.SecurityLevel.NONE;
}

export default function Lock({ onUnlock, resume = 0 }: { onUnlock: () => void; resume?: number }) {
  const [busy, setBusy] = useState(false);
  const running = useRef(false);

  const tryUnlock = async () => {
    if (running.current) return; // never stack two prompts
    running.current = true; authInProgress = true; setBusy(true);
    try {
      const r = await LocalAuthentication.authenticateAsync({ promptMessage: t('Unlock Fakka'), cancelLabel: t('Cancel') });
      if (r.success) onUnlock();
    } catch {
      // ignore — user can tap Unlock again
    } finally {
      running.current = false; setBusy(false);
      setTimeout(() => { authInProgress = false; }, 1500);
    }
  };

  // Ask as soon as the lock appears, and every time you come back to the app
  useEffect(() => {
    const id = setTimeout(tryUnlock, 350);
    return () => clearTimeout(id);
  }, [resume]);

  return (
    <View style={s.wrap}>
      <Logo size={110} />
      <Text style={s.title}>{t('Fakka is locked')}</Text>
      <Pressable style={[s.btn, busy && { opacity: 0.6 }]} onPress={tryUnlock} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Ionicons name="finger-print" size={22} color="#fff" />}
        <Text style={s.btnTxt}>{t('Unlock')}</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#003366', alignItems: 'center', justifyContent: 'center', zIndex: 90 },
  title: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 24 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#007ACC', paddingHorizontal: 28, paddingVertical: 15, borderRadius: 999, marginTop: 30 },
  btnTxt: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
