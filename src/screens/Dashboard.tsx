import React, { useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Text } from '../fonts';
import { Ionicons } from '@expo/vector-icons';
import { C, le, leShort, EXPENSE_CATS, themed, isHidden } from '../theme';
import { useStore, useTotals, daysUntil, daysLate, goalValue, ym } from '../store';
import { Card, Row, Section, Screen, tap, Progress, Check, SplitBar, Empty, pressedStyle } from '../ui';
import { t, locale } from '../i18n';
import Logo from '../Logo';
import HealthCard from '../features/HealthScore/HealthCard';
import AffordSheet from '../features/Afford/AffordSheet';
import { tourRef } from '../features/Tour/Tour';

type Go = (tab: string, action?: string) => void;

// For unpaid payments: late if its day has passed this month, otherwise how soon it's due
export const dueLabel = (day: number) => {
  const late = daysLate(day);
  if (late > 0) return late === 1 ? t('1 day late') : t('{n} days late', { n: late });
  const n = daysUntil(day);
  return n === 0 ? t('due today') : n === 1 ? t('due tomorrow') : t('due in {n} days', { n });
};

export default function Dashboard({ go }: { go: Go }) {
  const { d, set, togglePaid } = useStore();
  const [afford, setAfford] = useState(false);
  const tot = useTotals();
  const first = d.settings.name.trim().split(' ')[0];
  // Top line: the month at a glance
  const today = new Date();
  const monthName = today.toLocaleDateString(locale(), { month: 'long' });
  const daysLeft = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - today.getDate();

  const isNew = d.incomes.length + d.expenses.length + d.installments.length + d.loans.length + d.savings.length + d.bills.length + d.goals.length + d.gameyas.length === 0;

  const upcoming = tot.unpaid.slice(0, 3);
  const lateCount = tot.unpaid.filter(u => daysLate(u.day) > 0).length;
  const glance = [
    daysLeft === 0 ? t('Last day') : daysLeft === 1 ? t('1 day left') : t('{n} days left', { n: daysLeft }),
    tot.due.length === 0 ? null : tot.unpaid.length === 0 ? t('All paid')
      : lateCount > 0 ? t('{n} due, {k} late', { n: tot.unpaid.length, k: lateCount }) : t('{n} due', { n: tot.unpaid.length }),
  ].filter(Boolean).join(' · ');

  const base = Math.max(tot.income, tot.committed + tot.spent, 1);
  const segs = [
    { label: 'Installments', v: tot.instMonthly + tot.loanMonthly, c: C.sky },
    { label: 'Bills', v: tot.billsMonthly + tot.gameyaMonthly, c: '#8E6FE0' },
    { label: 'Spent', v: tot.spent, c: C.orange },
    { label: 'Left', v: Math.max(0, tot.left), c: C.green },
  ];

  const m = ym();
  const cats = EXPENSE_CATS.map(c => ({ ...c, v: d.expenses.filter(e => ym(new Date(e.date)) === m && e.cat === c.name).reduce((s, e) => s + e.amount, 0) }))
    .filter(c => c.v > 0).sort((a, b) => b.v - a.v).slice(0, 4);
  const catMax = Math.max(1, ...cats.map(c => c.v));

  return (
    <Screen>
      <View style={s.top}>
        <Logo size={40} />
        <View style={{ flex: 1 }}>
          <Text style={s.hello} numberOfLines={1}>{monthName}</Text>
          <Text style={s.date} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>{glance}</Text>
        </View>
        <Pressable onPress={() => { tap(); set(x => ({ ...x, settings: { ...x.settings, hideAmounts: !x.settings.hideAmounts } })); }} hitSlop={10} style={s.eye} ref={tourRef('eye')} collapsable={false}
          accessibilityRole="button" accessibilityLabel={t(isHidden() ? 'Show amounts' : 'Hide amounts')}>
          <Ionicons name={isHidden() ? 'eye-off-outline' : 'eye-outline'} size={20} color={C.primary} />
        </Pressable>
        <Pressable onPress={() => { tap(); go('profile'); }} hitSlop={6} style={s.avatar} ref={tourRef('avatar')} collapsable={false} accessibilityRole="button" accessibilityLabel={t('Profile')}>
          {first ? <Text style={s.avatarTxt}>{first[0].toUpperCase()}</Text> : <Ionicons name="person" size={18} color="#fff" />}
        </Pressable>
      </View>

      <AffordSheet visible={afford} onClose={() => setAfford(false)} onAddIncome={() => go('spend', 'income')} />

      {/* Net worth as the headline, no box */}
      <View style={n.worth} ref={tourRef('worth')} collapsable={false}>
        <Text style={n.worthLabel}>{t("What you're worth")}</Text>
        <Text style={n.worthVal} adjustsFontSizeToFit numberOfLines={1}>{le(tot.netWorth)}</Text>
        <View style={n.stats}>
          <Ionicons name="arrow-up" size={14} color={C.green} />
          <Text style={n.statLabel}>{t('You own')}</Text>
          <Text style={n.statVal}>{leShort(tot.assets)}</Text>
          <View style={n.divider} />
          <Ionicons name="arrow-down" size={14} color={C.red} />
          <Text style={n.statLabel}>{t('You owe')}</Text>
          <Text style={n.statVal}>{leShort(tot.debt)}</Text>
        </View>
      </View>

      <View ref={tourRef('quick')} collapsable={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={n.pills}>
          <Pill icon="remove" label={t('Expense')} primary onPress={() => go('spend', 'expense')} />
          <Pill icon="add" label={t('Income')} onPress={() => go('spend', 'income')} />
          <Pill icon="calendar-outline" label={t('Payment')} onPress={() => go('pay', 'installment')} />
          <Pill icon="pricetag-outline" label={t('Afford?')} onPress={() => setAfford(true)} />
        </ScrollView>
      </View>

      <View ref={tourRef('health')} collapsable={false}><HealthCard onAddIncome={() => go('spend', 'income')} /></View>

      {isNew ? (
        <>
          <Section>{t('Get started')}</Section>
          <Card>
            <Step n={1} title={t('Add your salary')} sub={t('So Fakka knows your monthly budget')} onPress={() => go('spend', 'income')} />
            <Step n={2} title={t('Add installments & bills')} sub={t('valU, Souhoola, electricity, internet…')} onPress={() => go('pay')} />
            <Step n={3} title={t('Set a savings goal')} sub={t('Wedding, car, Sahel summer…')} onPress={() => go('save', 'goal')} last />
          </Card>
        </>
      ) : (
        <>
          <Section>{t('This month')}</Section>
          <Card style={{ padding: 20 }}>
            <Text style={s.leftLabel}>{t(tot.left >= 0 ? 'You still have' : "You're over budget by")}</Text>
            <View style={s.leftRow}>
              <Text style={[s.leftVal, { color: tot.left >= 0 ? C.ink : C.red }]}>{le(Math.abs(tot.left))}</Text>
              <Text style={s.leftSub}>{t('of {x}', { x: le(tot.income) })}</Text>
            </View>
            <View style={{ marginTop: 16 }}><SplitBar parts={segs.map(x => ({ v: x.v, c: x.c }))} /></View>
            <View style={s.legend}>
              {segs.map(x => (
                <View key={x.label} style={s.legendItem}>
                  <View style={[s.dot, { backgroundColor: x.c }]} />
                  <Text style={s.legendLabel}>{t(x.label === 'Installments' ? 'Payments' : x.label)}</Text>
                  <Text style={s.legendVal}>{le(x.v)}</Text>
                </View>
              ))}
            </View>
          </Card>

          <Section action={tot.due.length ? t('See all') : undefined} onAction={() => go('pay')}>{t('Coming up')}</Section>
          <Card>
            {tot.due.length === 0
              ? <Empty icon="calendar-outline" text={t('No payments added yet')} button={t('Add a payment')} onPress={() => go('pay')} />
              : upcoming.length === 0
                ? <Text style={s.none}>{t('All paid this month')}</Text>
                : upcoming.map((u, i) => (
                  <Row key={u.id} icon={u.icon} color={u.color} title={u.name}
                    left={<Check on={u.paid} onPress={() => togglePaid(u.kind, u.id)} />} onPress={() => go('pay', `edit:${u.kind}:${u.id}`)}
                    sub={`${u.by} · ${dueLabel(u.day)}`}
                    value={le(u.amount)} valueColor={daysLate(u.day) > 0 ? C.red : daysUntil(u.day) <= 3 ? C.orange : undefined} last={i === upcoming.length - 1} />
                ))}
          </Card>

          {d.goals.length > 0 && <>
            <Section action={t('See all')} onAction={() => go('save')}>{t('Your goals')}</Section>
            <Card style={{ padding: 16, gap: 14 }}>
              {d.goals.slice(0, 3).map(g => {
                const p = g.target ? Math.min(1, g.saved / g.target) : 0;
                return (
                  <Pressable key={g.id} onPress={() => { tap(); go('save', `goal:${g.id}`); }}>
                    <View style={s.catHead}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Ionicons name={g.icon as any} size={16} color={C.accent} />
                        <Text style={s.catName}>{g.name}</Text>
                      </View>
                      <Text style={s.catVal}>{Math.round(p * 100)}%</Text>
                    </View>
                    <Progress value={p} color={p >= 1 ? C.green : C.accent} />
                  </Pressable>
                );
              })}
            </Card>
          </>}

          {cats.length > 0 && <>
            <Section action={t('Details')} onAction={() => go('spend')}>{t('Where your money went')}</Section>
            <Card style={{ padding: 16 }}>
              {cats.map(c => (
                <View key={c.name} style={{ marginVertical: 7 }}>
                  <View style={s.catHead}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name={c.icon as any} size={16} color={c.color} />
                      <Text style={s.catName}>{t(c.name)}</Text>
                    </View>
                    <Text style={s.catVal}>{le(c.v)}</Text>
                  </View>
                  <Progress value={c.v / catMax} color={c.color} />
                </View>
              ))}
            </Card>
          </>}
        </>
      )}
    </Screen>
  );
}

// Quick actions as pills; the first one is the main action
const Pill = ({ icon, label, primary, onPress }: { icon: any; label: string; primary?: boolean; onPress: () => void }) => (
  <Pressable onPress={() => { tap(); onPress(); }} style={({ pressed }) => [n.pill, primary && n.pillPrimary, pressed && pressedStyle]}>
    <Ionicons name={icon} size={16} color={primary ? '#fff' : C.ink} />
    <Text style={[n.pillTxt, primary && { color: '#fff' }]}>{label}</Text>
  </Pressable>
);

const Step = ({ n, title, sub, onPress, last }: any) => (
  <Pressable style={[s.step, !last && { borderBottomWidth: 1, borderColor: C.line }]} onPress={() => { tap(); onPress(); }}>
    <View style={s.stepN}><Text style={s.stepNTxt}>{n}</Text></View>
    <View style={{ flex: 1 }}>
      <Text style={s.stepTitle}>{title}</Text>
      <Text style={s.stepSub}>{sub}</Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color={C.sub} />
  </Pressable>
);

const s = themed(() => StyleSheet.create({
  top: { marginTop: 10, marginBottom: 18, flexDirection: 'row', alignItems: 'center', gap: 10 },
  eye: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#14294A', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: '#fff', fontSize: 17, fontWeight: '700' },
  hello: { fontSize: 24, fontWeight: '700', color: C.ink, letterSpacing: -0.4 },
  date: { fontSize: 13, color: C.sub, fontWeight: '500', marginTop: 3 },
  leftLabel: { color: C.sub, fontSize: 13, fontWeight: '500' },
  leftRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  leftVal: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  leftSub: { color: C.sub, fontSize: 14, fontWeight: '500' },
  legend: { marginTop: 14, gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { flex: 1, fontSize: 13, color: C.sub, fontWeight: '500' },
  legendVal: { fontSize: 13, fontWeight: '600', color: C.ink },
  none: { color: C.sub, textAlign: 'center', paddingVertical: 20, fontSize: 15 },
  catHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  catName: { fontSize: 15, fontWeight: '500', color: C.ink },
  catVal: { fontSize: 15, fontWeight: '600', color: C.ink },
  step: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16 },
  stepN: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.primary + '1F', alignItems: 'center', justifyContent: 'center' },
  stepNTxt: { color: C.primary, fontWeight: '700', fontSize: 16 },
  stepTitle: { fontSize: 16, fontWeight: '600', color: C.ink },
  stepSub: { fontSize: 13, color: C.sub, marginTop: 2 },
}));

// Home's top section
const n = themed(() => StyleSheet.create({
  worth: { marginTop: 4, paddingVertical: 6 },
  worthLabel: { fontSize: 13, color: C.sub, fontWeight: '500' },
  worthVal: { fontSize: 46, fontWeight: '600', color: C.ink, marginTop: 2 },
  stats: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 },
  statLabel: { fontSize: 13, color: C.sub },
  statVal: { fontSize: 14, fontWeight: '600', color: C.ink },
  divider: { width: 1, height: 14, backgroundColor: C.line, marginHorizontal: 9 },
  pills: { gap: 8, paddingVertical: 16, paddingRight: 8 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 999 },
  pillPrimary: { backgroundColor: C.primary, borderColor: C.primary },
  pillTxt: { fontSize: 14, fontWeight: '500', color: C.ink },
}));
