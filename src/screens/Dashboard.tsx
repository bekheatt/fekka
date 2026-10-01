import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from '../fonts';
import { Ionicons } from '@expo/vector-icons';
import { C, le, leShort, EXPENSE_CATS, themed, isHidden } from '../theme';
import { useStore, useTotals, daysUntil, goalValue, ym } from '../store';
import { Card, Row, Section, Screen, tap, Progress, Check } from '../ui';
import { t, locale } from '../i18n';
import Logo from '../Logo';
import HealthCard from '../features/HealthScore/HealthCard';
import AffordSheet from '../features/Afford/AffordSheet';

type Go = (tab: string, action?: string) => void;

export const dueLabel = (day: number) => {
  const n = daysUntil(day);
  return n === 0 ? t('due today') : n === 1 ? t('due tomorrow') : t('due in {n} days', { n });
};

export default function Dashboard({ go }: { go: Go }) {
  const { d, set, togglePaid } = useStore();
  const [afford, setAfford] = useState(false);
  const tot = useTotals();
  const hour = new Date().getHours();
  const hello = t(hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening');
  const first = d.settings.name.trim().split(' ')[0];
  const dateStr = new Date().toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' });

  const isNew = d.incomes.length + d.expenses.length + d.installments.length + d.loans.length + d.savings.length + d.bills.length + d.goals.length + d.gameyas.length === 0;

  const upcoming = tot.unpaid.slice(0, 3);

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
        <View style={{ flex: 1 }}>
          <Text style={s.hello}>{hello}{first ? `, ${first}` : ''}</Text>
          <Text style={s.date}>{dateStr}</Text>
        </View>
        <Pressable onPress={() => { tap(); set(x => ({ ...x, settings: { ...x.settings, hideAmounts: !x.settings.hideAmounts } })); }} hitSlop={10} style={s.eye}>
          <Ionicons name={isHidden() ? 'eye-off' : 'eye'} size={20} color={C.primary} />
        </Pressable>
        <Logo size={52} />
      </View>

      <HealthCard onAddIncome={() => go('spend', 'income')} />

      <Pressable onPress={() => { tap(); setAfford(true); }} style={({ pressed }) => [s.afford, pressed && { opacity: 0.7 }]}>
        <View style={s.affordIcon}><Ionicons name="pricetag" size={20} color={C.accent} /></View>
        <View style={{ flex: 1 }}>
          <Text style={s.affordTitle}>{t('Can I afford it?')}</Text>
          <Text style={s.affordSub}>{t('Check a purchase or installment before you commit')}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={C.sub} />
      </Pressable>
      <AffordSheet visible={afford} onClose={() => setAfford(false)} onAddIncome={() => go('spend', 'income')} />

      <View style={s.hero}>
        <Text style={s.heroLabel}>{t("What you're worth")}</Text>
        <Text style={s.heroVal} adjustsFontSizeToFit numberOfLines={1}>{le(tot.netWorth)}</Text>
        <Text style={s.heroExplain}>{t('Everything you own minus everything you owe')}</Text>
        <View style={s.heroRow}>
          <View style={s.heroPill}>
            <Ionicons name="arrow-up-circle" size={18} color={C.green} />
            <View><Text style={s.pillLabel}>{t('You own')}</Text><Text style={s.pillVal}>{leShort(tot.assets)}</Text></View>
          </View>
          <View style={s.heroPill}>
            <Ionicons name="arrow-down-circle" size={18} color={C.red} />
            <View><Text style={s.pillLabel}>{t('You owe')}</Text><Text style={s.pillVal}>{leShort(tot.debt)}</Text></View>
          </View>
        </View>
      </View>

      <View style={s.quick}>
        <Quick icon="remove-circle" label={t('Expense')} color={C.orange} onPress={() => go('spend', 'expense')} />
        <Quick icon="add-circle" label={t('Income')} color={C.green} onPress={() => go('spend', 'income')} />
        <Quick icon="calendar" label={t('Payment')} color={C.sky} onPress={() => go('pay', 'installment')} />
        <Quick icon="flag" label={t('Goal')} color={C.accent} onPress={() => go('save', 'goal')} />
      </View>

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
          <Card style={{ padding: 18 }}>
            <Text style={s.leftLabel}>{t(tot.left >= 0 ? 'You still have' : "You're over budget by")}</Text>
            <Text style={[s.leftVal, { color: tot.left >= 0 ? C.ink : C.red }]}>{le(Math.abs(tot.left))}</Text>
            <Text style={s.leftSub}>{t('out of {x} income', { x: le(tot.income) })}</Text>
            <View style={s.stack}>
              {segs.filter(x => x.v > 0).map(x => <View key={x.label} style={{ flex: x.v / base, backgroundColor: x.c }} />)}
            </View>
            <View style={s.legend}>
              {segs.map(x => (
                <View key={x.label} style={s.legendItem}>
                  <View style={[s.dot, { backgroundColor: x.c }]} />
                  <View>
                    <Text style={s.legendLabel}>{t(x.label)}</Text>
                    <Text style={s.legendVal}>{le(x.v)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>

          <Section action={tot.due.length ? t('See all') : undefined} onAction={() => go('pay')}>{t('Next payments')}</Section>
          <Card>
            {tot.due.length === 0
              ? <Text style={s.none}>{t('No payments added yet')}</Text>
              : upcoming.length === 0
                ? <Text style={s.none}>{t('All paid this month')}</Text>
                : upcoming.map((u, i) => (
                  <Row key={u.id} icon={u.icon} color={u.color} title={u.name}
                    left={<Check on={u.paid} onPress={() => togglePaid(u.kind, u.id)} />} onPress={() => go('pay', `edit:${u.kind}:${u.id}`)}
                    sub={`${u.by} · ${dueLabel(u.day)}`}
                    value={le(u.amount)} valueColor={daysUntil(u.day) <= 3 ? C.orange : undefined} last={i === upcoming.length - 1} />
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

const Quick = ({ icon, label, color, onPress }: any) => (
  <Pressable style={({ pressed }) => [s.qItem, pressed && { opacity: 0.6, transform: [{ scale: 0.96 }] }]} onPress={() => { tap(); onPress(); }}>
    <View style={[s.qIcon, { backgroundColor: color + '1F' }]}><Ionicons name={icon} size={24} color={color} /></View>
    <Text style={s.qTxt}>{label}</Text>
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
  afford: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: 14, padding: 14, marginTop: 12 },
  affordIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: C.accent + '1F', alignItems: 'center', justifyContent: 'center' },
  affordTitle: { fontSize: 16, fontWeight: '600', color: C.ink },
  affordSub: { fontSize: 13, color: C.sub, marginTop: 2 },
  top: { marginTop: 10, marginBottom: 16, flexDirection: 'row', alignItems: 'center' },
  eye: { width: 40, height: 40, borderRadius: 14, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  hello: { fontSize: 24, fontWeight: '700', color: C.ink, letterSpacing: -0.3 },
  date: { fontSize: 15, color: C.sub, marginTop: 3 },
  hero: { backgroundColor: C.hero, borderRadius: 14, padding: 22 },
  heroLabel: { color: '#CCE0FF', fontSize: 15, fontWeight: '500' },
  heroVal: { color: '#fff', fontSize: 34, fontWeight: '700', letterSpacing: -0.6, marginTop: 6 },
  heroExplain: { color: '#CCE0FF', opacity: 0.8, fontSize: 13, marginTop: 4 },
  heroRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  heroPill: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 12 },
  pillLabel: { color: '#CCE0FF', fontSize: 12 },
  pillVal: { color: '#fff', fontSize: 15, fontWeight: '600', marginTop: 2 },
  quick: { flexDirection: 'row', backgroundColor: C.card, borderRadius: 14, paddingVertical: 16, marginTop: 14 },
  qItem: { flex: 1, alignItems: 'center' },
  qIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  qTxt: { fontSize: 13, fontWeight: '500', color: C.ink, marginTop: 8 },
  leftLabel: { color: C.sub, fontSize: 15 },
  leftVal: { fontSize: 30, fontWeight: '700', letterSpacing: -0.4, marginTop: 4 },
  leftSub: { color: C.sub, fontSize: 14, marginTop: 2 },
  stack: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', backgroundColor: C.soft, marginTop: 16, gap: 2 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 14 },
  legendItem: { width: '50%', flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 13, color: C.sub },
  legendVal: { fontSize: 15, fontWeight: '600', color: C.ink },
  none: { color: C.sub, textAlign: 'center', paddingVertical: 20, fontSize: 15 },
  catHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  catName: { fontSize: 15, fontWeight: '500', color: C.ink },
  catVal: { fontSize: 15, fontWeight: '600', color: C.ink },
  step: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16 },
  stepN: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.primary + '1F', alignItems: 'center', justifyContent: 'center' },
  stepNTxt: { color: C.primary, fontWeight: '800', fontSize: 16 },
  stepTitle: { fontSize: 16, fontWeight: '600', color: C.ink },
  stepSub: { fontSize: 13, color: C.sub, marginTop: 2 },
}));
