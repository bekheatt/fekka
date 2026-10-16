// Full-screen guide for setting up automatic logging with Fakka's own Shortcuts action ("Log Bank SMS").
// Intro → one step per screen (real screenshot inside an iPhone, dimmed, with the thing to tap lifted out
// of it) → a live test that waits for the person's test message and removes it again.
import { useEffect, useRef, useState } from 'react';
import { Modal, View, Pressable, StyleSheet, Image, Animated, Easing, useWindowDimensions, I18nManager, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Text } from '../../fonts';
import { C, themed } from '../../theme';
import { tap, pressedStyle } from '../../ui';
import { t } from '../../i18n';
import { APP_NAME } from '../../brand';
import { loadInbox, clearInbox } from '../../cloud/supabase';
import { SHOTS, SHOT_RATIO, SHORTCUTS_ICON, ShotKey } from './guideShots';
import { inboxPause } from './inboxPause';

// A box on the screenshot (0–1 of its width / height) that gets lifted out
type Mark = { x: number; y: number; w: number; h: number };
// **text** = the exact words on the iPhone screen; type = words to type (chip with Copy)
type Step = { shot: ShotKey; marks: Mark[]; text: string; hint?: string; type?: string };

const STEPS: Step[] = [
  { shot: 'automation', marks: [{ x: 0.386, y: 0.913, w: 0.229, h: 0.059 }, { x: 0.275, y: 0.597, w: 0.449, h: 0.061 }],
    text: 'Open **Automation**, then tap **New Automation**', hint: 'Already have automations? Tap **+** at the top' },
  { shot: 'message', marks: [{ x: 0.048, y: 0.782, w: 0.903, h: 0.079 }], text: 'Tap **Message**', hint: 'Scroll down a little to find it' },
  { shot: 'choose', marks: [{ x: 0.048, y: 0.307, w: 0.903, h: 0.064 }], text: 'Tap **Choose** next to Message Contains' },
  { shot: 'contains', marks: [{ x: 0.114, y: 0.205, w: 0.773, h: 0.289 }], text: 'Type **EGP**, then tap **Done**', type: 'EGP',
    hint: 'Your bank writes جم? Make a second automation the same way with جم' },
  { shot: 'when', marks: [{ x: 0.048, y: 0.41, w: 0.903, h: 0.127 }, { x: 0.773, y: 0.076, w: 0.179, h: 0.049 }],
    text: 'Keep **Run Immediately** ticked, then tap **Next**' },
  { shot: 'blank', marks: [{ x: 0.04, y: 0.294, w: 0.419, h: 0.136 }], text: 'Tap **Create New Shortcut**' },
  { shot: 'search', marks: [{ x: 0.048, y: 0.381, w: 0.903, h: 0.057 }], text: 'Search **Fakka**, then tap **Log Bank SMS**', type: 'Fakka' },
  { shot: 'input', marks: [{ x: 0.268, y: 0.254, w: 0.249, h: 0.042 }, { x: 0.338, y: 0.547, w: 0.43, h: 0.047 }],
    text: 'Tap **Message**, then **Shortcut Input**' },
  { shot: 'saved', marks: [{ x: 0.04, y: 0.23, w: 0.92, h: 0.104 }, { x: 0.845, y: 0.076, w: 0.106, h: 0.049 }],
    text: 'Check it says **Shortcut Input**, then tap **✓**' },
];

const TEST_SMS = 'Card purchase 58 EGP at ORACLE IRELAND';
const isTest = (tx: { amount: number; party: string | null }) => tx.amount === 58 && /oracle/i.test(tx.party ?? '');

const bold = (s: string, style: any) => s.split('**').map((p, i) => (i % 2 ? <Text key={i} style={[style, s_.b]}>{p}</Text> : p));
const fwd = () => (I18nManager.isRTL ? 'chevron-back' : 'chevron-forward');
const back = () => (I18nManager.isRTL ? 'chevron-forward' : 'chevron-back');

