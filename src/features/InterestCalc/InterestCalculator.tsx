// Interest calculator: what does financing something really cost, in plain words
import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, Modal, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text } from '../../fonts';
import { Ionicons } from '@expo/vector-icons';
import { C, themed } from '../../theme';
import { Field, Chips, Segmented, num, tap } from '../../ui';
import { t, getLang } from '../../i18n';
import { calculate, RateKind } from './math';

// Calculator numbers are never masked by "hide amounts": they're what-ifs, not your balances
const money = (n: number) => (getLang() === 'ar' ? 'ج.م ' : 'L.E ') + Math.round(n).toLocaleString('en-US');
const pct = (n: number) => `${n.toFixed(n >= 10 ? 0 : 1)}%`;
const MONTHS = ['6', '12', '18', '24', '36', '48', '60'];

export default function InterestCalculator({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<'monthly' | 'rate'>('monthly');
  const [kind, setKind] = useState<RateKind>('flat');
  const [f, setF] = useState<Record<string, string>>({ months: '12' });
  const [all, setAll] = useState(false);
  const upd = (k: string) => (v: string) => setF(x => ({ ...x, [k]: v }));

  const r = useMemo(() => calculate({
    price: num(f.price), down: num(f.down), months: num(f.months), fees: num(f.fees),
    ...(mode === 'monthly' ? { monthly: num(f.monthly) } : { rate: f.rate?.trim() ? num(f.rate) : undefined, kind }),
  }), [f, mode, kind]);

  const shown = r ? (all ? r.schedule : r.schedule.slice(0, 6)) : [];
  const first = r?.schedule[0], last = r?.schedule[r.schedule.length - 1];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.head}>
          <Text style={s.title}>{t('Interest calculator')}</Text>
          <Pressable onPress={onClose} hitSlop={10}><Text style={s.done}>{t('Done')}</Text></Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
          <Text style={s.intro}>{t('See what financing something really costs before you sign.')}</Text>

          <View style={s.card}>
            <Field label={t('Price (L.E)')} keyboardType="numeric" placeholder="30,000" value={f.price} onChangeText={upd('price')} />
            <Field label={t('Down payment (L.E)')} keyboardType="numeric" placeholder="0" value={f.down} onChangeText={upd('down')} />
            <Text style={s.lbl}>{t('How many months?')}</Text>
            <Chips options={MONTHS} value={f.months ?? ''} onChange={upd('months')} translate={false} />
            <Field label={t('Or type the number of months')} keyboardType="numeric" placeholder="12" value={f.months} onChangeText={upd('months')} />

            <Text style={s.lbl}>{t('What do you know?')}</Text>
            <Segmented value={mode} onChange={k => { tap(); setMode(k as any); }}
              options={[{ key: 'monthly', label: t('Monthly payment') }, { key: 'rate', label: t('Interest rate') }]} />
            <View style={{ height: 12 }} />
            {mode === 'monthly'
              ? <Field label={t('Monthly payment (L.E)')} keyboardType="numeric" placeholder="2,875" value={f.monthly} onChangeText={upd('monthly')}
                  hint={t("From the shop, app or bank offer — e.g. valU, Souhoola, a car dealer")} />
              : <>
                  <Field label={t('Yearly interest rate (%)')} keyboardType="numeric" placeholder="18" value={f.rate} onChangeText={upd('rate')} />
                  <Segmented value={kind} onChange={k => { tap(); setKind(k as RateKind); }}
                    options={[{ key: 'flat', label: t('Flat rate') }, { key: 'reducing', label: t('Reducing rate') }]} />
                  <Text style={s.hint}>{t(kind === 'flat'
                    ? 'Flat: interest on the full amount for the whole time. Most car and personal loans in Egypt are quoted this way. Ask the bank if unsure.'
                    : 'Reducing: interest only on what you still owe. Usually called "declining balance".')}</Text>
                </>}
            <Field label={t('One-time fees (L.E) — optional')} keyboardType="numeric" placeholder="0" value={f.fees} onChangeText={upd('fees')}
              hint={t('Admin fees, insurance or anything paid once at the start')} />
          </View>

          {!r ? (
            <View style={[s.card, s.empty]}>
              <Ionicons name="calculator-outline" size={28} color={C.sub} />
              <Text style={s.emptyTxt}>{t('Fill in the price, months and the monthly payment or rate to see the real cost.')}</Text>
            </View>
          ) : <>
            <View style={s.card}>
              <Text style={s.kicker}>{t('You pay on top of the price')}</Text>
              <Text style={[s.big, { color: r.interest > 0.5 ? C.orange : C.green }]}>{money(r.interest)}</Text>
              <Text style={s.sentence}>{r.interest > 0.5
                ? t("That's {p} more than the price. You pay {total} for something that costs {price}.", { p: pct(r.extraPct), total: money(r.totalPaid), price: money(num(f.price)) })
                : t('No interest — you pay exactly the price. A true 0% offer.')}</Text>

              {r.interest > 0.5 && <>
                <View style={s.bar}>
                  <View style={{ flex: num(f.price), backgroundColor: C.accent }} />
                  <View style={{ flex: r.interest, backgroundColor: C.orange }} />
                </View>
                <View style={s.legend}>
                  <Dot c={C.accent} label={t('Price')} v={money(num(f.price))} />
                  <Dot c={C.orange} label={t('Interest & fees')} v={money(r.interest)} />
                </View>
              </>}
            </View>

            <View style={s.card}>
              <Line label={t('Monthly payment')} v={money(r.monthly)} />
              <Line label={t('Total you pay')} v={money(r.totalPaid)} sub={t('Down payment + all monthly payments + fees')} />
              <Line label={t('Real yearly interest rate')} v={pct(r.realRate)} strong last
                sub={t('Use this to compare offers. It counts fees and assumes interest only on what you still owe.')} />
            </View>

            {r.interest > 0.5 && (
              <View style={[s.card, s.callout]}>
                <Ionicons name="bulb-outline" size={20} color={C.accent} />
                <Text style={s.calloutTxt}>
                  {mode === 'rate' && kind === 'flat'
                    ? t('A {f} flat rate works like {r} on a normal loan, because you keep paying interest on money you already paid back.', { f: pct(num(f.rate)), r: pct(r.realRate) })
                    : t('This offer works like a loan at {r} a year.', { r: pct(r.realRate) })}
                  {first && last && r.schedule.length > 1 ? ' ' + t('Interest takes {a} of your first payment, but only {b} of your last.', { a: money(first.interest), b: money(last.interest) }) : ''}
                </Text>
              </View>
            )}

            {r.interestOnly > 0.5 && <>
              <Text style={s.section}>{t('Month by month')}</Text>
              <View style={s.card}>
                <View style={[s.row, s.rowHead]}>
                  <Text style={[s.cell, s.cMonth, s.th]}>{t('Month')}</Text>
                  <Text style={[s.cell, s.th]}>{t('Interest')}</Text>
                  <Text style={[s.cell, s.th]}>{t('Pays off')}</Text>
                  <Text style={[s.cell, s.th]}>{t('Still owed')}</Text>
                </View>
                {shown.map(x => (
                  <View key={x.month} style={s.row}>
                    <Text style={[s.cell, s.cMonth]}>{x.month}</Text>
                    <Text style={[s.cell, { color: C.orange }]}>{Math.round(x.interest).toLocaleString('en-US')}</Text>
                    <Text style={s.cell}>{Math.round(x.principal).toLocaleString('en-US')}</Text>
                    <Text style={[s.cell, { color: C.sub }]}>{Math.round(x.balance).toLocaleString('en-US')}</Text>
                  </View>
                ))}
                {r.schedule.length > 6 && (
                  <Pressable onPress={() => { tap(); setAll(a => !a); }} style={s.more}>
                    <Text style={s.moreTxt}>{t(all ? 'Show less' : 'Show all {n} months', { n: r.schedule.length })}</Text>
                  </Pressable>
                )}
              </View>
            </>}
          </>}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const Dot = ({ c, label, v }: { c: string; label: string; v: string }) => (
  <View style={s.legendItem}>
    <View style={[s.dot, { backgroundColor: c }]} />
    <View><Text style={s.legendLabel}>{label}</Text><Text style={s.legendVal}>{v}</Text></View>
  </View>
);

const Line = ({ label, v, sub, strong, last }: { label: string; v: string; sub?: string; strong?: boolean; last?: boolean }) => (
  <View style={[s.line, !last && { borderBottomWidth: 1, borderColor: C.line }]}>
    <View style={{ flex: 1, paddingRight: 12 }}>
      <Text style={s.lineLabel}>{label}</Text>
      {!!sub && <Text style={s.lineSub}>{sub}</Text>}
    </View>
    <Text style={[s.lineVal, strong && { color: C.accent }]}>{v}</Text>
  </View>
);

const s = themed(() => StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 22 },
  title: { fontSize: 20, fontWeight: '700', color: C.ink },
  done: { fontSize: 17, fontWeight: '600', color: C.primary },
  intro: { fontSize: 15, color: C.sub, marginBottom: 14 },
  card: { backgroundColor: C.card, borderRadius: 14, padding: 18, marginBottom: 14, shadowColor: '#0F2440', shadowOpacity: 0.04, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 1 },
  lbl: { fontSize: 14, fontWeight: '600', color: C.ink, marginBottom: 10 },
  hint: { fontSize: 13, color: C.sub, marginTop: -2, marginBottom: 16, lineHeight: 18 },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 26 },
  emptyTxt: { color: C.sub, textAlign: 'center', fontSize: 15, lineHeight: 21 },
  kicker: { fontSize: 14, color: C.sub },
  big: { fontSize: 34, fontWeight: '700', letterSpacing: -0.5, marginTop: 4 },
  sentence: { fontSize: 15, color: C.ink, marginTop: 6, lineHeight: 21 },
  bar: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', marginTop: 16, gap: 2 },
  legend: { flexDirection: 'row', marginTop: 12 },
  legendItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 13, color: C.sub },
  legendVal: { fontSize: 15, fontWeight: '600', color: C.ink },
  line: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  lineLabel: { fontSize: 15, fontWeight: '500', color: C.ink },
  lineSub: { fontSize: 12, color: C.sub, marginTop: 3, lineHeight: 16 },
  lineVal: { fontSize: 17, fontWeight: '600', color: C.ink },
  callout: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', backgroundColor: C.soft, shadowOpacity: 0 },
  calloutTxt: { flex: 1, fontSize: 14, color: C.ink, lineHeight: 20 },
  section: { fontSize: 17, fontWeight: '600', color: C.ink, marginTop: 10, marginBottom: 10, marginLeft: 4 },
  row: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderColor: C.line },
  rowHead: { paddingTop: 0 },
  cell: { flex: 1, fontSize: 14, color: C.ink, textAlign: 'right', fontVariant: ['tabular-nums'] },
  cMonth: { flex: 0.6, textAlign: 'left', color: C.sub },
  th: { fontSize: 12, color: C.sub, fontWeight: '600' },
  more: { alignItems: 'center', paddingTop: 12 },
  moreTxt: { color: C.accent, fontWeight: '600', fontSize: 15 },
}));
