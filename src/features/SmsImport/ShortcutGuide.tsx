// Full-screen, one-step-at-a-time guide for building the iPhone Shortcuts automation that sends each
// bank SMS to Fakka. Each step shows a real iPhone screenshot inside a phone, with a pulsing circle on
// the spot to tap and the exact words to type. Opened from Automatic logging once the person has a link.
import { useEffect, useRef, useState } from 'react';
import { Modal, View, Pressable, StyleSheet, ScrollView, Image, Animated, Easing, useWindowDimensions, I18nManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Text } from '../../fonts';
import { C, themed } from '../../theme';
import { tap, pressedStyle, Progress } from '../../ui';
import { t } from '../../i18n';
import { APP_NAME } from '../../brand';
import { SHOTS, ShotKey } from './guideShots';

// **text** = the exact word to look for on the iPhone screen.
// shot = screenshot shown in the phone; spot = where to tap on it (0–1 from the left / top);
// type = words to type (shown in a box with a Copy button); link = show the Copy link button.
type Step = { title: string; text: string; shot?: ShotKey; spot?: { x: number; y: number }; type?: string; link?: boolean; note?: string; warn?: string };
const STEPS: Step[] = [
  { title: 'Copy your personal link', text: 'Tap the button below. You will paste this link into Shortcuts later.', link: true,
    note: 'Keep this link private: anyone with it can add transactions to your account.' },
  { title: 'Open Shortcuts', shot: 'home', text: 'Go to your home screen and open the **Shortcuts** app. It comes with every iPhone.',
    note: 'Can\'t find it? Download "Shortcuts" free from the App Store.' },
  { title: 'Go to Automation', shot: 'automation', text: 'At the bottom of the screen, tap **Automation**.' },
  { title: 'Make a new automation', shot: 'new', text: 'Tap **+** at the top right. If you have never made one, tap **New Automation** instead.' },
  { title: 'Choose Message', shot: 'message', text: 'Scroll down the list and tap **Message**.' },
  { title: 'Pick bank messages', shot: 'contains', text: 'Tap **Message Contains**, type the word below, then tap **Done**.', type: 'جم',
    note: '**Your bank writes EGP instead of جم?** Make a second automation the same way and type **EGP** here.' },
  { title: 'Let it run by itself', shot: 'run', text: 'Tap **Run Immediately**. Turn off **Notify When Run**. Then tap **Next** at the top right.' },
  { title: 'Start from blank', shot: 'blank', text: 'Tap **New Blank Automation**.' },
  { title: 'Add the web action', shot: 'search', text: 'Tap **Add Action**. In the search box, type the words below and tap the result.', type: 'Get Contents of URL' },
  { title: 'Paste your link', shot: 'paste', text: 'Tap the blue word **URL**. Tap it once more and choose **Paste**.', link: true,
    note: 'Nothing to paste? Tap Copy link above, then go back to Shortcuts.' },
  { title: 'Change GET to POST', shot: 'post', text: 'Tap the small arrow **›** at the end of that line. Tap **Method** and choose **POST**.' },
  { title: 'Add a field', shot: 'field', text: 'Under **Request Body**, check that **JSON** is chosen. Tap **Add new field** and choose **Text**.' },
  { title: 'Name the field "text"', shot: 'key', text: 'Tap the grey word **Key** and type the word below. Then tap **Text** next to it and choose **Shortcut Input** above the keyboard.', type: 'text',
    warn: "Don't skip this. If the grey word **Key** is still showing, the field has no name. It must say **text**, and next to it the blue **Shortcut Input**." },
  { title: 'Save it', shot: 'done', text: "Tap **Done** at the top right. That's it!" },
  { title: 'Try it', shot: 'try', text: 'Send yourself an iMessage with the words below. Then open {app}: it shows the transaction so you can keep it or throw it away.', type: 'خصم 58 جم ORACLE IRELAND',
    note: 'Made a new link, or deleted your account and signed up again? Open this automation and paste the new link. The old one stops working.' },
];

const bold = (s: string, style: any) => s.split('**').map((p, i) => (i % 2 ? <Text key={i} style={[style, { fontWeight: '700' }]}>{p}</Text> : p));

