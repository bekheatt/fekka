import React, { useEffect, useState } from 'react';
import { View, Pressable, StyleSheet, Image } from 'react-native';
import { Text } from '../fonts';
import { pickReceipt, deleteReceipt } from '../receipts';
import { Ionicons } from '@expo/vector-icons';
import { C, le, EXPENSE_CATS, themed } from '../theme';
import { useStore, useTotals, uid, ym, inPeriod } from '../store';
import { Header, Section, Card, Row, Empty, AddBtn, Sheet, Field, num, tap, Screen, Hint, Segmented } from '../ui';
import { t, locale } from '../i18n';

export default function Spend({ action, clear }: { action?: string; clear: () => void }) {
  const { d, set } = useStore();
  const tot = useTotals();
  const [open, setOpen] = useState<'exp' | 'inc' | null>(null);
  const [cat, setCat] = useState('Food');
  const [amt, setAmt] = useState('');
  const [note, setNote] = useState('');
  const [once, setOnce] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<string | undefined>();
  const [bigReceipt, setBigReceipt] = useState(false);

  useEffect(() => {
    if (action === 'expense') setOpen('exp');
    if (action === 'income') { setOnce(d.settings.work === 'freelancer'); setOpen('inc'); }
    if (action) clear();
  }, [action]);

  const today = new Date().toDateString();
  const todaySpent = d.expenses.filter(e => new Date(e.date).toDateString() === today).reduce((s, e) => s + e.amount, 0);

  const reset = () => { setAmt(''); setNote(''); setOpen(null); setEditId(null); setReceipt(undefined); setBigReceipt(false); };
  const editExpense = (e: any) => { setEditId(e.id); setCat(e.cat); setAmt(String(e.amount)); setNote(e.note); setReceipt(e.receipt); setOpen('exp'); };
  const snap = async (from: 'camera' | 'library') => { const uri = await pickReceipt(from); if (uri) setReceipt(uri); };
  const editIncome = (i: any) => { setEditId(i.id); setOnce(!!i.oneOff); setAmt(String(i.monthly)); setNote(i.source); setOpen('inc'); };
  const incomes = d.incomes.filter(i => !i.oneOff || inPeriod(i.oneOff));
  const save = () => {
    const v = num(amt);
    if (!v) return reset();
    if (editId && open === 'exp') set(x => ({ ...x, expenses: x.expenses.map(e => { if (e.id !== editId) return e; if (e.receipt && e.receipt !== receipt) deleteReceipt(e.receipt); return { ...e, cat, amount: v, note, receipt }; }) }));
    else if (editId) set(x => ({ ...x, incomes: x.incomes.map(i => i.id === editId ? { ...i, source: note || i.source, monthly: v, oneOff: once ? (i.oneOff ?? new Date().toISOString()) : undefined } : i) }));
    else if (open === 'exp') set(x => ({ ...x, expenses: [{ id: uid(), cat, amount: v, note, date: new Date().toISOString(), receipt }, ...x.expenses] }));
    else set(x => ({ ...x, incomes: [...x.incomes, { id: uid(), source: note || t(once ? 'Payment received' : 'Salary'), monthly: v, oneOff: once ? new Date().toISOString() : undefined }] }));
    reset();
  };

  return (
    <Screen>
      <Header title={t('Spending')} right={<AddBtn onPress={() => setOpen('exp')} label={t('Expense')} />} />

      <View style={s.sumRow}>
        <View style={s.sum}><Text style={s.sumLabel}>{t('Today')}</Text><Text style={s.sumVal}>{le(todaySpent)}</Text></View>
        <View style={s.sum}><Text style={s.sumLabel}>{t('This month')}</Text><Text style={s.sumVal}>{le(tot.spent)}</Text></View>
      </View>

      <Section>{t('Add a spend')}</Section>
      <View style={s.quick}>
        {EXPENSE_CATS.map(c => (
          <Pressable key={c.name} style={s.qItem} onPress={() => { tap(); setCat(c.name); setOpen('exp'); }}>
            <View style={[s.qIcon, { backgroundColor: c.color + '1F' }]}><Ionicons name={c.icon as any} size={22} color={c.color} /></View>
            <Text style={s.qTxt}>{t(c.name)}</Text>
          </Pressable>
        ))}
      </View>

      <Section action={t('+ Add')} onAction={() => { setOnce(d.settings.work === 'freelancer'); setOpen('inc'); }}>{t('Income')}</Section>
      <Card>
        {incomes.length === 0
          ? <Empty icon="wallet-outline" text={t('Add your salary or any monthly income')} button={t('Add income')} onPress={() => setOpen('inc')} />
          : incomes.map((i, idx) => (
            <Row key={i.id} icon={i.oneOff ? 'cash' : 'trending-up'} color={C.green} title={i.source}
              sub={i.oneOff ? `${t('One-time')} · ${new Date(i.oneOff).toLocaleDateString(locale(), { day: 'numeric', month: 'short' })}` : t('Every month')}
              value={le(i.monthly)} valueColor={C.green} onPress={() => editIncome(i)}
              last={idx === incomes.length - 1}
              onDelete={() => set(x => ({ ...x, incomes: x.incomes.filter(y => y.id !== i.id) }))} />
          ))}
      </Card>

      <Section>{t('Recent spending')}</Section>
      <Card>
        {d.expenses.length === 0
          ? <Empty icon="receipt-outline" text={t('No spending yet')} />
          : d.expenses.slice(0, 30).map((e, idx, arr) => {
            const c = EXPENSE_CATS.find(x => x.name === e.cat) ?? EXPENSE_CATS[6];
            return <Row key={e.id} icon={c.icon} color={c.color} title={e.note || t(e.cat)}
              sub={`${t(e.cat)} · ${new Date(e.date).toLocaleDateString(locale(), { day: 'numeric', month: 'short' })}${e.receipt ? ' · 🧾' : ''}`} value={le(e.amount)} onPress={() => editExpense(e)}
              last={idx === arr.length - 1}
              onDelete={() => { deleteReceipt(e.receipt); set(x => ({ ...x, expenses: x.expenses.filter(y => y.id !== e.id) })); }} />;
          })}
      </Card>

      <Sheet visible={open === 'exp'} title={t(editId ? 'Edit expense' : 'New expense')} onClose={reset} onSave={save}>
        <Text style={s.lbl}>{t('Category')}</Text>
        <View style={s.chips}>
          {EXPENSE_CATS.map(c => (
            <Pressable key={c.name} onPress={() => { tap(); setCat(c.name); }} style={[s.chip, cat === c.name && { backgroundColor: c.color }]}>
              <Ionicons name={c.icon as any} size={15} color={cat === c.name ? '#fff' : c.color} />
              <Text style={[s.chipTxt, cat === c.name && { color: '#fff' }]}>{t(c.name)}</Text>
            </Pressable>
          ))}
        </View>
        <Field label={t('How much? (L.E)')} keyboardType="numeric" autoFocus={!editId} placeholder="0" value={amt} onChangeText={setAmt} style={s.big} />
        <Field label={t('Note (optional)')} placeholder={t('e.g. Koshary, Uber, electricity')} value={note} onChangeText={setNote} />
        <Text style={s.lbl}>{t('Receipt (optional)')}</Text>
        {receipt ? (
          <View style={{ marginBottom: 16 }}>
            <Pressable onPress={() => setBigReceipt(b => !b)}>
              <Image source={{ uri: receipt }} style={[s.receipt, bigReceipt && { height: 460 }]} resizeMode={bigReceipt ? 'contain' : 'cover'} />
            </Pressable>
            <Pressable onPress={() => { tap(); if (!editId) deleteReceipt(receipt); setReceipt(undefined); }} style={s.rmReceipt}>
              <Ionicons name="trash-outline" size={16} color={C.red} /><Text style={{ color: C.red, fontWeight: '600' }}>{t('Remove receipt')}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={s.receiptBtns}>
            <Pressable onPress={() => { tap(); snap('camera'); }} style={s.receiptBtn}><Ionicons name="camera" size={20} color={C.primary} /><Text style={s.receiptBtnTxt}>{t('Take photo')}</Text></Pressable>
            <Pressable onPress={() => { tap(); snap('library'); }} style={s.receiptBtn}><Ionicons name="image" size={20} color={C.primary} /><Text style={s.receiptBtnTxt}>{t('From photos')}</Text></Pressable>
          </View>
        )}
      </Sheet>

      <Sheet visible={open === 'inc'} title={t(editId ? 'Edit income' : 'New income')} onClose={reset} onSave={save}>
        <Segmented value={once ? 'once' : 'monthly'} onChange={k => setOnce(k === 'once')}
          options={[{ key: 'monthly', label: t('Every month') }, { key: 'once', label: t('One-time') }]} />
        <View style={{ height: 12 }} />
        <Field label={t('Where does it come from?')} placeholder={t(once ? 'e.g. Logo design for client' : 'Salary')} value={note} onChangeText={setNote} />
        <Field label={t(once ? 'Amount (L.E)' : 'Monthly amount (L.E)')} keyboardType="numeric" placeholder="25,000" value={amt} onChangeText={setAmt} style={s.big} />
      </Sheet>
    </Screen>
  );
}

const s = themed(() => StyleSheet.create({
  sumRow: { flexDirection: 'row', gap: 12 },
  sum: { flex: 1, backgroundColor: C.card, borderRadius: 14, padding: 16 },
  sumLabel: { color: C.sub, fontSize: 14 },
  sumVal: { color: C.ink, fontSize: 21, fontWeight: '800', marginTop: 4 },
  quick: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: C.card, borderRadius: 14, paddingVertical: 8 },
  qItem: { width: '25%', alignItems: 'center', paddingVertical: 10 },
  qIcon: { width: 50, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  qTxt: { fontSize: 13, fontWeight: '600', marginTop: 7, color: C.ink },
  lbl: { fontSize: 14, fontWeight: '600', color: C.ink, marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: C.soft },
  chipTxt: { fontWeight: '600', color: C.ink, fontSize: 15 },
  big: { fontSize: 30, fontWeight: '800' },
  receipt: { width: '100%', height: 180, borderRadius: 10, backgroundColor: C.soft },
  rmReceipt: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center', paddingVertical: 10 },
  receiptBtns: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  receiptBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.soft, borderRadius: 10, paddingVertical: 14 },
  receiptBtnTxt: { color: C.primary, fontWeight: '700', fontSize: 15 },
}));
