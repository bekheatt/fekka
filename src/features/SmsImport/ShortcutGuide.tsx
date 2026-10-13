// Full-screen, one-step-at-a-time guide for building the iPhone Shortcuts automation that sends each
// bank SMS to Fakka. Opened from Automatic logging once the person has a link.
import React, { useEffect, useState } from 'react';
import { Modal, View, Pressable, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Text } from '../../fonts';
import { C, themed } from '../../theme';
import { tap, pressedStyle, Progress } from '../../ui';
import { t } from '../../i18n';
import { APP_NAME } from '../../brand';

// **text** = the exact word to look for on the iPhone screen
type Step = { icon: any; title: string; text: string; copy?: boolean; note?: string; warn?: string };
const STEPS: Step[] = [
  { icon: 'link', title: 'Copy your personal link', text: 'Tap the button below. You will paste this link into Shortcuts in step 9.', copy: true,
    note: 'Keep this link private: anyone with it can add transactions to your account.' },
  { icon: 'apps', title: 'Open Shortcuts', text: 'Go to your home screen and open the **Shortcuts** app (it comes with every iPhone). If you deleted it, download "Shortcuts" free from the App Store.' },
  { icon: 'timer-outline', title: 'Go to Automation', text: 'At the bottom, tap **Automation**.' },
  { icon: 'add-circle-outline', title: 'Make a new automation', text: 'Tap **+** at the top right (or **New Automation** if this is your first one). Scroll down and tap **Message**.' },
  { icon: 'chatbubble-ellipses-outline', title: 'Pick bank messages', text: 'Tap **Message Contains**, type **جم** and tap **Done**.',
    note: '**Your bank writes EGP instead of جم?** Make a second automation the same way and type **EGP** in step 5. If you use both, make both.' },
  { icon: 'flash-outline', title: 'Let it run by itself', text: 'Choose **Run Immediately** and turn off **Notify When Run**. Then tap **Next** at the top right.' },
  { icon: 'document-outline', title: 'Start from blank', text: 'Tap **New Blank Automation**.' },
  { icon: 'globe-outline', title: 'Add the web action', text: 'Tap **Add Action**. In the search box type **Get Contents of URL** and tap it.' },
  { icon: 'clipboard-outline', title: 'Paste your link', text: 'Tap the blue word **URL**, then tap again and choose **Paste** to paste your link.', copy: true,
    note: 'Nothing to paste? Tap Copy link above, then go back to Shortcuts.' },
  { icon: 'swap-vertical', title: 'Change GET to POST', text: 'Tap the small arrow **›** at the end of that line to show more options. Tap **Method** and change it from GET to **POST**.' },
  { icon: 'add', title: 'Add a field', text: 'Under **Request Body**, make sure **JSON** is selected. Tap **Add new field** and choose **Text**.' },
  { icon: 'text', title: 'Name the field "text"', text: 'Tap **Key** and type **text** (small letters). Then tap **Text** next to it, and choose **Shortcut Input** in the bar above the keyboard.',
    warn: "Don't skip this. If the grey word **Key** is still showing, the field has no name. It must say **text**, and next to it the blue **Shortcut Input**." },
  { icon: 'checkmark-circle-outline', title: 'Save it', text: "Tap **Done** at the top right. That's it!" },
  { icon: 'sparkles-outline', title: 'Try it', text: 'Send yourself an iMessage that says **خصم 58 جم ORACLE IRELAND**. Then open {app}: it will show the transaction so you can keep or discard it.',
    note: 'Made a new link, or deleted your account and signed up again? Open this automation and paste the new link (step 9). The old one stops working.' },
];

const bold = (s: string, style: any) => s.split('**').map((p, i) => (i % 2 ? <Text key={i} style={[style, { fontWeight: '700' }]}>{p}</Text> : p));

