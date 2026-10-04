// First-run tour of the app: dims the screen, spotlights one thing at a time and explains it.
// Screens mark what can be spotlighted with ref={tourRef('id')} (plus collapsable={false} on Android).
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Text } from '../../fonts';
import { C, themed } from '../../theme';
import { t } from '../../i18n';
import { APP_NAME } from '../../brand';
import { tap, pressedStyle } from '../../ui';

const targets: Record<string, View | null> = {};
export const tourRef = (id: string) => (r: View | null) => { targets[id] = r; };

type Step = { target?: string; title: string; body: string };
const STEPS: Step[] = [
  { title: 'Welcome to {app}', body: "Here's a 30-second tour of how everything works. You can skip it any time." },
  { target: 'health', title: 'Your money score', body: 'One number for how healthy your money is. Tap it to see what is pulling it down and how to raise it.' },
  { target: 'worth', title: "What you're worth", body: 'Everything you own (cash, gold, dollars) minus everything you owe (installments and loans).' },
  { target: 'quick', title: 'Quick actions', body: 'Add an expense, income or payment. Not sure about a purchase? Tap Afford? before you buy.' },
  { target: 'add', title: 'The + button', body: 'Log a spend in two taps from any screen. You can add a receipt photo too.' },
  { target: 'tab-spend', title: 'Spend', body: 'Your income and spending. You can also import your bank messages here.' },
  { target: 'tab-pay', title: 'Pay', body: "Installments, loans, bills and gam'eya. {app} reminds you before each one is due." },
  { target: 'tab-save', title: 'Save', body: 'Gold, dollars and savings goals, with live prices.' },
  { target: 'eye', title: 'Hide amounts', body: 'Tap the eye to hide every number when someone is looking at your screen.' },
  { target: 'avatar', title: 'Profile & settings', body: 'Language, dark mode, Face ID lock and payment reminders. You can replay this tour from Settings.' },
  { title: "You're all set", body: 'Start by adding your salary. Everything else builds on it.' },
];

type Box = { x: number; y: number; w: number; h: number };
const PAD = 6;

export default function Tour({ visible, onDone }: { visible: boolean; onDone: () => void }) {
  const [i, setI] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const [cardH, setCardH] = useState(0);
  const dir = useRef(1);
  const fade = useRef(new Animated.Value(0)).current;
  const { width: W, height: H } = useWindowDimensions();

  useEffect(() => { if (visible) { dir.current = 1; setI(0); } }, [visible]);

  // Find the spotlighted element; skip steps whose element isn't on screen (e.g. a hidden card)
  useEffect(() => {
    if (!visible) return;
    fade.setValue(0);
    const show = () => Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    const skip = () => {
      const next = i + dir.current;
      if (next < 0) { dir.current = 1; setI(0); } else if (next >= STEPS.length) onDone(); else setI(next);
    };
    const step = STEPS[i];
    if (!step.target) { setBox(null); show(); return; }
    const el = targets[step.target];
    if (!el) return skip();
    const id = setTimeout(() => el.measureInWindow((x, y, w, h) => {
      if (!w || !h || y < 0 || y + h > H - 10) return skip();
      setBox({ x: x - PAD, y: y - PAD, w: w + PAD * 2, h: h + PAD * 2 });
      show();
    }), 60);
    return () => clearTimeout(id);
  }, [i, visible]);

  if (!visible) return null;
  const step = STEPS[i];
  const last = i === STEPS.length - 1;
  const go = (d: number) => { tap(); dir.current = d; if (last && d > 0) onDone(); else setI(Math.max(0, i + d)); };

  // Card goes below the spotlight when there's room, otherwise above it
  const below = box ? box.y + box.h + 14 + cardH < H - 30 : false;
  const cardPos = !box ? { top: Math.max(80, (H - cardH) / 2) }
    : below ? { top: box.y + box.h + 14 } : { top: Math.max(40, box.y - 14 - cardH) };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* dim everything except the spotlight */}
      {box ? (
        <>
          <View style={[s.dim, { top: 0, left: 0, right: 0, height: Math.max(0, box.y) }]} />
          <View style={[s.dim, { top: box.y + box.h, left: 0, right: 0, bottom: 0 }]} />
          <View style={[s.dim, { top: box.y, left: 0, width: Math.max(0, box.x), height: box.h }]} />
          <View style={[s.dim, { top: box.y, left: box.x + box.w, right: 0, height: box.h }]} />
          <Animated.View pointerEvents="none" style={[s.ring, { left: box.x, top: box.y, width: box.w, height: box.h, opacity: fade }]} />
        </>
      ) : <View style={[s.dim, StyleSheet.absoluteFill]} />}

      <Animated.View onLayout={e => setCardH(e.nativeEvent.layout.height)}
        style={[s.card, { left: 20, width: W - 40 }, cardPos, { opacity: fade, transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [below || !box ? 8 : -8, 0] }) }] }]}>
        <View style={s.dots}>
          {STEPS.map((_, k) => <View key={k} style={[s.dot, k === i && s.dotOn]} />)}
        </View>
        <Text style={s.title}>{t(step.title, { app: APP_NAME })}</Text>
        <Text style={s.body}>{t(step.body, { app: APP_NAME })}</Text>
        <View style={s.row}>
          {!last ? <Pressable onPress={() => { tap(); onDone(); }} hitSlop={10}><Text style={s.skip}>{t('Skip tour')}</Text></Pressable> : <View />}
          <View style={s.btns}>
            {i > 0 && !last && (
              <Pressable onPress={() => go(-1)} style={({ pressed }) => [s.back, pressed && pressedStyle]}><Text style={s.backTxt}>{t('Back')}</Text></Pressable>
            )}
            <Pressable onPress={() => go(1)} style={({ pressed }) => [s.next, pressed && pressedStyle]}>
              <Text style={s.nextTxt}>{t(last ? "Let's go" : i === 0 ? 'Start tour' : 'Next')}</Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const s = themed(() => StyleSheet.create({
  dim: { position: 'absolute', backgroundColor: 'rgba(5,15,30,0.62)' },
  ring: { position: 'absolute', borderRadius: 18, borderWidth: 2, borderColor: '#fff' },
  card: { position: 'absolute', backgroundColor: C.card, borderRadius: 24, padding: 20,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 12 },
  dots: { flexDirection: 'row', gap: 5, marginBottom: 14 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.line },
  dotOn: { width: 18, backgroundColor: C.primary },
  title: { fontSize: 19, fontWeight: '700', color: C.ink },
  body: { fontSize: 15, color: C.sub, lineHeight: 22, marginTop: 6 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 },
  skip: { fontSize: 15, color: C.sub },
  btns: { flexDirection: 'row', gap: 8 },
  back: { paddingHorizontal: 16, paddingVertical: 11, borderRadius: 12, backgroundColor: C.soft },
  backTxt: { fontSize: 15, fontWeight: '600', color: C.ink },
  next: { paddingHorizontal: 20, paddingVertical: 11, borderRadius: 12, backgroundColor: C.primary },
  nextTxt: { fontSize: 15, fontWeight: '600', color: '#fff' },
}));
