// "Can I afford it?" — type a price (or an installment) and get a clear yes / careful / not now,
// based on your income, monthly commitments, usual spending and savings.
import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, Modal, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../fonts';
import { C, themed, le } from '../../theme';
import { Field, Chips, Segmented, num, tap } from '../../ui';
import { t } from '../../i18n';
import { useStore, useTotals, savingValue } from '../../store';
import { oneTime, installment, typicalSpending, Money, Result } from './afford';

const MONTHS = ['3', '6', '12', '18', '24', '36'];
const LOOK = {
  yes: { icon: 'checkmark-circle', color: () => C.green },
  careful: { icon: 'alert-circle', color: () => C.orange },
  no: { icon: 'close-circle', color: () => C.red },
  unknown: { icon: 'help-circle', color: () => C.sub },
} as const;

// Money amounts inside sentences are formatted here; plain numbers (months, %) stay as they are
const fill = (vars?: Record<string, number | string>) => {
  if (!vars) return undefined;
  const out: Record<string, string | number> = {};
  for (const k in vars) out[k] = k === 'n' || k === 'a' || k === 'b' ? vars[k] : le(Number(vars[k]));
  return out;
};

export default function AffordSheet({ visible, onClose, onAddIncome }: { visible: boolean; onClose: () => void; onAddIncome: () => void }) {
  const { d } = useStore();
  const tot = useTotals();
  const [mode, setMode] = useState<'once' | 'inst'>('once');
  const [f, setF] = useState<Record<string, string>>({ months: '12' });
  const upd = (k: string) => (v: string) => setF(x => ({ ...x, [k]: v }));

  const money: Money = useMemo(() => ({
    income: tot.income,
    committed: tot.committed,
    debtMonthly: tot.instMonthly + tot.loanMonthly,
    spending: typicalSpending(d.expenses),
    leftThisMonth: tot.left,
    cash: d.savings.filter(s => ['egp', 'usd', 'eur'].includes(s.kind)).reduce((s, x) => s + savingValue(x, d.rates), 0),
  }), [d, tot.income, tot.committed, tot.left]);

  const r: Result | null = useMemo(() => {
    if (mode === 'once') return num(f.price) > 0 ? oneTime(money, num(f.price)) : null;
    return num(f.monthly) > 0 ? installment(money, num(f.monthly), num(f.months), num(f.down)) : null;
  }, [mode, f, money]);

  const look = r ? LOOK[r.verdict] : null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.head}>
          <Text style={s.title}>{t('Can I afford it?')}</Text>
          <Pressable onPress={onClose} hitSlop={10}><Text style={s.done}>{t('Done')}</Text></Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
          <Text style={s.intro}>{t('Check a purchase against your real numbers before you commit.')}</Text>

          <Segmented value={mode} onChange={k => setMode(k as any)}
            options={[{ key: 'once', label: t('Pay in full') }, { key: 'inst', label: t('On installments') }]} />
          <View style={{ height: 14 }} />

          <View style={s.card}>
            {mode === 'once' ? (
              <Field label={t('Price (L.E)')} keyboardType="numeric" placeholder="15,000" value={f.price} onChangeText={upd('price')} />
            ) : (
              <>
                <Field label={t('Monthly payment (L.E)')} keyboardType="numeric" placeholder="2,500" value={f.monthly} onChangeText={upd('monthly')} />
                <Text style={s.lbl}>{t('How many months?')}</Text>
                <Chips options={MONTHS} value={f.months ?? ''} onChange={upd('months')} translate={false} />
                <Field label={t('Down payment (L.E)')} keyboardType="numeric" placeholder="0" value={f.down} onChangeText={upd('down')}
                  hint={t('Leave empty if there is none')} />
              </>
            )}
          </View>

          {!r && (
            <View style={[s.card, s.empty]}>
              <Ionicons name="pricetag-outline" size={30} color={C.sub} />
              <Text style={s.emptyTxt}>{t(mode === 'once' ? 'Type the price to see if it fits your budget.' : 'Type the monthly payment to see if it fits your budget.')}</Text>
            </View>
          )}

          {r && r.verdict === 'unknown' && (
            <View style={[s.card, s.empty]}>
              <Ionicons name="wallet-outline" size={30} color={C.sub} />
              <Text style={s.emptyTxt}>{t('Add your income so Fakka can judge what you can afford.')}</Text>
              <Pressable onPress={() => { tap(); onClose(); onAddIncome(); }} style={s.btn}><Text style={s.btnTxt}>{t('Add income')}</Text></Pressable>
            </View>
          )}

          {r && look && r.verdict !== 'unknown' && (
            <>
              <View style={[s.card, { borderLeftWidth: 4, borderLeftColor: look.color() }]}>
                <View style={s.verdictRow}>
                  <Ionicons name={look.icon as any} size={30} color={look.color()} />
                  <Text style={[s.verdict, { color: look.color() }]}>{t(r.headline)}</Text>
                </View>
                {mode === 'inst' && r.numbers.months > 0 && (
                  <Text style={s.total}>{t('Total you would pay: {x}', { x: le(r.numbers.total) })}</Text>
                )}
                <View style={{ marginTop: 12, gap: 10 }}>
                  {r.reasons.map((x, i) => (
                    <View key={i} style={s.reason}>
                      <Ionicons name={x.good ? 'checkmark' : 'close'} size={18} color={x.good ? C.green : C.red} style={{ marginTop: 1 }} />
                      <Text style={s.reasonTxt}>{t(x.key, fill(x.vars))}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {r.tip && (
                <View style={[s.card, s.callout]}>
                  <Ionicons name="bulb-outline" size={20} color={C.accent} />
                  <Text style={s.calloutTxt}>{t(r.tip.key, fill(r.tip.vars))}</Text>
                </View>
              )}

              <Text style={s.section}>{t('Based on your numbers')}</Text>
              <View style={s.card}>
                <Line label={t('Monthly income')} value={le(money.income)} />
                <Line label={t('Monthly commitments')} value={le(money.committed)} sub={t('Installments, loans, bills and gam\'eya')} />
                <Line label={t('Usual monthly spending')} value={le(money.spending)} sub={t('Average of your recent months')} />
                <Line label={t('Cash savings')} value={le(money.cash)} sub={t('Pounds, dollars and euros')} last />
              </View>
              <Text style={s.foot}>{t('A guide, not financial advice. Gold is not counted as ready cash.')}</Text>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const Line = ({ label, value, sub, last }: { label: string; value: string; sub?: string; last?: boolean }) => (
  <View style={[s.line, !last && { borderBottomWidth: 1, borderColor: C.line }]}>
    <View style={{ flex: 1 }}>
      <Text style={s.lineLabel}>{label}</Text>
      {!!sub && <Text style={s.lineSub}>{sub}</Text>}
    </View>
    <Text style={s.lineVal}>{value}</Text>
  </View>
);

const s = themed(() => StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 22 },
  title: { fontSize: 20, fontWeight: '700', color: C.ink },
  done: { fontSize: 17, fontWeight: '600', color: C.primary },
  intro: { fontSize: 15, color: C.sub, marginBottom: 14 },
  card: { backgroundColor: C.card, borderRadius: 14, padding: 18, marginBottom: 14, shadowColor: '#0F2440', shadowOpacity: 0.04, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 1 },
  lbl: { fontSize: 14, fontWeight: '600', color: C.ink, marginBottom: 10 },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 26 },
  emptyTxt: { color: C.sub, textAlign: 'center', fontSize: 15, lineHeight: 21 },
  btn: { backgroundColor: C.primary, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10, marginTop: 4 },
  btnTxt: { color: '#fff', fontWeight: '600', fontSize: 15 },
  verdictRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  verdict: { fontSize: 20, fontWeight: '700', flex: 1 },
  total: { fontSize: 14, color: C.sub, marginTop: 8 },
  reason: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  reasonTxt: { flex: 1, fontSize: 15, color: C.ink, lineHeight: 21 },
  callout: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', backgroundColor: C.soft, shadowOpacity: 0 },
  calloutTxt: { flex: 1, fontSize: 14, color: C.ink, lineHeight: 20 },
  section: { fontSize: 17, fontWeight: '600', color: C.ink, marginTop: 10, marginBottom: 10, marginLeft: 4 },
  line: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  lineLabel: { fontSize: 15, fontWeight: '500', color: C.ink },
  lineSub: { fontSize: 12, color: C.sub, marginTop: 3 },
  lineVal: { fontSize: 16, fontWeight: '600', color: C.ink },
  foot: { fontSize: 12, color: C.sub, textAlign: 'center', marginTop: 4 },
}));
