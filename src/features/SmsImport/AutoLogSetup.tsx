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

// **text** = the exact button name to look for on screen
const GUIDE: { text: string; part?: string; copy?: boolean }[] = [
  { part: 'Part 1 · Copy your link', text: 'Tap the box above to copy your personal link. You will paste it in step 9.' },
  { part: 'Part 2 · Create the automation', text: 'Go to your home screen and open the **Shortcuts** app (it comes with every iPhone). If you deleted it, download "Shortcuts" free from the App Store.' },
  { text: 'At the bottom, tap **Automation**.' },
  { text: 'Tap **+** at the top right (or **New Automation** if this is your first one). Scroll down and tap **Message**.' },
  { text: 'Tap **Message Contains**, type **جم** and tap **Done**.' },
  { text: 'Choose **Run Immediately** and turn off **Notify When Run**. Then tap **Next** at the top right.' },
  { text: 'Tap **New Blank Automation**.' },
  { part: 'Part 3 · Send the message to Fakka', text: 'Tap **Add Action**. In the search box type **Get Contents of URL** and tap it.' },
  { text: 'Tap the blue word **URL**, then tap again and choose **Paste** to paste your link.' },
  { text: 'Tap the small arrow **›** at the end of that line to show more options. Tap **Method** and change it from GET to **POST**.' },
  { text: 'Under **Request Body**, make sure **JSON** is selected. Tap **Add new field** and choose **Text**.' },
  { text: 'Tap **Key** and type **text** (small letters). Then tap **Text** next to it, and choose **Shortcut Input** in the bar above the keyboard.' },
  { text: 'Tap **Done** at the top right. That\'s it!' },
  { part: 'Part 4 · Try it', text: 'Send yourself an iMessage that says **خصم 58 جم ORACLE IRELAND**. Then open {app}: it will show the transaction so you can keep or discard it.' },
];

const bold = (s: string) => s.split('**').map((p, i) => (i % 2 ? <Text key={i} style={{ fontWeight: '700' }}>{p}</Text> : p));

export default function AutoLogSetup({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { d, set } = useStore();
  const st = d.settings;
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
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
                  {GUIDE.map((g, i) => (
                    <View key={i}>
                      {g.part && <Text style={s.part}>{t(g.part)}</Text>}
                      <View style={s.step}>
                        <Text style={s.stepN}>{i + 1}</Text>
                        <Text style={s.stepTxt}>{bold(t(g.text, { app: APP_NAME }))}</Text>
                      </View>
                    </View>
                  ))}
                  <Text style={s.hint}>{bold(t('**Your bank writes EGP instead of جم?** Make a second automation the same way and type **EGP** in step 5. If you use both, make both.'))}</Text>

                  <View style={s.manage}>
                    <Pressable onPress={() => { tap(); makeKey(true); }} hitSlop={6}><Text style={s.link}>{t('Make a new link')}</Text></Pressable>
                    <Pressable onPress={() => { tap(); turnOff(); }} hitSlop={6}><Text style={[s.link, { color: C.red }]}>{t('Turn off')}</Text></Pressable>
                  </View>
                </View>
              )}
            </>
          )}
        </ScrollView>
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
  part: { fontSize: 13, fontWeight: '700', color: C.primary, marginTop: 10, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.3 },
  step: { flexDirection: 'row', gap: 10 },
  stepN: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.soft, color: C.primary, textAlign: 'center', lineHeight: 22, fontSize: 12, fontWeight: '700', overflow: 'hidden' },
  stepTxt: { flex: 1, fontSize: 14, color: C.ink, lineHeight: 20 },
  hint: { color: C.sub, fontSize: 13, lineHeight: 18, marginTop: 4 },
  manage: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  link: { color: C.primary, fontSize: 15, fontWeight: '600' },
}));