export default function ShortcutGuide({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  // -1 = intro, 0..n-1 = steps, n = test
  const [i, setI] = useState(-1);
  const fade = useRef(new Animated.Value(1)).current;
  useEffect(() => { if (visible) setI(-1); }, [visible]);

  const go = (to: number) => {
    tap();
    Animated.timing(fade, { toValue: 0, duration: 110, useNativeDriver: true }).start(() => {
      setI(to);
      Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };
  const close = () => { tap(); onClose(); };
  const testing = i === STEPS.length;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={s.wrap}>
        <LinearGradient colors={[C.primary + '22', C.bg, C.bg]} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          <View style={s.top}>
            <Pressable onPress={i === -1 ? close : () => go(i - 1)} hitSlop={12} accessibilityRole="button" accessibilityLabel={t(i === -1 ? 'Close' : 'Back')}>
              <Ionicons name={i === -1 ? 'close' : back()} size={26} color={C.ink} />
            </Pressable>
            {i >= 0 && !testing && <Pressable onPress={close} hitSlop={12}><Text style={s.topTxt}>{t('Close')}</Text></Pressable>}
          </View>
          <Animated.View style={{ flex: 1, opacity: fade }}>
            {i === -1 ? <Intro onStart={() => go(0)} />
              : testing ? <Test active={visible && testing} onDone={onClose} onSteps={() => go(0)} />
              : <StepView key={i} step={STEPS[i]} n={i} onNext={() => go(i + 1)} />}
          </Animated.View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

// ---------- intro ----------
function Intro({ onStart }: { onStart: () => void }) {
  const ripple = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(ripple, { toValue: 1, duration: 2400, easing: Easing.out(Easing.quad), useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, []);
  const ring = (delay: number) => {
    const v = Animated.modulo(Animated.add(ripple, delay), 1);
    return { opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }), transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] }) }] };
  };
  return (
    <View style={{ flex: 1, paddingHorizontal: 28 }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={s.h1}>{t('Log bank messages automatically')}</Text>
        <Text style={s.lead}>{t('A one-time setup in Apple’s Shortcuts app. After that, every bank SMS goes into {app} by itself.', { app: APP_NAME })}</Text>
        <View style={s.iconWrap}>
          <Animated.View style={[s.ripple, ring(0)]} />
          <Animated.View style={[s.ripple, ring(0.5)]} />
          <Image source={SHORTCUTS_ICON} style={s.icon} />
        </View>
        <Pressable onPress={() => { tap(); Linking.openURL('shortcuts://').catch(() => {}); }} style={({ pressed }) => [s.openBtn, pressed && pressedStyle]} accessibilityRole="button">
          <Text style={s.openTxt}>{t('Open Shortcuts')}</Text>
          <Ionicons name="open-outline" size={15} color="#fff" />
        </Pressable>
        <Text style={s.small}>{t('We’ll show you every tap. It takes about 2 minutes.')}</Text>
      </View>
      <Pressable onPress={onStart} style={({ pressed }) => [s.primary, pressed && pressedStyle]} accessibilityRole="button">
        <Text style={s.primaryTxt}>{t('Show me how')}</Text>
        <Ionicons name={fwd()} size={18} color="#fff" />
      </Pressable>
    </View>
  );
}

// ---------- one step ----------
function StepView({ step, n, onNext }: { step: Step; n: number; onNext: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Phone shot={step.shot} marks={step.marks} />
      </View>
      <View style={s.say}>
        <Text style={s.line}>{bold(t(step.text), s.line)}</Text>
        {!!step.hint && <Text style={s.hint}>{bold(t(step.hint), s.hint)}</Text>}
        {!!step.type && (
          <Pressable onPress={() => { tap(); Clipboard.setStringAsync(step.type!); setCopied(true); }} style={({ pressed }) => [s.chip, pressed && pressedStyle]} accessibilityRole="button">
            <Text style={s.chipTxt}>{step.type}</Text>
            <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={15} color={C.primary} />
          </Pressable>
        )}
      </View>
      <View style={s.nextRow}><RingNext progress={(n + 1) / (STEPS.length + 1)} onPress={onNext} /></View>
    </View>
  );
}