export default function ShortcutGuide({ visible, onClose, link }: { visible: boolean; onClose: () => void; link: string }) {
  const [i, setI] = useState(0);
  const [copied, setCopied] = useState<string | null>(null); // what was copied last: 'link' or the typed words
  const scroll = useRef<ScrollView>(null);
  useEffect(() => { if (visible) { setI(0); setCopied(null); } }, [visible]);

  const step = STEPS[i];
  const last = i === STEPS.length - 1;
  const copy = (what: string, value: string) => { tap(); Clipboard.setStringAsync(value); setCopied(what); };
  const go = (to: number) => { tap(); setI(to); setCopied(c => (c === 'link' ? c : null)); scroll.current?.scrollTo({ y: 0, animated: false }); };

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

        <ScrollView ref={scroll} contentContainerStyle={s.body}>
          {step.shot ? <Phone shot={step.shot} spot={step.spot} /> : (
            <View style={s.icon}><Ionicons name="link" size={34} color={C.primary} /></View>
          )}
          <Text style={s.title}>{t(step.title)}</Text>
          <Text style={s.text}>{bold(t(step.text, { app: APP_NAME }), s.text)}</Text>

          {!!step.type && (
            <View style={s.typeBox}>
              <View style={{ flex: 1 }}>
                <Text style={s.typeLbl}>{t('Type this')}</Text>
                <Text style={s.typeVal} selectable>{step.type}</Text>
              </View>
              <Pressable onPress={() => copy(step.type!, step.type!)} hitSlop={8} accessibilityRole="button" style={({ pressed }) => [s.typeCopy, pressed && pressedStyle]}>
                <Ionicons name={copied === step.type ? 'checkmark' : 'copy-outline'} size={16} color={C.primary} />
                <Text style={s.typeCopyTxt}>{t(copied === step.type ? 'Copied' : 'Copy')}</Text>
              </Pressable>
            </View>
          )}
          {step.link && (
            <Pressable onPress={() => copy('link', link)} accessibilityRole="button" style={({ pressed }) => [s.copy, copied === 'link' && { backgroundColor: C.green }, pressed && pressedStyle]}>
              <Ionicons name={copied === 'link' ? 'checkmark' : 'copy-outline'} size={20} color="#fff" />
              <Text style={s.copyTxt}>{t(copied === 'link' ? 'Link copied' : 'Copy link')}</Text>
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

// An iPhone drawn around the step's screenshot, with a pulsing circle where to tap
function Phone({ shot, spot }: { shot: ShotKey; spot?: { x: number; y: number } }) {
  const { height } = useWindowDimensions();
  const h = Math.min(460, Math.max(300, height * 0.46));
  const w = h / 2.06;                // iPhone shape including the frame
  const src = SHOTS[shot];
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!spot) return;
    const loop = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 1300, easing: Easing.out(Easing.quad), useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [shot, spot]);

  return (
    <View style={[s.phone, { width: w, height: h, borderRadius: w * 0.17 }]}>
      <View style={[s.screen, { borderRadius: w * 0.14 }]}>
        {src ? <Image source={src} style={StyleSheet.absoluteFill} resizeMode="cover" /> : (
          <View style={s.empty}>
            <Ionicons name="image-outline" size={32} color={C.sub} />
            <Text style={s.emptyTxt}>{t('Picture coming soon')}</Text>
          </View>
        )}
        {src && spot && (
          <View pointerEvents="none" style={[s.spotWrap, { left: `${(I18nManager.isRTL ? 1 - spot.x : spot.x) * 100}%`, top: `${spot.y * 100}%` }]}>
            <Animated.View style={[s.spotRing, { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0] }), transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.8] }) }] }]} />
            <View style={s.spotDot} />
          </View>
        )}
      </View>
      <View style={[s.island, { width: w * 0.3, height: w * 0.085, top: w * 0.055 }]} />
    </View>
  );
}

const SPOT = 44;
const s = themed(() => StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.card },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  count: { fontSize: 15, fontWeight: '600', color: C.sub },
  body: { padding: 24, paddingTop: 22 },
  icon: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.primary + '1A', alignItems: 'center', justifyContent: 'center', marginBottom: 22, marginTop: 14 },
  phone: { alignSelf: 'center', backgroundColor: '#111', padding: 7, marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  screen: { flex: 1, overflow: 'hidden', backgroundColor: C.soft },
  island: { position: 'absolute', alignSelf: 'center', backgroundColor: '#000', borderRadius: 20 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyTxt: { fontSize: 13, color: C.sub },
  spotWrap: { position: 'absolute', width: SPOT, height: SPOT, marginLeft: -SPOT / 2, marginTop: -SPOT / 2, alignItems: 'center', justifyContent: 'center' },
  spotRing: { position: 'absolute', width: SPOT, height: SPOT, borderRadius: SPOT / 2, borderWidth: 3, borderColor: '#FF3B30' },
  spotDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 3, borderColor: '#FF3B30', backgroundColor: 'rgba(255,59,48,0.25)' },
  title: { fontSize: 26, fontWeight: '700', color: C.ink, marginBottom: 10 },
  text: { fontSize: 18, color: C.ink, lineHeight: 27 },
  typeBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.soft, borderRadius: 14, padding: 14, marginTop: 18 },
  typeLbl: { fontSize: 13, fontWeight: '600', color: C.sub, marginBottom: 4 },
  typeVal: { fontSize: 20, fontWeight: '700', color: C.ink },
  typeCopy: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.card, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  typeCopyTxt: { color: C.primary, fontSize: 14, fontWeight: '600' },
  copy: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.primary, borderRadius: 16, paddingVertical: 16, marginTop: 22 },
  copyTxt: { color: '#fff', fontSize: 17, fontWeight: '600' },
  warn: { flexDirection: 'row', gap: 10, backgroundColor: C.red + '14', borderRadius: 16, padding: 16, marginTop: 20 },
  warnTxt: { flex: 1, color: C.red, fontSize: 16, lineHeight: 23, fontWeight: '500' },
  note: { fontSize: 15, color: C.sub, lineHeight: 22, marginTop: 18 },
  foot: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 8 },
  back: { flex: 1, borderRadius: 16, paddingVertical: 16, alignItems: 'center', backgroundColor: C.soft },
  backTxt: { color: C.ink, fontSize: 17, fontWeight: '600' },
  next: { flex: 1, borderRadius: 16, paddingVertical: 16, alignItems: 'center', backgroundColor: C.primary },
  nextTxt: { color: '#fff', fontSize: 17, fontWeight: '600' },
}));
