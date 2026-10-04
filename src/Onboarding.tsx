import React, { useRef, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, KeyboardAvoidingView, Platform, Animated, I18nManager, Alert } from 'react-native';
import { Text, TextInput } from './fonts';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { C, le, themed, PROVIDERS, LOAN_TYPES, BILL_TYPES } from './theme';
import { useStore, uid, ym, Work, Data } from './store';
import { t } from './i18n';
import { tap, num, Toggle } from './ui';
import { canUseLock } from './Lock';
import Logo from './Logo';

type Draft = {
  name: string; work?: Work; income: string; payDay: string; extraName: string; extra: string;
  inst: Record<string, { monthly: string; months: string }>;
  loans: Record<string, { monthly: string; remaining: string }>;
  bills: Record<string, string>;
  gameya: { on: boolean; monthly: string; members: string; turn: string };
  sav: Record<string, string>;
  goal: { name: string; target: string };
  lock: boolean;
};

const WORK: { key: Work; icon: any; label: string; sub: string }[] = [
  { key: 'employee', icon: 'briefcase', label: 'Employee', sub: 'Fixed monthly salary' },
  { key: 'freelancer', icon: 'laptop', label: 'Freelancer', sub: 'Income changes month to month' },
  { key: 'business', icon: 'storefront', label: 'Business owner', sub: 'Shop, company or trade' },
  { key: 'student', icon: 'school', label: 'Student', sub: 'Allowance or part-time' },
  { key: 'retired', icon: 'leaf', label: 'Retired', sub: 'Pension' },
  { key: 'other', icon: 'ellipsis-horizontal', label: 'Other', sub: 'Something else' },
];

const INCOME_Q: Record<Work, { label: string; hint: string; source: string }> = {
  employee: { label: 'Monthly salary after tax (L.E)', hint: 'What actually reaches your account', source: 'Salary' },
  freelancer: { label: 'Usual monthly income (L.E)', hint: 'Use a normal month. You can log each payment as it arrives later.', source: 'Freelance' },
  business: { label: 'What you take home each month (L.E)', hint: 'Your personal share of the profit, not the sales', source: 'Business' },
  student: { label: 'Monthly allowance (L.E)', hint: 'Pocket money, part-time job or scholarship', source: 'Allowance' },
  retired: { label: 'Monthly pension (L.E)', hint: 'Include any regular support from family', source: 'Pension' },
  other: { label: 'Monthly income (L.E)', hint: 'Roughly how much comes in every month', source: 'Income' },
};

const STEPS = ['welcome', 'name', 'work', 'income', 'installments', 'loans', 'bills', 'gameya', 'savings', 'goal', 'done'] as const;
const GOAL_IDEAS = [
  { name: 'Emergency fund', icon: 'umbrella' }, { name: 'Wedding', icon: 'heart' }, { name: 'Car', icon: 'car-sport' },
  { name: 'Umrah', icon: 'moon' }, { name: 'Travel', icon: 'airplane' }, { name: 'Home', icon: 'home' },
];

