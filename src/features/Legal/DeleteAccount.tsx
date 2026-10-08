// Delete account (Settings → Legal & Privacy). Really deletes: the sign-in account and every server row
// linked to it (Supabase delete_my_account + on delete cascade), then everything Fakka kept on this phone.
// Email accounts confirm with their password; Google accounts and guests type DELETE.
import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Modal, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../fonts';
import { C, themed } from '../../theme';
import { t } from '../../i18n';
import { Field } from '../../ui';
import { useStore, hasAccount } from '../../store';
import { deleteMyAccount, confirmPassword, signOutCloud } from '../../cloud/supabase';
import { deleteAllReceipts } from '../../receipts';

// Everything this app keeps on the phone outside the main data (which reset() clears)
async function clearDevice() {
  deleteAllReceipts();
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
  await AsyncStorage.multiRemove(['fekka.crowd', 'fekka.sync']).catch(() => {});
}

const WORD = 'DELETE';

export default function DeleteAccount({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { d, reset } = useStore();
  const st = d.settings;
  const online = hasAccount(st);
  const usePassword = online && st.account === 'email';
  const [pw, setPw] = useState('');
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const ready = usePassword ? pw.length > 0 : typed.trim().toUpperCase() === WORD;
  const close = () => { if (busy) return; setPw(''); setTyped(''); setErr(''); onClose(); };

  const finish = async () => {
    await clearDevice();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    reset(); // back to the sign-in screen with an empty app
  };

  const run = async () => {
    if (!ready || busy) return;
    setErr('');
    setBusy(true);
    try {
      if (online) {
        if (usePassword && !(await confirmPassword(st.email ?? '', pw))) {
          setBusy(false);
          return setErr(t('Wrong password. Nothing was deleted.'));
        }
        await deleteMyAccount();
      }
      await finish();
    } catch (e: any) {
      setBusy(false);
      if (String(e?.message) === 'SIGN_IN_AGAIN') {
        Alert.alert(t('Please sign in again'), t('For your security, sign in again and then delete your account. Nothing was deleted.'), [
          { text: t('Cancel'), style: 'cancel' },
          { text: t('Sign in again'), onPress: async () => { await signOutCloud(); reset(); } },
        ]);
      } else {
        setErr(t('Check your internet connection and try again. Nothing was deleted.'));
      }
    }
  };

  const gone = online
    ? ['Your Fakka account and sign-in', 'Everything you entered: income, spending, installments, loans, bills, gam\'eya, savings and goals', 'Bank messages waiting in your inbox and your automatic logging link', 'Your shop category choices', 'Receipt photos and reminders on this phone']
    : ['Everything you entered on this phone', 'Receipt photos and reminders on this phone'];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.card }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.head}>
          <Pressable onPress={close} hitSlop={10}><Text style={s.cancel}>{t('Cancel')}</Text></Pressable>
          <Text style={s.title}>{t(online ? 'Delete account' : 'Delete all data')}</Text>
          <View style={{ width: 50 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
          <View style={s.warnBox}>
            <Ionicons name="warning" size={22} color={C.red} />
            <Text style={s.warnTxt}>{t('This is permanent and cannot be undone.')}</Text>
          </View>

          <Text style={s.lbl}>{t('What will be deleted')}</Text>
          {gone.map(g => (
            <View key={g} style={s.li}>
              <Ionicons name="close-circle" size={18} color={C.red} />
              <Text style={s.liTxt}>{t(g)}</Text>
            </View>
          ))}
          {online && <Text style={s.note}>{t('Other phones signed in to this account will be signed out. What is already saved on them stays there until you delete it or remove the app.')}</Text>}
          {online && <Text style={s.note}>{t('If you sign in again later, you will start with a new, empty account.')}</Text>}

          <View style={{ height: 18 }} />
          {usePassword ? (
            <Field label={t('Enter your password to confirm')} value={pw} onChangeText={(v: string) => { setPw(v); setErr(''); }}
              secureTextEntry autoCapitalize="none" autoComplete="current-password" placeholder="••••••" hint={st.email} />
          ) : (
            <Field label={t('Type {w} to confirm', { w: WORD })} value={typed} onChangeText={(v: string) => { setTyped(v); setErr(''); }}
              autoCapitalize="characters" autoCorrect={false} placeholder={WORD} />
          )}
          {!!err && <Text style={s.err} accessibilityLiveRegion="assertive">{err}</Text>}

          <Pressable onPress={run} accessibilityRole="button" accessibilityState={{ disabled: !ready || busy }}
            style={({ pressed }) => [s.btn, (!ready || busy) && { opacity: 0.45 }, pressed && { opacity: 0.8 }]}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>{t(online ? 'Delete my account' : 'Delete all data')}</Text>}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = themed(() => StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderColor: C.line },
  title: { fontSize: 17, fontWeight: '600', color: C.ink },
  cancel: { fontSize: 16, color: C.sub, width: 50 },
  warnBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.red + '18', borderRadius: 14, padding: 14, marginBottom: 20 },
  warnTxt: { flex: 1, color: C.red, fontSize: 15, fontWeight: '600' },
  lbl: { fontSize: 14, fontWeight: '600', color: C.ink, marginBottom: 10 },
  li: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  liTxt: { flex: 1, color: C.ink, fontSize: 15, lineHeight: 21 },
  note: { color: C.sub, fontSize: 13, lineHeight: 19, marginTop: 6 },
  err: { color: C.red, fontSize: 14, marginBottom: 12, marginTop: -6 },
  btn: { backgroundColor: C.red, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  btnTxt: { color: '#fff', fontSize: 17, fontWeight: '600' },
}));