// The screenshot inside an iPhone, dimmed, with each mark lifted out a little bigger with a shadow
const BEZEL = 6;
function Phone({ shot, marks }: { shot: ShotKey; marks: Mark[] }) {
  const { height } = useWindowDimensions();
  const h = Math.min(500, height * 0.5) - BEZEL * 2;
  const w = h * SHOT_RATIO;
  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.spring(pop, { toValue: 1, delay: 150, friction: 6, tension: 80, useNativeDriver: true }).start(); }, []);
  const src = SHOTS[shot];
  return (
    // ltr: the screenshot isn't mirrored in Arabic, so neither are the marks on it
    <View style={{ width: w + BEZEL * 2, height: h + BEZEL * 2, direction: 'ltr' }}>
      <View style={[s.phone, { borderRadius: w * 0.16 }]}>
        <View style={{ flex: 1, borderRadius: w * 0.16 - BEZEL, overflow: 'hidden' }}>
          <Image source={src} style={{ width: w, height: h }} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(16,20,38,0.42)' }]} />
        </View>
      </View>
      <View style={[s.island, { width: w * 0.3, height: w * 0.085, top: BEZEL + w * 0.03, left: BEZEL + w * 0.35 }]} />
      {marks.map((m, k) => {
        const mw = m.w * w, mh = m.h * h;
        const grow = Math.min(1.45, Math.max(1.1, 1 + 18 / mw));
        const r = Math.min(14, mh / 2);
        return (
          <Animated.View key={k} pointerEvents="none" style={[s.lift, { left: BEZEL + m.x * w, top: BEZEL + m.y * h, width: mw, height: mh, borderRadius: r,
            transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [1, grow] }) }] }]}>
            <View style={{ flex: 1, borderRadius: r, overflow: 'hidden' }}>
              <Image source={src} style={{ position: 'absolute', width: w, height: h, left: -m.x * w, top: -m.y * h }} />
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}

// Round Next button; the ring around it shows how far along the setup is
function RingNext({ progress, onPress }: { progress: number; onPress: () => void }) {
  const size = 68, sw = 3, r = (size - sw) / 2, c = 2 * Math.PI * r;
  return (
    <Pressable onPress={onPress} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('Next')} style={({ pressed }) => [{ width: size, height: size }, pressed && pressedStyle]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={C.line} strokeWidth={sw} fill={C.card} />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={C.primary} strokeWidth={sw} fill="none" strokeLinecap="round"
          strokeDasharray={`${c} ${c}`} strokeDashoffset={c * (1 - progress)} rotation={-90} origin={`${size / 2}, ${size / 2}`} />
      </Svg>
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        <Ionicons name={fwd()} size={24} color={C.ink} />
      </View>
    </Pressable>
  );
}