export default function Onboarding() {
  const { d, set } = useStore();
  const [step, setStep] = useState(0);
  const [x, setX] = useState<Draft>({
    name: d.settings.name, work: d.settings.work, income: '', payDay: '', extraName: '', extra: '',
    inst: {}, loans: {}, bills: {}, gameya: { on: false, monthly: '', members: '', turn: '' },
    sav: {}, goal: { name: '', target: '' }, lock: true,
  });
  const fade = useRef(new Animated.Value(1)).current;
  const key = STEPS[step];

  const move = (dir: 1 | -1) => {
    tap();
    Animated.timing(fade, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      setStep(s => Math.max(0, Math.min(STEPS.length - 1, s + dir)));
      Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    });
  };

  const setLanguage = (lang: 'en' | 'ar') => {
    if (lang === d.settings.lang) return;
    set(v => ({ ...v, settings: { ...v.settings, lang } }));
    const rtl = lang === 'ar';
    if (I18nManager.isRTL !== rtl) {
      I18nManager.allowRTL(rtl); I18nManager.forceRTL(rtl);
      setTimeout(() => Alert.alert(t('Restart needed'), t('Close Fakka and open it again to switch the layout direction.')), 300);
    }
  };

  const finish = async () => {
    const lockOk = x.lock && (await canUseLock().catch(() => false));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const w = x.work ?? 'other';
    const month = ym();
    set(v => {
      const n: Data = { ...v };
      if (num(x.income)) n.incomes = [...n.incomes, { id: uid(), source: t(INCOME_Q[w].source), monthly: num(x.income), day: num(x.payDay) || undefined }];
      if (num(x.extra)) n.incomes = [...n.incomes, { id: uid(), source: x.extraName.trim() || t('Other income'), monthly: num(x.extra) }];
      n.installments = [...n.installments, ...Object.entries(x.inst).filter(([, v2]) => num(v2.monthly)).map(([p, v2]) =>
        ({ id: uid(), provider: p, item: p, monthly: num(v2.monthly), monthsLeft: num(v2.months) || 12, dueDay: 1 }))];
      n.loans = [...n.loans, ...Object.entries(x.loans).filter(([, v2]) => num(v2.monthly)).map(([ty, v2]) =>
        ({ id: uid(), type: ty, lender: 'Bank', monthly: num(v2.monthly), remaining: num(v2.remaining), dueDay: 1 }))];
      n.bills = [...n.bills, ...Object.entries(x.bills).filter(([, a]) => num(a)).map(([cat, a]) =>
        ({ id: uid(), cat, name: '', amount: num(a), dueDay: 1 }))];
      if (x.gameya.on && num(x.gameya.monthly)) {
        const members = Math.max(2, num(x.gameya.members) || 10);
        n.gameyas = [...n.gameyas, { id: uid(), name: t("Gam'eya"), monthly: num(x.gameya.monthly), members, myTurn: Math.min(members, num(x.gameya.turn) || 1), start: month, dueDay: 1 }];
      }
      n.savings = [...n.savings, ...Object.entries(x.sav).filter(([, q]) => num(q)).map(([kind, q]) => ({ id: uid(), kind, qty: num(q) }))];
      if (num(x.goal.target)) {
        const idea = GOAL_IDEAS.find(g => t(g.name) === x.goal.name);
        n.goals = [...n.goals, { id: uid(), name: x.goal.name.trim() || t('Goal'), icon: idea?.icon ?? 'star', unit: 'egp', target: num(x.goal.target), saved: 0 }];
      }
      n.settings = { ...n.settings, name: x.name.trim(), work: w, onboarded: true, toured: false, lock: lockOk || n.settings.lock };
      return n;
    });
  };

  const optional = ['installments', 'loans', 'bills', 'gameya', 'savings', 'goal'].includes(key);
  const canNext = key === 'work' ? !!x.work : true;
  const progress = step / (STEPS.length - 1);

  // ---------- step content ----------
  const body = () => {
    switch (key) {
      case 'welcome': return (
        <View style={{ alignItems: 'center', paddingTop: 30 }}>
          <Logo size={130} animated />
          <Text style={[s.h1, { textAlign: 'center', marginTop: 26 }]}>{t('Welcome to Fakka')}</Text>
          <Text style={[s.p, { textAlign: 'center' }]}>{t("Let's set up your money in 2 minutes. Everything stays on your phone.")}</Text>
          <View style={s.langRow}>
            {(['en', 'ar'] as const).map(l => (
              <Pressable key={l} onPress={() => { tap(); setLanguage(l); }} style={[s.lang, d.settings.lang === l && s.langOn]}>
                <Text style={[s.langTxt, d.settings.lang === l && { color: '#fff' }]}>{l === 'en' ? 'English' : 'العربية'}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      );

      case 'name': return (
        <>
          <Q title={t("What should we call you?")} sub={t('Just your first name is fine')} />
          <TextInput style={s.bigInput} value={x.name} onChangeText={v => setX({ ...x, name: v })} placeholder={t('Your name')}
            placeholderTextColor={C.sub} autoFocus returnKeyType="next" onSubmitEditing={() => move(1)} />
        </>
      );

      case 'work': return (
        <>
          <Q title={t('What do you do?')} sub={t('So Fakka asks the right questions')} />
          <View style={s.workGrid}>
            {WORK.map(w => {
              const on = x.work === w.key;
              return (
                <Pressable key={w.key} onPress={() => { tap(); setX({ ...x, work: w.key }); }} style={[s.work, on && s.workOn]}>
                  <View style={[s.workIcon, on && { backgroundColor: 'rgba(255,255,255,0.18)' }]}><Ionicons name={w.icon} size={22} color={on ? '#fff' : C.accent} /></View>
                  <Text style={[s.workTxt, on && { color: '#fff' }]}>{t(w.label)}</Text>
                  <Text style={[s.workSub, on && { color: '#CCE0FF' }]}>{t(w.sub)}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      );

      case 'income': {
        const q = INCOME_Q[x.work ?? 'other'];
        return (
          <>
            <Q title={t('How much comes in?')} sub={t(q.hint)} />
            <In label={t(q.label)} value={x.income} onChange={(v: string) => setX({ ...x, income: v })} big placeholder="15,000" />
            {x.work === 'employee' && <In label={t('Which day do you get paid?')} value={x.payDay} onChange={(v: string) => setX({ ...x, payDay: v })} placeholder="25" />}
            <Text style={[s.lbl, { marginTop: 12 }]}>{t('Any other monthly income? (optional)')}</Text>
            <View style={s.pair}>
              <TextInput style={[s.input, { flex: 1.3 }]} value={x.extraName} onChangeText={v => setX({ ...x, extraName: v })} placeholder={t('e.g. Rent, side job')} placeholderTextColor={C.sub} />
              <TextInput style={[s.input, { flex: 1 }]} value={x.extra} onChangeText={v => setX({ ...x, extra: v })} placeholder="L.E" keyboardType="numeric" placeholderTextColor={C.sub} />
            </View>
          </>
        );
      }

      case 'installments': return (
        <>
          <Q title={t('Do you pay any installments?')} sub={t('Tap the apps you use, then fill in the monthly amount')} />
          <Multi options={PROVIDERS.map(p => p.name)} colors={Object.fromEntries(PROVIDERS.map(p => [p.name, p.color]))} translate={false}
            selected={Object.keys(x.inst)} onToggle={p => setX({ ...x, inst: toggle(x.inst, p, { monthly: '', months: '' }) })} />
          {Object.keys(x.inst).map(p => (
            <Sub key={p} title={p}>
              <View style={s.pair}>
                <SmallIn label={t('Monthly (L.E)')} value={x.inst[p].monthly} onChange={(v: string) => setX({ ...x, inst: { ...x.inst, [p]: { ...x.inst[p], monthly: v } } })} />
                <SmallIn label={t('Months left')} value={x.inst[p].months} onChange={(v: string) => setX({ ...x, inst: { ...x.inst, [p]: { ...x.inst[p], months: v } } })} />
              </View>
            </Sub>
          ))}
        </>
      );

      case 'loans': return (
        <>
          <Q title={t('Any bank loans?')} sub={t('Mortgage, car, personal loan or credit card')} />
          <Multi options={LOAN_TYPES.map(l => l.name)} selected={Object.keys(x.loans)}
            onToggle={l => setX({ ...x, loans: toggle(x.loans, l, { monthly: '', remaining: '' }) })} />
          {Object.keys(x.loans).map(l => (
            <Sub key={l} title={t(l)}>
              <View style={s.pair}>
                <SmallIn label={t('Monthly (L.E)')} value={x.loans[l].monthly} onChange={(v: string) => setX({ ...x, loans: { ...x.loans, [l]: { ...x.loans[l], monthly: v } } })} />
                <SmallIn label={t('Left to pay (L.E)')} value={x.loans[l].remaining} onChange={(v: string) => setX({ ...x, loans: { ...x.loans, [l]: { ...x.loans[l], remaining: v } } })} />
              </View>
            </Sub>
          ))}
        </>
      );

      case 'bills': return (
        <>
          <Q title={t('Your monthly bills')} sub={t('Tap the ones you pay and enter the usual amount')} />
          <Multi options={BILL_TYPES.map(b => b.name)} colors={Object.fromEntries(BILL_TYPES.map(b => [b.name, b.color]))}
            selected={Object.keys(x.bills)} onToggle={b => setX({ ...x, bills: toggle(x.bills, b, '') })} />
          {Object.keys(x.bills).length > 0 && (
            <View style={s.billGrid}>
              {Object.keys(x.bills).map(b => (
                <View key={b} style={{ width: '48%' }}>
                  <SmallIn label={t(b)} value={x.bills[b]} onChange={(v: string) => setX({ ...x, bills: { ...x.bills, [b]: v } })} />
                </View>
              ))}
            </View>
          )}
        </>
      );

      case 'gameya': return (
        <>
          <Q title={t("Are you in a gam'eya?")} sub={t("Fakka tracks your payments and tells you when it's your turn")} />
          <View style={s.langRow}>
            {[false, true].map(v => (
              <Pressable key={String(v)} onPress={() => { tap(); setX({ ...x, gameya: { ...x.gameya, on: v } }); }} style={[s.lang, x.gameya.on === v && s.langOn]}>
                <Text style={[s.langTxt, x.gameya.on === v && { color: '#fff' }]}>{t(v ? 'Yes' : 'No')}</Text>
              </Pressable>
            ))}
          </View>
          {x.gameya.on && (
            <View style={{ marginTop: 18 }}>
              <In label={t('Monthly share (L.E)')} value={x.gameya.monthly} onChange={(v: string) => setX({ ...x, gameya: { ...x.gameya, monthly: v } })} placeholder="2,000" />
              <View style={s.pair}>
                <SmallIn label={t('Members')} value={x.gameya.members} onChange={(v: string) => setX({ ...x, gameya: { ...x.gameya, members: v } })} />
                <SmallIn label={t('Your turn')} value={x.gameya.turn} onChange={(v: string) => setX({ ...x, gameya: { ...x.gameya, turn: v } })} />
              </View>
              <Text style={s.hint}>{t('Starting this month. You can change it later.')}</Text>
            </View>
          )}
        </>
      );

      case 'savings': return (
        <>
          <Q title={t('What have you saved?')} sub={t('Fill in only what you have — we convert it to L.E with live prices')} />
          <SavIn icon="wallet" color={C.primary} label={t('Cash / bank (L.E)')} k="egp" x={x} setX={setX} />
          <SavIn icon="diamond" color="#E0AA3E" label={t('Gold 21K (grams)')} k="gold21" x={x} setX={setX} />
          <SavIn icon="diamond-outline" color="#C9922A" label={t('Gold 24K (grams)')} k="gold24" x={x} setX={setX} />
          <SavIn icon="logo-usd" color={C.green} label={t('US Dollars')} k="usd" x={x} setX={setX} />
          <SavIn icon="logo-euro" color={C.accent} label={t('Euros')} k="eur" x={x} setX={setX} />
        </>
      );

      case 'goal': return (
        <>
          <Q title={t('Saving for something?')} sub={t('Pick one to start — you can add more later')} />
          <View style={s.multi}>
            {GOAL_IDEAS.map(g => {
              const on = x.goal.name === t(g.name);
              return (
                <Pressable key={g.name} onPress={() => { tap(); setX({ ...x, goal: { ...x.goal, name: on ? '' : t(g.name) } }); }} style={[s.chip, on && { backgroundColor: C.accent }]}>
                  <Ionicons name={g.icon as any} size={15} color={on ? '#fff' : C.accent} />
                  <Text style={[s.chipTxt, on && { color: '#fff' }]}>{t(g.name)}</Text>
                </Pressable>
              );
            })}
          </View>
          <In label={t('Goal name')} value={x.goal.name} onChange={(v: string) => setX({ ...x, goal: { ...x.goal, name: v } })} placeholder={t('e.g. Wedding, Car, Umrah')} text />
          <In label={t('Target (L.E)')} value={x.goal.target} onChange={(v: string) => setX({ ...x, goal: { ...x.goal, target: v } })} placeholder="100,000" />
        </>
      );

      case 'done': {
        const monthly = Object.values(x.inst).reduce((a, v) => a + num(v.monthly), 0) + Object.values(x.loans).reduce((a, v) => a + num(v.monthly), 0)
          + Object.values(x.bills).reduce((a, v) => a + num(v), 0) + (x.gameya.on ? num(x.gameya.monthly) : 0);
        const inc = num(x.income) + num(x.extra);
        return (
          <View style={{ alignItems: 'center', paddingTop: 20 }}>
            <View style={s.doneIcon}><Ionicons name="checkmark" size={46} color="#fff" /></View>
            <Text style={[s.h1, { textAlign: 'center', marginTop: 20 }]}>{x.name.trim() ? t("You're all set, {n}!", { n: x.name.trim().split(' ')[0] }) : t("You're all set!")}</Text>
            <Text style={[s.p, { textAlign: 'center' }]}>{t("Here's your month at a glance")}</Text>
            <View style={s.summary}>
              <SumRow label={t('Income')} value={le(inc)} color={C.green} />
              <SumRow label={t('Monthly payments')} value={le(monthly)} color={C.sky} />
              <SumRow label={t('Left for daily spending')} value={le(inc - monthly)} color={inc - monthly >= 0 ? C.ink : C.red} last />
            </View>
            <View style={[s.summary, { marginTop: 0 }]}>
              <Toggle icon="finger-print" title={t('Lock with Face ID / fingerprint')} sub={t('Locks the moment you leave the app, like a banking app')}
                value={x.lock} onChange={v => setX({ ...x, lock: v })} last />
            </View>
            <Text style={[s.hint, { textAlign: 'center' }]}>{t('Log your daily spending on the Spend tab to see where it goes.')}</Text>
          </View>
        );
      }
    }
  };

  return (
    <SafeAreaView style={s.wrap}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.top}>
          {step > 0 && key !== 'done'
            ? <Pressable onPress={() => move(-1)} hitSlop={12}><Ionicons name={I18nManager.isRTL ? 'chevron-forward' : 'chevron-back'} size={26} color={C.ink} /></Pressable>
            : <View style={{ width: 26 }} />}
          <View style={s.bar}><View style={[s.barFill, { width: `${progress * 100}%` }]} /></View>
          {optional
            ? <Pressable onPress={() => move(1)} hitSlop={12}><Text style={s.skip}>{t('Skip')}</Text></Pressable>
            : <View style={{ width: 34 }} />}
        </View>

        <Animated.View style={{ flex: 1, opacity: fade }}>
          <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
            {body()}
          </ScrollView>
        </Animated.View>

        <View style={s.footer}>
          <Pressable disabled={!canNext} onPress={() => (key === 'done' ? finish() : move(1))}
            style={({ pressed }) => [s.next, !canNext && { opacity: 0.4 }, pressed && { opacity: 0.8 }]}>
            <Text style={s.nextTxt}>{t(key === 'welcome' ? "Let's start" : key === 'done' ? 'Go to my dashboard' : 'Continue')}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ---------- helpers ----------
function toggle<T>(obj: Record<string, T>, k: string, init: T) {
  const n = { ...obj };
  if (k in n) delete n[k]; else n[k] = init;
  return n;
}

const Q = ({ title, sub }: { title: string; sub?: string }) => (
  <View style={{ marginBottom: 22 }}>
    <Text style={s.h1}>{title}</Text>
    {!!sub && <Text style={s.p}>{sub}</Text>}
  </View>
);

const In = ({ label, value, onChange, placeholder, big, text }: any) => (
  <View style={{ marginBottom: 14 }}>
    <Text style={s.lbl}>{label}</Text>
    <TextInput style={[s.input, big && s.inputBig]} value={value} onChangeText={onChange} placeholder={placeholder}
      placeholderTextColor={C.sub} keyboardType={text ? 'default' : 'numeric'} />
  </View>
);

const SmallIn = ({ label, value, onChange }: any) => (
  <View style={{ flex: 1, marginBottom: 10 }}>
    <Text style={s.smallLbl}>{label}</Text>
    <TextInput style={s.input} value={value} onChangeText={onChange} placeholder="0" placeholderTextColor={C.sub} keyboardType="numeric" />
  </View>
);

const Sub = ({ title, children }: any) => (
  <View style={s.sub}>
    <Text style={s.subTitle}>{title}</Text>
    {children}
  </View>
);

const Multi = ({ options, selected, onToggle, colors, translate = true }: { options: string[]; selected: string[]; onToggle: (k: string) => void; colors?: Record<string, string>; translate?: boolean }) => (
  <View style={s.multi}>
    {options.map(o => {
      const on = selected.includes(o);
      return (
        <Pressable key={o} onPress={() => { tap(); onToggle(o); }} style={[s.chip, on && { backgroundColor: colors?.[o] ?? C.accent }]}>
          {on && <Ionicons name="checkmark" size={15} color="#fff" />}
          <Text style={[s.chipTxt, on && { color: '#fff' }]}>{translate ? t(o) : o}</Text>
        </Pressable>
      );
    })}
  </View>
);

const SavIn = ({ icon, color, label, k, x, setX }: any) => (
  <View style={s.savRow}>
    <View style={[s.savIcon, { backgroundColor: color + '22' }]}><Ionicons name={icon} size={20} color={color} /></View>
    <Text style={s.savLbl}>{label}</Text>
    <TextInput style={[s.input, { width: 120, textAlign: 'right' }]} value={x.sav[k] ?? ''} placeholder="0" placeholderTextColor={C.sub} keyboardType="numeric"
      onChangeText={v => setX({ ...x, sav: { ...x.sav, [k]: v } })} />
  </View>
);

const SumRow = ({ label, value, color, last }: any) => (
  <View style={[s.sumRow, !last && { borderBottomWidth: 1, borderColor: C.line }]}>
    <Text style={s.sumLbl}>{label}</Text>
    <Text style={[s.sumVal, { color }]}>{value}</Text>
  </View>
);

const s = themed(() => StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  bar: { flex: 1, height: 6, borderRadius: 3, backgroundColor: C.soft, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: C.accent, borderRadius: 3 },
  skip: { color: C.sub, fontSize: 15, fontWeight: '600' },
  h1: { fontSize: 28, fontWeight: '700', color: C.ink, letterSpacing: -0.5 },
  p: { fontSize: 16, color: C.sub, marginTop: 8, lineHeight: 22 },
  langRow: { flexDirection: 'row', gap: 10, marginTop: 28, alignSelf: 'stretch' },
  lang: { flex: 1, paddingVertical: 15, borderRadius: 12, backgroundColor: C.card, alignItems: 'center' },
  langOn: { backgroundColor: C.primary },
  langTxt: { fontSize: 16, fontWeight: '700', color: C.ink },
  bigInput: { fontSize: 30, fontWeight: '700', color: C.ink, borderBottomWidth: 2, borderColor: C.accent, paddingVertical: 10 },
  workGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  work: { width: '47.5%', backgroundColor: C.card, borderRadius: 14, padding: 16, minHeight: 130 },
  workOn: { backgroundColor: C.primary },
  workIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: C.soft, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  workTxt: { fontSize: 16, fontWeight: '700', color: C.ink },
  workSub: { fontSize: 12.5, color: C.sub, marginTop: 3 },
  lbl: { fontSize: 14, fontWeight: '600', color: C.ink, marginBottom: 7 },
  smallLbl: { fontSize: 13, fontWeight: '600', color: C.sub, marginBottom: 6 },
  input: { backgroundColor: C.card, borderRadius: 10, padding: 14, fontSize: 17, color: C.ink },
  inputBig: { fontSize: 28, fontWeight: '700' },
  hint: { fontSize: 13, color: C.sub, marginTop: 6 },
  pair: { flexDirection: 'row', gap: 10 },
  multi: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 15, paddingVertical: 11, borderRadius: 10, backgroundColor: C.card },
  chipTxt: { fontWeight: '600', color: C.ink, fontSize: 15 },
  sub: { backgroundColor: C.soft, borderRadius: 12, padding: 14, paddingBottom: 4, marginBottom: 10 },
  subTitle: { fontSize: 15, fontWeight: '700', color: C.ink, marginBottom: 8 },
  billGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  savRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  savIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  savLbl: { flex: 1, fontSize: 15, fontWeight: '600', color: C.ink },
  doneIcon: { width: 90, height: 90, borderRadius: 45, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  summary: { backgroundColor: C.card, borderRadius: 14, paddingHorizontal: 16, alignSelf: 'stretch', marginTop: 24, marginBottom: 14 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15 },
  sumLbl: { fontSize: 15, color: C.sub },
  sumVal: { fontSize: 16, fontWeight: '700' },
  footer: { padding: 20, paddingTop: 10 },
  next: { backgroundColor: C.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  nextTxt: { color: '#fff', fontSize: 17, fontWeight: '600' },
}));
