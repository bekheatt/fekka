// Home card: "Safe to spend today". Updates by itself as expenses (and bank SMS) come in.
// To remove the feature: delete this folder and the <SafeToSpendCard /> line in screens/Dashboard.tsx.
import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../fonts';
import { C, le, themed } from '../../theme';
import { useStore, useTotals } from '../../store';
import { tap } from '../../ui';
import { t } from '../../i18n';
import { safeToSpend } from './safeToSpend';

export default function SafeToSpendCard({ onAddIncome }: { onAddIncome: () => void }) {
  const { d } = useStore();
  const tot = useTotals();
  const [open, setOpen] = useState(false);
  const todayStr = new Date().toDateString();
  const spentToday = d.expenses.filter(e => new Date(e.date).toDateString() === todayStr).reduce((s, e) => s + e.amount, 0);
  const r = safeToSpend({ income: tot.income, left: tot.left, spentToday });

  if (r.state === 'no-income') return (
    <Pressable onPress={() => { tap(); onAddIncome(); }} style={({ pressed }) => [s.card, s.row, pressed && { opacity: 0.8 }]}>
      <View style={s.icon}><Ionicons name="sunny-outline" size={18} color={C.primary} /></View>
      <View style={{ flex: 1 }}>
        <Text style={s.label}>{t('Safe to spend today')}</Text>
        <Text style={s.small}>{t('Add your income to see how much you can spend each day')}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={C.sub} />
    </Pressable>
  );

  if (r.state === 'over') return (
    <View style={[s.card, { borderColor: C.red + '55' }]}>
      <Text style={s.label}>{t('Safe to spend today')}</Text>
      <Text style={[s.big, { color: C.red }]} adjustsFontSizeToFit numberOfLines={1}>{le(0)}</Text>
      <Text style={s.small}>{t("You're {x} over this month's budget. Every pound you skip now helps.", { x: le(r.overBy) })}</Text>
    </View>
  );

  const left = Math.max(0, r.today);
  const used = r.budget > 0 ? Math.min(1, r.spentToday / r.budget) : 1;
  const color = r.today < 0 ? C.red : left < r.budget * 0.25 ? C.orange : C.green;

  return (
    <Pressable onPress={() => { tap(); setOpen(o => !o); }} style={({ pressed }) => [s.card, pressed && { opacity: 0.9 }]}
      accessibilityRole="button" accessibilityLabel={`${t('Safe to spend today')}: ${le(left)}`}>
      <View style={s.head}>
        <Text style={s.label}>{t('Safe to spend today')}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={C.sub} />
      </View>
      <View style={s.amountRow}>
        <Text style={[s.big, { color }]} adjustsFontSizeToFit numberOfLines={1}>{le(left)}</Text>
        <Text style={s.of}>{t('of {x}', { x: le(r.budget) })}</Text>
      </View>
      <View style={s.bar}><View style={[s.fill, { width: `${used * 100}%`, backgroundColor: color }]} /></View>
      <Text style={s.small}>
        {r.today < 0
          ? t('{x} over today. Tomorrow adjusts to keep the month on track.', { x: le(-r.today) })
          : r.spentToday > 0 ? t('{x} spent today', { x: le(r.spentToday) }) : t('Nothing spent today yet')}
      </Text>

      {open && (
        <View style={s.more}>
          <Line label={t('Free for the rest of the month')} value={le(Math.max(0, tot.left) + r.spentToday)} />
          <Line label={t('Days left, including today')} value={String(r.daysLeft)} />
          {r.tomorrow !== null && <Line label={t('Tomorrow, if you stop spending now')} value={t('{x} a day', { x: le(r.tomorrow) })} />}
          <Text style={s.note}>{t('Your payments for this month are already set aside.')}</Text>
        </View>
      )}
    </Pressable>
  );
}

const Line = ({ label, value }: { label: string; value: string }) => (
  <View style={s.line}>
    <Text style={s.lineLabel}>{label}</Text>
    <Text style={s.lineVal}>{value}</Text>
  </View>
);

const s = themed(() => StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: 24, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: C.line },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.soft, alignItems: 'center', justifyContent: 'center' },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: 13, color: C.sub, fontWeight: '500' },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 4 },
  big: { fontSize: 30, fontWeight: '700', flexShrink: 1 },
  of: { fontSize: 14, color: C.sub },
  bar: { height: 6, borderRadius: 3, backgroundColor: C.soft, overflow: 'hidden', marginTop: 12 },
  fill: { height: '100%', borderRadius: 3 },
  small: { fontSize: 13, color: C.sub, marginTop: 8, lineHeight: 18 },
  more: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderColor: C.line, gap: 8 },
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  lineLabel: { fontSize: 14, color: C.sub, flex: 1 },
  lineVal: { fontSize: 14, fontWeight: '600', color: C.ink },
  note: { fontSize: 12, color: C.sub, marginTop: 2 },
}));