// ---------- live test ----------
function Test({ active, onDone, onSteps }: { active: boolean; onDone: () => void; onSteps: () => void }) {
  const [state, setState] = useState<'wait' | 'ok'>('wait');
  const [slow, setSlow] = useState(false);
  const [copied, setCopied] = useState(false);
  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) return;
    inboxPause.on = true;
    const since = Date.now() - 2 * 60 * 1000; // a little slack for the phone's clock
    let stop = false;
    const look = async () => {
      try {
        const rows = (await loadInbox()).filter(r => Date.parse(r.received_at) >= since);
        if (stop || !rows.length) return;
        stop = true;
        await clearInbox(rows.filter(r => isTest(r.tx)).map(r => r.id)).catch(() => {}); // the test isn't real spending
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        setState('ok');
        Animated.spring(pop, { toValue: 1, friction: 5, useNativeDriver: true }).start();
      } catch { /* offline: try again */ }
    };
    const timer = setInterval(look, 3000);
    const slowTimer = setTimeout(() => setSlow(true), 45000);
    return () => { stop = true; clearInterval(timer); clearTimeout(slowTimer); inboxPause.on = false; };
  }, [active]);

  if (state === 'ok') return (
    <View style={{ flex: 1, paddingHorizontal: 28 }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={[s.okCircle, { transform: [{ scale: pop }] }]}><Ionicons name="checkmark" size={46} color="#fff" /></Animated.View>
        <Text style={[s.h1, { marginTop: 26 }]}>{t('It works!')}</Text>
        <Text style={s.lead}>{t('{app} will now add your bank messages by itself. We removed the test message so it doesn’t count as spending.', { app: APP_NAME })}</Text>
      </View>
      <Pressable onPress={() => { tap(); onDone(); }} style={({ pressed }) => [s.primary, pressed && pressedStyle]} accessibilityRole="button">
        <Text style={s.primaryTxt}>{t('Done')}</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={{ flex: 1, paddingHorizontal: 28 }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={s.testIcon}><Ionicons name="chatbubble-ellipses" size={34} color={C.primary} /></View>
        <Text style={s.h1}>{t('Send yourself a test')}</Text>
        <Text style={s.lead}>{t('Send this as an iMessage to your own number. {app} should catch it in a few seconds.', { app: APP_NAME })}</Text>
        <Pressable onPress={() => { tap(); Clipboard.setStringAsync(TEST_SMS); setCopied(true); }} style={({ pressed }) => [s.chip, { marginTop: 18 }, pressed && pressedStyle]} accessibilityRole="button">
          <Text style={[s.chipTxt, { fontSize: 15 }]}>{TEST_SMS}</Text>
          <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={15} color={C.primary} />
        </Pressable>
        <Pressable onPress={() => { tap(); Linking.openURL(`sms:&body=${encodeURIComponent(TEST_SMS)}`).catch(() => {}); }} style={({ pressed }) => [s.openBtn, { marginTop: 18 }, pressed && pressedStyle]} accessibilityRole="button">
          <Text style={s.openTxt}>{t('Open Messages')}</Text>
          <Ionicons name="open-outline" size={15} color="#fff" />
        </Pressable>
        <View style={s.waitRow}>
          <ActivityIndicator color={C.sub} />
          <Text style={s.waitTxt}>{t('Waiting for your test message…')}</Text>
        </View>
        {slow && (
          <View style={s.slow}>
            <Text style={s.slowTxt}>{bold(t('Nothing yet? Open the automation in Shortcuts and check it says **Log Shortcut Input in Fakka** and that **Run Immediately** is on.'), s.slowTxt)}</Text>
            <Pressable onPress={onSteps} hitSlop={8}><Text style={s.link}>{t('Show the steps again')}</Text></Pressable>
          </View>
        )}
      </View>
      <Pressable onPress={() => { tap(); onDone(); }} hitSlop={8} style={{ alignSelf: 'center', paddingVertical: 14 }}>
        <Text style={s.skip}>{t('Skip the test')}</Text>
      </Pressable>
    </View>
  );
}

const s_ = StyleSheet.create({ b: { fontWeight: '700' } });
const s = themed(() => StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, minHeight: 50 },
  topTxt: { fontSize: 15, color: C.sub, fontWeight: '500' },
  h1: { fontSize: 26, fontWeight: '700', color: C.ink, textAlign: 'center', letterSpacing: -0.4 },
  lead: { fontSize: 16, color: C.sub, textAlign: 'center', lineHeight: 23, marginTop: 10 },
  small: { fontSize: 13, color: C.sub, textAlign: 'center', marginTop: 14 },
  iconWrap: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center', marginTop: 44, marginBottom: 40 },
  ripple: { position: 'absolute', width: 96, height: 96, borderRadius: 48, borderWidth: 1.5, borderColor: C.primary },
  icon: { width: 76, height: 76, borderRadius: 18 },
  openBtn: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: C.ink, borderRadius: 22, paddingHorizontal: 20, paddingVertical: 11 },
  openTxt: { color: C.card, fontSize: 15, fontWeight: '600' },
  primary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.primary, borderRadius: 16, paddingVertical: 17, marginBottom: 6 },
  primaryTxt: { color: '#fff', fontSize: 17, fontWeight: '600' },
  phone: { flex: 1, backgroundColor: '#1D1E22', padding: BEZEL, shadowColor: '#000', shadowOpacity: 0.16, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
  island: { position: 'absolute', backgroundColor: '#000', borderRadius: 20 },
  lift: { position: 'absolute', backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 12 },
  say: { paddingHorizontal: 28, alignItems: 'center', minHeight: 110, paddingTop: 22 },
  line: { fontSize: 18, color: C.ink, textAlign: 'center', lineHeight: 26 },
  hint: { fontSize: 14, color: C.sub, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9, marginTop: 12 },
  chipTxt: { fontSize: 17, fontWeight: '700', color: C.ink },
  nextRow: { alignItems: 'center', paddingBottom: 14, paddingTop: 6 },
  testIcon: { width: 76, height: 76, borderRadius: 38, backgroundColor: C.primary + '1A', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  waitRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 34 },
  waitTxt: { fontSize: 15, color: C.sub },
  slow: { backgroundColor: C.card, borderRadius: 14, padding: 14, marginTop: 22, alignSelf: 'stretch', gap: 8 },
  slowTxt: { fontSize: 14, color: C.ink, lineHeight: 20 },
  link: { color: C.primary, fontSize: 15, fontWeight: '600' },
  skip: { color: C.sub, fontSize: 15, fontWeight: '500' },
  okCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
}));
