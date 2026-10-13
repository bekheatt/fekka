// Set up automatic logging of bank SMS on iPhone: make a personal link, then build a Shortcuts automation
// that quietly sends each bank message to Fekka's server (the app never opens).
import React, { useState } from 'react';
import { Modal, View, Pressable, StyleSheet, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Text } from '../../fonts';
import { C, themed } from '../../theme';
import { useStore, hasAccount } from '../../store';
import { Card, Toggle, tap, pressedStyle } from '../../ui';
import { t } from '../../i18n';
import { APP_NAME } from '../../brand';
import { newSmsKey, removeSmsKey, smsEndpoint } from '../../cloud/supabase';
import ShortcutGuide from './ShortcutGuide';

const bold = (s: string) => s.split('**').map((p, i) => (i % 2 ? <Text key={i} style={{ fontWeight: '700' }}>{p}</Text> : p));

export default function AutoLogSetup({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { d, set } = useStore();
  const st = d.settings;
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [guide, setGuide] = useState(false);
  const online = hasAccount(st);
  const change = (patch: object) => set(x => ({ ...x, settings: { ...x.settings, ...patch } }));

  const makeKey = async (confirm: boolean) => {
    const go = async () => {
      setBusy(true);
      try { change({ smsKey: await newSmsKey() }); setCopied(false); }
      catch { Alert.alert(t("Couldn't create your link"), t('Check your internet connection and try again.')); }
      finally { setBusy(false); }
    };
    if (!confirm) return go();
    Alert.alert(t('Make a new link?'), t('The old link stops working. You will need to paste the new one in your Shortcut.'), [
      { text: t('Cancel'), style: 'cancel' }, { text: t('New link'), onPress: go },
    ]);
  };
  const turnOff = () => Alert.alert(t('Turn off automatic logging?'), t('Your Shortcut will stop sending messages. You can turn it on again any time.'), [
    { text: t('Cancel'), style: 'cancel' },
    { text: t('Turn off'), style: 'destructive', onPress: async () => {
      try { await removeSmsKey(); change({ smsKey: undefined }); } catch { Alert.alert(t('Check your internet connection and try again.')); }
    } },
  ]);
  const copy = () => { if (!st.smsKey) return; tap(); Clipboard.setStringAsync(smsEndpoint(st.smsKey)); setCopied(true); };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: C.card }}>
        <View style={s.head}>
          <View style={{ width: 50 }} />
          <Text style={s.title}>{t('Automatic logging')}</Text>
          <Pressable onPress={onClose} hitSlop={10}><Text style={s.done}>{t('Done')}</Text></Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 50 }}>
          <Text style={s.lead}>{t('Your iPhone sends each bank message to {app} in the background. The app does not open. Next time you open {app}, the transactions are there, on all your devices.', { app: APP_NAME })}</Text>

          {!online ? (
            <Card style={{ padding: 18 }}>
              <Text style={s.need}>{t('Sign in with an account to use this. Guests can still paste messages in Import from SMS.')}</Text>
            </Card>
          ) : Platform.OS !== 'ios' ? (
            <Card style={{ padding: 18 }}>
              <Text style={s.need}>{t('This uses the iPhone Shortcuts app. On Android, paste messages in Import from SMS for now.')}</Text>
            </Card>
          ) : (
            <>
              {!st.smsKey ? (
                <Pressable onPress={() => { tap(); makeKey(false); }} disabled={busy} style={({ pressed }) => [s.primary, pressed && pressedStyle]}>
                  {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryTxt}>{t('Create my link')}</Text>}
                </Pressable>
              ) : (
                <>
                  <Pressable onPress={copy} style={s.code}>
                    <Text style={s.codeTxt} numberOfLines={2}>{smsEndpoint(st.smsKey)}</Text>
                    <View style={s.copyBtn}>
                      <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={14} color="#fff" />
                      <Text style={s.copyTxt}>{t(copied ? 'Copied' : 'Copy')}</Text>
                    </View>
                  </Pressable>
                  <Text style={s.warn}>{t('Keep this link private: anyone with it can add transactions to your account.')}</Text>
                </>
              )}

              <Card style={{ marginTop: 18 }}>
                <Toggle icon="flash" title={t('Keep new transactions automatically')} sub={t("Add them without asking. Off: you choose what to keep when you open the app.")}
                  value={!!st.smsAutoKeep} onChange={v => change({ smsAutoKeep: v })} last />
              </Card>

              {!!st.smsKey && (
                <View style={s.steps}>
                  <Pressable onPress={() => { tap(); setGuide(true); }} style={({ pressed }) => [s.primary, s.startBtn, pressed && pressedStyle]} accessibilityRole="button">
                    <Ionicons name="list" size={20} color="#fff" />
                    <Text style={s.primaryTxt}>{t('Start step-by-step setup')}</Text>
                  </Pressable>
                  <Text style={s.hint}>{t('About 3 minutes in the Shortcuts app. One step per screen.')}</Text>
                  <View style={s.trouble}>
                    <Text style={s.troubleTitle}>{t('Stopped working?')}</Text>
                    <Text style={s.hint}>{bold(t('Check two things in your automation: the link is the newest one from this screen, and the field under Request Body is named **text**.'))}</Text>
                  </View>

                  <View style={s.manage}>
                    <Pressable onPress={() => { tap(); makeKey(true); }} hitSlop={6}><Text style={s.link}>{t('Make a new link')}</Text></Pressable>
                    <Pressable onPress={() => { tap(); turnOff(); }} hitSlop={6}><Text style={[s.link, { color: C.red }]}>{t('Turn off')}</Text></Pressable>
                  </View>
                </View>
              )}
            </>
          )}
        </ScrollView>
        {!!st.smsKey && <ShortcutGuide visible={guide} onClose={() => setGuide(false)} link={smsEndpoint(st.smsKey)} />}
      </View>
    </Modal>
  );
}

const s = themed(() => StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderColor: C.line },
  title: { fontSize: 17, fontWeight: '600', color: C.ink },
  done: { fontSize: 16, fontWeight: '600', color: C.primary, width: 50, textAlign: 'right' },
  lead: { fontSize: 15, color: C.sub, lineHeight: 21, marginBottom: 16 },
  need: { fontSize: 15, color: C.ink, lineHeight: 21 },
  primary: { backgroundColor: C.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  primaryTxt: { color: '#fff', fontSize: 17, fontWeight: '600' },
  code: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.soft, borderRadius: 12, padding: 12 },
  codeTxt: { flex: 1, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 12, color: C.ink },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.primary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  copyTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },
  warn: { fontSize: 12, color: C.sub, marginTop: 8, lineHeight: 17 },
  steps: { gap: 12, marginTop: 18 },
  startBtn: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  trouble: { backgroundColor: C.soft, borderRadius: 14, padding: 14, marginTop: 8 },
  troubleTitle: { fontSize: 14, fontWeight: '600', color: C.ink, marginBottom: 2 },
  hint: { color: C.sub, fontSize: 13, lineHeight: 18, marginTop: 4 },
  manage: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  link: { color: C.primary, fontSize: 15, fontWeight: '600' },
}));
