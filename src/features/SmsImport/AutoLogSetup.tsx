// Set up automatic logging of bank SMS on iPhone. Fakka has its own Shortcuts action ("Log Bank SMS",
// native/ios/FakkaIntents.swift); a Message automation hands it each bank message and it sends it to
// Fakka's server in the background. Turning this on makes the private key the action uses (never shown).
import { useState } from 'react';
import { Modal, View, Pressable, StyleSheet, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../fonts';
import { C, themed } from '../../theme';
import { useStore, hasAccount } from '../../store';
import { Card, Toggle, tap, pressedStyle } from '../../ui';
import { t } from '../../i18n';
import { APP_NAME } from '../../brand';
import { newSmsKey, removeSmsKey } from '../../cloud/supabase';
import ShortcutGuide from './ShortcutGuide';

const bold = (s: string) => s.split('**').map((p, i) => (i % 2 ? <Text key={i} style={{ fontWeight: '700' }}>{p}</Text> : p));

export default function AutoLogSetup({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { d, set } = useStore();
  const st = d.settings;
  const [busy, setBusy] = useState(false);
  const [guide, setGuide] = useState(false);
  const online = hasAccount(st);
  const change = (patch: object) => set(x => ({ ...x, settings: { ...x.settings, ...patch } }));

  // Turn on (make the key if there isn't one yet), then walk through the Shortcuts setup
  const start = async () => {
    tap();
    if (!st.smsKey) {
      setBusy(true);
      try { change({ smsKey: await newSmsKey() }); }
      catch { setBusy(false); return Alert.alert(t("Couldn't turn it on"), t('Check your internet connection and try again.')); }
      setBusy(false);
    }
    setGuide(true);
  };
  const turnOff = () => Alert.alert(t('Turn off automatic logging?'), t('{app} will stop adding your bank messages. You can also delete the automation in Shortcuts.', { app: APP_NAME }), [
    { text: t('Cancel'), style: 'cancel' },
    { text: t('Turn off'), style: 'destructive', onPress: async () => {
      try { await removeSmsKey(); change({ smsKey: undefined }); } catch { Alert.alert(t('Check your internet connection and try again.')); }
    } },
  ]);

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
              {!!st.smsKey && (
                <View style={s.on}>
                  <Ionicons name="checkmark-circle" size={20} color={C.green} />
                  <Text style={s.onTxt}>{t('On for this iPhone')}</Text>
                </View>
              )}
              <Pressable onPress={start} disabled={busy} style={({ pressed }) => [s.primary, pressed && pressedStyle]} accessibilityRole="button">
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryTxt}>{t(st.smsKey ? 'Show the setup steps' : 'Set up automatic logging')}</Text>}
              </Pressable>
              <Text style={s.hint}>{t('About 2 minutes in the Shortcuts app. We show you every tap.')}</Text>

              <Card style={{ marginTop: 18 }}>
                <Toggle icon="flash" title={t('Keep new transactions automatically')} sub={t("Add them without asking. Off: you choose what to keep when you open the app.")}
                  value={!!st.smsAutoKeep} onChange={v => change({ smsAutoKeep: v })} last />
              </Card>

              {!!st.smsKey && (
                <>
                  <View style={s.trouble}>
                    <Text style={s.troubleTitle}>{t('Stopped working?')}</Text>
                    <Text style={s.hint}>{bold(t('Open the automation in Shortcuts and check it says **Log Shortcut Input in Fakka** and that **Run Immediately** is on.'))}</Text>
                  </View>
                  <Pressable onPress={() => { tap(); turnOff(); }} hitSlop={6} style={{ marginTop: 22, alignSelf: 'flex-start' }}>
                    <Text style={[s.link, { color: C.red }]}>{t('Turn off')}</Text>
                  </Pressable>
                </>
              )}
            </>
          )}
        </ScrollView>
        <ShortcutGuide visible={guide} onClose={() => setGuide(false)} />
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
  on: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  onTxt: { fontSize: 15, fontWeight: '600', color: C.ink },
  primary: { backgroundColor: C.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  primaryTxt: { color: '#fff', fontSize: 17, fontWeight: '600' },
  trouble: { backgroundColor: C.soft, borderRadius: 14, padding: 14, marginTop: 18 },
  troubleTitle: { fontSize: 14, fontWeight: '600', color: C.ink, marginBottom: 2 },
  hint: { color: C.sub, fontSize: 13, lineHeight: 18, marginTop: 8 },
  link: { color: C.primary, fontSize: 15, fontWeight: '600' },
}));