export default function ShortcutGuide({ visible, onClose, link }: { visible: boolean; onClose: () => void; link: string }) {
  const [i, setI] = useState(0);
  const [copied, setCopied] = useState(false);
  useEffect(() => { if (visible) { setI(0); setCopied(false); } }, [visible]);

  const step = STEPS[i];
  const last = i === STEPS.length - 1;
  const copy = () => { tap(); Clipboard.setStringAsync(link); setCopied(true); };
  const go = (to: number) => { tap(); setI(to); };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView style={s.wrap} edges={['top', 'bottom']}>
        <View style={s.head}>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel={t('Close')}>
            <Ionicons name="close" size={26} color={C.ink} />
          </Pressable>
          <Text style={s.count}>{t('Step {n} of {m}', { n: i + 1, m: STEPS.length })}</Text>
          <View style={{ width: 26 }} />
        </View>
        <View style={{ paddingHorizontal: 24 }}><Progress value={(i + 1) / STEPS.length} color={C.primary} /></View>

        <ScrollView contentContainerStyle={s.body}>
          <View style={s.icon}><Ionicons name={step.icon} size={34} color={C.primary} /></View>
          <Text style={s.title}>{t(step.title)}</Text>
          <Text style={s.text}>{bold(t(step.text, { app: APP_NAME }), s.text)}</Text>

          {step.copy && (
            <Pressable onPress={copy} accessibilityRole="button" style={({ pressed }) => [s.copy, copied && { backgroundColor: C.green }, pressed && pressedStyle]}>
              <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={20} color="#fff" />
              <Text style={s.copyTxt}>{t(copied ? 'Link copied' : 'Copy link')}</Text>
            </Pressable>
          )}
          {!!step.warn && (
            <View style={s.warn}>
              <Ionicons name="warning" size={20} color={C.red} />
              <Text style={s.warnTxt}>{bold(t(step.warn), s.warnTxt)}</Text>
            </View>
          )}
          {!!step.note && <Text style={s.note}>{bold(t(step.note), s.note)}</Text>}
        </ScrollView>

        <View style={s.foot}>
          {i > 0 ? (
            <Pressable onPress={() => go(i - 1)} style={({ pressed }) => [s.back, pressed && pressedStyle]} accessibilityRole="button">
              <Text style={s.backTxt}>{t('Back')}</Text>
            </Pressable>
          ) : <View style={{ flex: 1 }} />}
          <Pressable onPress={() => (last ? (tap(), onClose()) : go(i + 1))} style={({ pressed }) => [s.next, pressed && pressedStyle]} accessibilityRole="button">
            <Text style={s.nextTxt}>{t(last ? 'Finish' : 'Next')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const s = themed(() => StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.card },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  count: { fontSize: 15, fontWeight: '600', color: C.sub },
  body: { padding: 24, paddingTop: 36 },
  icon: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.primary + '1A', alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  title: { fontSize: 28, fontWeight: '700', color: C.ink, marginBottom: 14 },
  text: { fontSize: 19, color: C.ink, lineHeight: 28 },
  copy: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.primary, borderRadius: 16, paddingVertical: 16, marginTop: 26 },
  copyTxt: { color: '#fff', fontSize: 17, fontWeight: '600' },
  warn: { flexDirection: 'row', gap: 10, backgroundColor: C.red + '14', borderRadius: 16, padding: 16, marginTop: 24 },
  warnTxt: { flex: 1, color: C.red, fontSize: 16, lineHeight: 23, fontWeight: '500' },
  note: { fontSize: 15, color: C.sub, lineHeight: 22, marginTop: 22 },
  foot: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 8 },
  back: { flex: 1, borderRadius: 16, paddingVertical: 16, alignItems: 'center', backgroundColor: C.soft },
  backTxt: { color: C.ink, fontSize: 17, fontWeight: '600' },
  next: { flex: 1, borderRadius: 16, paddingVertical: 16, alignItems: 'center', backgroundColor: C.primary },
  nextTxt: { color: '#fff', fontSize: 17, fontWeight: '600' },
}));
