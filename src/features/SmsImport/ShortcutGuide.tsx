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
// shot = screenshot shown in the phone; spots = where to tap on it, in order (0–1 from the left / top of the
// screenshot; two or more are numbered); type = words to type (box with a Copy button); link = Copy link button.
type Spot = { x: number; y: number };
type Step = { title: string; text: string; shot?: ShotKey; spots?: Spot[]; type?: string; link?: boolean; note?: string; warn?: string };
const STEPS: Step[] = [
  { title: 'Copy your personal link', text: 'Tap the button below. You will paste this link into Shortcuts later.', link: true,
    note: 'Keep this link private: anyone with it can add transactions to your account.' },
  { title: 'Open Shortcuts', shot: 'home', spots: [{ x: 0.843, y: 0.572 }], text: 'Go to your home screen and open the **Shortcuts** app. It comes with every iPhone.',
    note: 'Can\'t find it? Download "Shortcuts" free from the App Store.' },
  { title: 'Make a new automation', shot: 'automation', spots: [{ x: 0.501, y: 0.94 }, { x: 0.5, y: 0.628 }],
    text: 'Tap **Automation** at the bottom (1). Then tap **New Automation** (2).',
    note: 'Already have automations? Tap **+** at the top right instead.' },
  { title: 'Choose Message', shot: 'message', spots: [{ x: 0.3, y: 0.821 }], text: 'Scroll down the list and tap **Message**.' },
  { title: 'Pick bank messages', shot: 'when', spots: [{ x: 0.86, y: 0.339 }], text: 'Tap **Message Contains**, type the word below, then tap **Done**.', type: 'EGP',
    note: '**Your bank writes جم instead of EGP?** Make a second automation the same way and type **جم** here.' },
  { title: 'Let it run by itself', shot: 'when', spots: [{ x: 0.87, y: 0.505 }, { x: 0.862, y: 0.1 }],
    text: 'Tap **Run Immediately** (1). Then tap **Next** at the top right (2).',
    note: 'If you see **Notify When Run**, turn it off.' },
  { title: 'Start from blank', shot: 'blank', spots: [{ x: 0.25, y: 0.363 }], text: 'Tap **Create New Shortcut**.',
    note: 'On some iPhones it says **New Blank Automation**.' },
  { title: 'Add the web action', shot: 'search', spots: [{ x: 0.39, y: 0.315 }], text: 'In the search box, type the words below. Then tap **Get Contents of URL**.', type: 'Get Contents of URL',
    note: "Don't see a search box? Tap **Add Action** first." },
  { title: 'Paste your link', shot: 'paste', spots: [{ x: 0.24, y: 0.314 }], text: 'Tap the blue word **URL**. Tap it once more and choose **Paste**.', link: true,
    note: 'Nothing to paste? Tap Copy link above, then go back to Shortcuts.' },
  { title: 'Change GET to POST', shot: 'options', spots: [{ x: 0.463, y: 0.314 }, { x: 0.864, y: 0.373 }],
    text: 'Tap the small blue arrow next to your link (1). Then tap **Method** and choose **POST** (2).' },
  { title: 'Add a field', shot: 'options', spots: [{ x: 0.864, y: 0.473 }, { x: 0.31, y: 0.525 }],
    text: 'Check that **Request Body** says **JSON** (1). Then tap **Add new field** (2).' },
  { title: 'Choose Text', shot: 'fieldtype', spots: [{ x: 0.293, y: 0.32 }], text: 'In the menu, tap **Text**.' },
  { title: 'Name the field "text"', shot: 'key', spots: [{ x: 0.211, y: 0.479 }], text: 'Tap the grey word **Key** and type the word below, in small letters.', type: 'text' },
  { title: 'Connect the message', shot: 'input', spots: [{ x: 0.477, y: 0.479 }, { x: 0.616, y: 0.6 }],
    text: 'Tap the grey word **Text** next to it (1). Then tap **Shortcut Input** above the keyboard (2).',
    warn: "Don't skip this. The field must say **text**, and next to it the blue **Shortcut Input**." },
  { title: 'Save it', shot: 'input', spots: [{ x: 0.897, y: 0.1 }], text: "Tap the blue **✓** at the top right. That's it!" },
  { title: 'Try it', shot: 'try', spots: [{ x: 0.622, y: 0.37 }], text: 'Send yourself an iMessage with the words below. Then open {app}: tap **Keep** to add it.', type: 'Card purchase 58 EGP at ORACLE IRELAND',
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
          {step.shot ? <Phone shot={step.shot} spots={step.spots} /> : (
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

// An iPhone drawn around the step's screenshot, with a pulsing circle on each spot to tap (numbered when there are several)
const SHOT_RATIO = 828 / 1792; // the screenshots' width / height, so the tap spots land exactly
const BEZEL = 7;
function Phone({ shot, spots = [] }: { shot: ShotKey; spots?: Spot[] }) {
  const { height } = useWindowDimensions();
  const h = Math.min(460, Math.max(300, height * 0.46));
  const w = (h - BEZEL * 2) * SHOT_RATIO + BEZEL * 2;
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    pulse.setValue(0);
    const loop = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 1300, easing: Easing.out(Easing.quad), useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [shot]);
  const ring = { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0] }), transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.8] }) }] };

  return (
    <View style={[s.phone, { width: w, height: h, borderRadius: w * 0.17 }]}>
      <View style={[s.screen, { borderRadius: w * 0.14 }]}>
        <Image source={SHOTS[shot]} style={StyleSheet.absoluteFill} resizeMode="cover" />
        {spots.map((p, n) => (
          // left is mirrored by React Native in Arabic, but the screenshot isn't, so flip it back
          <View key={n} pointerEvents="none" style={[s.spotWrap, { left: `${(I18nManager.isRTL ? 1 - p.x : p.x) * 100}%`, top: `${p.y * 100}%` }]}>
            <Animated.View style={[s.spotRing, ring]} />
            <View style={[s.spotDot, spots.length > 1 && s.spotNum]}>
              {spots.length > 1 && <Text style={s.spotNumTxt}>{n + 1}</Text>}
            </View>
          </View>
        ))}
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
  phone: { alignSelf: 'center', backgroundColor: '#111', padding: BEZEL, marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  screen: { flex: 1, overflow: 'hidden', backgroundColor: C.soft },
  island: { position: 'absolute', alignSelf: 'center', backgroundColor: '#000', borderRadius: 20 },
  spotWrap: { position: 'absolute', width: SPOT, height: SPOT, marginLeft: -SPOT / 2, marginTop: -SPOT / 2, alignItems: 'center', justifyContent: 'center' },
  spotRing: { position: 'absolute', width: SPOT, height: SPOT, borderRadius: SPOT / 2, borderWidth: 3, borderColor: '#FF3B30' },
  spotDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 3, borderColor: '#FF3B30', backgroundColor: 'rgba(255,59,48,0.25)' },
  spotNum: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: '#fff', backgroundColor: '#FF3B30', alignItems: 'center', justifyContent: 'center' },
  spotNumTxt: { color: '#fff', fontSize: 14, fontWeight: '800' },
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
