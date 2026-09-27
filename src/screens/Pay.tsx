import React, { useEffect, useState } from 'react';
import { View, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Text } from '../fonts';
import { Ionicons } from '@expo/vector-icons';
import { C, le, leShort, PROVIDERS, LOAN_TYPES, BILL_TYPES, themed } from '../theme';
import { useStore, useTotals, uid, gameyaStatus, ym, daysUntil, isPropertyLoan, propertyOwned } from '../store';
import { Header, Section, Card, Row, Empty, Sheet, Field, Chips, num, tap, Screen, Hint, Check, Progress } from '../ui';
import { t } from '../i18n';
import { dueLabel } from './Dashboard';
import InterestCalculator from '../features/InterestCalc/InterestCalculator';

type Mode = 'inst' | 'loan' | 'bill' | 'gameya' | null;
const HOME_NICKNAMES = ['Primary home', 'Sahel chalet', 'Rental apartment', 'Family house'];

export default function Pay({ action, clear }: { action?: string; clear: () => void }) {
  const { d, set, togglePaid } = useStore();
  const tot = useTotals();
  const [mode, setMode] = useState<Mode>(null);
  const [f, setF] = useState<any>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [calc, setCalc] = useState(false);
  const colors = Object.fromEntries(PROVIDERS.map(p => [p.name, p.color]));
  const upd = (k: string) => (v: string) => setF((x: any) => ({ ...x, [k]: v }));

  const open = (m: Mode) => {
    setEditId(null);
    setF(m === 'inst' ? { provider: 'valU' } : m === 'loan' ? { type: 'Mortgage' } : m === 'bill' ? { cat: 'Electricity' } : m === 'gameya' ? { start: ym() } : {});
    setMode(m);
  };

  const edit = (kind: string, id: string) => {
    const S = (n: number) => String(n);
    if (kind === 'inst') { const i = d.installments.find(y => y.id === id); if (!i) return; setF({ provider: i.provider, item: i.item, monthly: S(i.monthly), months: S(i.monthsLeft), day: S(i.dueDay) }); setMode('inst'); }
    if (kind === 'loan') { const l = d.loans.find(y => y.id === id); if (!l) return; setF({ type: l.type, lender: l.lender, monthly: S(l.monthly), remaining: S(l.remaining), day: S(l.dueDay), name: l.name ?? '', price: l.price ? S(l.price) : '', paid: l.paid ? S(l.paid) : '' }); setMode('loan'); }
    if (kind === 'bill') { const b = d.bills.find(y => y.id === id); if (!b) return; setF({ cat: b.cat, name: b.name, amount: S(b.amount), day: S(b.dueDay) }); setMode('bill'); }
    if (kind === 'gameya') { const g = d.gameyas.find(y => y.id === id); if (!g) return; setF({ name: g.name, monthly: S(g.monthly), members: S(g.members), turn: S(g.myTurn), start: g.start, day: S(g.dueDay) }); setMode('gameya'); }
    setEditId(id);
  };

  useEffect(() => {
    if (action?.startsWith('edit:')) { const [, k, id] = action.split(':'); edit(k, id); }
    if (action === 'installment') open('inst');
    if (action === 'gameya') open('gameya');
    if (action === 'calc') setCalc(true);
    if (action) clear();
  }, [action]);

  const day = () => Math.min(31, Math.max(1, num(f.day) || 1));
  // Mortgages also save the nickname, apartment price and amount paid. If "still owe" is left empty, it's price − paid.
  const isMortgage = f.type === 'Mortgage';
  const loanExtras = () => {
    if (!isMortgage) return { remaining: num(f.remaining), name: undefined, price: undefined, paid: undefined };
    const price = num(f.price), paid = num(f.paid);
    const remaining = f.remaining?.trim() ? num(f.remaining) : Math.max(0, price - paid);
    return { remaining, name: f.name?.trim() || undefined, price: price || undefined, paid: price ? paid : undefined };
  };
  const save = () => {
    if (editId) {
      const members = Math.max(2, num(f.members) || 10);
      set(x => ({
        ...x,
        installments: x.installments.map(i => i.id !== editId ? i : { ...i, provider: f.provider, item: f.item || i.item, monthly: num(f.monthly), monthsLeft: num(f.months), dueDay: day() }),
        loans: x.loans.map(l => l.id !== editId ? l : { ...l, type: f.type, lender: f.lender || l.lender, monthly: num(f.monthly), dueDay: day(), ...loanExtras() }),
        bills: x.bills.map(b => b.id !== editId ? b : { ...b, cat: f.cat, name: f.name?.trim() || '', amount: num(f.amount), dueDay: day() }),
        gameyas: x.gameyas.map(g => g.id !== editId ? g : { ...g, name: f.name?.trim() || g.name, monthly: num(f.monthly), members, myTurn: Math.min(members, Math.max(1, num(f.turn) || 1)), start: /^\d{4}-\d{2}$/.test(f.start ?? '') ? f.start : g.start, dueDay: day() }),
      }));
      setMode(null); setEditId(null);
      return;
    }
    if (mode === 'inst') set(x => ({ ...x, installments: [...x.installments, { id: uid(), provider: f.provider, item: f.item || 'Purchase', monthly: num(f.monthly), monthsLeft: num(f.months) || 1, dueDay: day() }] }));
    if (mode === 'loan') set(x => ({ ...x, loans: [...x.loans, { id: uid(), type: f.type, lender: f.lender || 'Bank', monthly: num(f.monthly), dueDay: day(), ...loanExtras() }] }));
    if (mode === 'bill') set(x => ({ ...x, bills: [...x.bills, { id: uid(), cat: f.cat, name: f.name?.trim() || '', amount: num(f.amount), dueDay: day() }] }));
    if (mode === 'gameya') {
      const members = Math.max(2, num(f.members) || 10);
      set(x => ({ ...x, gameyas: [...x.gameyas, { id: uid(), name: f.name?.trim() || t("Gam'eya"), monthly: num(f.monthly), members, myTurn: Math.min(members, Math.max(1, num(f.turn) || 1)), start: /^\d{4}-\d{2}$/.test(f.start ?? '') ? f.start : ym(), dueDay: day() }] }));
    }
    setMode(null);
  };

  const paidCount = tot.due.filter(x => x.paid).length;

  return (
    <Screen>
      <Header title={t('Payments')} subtitle={t("Installments, loans, bills and gam'eya")} />

      <View style={s.total}>
        <Text style={s.totalLabel}>{t('You pay every month')}</Text>
        <Text style={s.totalVal}>{le(tot.committed)}</Text>
        <View style={s.split}>
          <Text style={s.splitTxt}>{t('Installments')} {le(tot.instMonthly)}</Text>
          <Text style={s.splitTxt}>{t('Loans')} {le(tot.loanMonthly)}</Text>
        </View>
        <View style={s.split}>
          <Text style={s.splitTxt}>{t('Bills')} {le(tot.billsMonthly)}</Text>
          <Text style={s.splitTxt}>{t("Gam'eya")} {le(tot.gameyaMonthly)}</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.btns}>
        <AddChip icon="phone-portrait-outline" color={C.sky} label={t('Installment')} onPress={() => open('inst')} />
        <AddChip icon="flash-outline" color="#E8B93A" label={t('Bill')} onPress={() => open('bill')} />
        <AddChip icon="people-outline" color="#8E6FE0" label={t("Gam'eya")} onPress={() => open('gameya')} />
        <AddChip icon="business-outline" color={C.primary} label={t('Loan')} onPress={() => open('loan')} />
      </ScrollView>

      <Pressable onPress={() => { tap(); setCalc(true); }} style={({ pressed }) => [s.calc, pressed && { opacity: 0.7 }]}>
        <View style={s.calcIcon}><Ionicons name="calculator" size={20} color={C.accent} /></View>
        <View style={{ flex: 1 }}>
          <Text style={s.calcTitle}>{t('Interest calculator')}</Text>
          <Text style={s.calcSub}>{t('How much interest will you really pay?')}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={C.sub} />
      </Pressable>
      <InterestCalculator visible={calc} onClose={() => setCalc(false)} />

      <Section>{`${t('Due this month')} · ${paidCount}/${tot.due.length}`}</Section>
      <Card>
        {tot.due.length === 0
          ? <Empty icon="calendar-outline" text={t('Nothing due yet')} />
          : tot.due.map((u, i) => (
            <Row key={u.kind + u.id} icon={u.icon} color={u.color} title={u.name} dim={u.paid}
              left={<Check on={u.paid} onPress={() => togglePaid(u.kind, u.id)} />} onPress={() => edit(u.kind, u.id)}
              sub={`${u.by} · ${u.paid ? t('Paid') : dueLabel(u.day)}`}
              value={le(u.amount)} valueColor={!u.paid && daysUntil(u.day) <= 3 ? C.orange : undefined}
              last={i === tot.due.length - 1} />
          ))}
      </Card>
      {tot.due.length > 0 && <Hint>{tot.unpaid.length === 0 ? t('All paid this month') : t('Tap the circle when you pay')}</Hint>}

      <Section>{t("Gam'eya")}</Section>
      <Card>
        {d.gameyas.length === 0
          ? <Empty icon="people-outline" text={t("Track your gam'eya: who pays, when it's your turn")} button={t("Add gam'eya")} onPress={() => open('gameya')} />
          : d.gameyas.map((g, idx) => {
            const st = gameyaStatus(g);
            const sub = st.round < 1 ? t('Not started yet')
              : st.finished ? t('Finished ✓')
              : st.round === g.myTurn ? t("It's your turn this month! You get {x}", { x: le(st.payout) })
              : st.received ? t('You received {x}', { x: le(st.payout) })
              : t('Your turn in {n} months · {x}', { n: g.myTurn - st.round, x: le(st.payout) });
            return (
              <View key={g.id}>
                <Row icon="people" color="#8E6FE0" title={`${g.name} · ${t('Month {r} of {n}', { r: Math.max(0, Math.min(st.round, g.members)), n: g.members })}`}
                  sub={sub} value={le(g.monthly)} last onPress={() => edit('gameya', g.id)}
                  onDelete={() => set(x => ({ ...x, gameyas: x.gameyas.filter(y => y.id !== g.id) }))} />
                <View style={[s.turns, idx < d.gameyas.length - 1 && { borderBottomWidth: 1, borderColor: C.line }]}>
                  {Array.from({ length: g.members }, (_, k) => k + 1).map(n => (
                    <View key={n} style={[s.turn,
                      n < st.round && { backgroundColor: C.pale },
                      n === st.round && { backgroundColor: C.accent },
                      n === g.myTurn && { borderColor: C.green, borderWidth: 2 }]}>
                      <Text style={[s.turnTxt, n < st.round && { color: '#003366' }, n === st.round && { color: '#fff' }]}>{n}</Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
      </Card>

      <Section>{t('Installment apps')}</Section>
      <Card>
        {d.installments.length === 0
          ? <Empty icon="phone-portrait-outline" text={t('valU, Souhoola, Klivvr, Sympl, Contact, Aman…')} />
          : d.installments.map((i, idx) => (
            <Row key={i.id} icon={i.provider[0].toUpperCase()} color={colors[i.provider]} title={i.item}
              sub={`${i.provider} · ${i.monthsLeft > 0 ? t('{n} months left', { n: i.monthsLeft }) : t('Paid off')} · ${t('day {n}', { n: i.dueDay })}`} value={le(i.monthly)}
              last={idx === d.installments.length - 1} onPress={() => edit('inst', i.id)}
              onDelete={() => set(x => ({ ...x, installments: x.installments.filter(y => y.id !== i.id) }))} />
          ))}
      </Card>

      <Section>{t('Bills')}</Section>
      <Card>
        {d.bills.length === 0
          ? <Empty icon="flash-outline" text={t('Electricity, gas, water, internet, mobile, school…')} />
          : d.bills.map((b, idx) => {
            const bt = BILL_TYPES.find(x => x.name === b.cat);
            return <Row key={b.id} icon={bt?.icon ?? 'document-text'} color={bt?.color} title={b.name || t(b.cat)}
              sub={`${t(b.cat)} · ${t('day {n}', { n: b.dueDay })}`} value={le(b.amount)} last={idx === d.bills.length - 1} onPress={() => edit('bill', b.id)}
              onDelete={() => set(x => ({ ...x, bills: x.bills.filter(y => y.id !== b.id) }))} />;
          })}
      </Card>

      <Section>{t('Loans')}</Section>
      <Card>
        {d.loans.length === 0
          ? <Empty icon="business-outline" text={t('Mortgage, car loan, personal loan or credit card')} />
          : d.loans.map((l, idx) => (
            <Row key={l.id} icon={LOAN_TYPES.find(x => x.name === l.type)?.icon ?? 'cash'} color={C.primary} title={l.name ? t(l.name) : t(l.type)}
              sub={isPropertyLoan(l)
                ? `${t('You own {x} of {y}', { x: leShort(propertyOwned(l)), y: leShort(l.price!) })} (${Math.round(propertyOwned(l) / l.price! * 100)}%) · ${l.remaining > 0 ? t('{x} left', { x: leShort(l.remaining) }) : t('Paid off')}`
                : `${l.lender} · ${l.remaining > 0 ? t('{x} left', { x: le(l.remaining) }) : t('Paid off')} · ${t('day {n}', { n: l.dueDay })}`} value={le(l.monthly)}
              last={idx === d.loans.length - 1} onPress={() => edit('loan', l.id)}
              onDelete={() => set(x => ({ ...x, loans: x.loans.filter(y => y.id !== l.id) }))} />
          ))}
      </Card>
      <Hint>{t('Tip: tap an item to edit it, swipe left to delete')}</Hint>

      <Sheet visible={mode === 'inst'} title={t(editId ? 'Edit installment' : 'New installment')} onClose={() => { setMode(null); setEditId(null); }} onSave={save}>
        <Text style={s.lbl}>{t('Which app?')}</Text>
        <Chips options={PROVIDERS.map(p => p.name)} value={f.provider} onChange={upd('provider')} colors={colors} translate={false} />
        <Field label={t('What did you buy?')} placeholder={t('e.g. iPhone, fridge, course')} value={f.item} onChangeText={upd('item')} />
        <Field label={t('Monthly amount (L.E)')} keyboardType="numeric" placeholder="2,500" value={f.monthly} onChangeText={upd('monthly')} />
        <Field label={t('Months left')} keyboardType="numeric" placeholder="12" value={f.months} onChangeText={upd('months')} />
        <Field label={t('Pay on which day of the month?')} keyboardType="numeric" placeholder="5" hint={t("We'll remind you before it's due")} value={f.day} onChangeText={upd('day')} />
      </Sheet>

      <Sheet visible={mode === 'bill'} title={t(editId ? 'Edit bill' : 'New bill')} onClose={() => { setMode(null); setEditId(null); }} onSave={save}>
        <Text style={s.lbl}>{t('Type of bill')}</Text>
        <Chips options={BILL_TYPES.map(b => b.name)} value={f.cat} onChange={upd('cat')} colors={Object.fromEntries(BILL_TYPES.map(b => [b.name, b.color]))} />
        <Field label={t('Name (optional)')} placeholder={t('e.g. WE home internet')} value={f.name} onChangeText={upd('name')} />
        <Field label={t('Usual amount (L.E)')} keyboardType="numeric" placeholder="600" value={f.amount} onChangeText={upd('amount')} />
        <Field label={t('Pay on which day of the month?')} keyboardType="numeric" placeholder="10" hint={t("We'll remind you before it's due")} value={f.day} onChangeText={upd('day')} />
      </Sheet>

      <Sheet visible={mode === 'gameya'} title={t(editId ? "Edit gam'eya" : "New gam'eya")} onClose={() => { setMode(null); setEditId(null); }} onSave={save}>
        <Field label={t('Name')} placeholder={t("e.g. Office gam'eya")} value={f.name} onChangeText={upd('name')} />
        <Field label={t('Monthly share (L.E)')} keyboardType="numeric" placeholder="2,000" value={f.monthly} onChangeText={upd('monthly')} />
        <Field label={t('Number of members')} keyboardType="numeric" placeholder="10" value={f.members} onChangeText={upd('members')} />
        <Field label={t('Your turn (number)')} keyboardType="numeric" placeholder="4" value={f.turn} onChangeText={upd('turn')} />
        <Field label={t('First month')} placeholder="2026-09" value={f.start} onChangeText={upd('start')} hint={t('Format: YYYY-MM, e.g. 2026-09')} />
        <Field label={t('Pay day of the month')} keyboardType="numeric" placeholder="1" value={f.day} onChangeText={upd('day')} />
      </Sheet>

      <Sheet visible={mode === 'loan'} title={t(editId ? 'Edit loan' : 'New loan')} onClose={() => { setMode(null); setEditId(null); }} onSave={save}>
        <Text style={s.lbl}>{t('Type of loan')}</Text>
        <Chips options={LOAN_TYPES.map(x => x.name)} value={f.type} onChange={upd('type')} />
        {isMortgage ? <>
          <Text style={s.lbl}>{t('Nickname')}</Text>
          <Chips options={HOME_NICKNAMES} value={f.name ?? ''} onChange={upd('name')} />
          <Field label={t('Or type your own')} placeholder={t('e.g. Sahel chalet')} value={f.name} onChangeText={upd('name')} />
          <Field label={t('Apartment price (L.E)')} keyboardType="numeric" placeholder="8,000,000" value={f.price} onChangeText={upd('price')} />
          <Field label={t('How much have you paid so far? (L.E)')} keyboardType="numeric" placeholder="1,000,000" value={f.paid} onChangeText={upd('paid')} />
          <Field label={t('How much do you still owe? (L.E)')} keyboardType="numeric" value={f.remaining} onChangeText={upd('remaining')}
            placeholder={num(f.price) ? le(Math.max(0, num(f.price) - num(f.paid))) : '7,000,000'} />
          {num(f.price) > 0 && (
            <View style={s.ownBox}>
              <Text style={s.ownLabel}>{t('You own')}</Text>
              <Text style={s.ownVal}>{le(Math.min(num(f.price), num(f.paid)))} · {Math.round(Math.min(1, num(f.paid) / num(f.price)) * 100)}%</Text>
              <Progress value={num(f.paid) / num(f.price)} color={C.green} />
              <Text style={s.ownHint}>{t('This counts in what you own and grows every time you mark a payment as paid.')}</Text>
            </View>
          )}
        </> : null}
        <Field label={t('Bank')} placeholder={t('e.g. NBE, CIB, Banque Misr')} value={f.lender} onChangeText={upd('lender')} />
        <Field label={t('Monthly payment (L.E)')} keyboardType="numeric" placeholder="8,000" value={f.monthly} onChangeText={upd('monthly')} />
        {!isMortgage && <Field label={t('How much is left to pay? (L.E)')} keyboardType="numeric" placeholder="450,000" value={f.remaining} onChangeText={upd('remaining')} />}
        <Field label={t('Pay on which day of the month?')} keyboardType="numeric" placeholder="1" value={f.day} onChangeText={upd('day')} />
      </Sheet>
    </Screen>
  );
}

const AddChip = ({ icon, color, label, onPress }: any) => (
  <Pressable style={s.btn} onPress={() => { tap(); onPress(); }}>
    <Ionicons name={icon} size={19} color={color} />
    <Text style={s.btnTxt}>+ {label}</Text>
  </Pressable>
);

const s = themed(() => StyleSheet.create({
  total: { backgroundColor: C.card, borderRadius: 14, padding: 18 },
  totalLabel: { color: C.sub, fontSize: 15 },
  totalVal: { color: C.ink, fontSize: 30, fontWeight: '800', marginTop: 4, letterSpacing: -0.5 },
  split: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  splitTxt: { color: C.sub, fontSize: 13, fontWeight: '600' },
  btns: { gap: 10, marginTop: 12, paddingRight: 4 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: C.card, borderRadius: 10, paddingVertical: 13, paddingHorizontal: 16 },
  btnTxt: { fontWeight: '700', fontSize: 15, color: C.ink },
  calc: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: 14, padding: 14, marginTop: 12 },
  calcIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: C.accent + '1F', alignItems: 'center', justifyContent: 'center' },
  calcTitle: { fontSize: 16, fontWeight: '600', color: C.ink },
  calcSub: { fontSize: 13, color: C.sub, marginTop: 2 },
  lbl: { fontSize: 14, fontWeight: '600', color: C.ink, marginBottom: 10 },
  ownBox: { backgroundColor: C.soft, borderRadius: 12, padding: 14, marginBottom: 16, gap: 6 },
  ownLabel: { fontSize: 13, color: C.sub, fontWeight: '600' },
  ownVal: { fontSize: 20, fontWeight: '800', color: C.green, marginBottom: 4 },
  ownHint: { fontSize: 12, color: C.sub, marginTop: 4 },
  turns: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingBottom: 14, paddingTop: 2 },
  turn: { width: 28, height: 28, borderRadius: 10, backgroundColor: C.soft, alignItems: 'center', justifyContent: 'center' },
  turnTxt: { fontSize: 12, fontWeight: '700', color: C.ink },
}));
