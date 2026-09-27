import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Text, TextInput } from '../fonts';
import { Ionicons } from '@expo/vector-icons';
import { C, le, SAVING_TYPES, GOAL_ICONS, themed, isHidden, MASK } from '../theme';
import { askPermission } from '../notify';
import { useStore, useTotals, uid, savingValue, goalValue, ym, monthsBetween, Goal, ALERT_NAMES } from '../store';
import { Header, Section, Card, Row, Empty, AddBtn, Sheet, Field, Chips, num, Screen, Hint, tap, Progress, Segmented } from '../ui';
import { t, locale } from '../i18n';

const OTHER = 'Other…';
const GOAL_UNITS = [
  { key: 'egp', label: 'L.E' }, { key: 'gold21', label: 'Gold 21K' }, { key: 'gold24', label: 'Gold 24K' },
  { key: 'usd', label: 'USD' }, { key: 'eur', label: 'EUR' },
];
const unitLabel = (k: string) => t(k === 'egp' ? 'L.E' : k === 'usd' ? 'USD' : k === 'eur' ? 'EUR' : 'grams');
const fmtUnit = (k: string, v: number) => isHidden() ? (k === 'egp' ? le(v) : MASK) : k === 'egp' ? le(v) : k === 'usd' ? `$${Math.round(v).toLocaleString()}` : k === 'eur' ? `€${Math.round(v).toLocaleString()}` : t('{n} grams', { n: +v.toFixed(1) });

export default function Save({ action, clear }: { action?: string; clear: () => void }) {
  const { d, set, refreshRates, rateStatus } = useStore();
  const tot = useTotals();
  const [open, setOpen] = useState<'hold' | 'goal' | 'fund' | 'alert' | null>(null);
  const [kind, setKind] = useState('Gold 21K');
  const [f, setF] = useState<any>({});
  const [fundId, setFundId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [dir, setDir] = useState<'add' | 'take'>('add');
  const upd = (k: string) => (v: string) => setF((x: any) => ({ ...x, [k]: v }));

  useEffect(() => {
    if (action === 'add') { setF({}); setOpen('hold'); }
    if (action === 'goal') { setEditId(null); setF({ unit: 'egp', icon: 'heart' }); setOpen('goal'); }
    if (action?.startsWith('goal:')) { const g = d.goals.find(y => y.id === action.slice(5)); if (g) fund(g); }
    if (action) clear();
  }, [action]);

  const isOther = kind === OTHER;
  const ty = SAVING_TYPES.find(x => x.name === kind);
  const preview = isOther ? num(f.qty) * (num(f.price) || 1) : num(f.qty) * (ty ? d.rates[ty.key] ?? 0 : 0);
  const close = () => { setF({}); setOpen(null); setFundId(null); setEditId(null); };

  const saveHolding = () => {
    const q = num(f.qty);
    if (editId) {
      if (q) set(x => ({ ...x, savings: x.savings.map(h => h.id !== editId ? h : h.kind === 'custom' ? { ...h, name: f.name?.trim() || h.name, qty: q, price: num(f.price) || 1 } : { ...h, qty: q }) }));
      return close();
    }
    if (q) {
      if (isOther) set(x => ({ ...x, savings: [...x.savings, { id: uid(), kind: 'custom', name: f.name?.trim() || t('Other'), qty: q, price: num(f.price) || 1 }] }));
      else if (ty) set(x => ({ ...x, savings: [...x.savings, { id: uid(), kind: ty.key, qty: q }] }));
    }
    close();
  };
  const saveGoal = () => {
    const deadline = /^\d{4}-\d{2}$/.test(f.deadline ?? '') ? f.deadline : undefined;
    if (editId) {
      if (num(f.target)) set(x => ({ ...x, goals: x.goals.map(g => g.id !== editId ? g : { ...g, name: f.name?.trim() || g.name, icon: f.icon, unit: f.unit, target: num(f.target), saved: num(f.saved), deadline }) }));
      return close();
    }
    if (num(f.target)) set(x => ({ ...x, goals: [...x.goals, { id: uid(), name: f.name?.trim() || t('Goal'), icon: f.icon, unit: f.unit, target: num(f.target), saved: num(f.saved), deadline: /^\d{4}-\d{2}$/.test(f.deadline ?? '') ? f.deadline : undefined }] }));
    close();
  };
  function fund(g: Goal) { setFundId(g.id); setDir('add'); setF({}); setOpen('fund'); }
  const saveFund = () => {
    const v = num(f.amount);
    if (v && fundId) set(x => ({ ...x, goals: x.goals.map(g => {
      if (g.id !== fundId) return g;
      const delta = dir === 'add' ? v : -Math.min(v, g.saved);
      return { ...g, saved: Math.max(0, g.saved + delta), history: [{ date: new Date().toISOString(), amount: delta }, ...(g.history ?? [])].slice(0, 50) };
    }) }));
    close();
  };
  const editGoal = (g: Goal) => {
    setOpen(null);
    setTimeout(() => { setEditId(g.id); setF({ name: g.name, icon: g.icon, unit: g.unit, target: String(g.target), saved: String(g.saved), deadline: g.deadline ?? '' }); setOpen('goal'); }, 350);
  };
  const editHolding = (h: any) => {
    const st = SAVING_TYPES.find(y => y.key === h.kind);
    setKind(h.kind === 'custom' ? OTHER : st?.name ?? 'Gold 21K');
    setEditId(h.id); setF({ qty: String(h.qty), name: h.name, price: h.price && h.price !== 1 ? String(h.price) : '' }); setOpen('hold');
  };
  const fundGoal = d.goals.find(g => g.id === fundId);

  const ALERT_KINDS = ['gold21', 'gold24', 'usd', 'eur'];
  const openAlert = () => { setF({ kind: 'gold21', dir: 'above', price: String(Math.round(d.rates.gold21 * 1.03)) }); setOpen('alert'); };
  const saveAlert = async () => {
    const price = num(f.price);
    if (price) {
      await askPermission().catch(() => false);
      set(x => ({ ...x, alerts: [...x.alerts, { id: uid(), kind: f.kind, dir: f.dir, price, active: true }] }));
    }
    close();
  };

  const subFor = (x: any) => {
    if (isHidden()) return x.kind === 'custom' ? t('Your own savings') : MASK;
    if (x.kind === 'custom') return x.price && x.price !== 1 ? `${x.qty.toLocaleString()} × ${le(x.price)}` : t('Your own savings');
    if (x.kind === 'usd') return `$${x.qty.toLocaleString()}`;
    if (x.kind === 'eur') return `€${x.qty.toLocaleString()}`;
    if (x.kind === 'egp') return t('Cash / bank');
    return t('{n} grams', { n: x.qty });
  };

  const updated = d.ratesUpdated
    ? new Date(d.ratesUpdated).toLocaleString(locale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <Screen>
      <Header title={t('Savings')} subtitle={t('Gold, foreign currency and more')} right={<AddBtn onPress={() => { setF({}); setOpen('hold'); }} />} />

      <View style={s.hero}>
        <Text style={s.heroLabel}>{t('All your savings are worth')}</Text>
        <Text style={s.heroVal} adjustsFontSizeToFit numberOfLines={1}>{le(tot.holdings + tot.goalsSaved)}</Text>
      </View>

      {/* Goals */}
      <Section action={t('+ Add')} onAction={() => { setF({ unit: 'egp', icon: 'heart' }); setOpen('goal'); }}>{t('Savings goals')}</Section>
      {d.goals.length === 0 ? (
        <Card><Empty icon="flag-outline" text={t('Save for a wedding, car, trip or Umrah — in pounds, gold or dollars')} button={t('Add goal')}
          onPress={() => { setF({ unit: 'egp', icon: 'heart' }); setOpen('goal'); }} /></Card>
      ) : d.goals.map(g => {
        const p = g.target ? Math.min(1, g.saved / g.target) : 0;
        const left = Math.max(0, g.target - g.saved);
        const monthsLeft = g.deadline ? Math.max(1, monthsBetween(ym(), g.deadline)) : 0;
        const perMonth = monthsLeft ? (left / monthsLeft) * (d.rates[g.unit] ?? 1) : 0;
        const deadlineStr = g.deadline ? new Date(g.deadline + '-01').toLocaleDateString(locale(), { month: 'short', year: 'numeric' }) : '';
        return (
          <Card key={g.id} style={s.goal}>
            <Row icon={g.icon} color={C.accent} title={g.name}
              sub={p >= 1 ? t('Goal reached') : t('{p}% · {x} to go', { p: Math.round(p * 100), x: fmtUnit(g.unit, left) })}
              value={fmtUnit(g.unit, g.saved)} last onPress={() => fund(g)}
              onDelete={() => set(x => ({ ...x, goals: x.goals.filter(y => y.id !== g.id) }))} />
            <Progress value={p} color={p >= 1 ? C.green : C.accent} height={10} />
            <View style={s.goalFoot}>
              <Text style={s.goalHint}>
                {g.unit !== 'egp' ? `≈ ${le(goalValue(g, d.rates))}` : ''}
                {perMonth > 0 && p < 1 ? `${g.unit !== 'egp' ? ' · ' : ''}${t('Save {x}/month to reach it by {d}', { x: le(perMonth), d: deadlineStr })}` : ''}
              </Text>
              <Pressable onPress={() => { tap(); fund(g); }} style={s.fundBtn}><Text style={s.fundTxt}>{t('+ / −')}</Text></Pressable>
            </View>
          </Card>
        );
      })}

      {/* Holdings */}
      <Section>{t('What you have')}</Section>
      <Card>
        {d.savings.length === 0
          ? <Empty icon="diamond-outline" text={t('Add your gold, dollars, euros, cash — or anything else you save')} button={t('Add savings')} onPress={() => { setF({}); setOpen('hold'); }} />
          : d.savings.map((x, idx) => {
            const st = SAVING_TYPES.find(y => y.key === x.kind);
            return <Row key={x.id} icon={st?.icon ?? 'star'} color={st?.color ?? C.sky}
              title={x.kind === 'custom' ? x.name : t(st?.name ?? '')}
              sub={subFor(x)} value={le(savingValue(x, d.rates))} last={idx === d.savings.length - 1} onPress={() => editHolding(x)}
              onDelete={() => set(z => ({ ...z, savings: z.savings.filter(y => y.id !== x.id) }))} />;
          })}
      </Card>

      {/* Prices */}
      <Section>{t("Today's prices in L.E")}</Section>
      <View style={s.live}>
        <View style={[s.liveDot, { backgroundColor: rateStatus === 'error' ? C.red : C.green }]} />
        <Text style={s.liveTxt}>
          {rateStatus === 'loading' ? t('Updating prices…')
            : rateStatus === 'error' ? t("Couldn't update — showing last saved prices")
            : updated ? t('Live prices · updated {x}', { x: updated }) : t('Prices not updated yet')}
        </Text>
        <Pressable onPress={() => { tap(); refreshRates(); }} hitSlop={10} style={s.refresh}>
          {rateStatus === 'loading' ? <ActivityIndicator size="small" color={C.primary} /> : <Ionicons name="refresh" size={18} color={C.primary} />}
        </Pressable>
      </View>
      <Card style={{ paddingVertical: 8 }}>
        {SAVING_TYPES.filter(x => x.key !== 'egp').map((st, idx, arr) => (
          <View key={st.key} style={[s.rate, idx < arr.length - 1 && { borderBottomWidth: 1, borderColor: C.line }]}>
            <View>
              <Text style={s.rateName}>{t(st.name)}</Text>
              <Text style={s.rateUnit}>{st.unit === 'grams' ? t('price of 1 gram') : t('price of 1 {u}', { u: t(st.unit) })}</Text>
            </View>
            <TextInput key={`${st.key}-${d.rates[st.key]}`} style={s.rateInput} keyboardType="numeric"
              defaultValue={d.rates[st.key].toFixed(2)}
              onEndEditing={e => { const v = num(e.nativeEvent.text); if (v) set(z => ({ ...z, rates: { ...z.rates, [st.key]: v } })); }} />
          </View>
        ))}
      </Card>
      <Hint>{t('Prices update automatically when you open the app. Gold is the world price — shop prices in Egypt can differ a little, so you can tap any price to adjust it.')}</Hint>

      <Section action={t('+ Add')} onAction={openAlert}>{t('Price alerts')}</Section>
      <Card>
        {d.alerts.length === 0
          ? <Empty icon="notifications-outline" text={t('Get a notification when gold or the dollar hits your price')} button={t('Add alert')} onPress={openAlert} />
          : d.alerts.map((a, idx) => (
            <Row key={a.id} icon={a.active ? 'notifications' : 'checkmark-done'} color={a.active ? C.accent : C.green}
              title={t(a.dir === 'above' ? '{k} above {p}' : '{k} below {p}', { k: t(ALERT_NAMES[a.kind]), p: le(a.price) })}
              sub={a.active ? t('Watching · now {x}', { x: le(d.rates[a.kind]) }) : t('Reached on {d} · tap to watch again', { d: new Date(a.firedAt ?? Date.now()).toLocaleDateString(locale(), { day: 'numeric', month: 'short' }) })}
              value="" last={idx === d.alerts.length - 1} dim={!a.active}
              onPress={() => !a.active && set(x => ({ ...x, alerts: x.alerts.map(y => y.id === a.id ? { ...y, active: true, firedAt: undefined } : y) }))}
              onDelete={() => set(x => ({ ...x, alerts: x.alerts.filter(y => y.id !== a.id) }))} />
          ))}
      </Card>
      <Hint>{t('Fakka checks prices whenever you open the app. Checking in the background comes with the App Store version.')}</Hint>
      <Hint>{t('Tip: tap an item to edit it, swipe left to delete')}</Hint>

      {/* Add holding */}
      <Sheet visible={open === 'hold'} title={t(editId ? 'Edit savings' : 'Add savings')} onClose={close} onSave={saveHolding}>
        <Text style={s.lbl}>{t('What type?')}</Text>
        {!editId && <Chips options={[...SAVING_TYPES.map(x => x.name), OTHER]} value={kind} onChange={setKind} />}
        {isOther ? (
          <>
            <Field label={t('What is it?')} placeholder={t('e.g. Silver, stocks, car')} value={f.name} onChangeText={upd('name')} autoFocus />
            <Field label={t('Total value (L.E)')} keyboardType="numeric" placeholder="0" value={f.qty} onChangeText={upd('qty')} style={s.big}
              hint={t('Or enter a quantity here and a price per unit below')} />
            <Field label={t('Price per unit in L.E (optional)')} keyboardType="numeric" placeholder={t('Leave empty if you entered the total')}
              value={f.price} onChangeText={upd('price')}
              hint={num(f.price) > 0 && num(f.qty) > 0 ? t('≈ {x} in total', { x: le(preview) }) : undefined} />
          </>
        ) : (
          <Field label={t('How much? ({u})', { u: t(ty?.unit ?? '') })} keyboardType="numeric" autoFocus placeholder="0" value={f.qty} onChangeText={upd('qty')} style={s.big}
            hint={preview > 0 && ty?.key !== 'egp' ? t("≈ {x} at today's price", { x: le(preview) }) : undefined} />
        )}
      </Sheet>

      {/* New goal */}
      <Sheet visible={open === 'goal'} title={t(editId ? 'Edit goal' : 'New goal')} onClose={close} onSave={saveGoal}>
        <Field label={t('What are you saving for?')} placeholder={t('e.g. Wedding, Car, Umrah')} value={f.name} onChangeText={upd('name')} autoFocus />
        <Text style={s.lbl}>{t('Icon')}</Text>
        <View style={s.icons}>
          {GOAL_ICONS.map(ic => (
            <Pressable key={ic} onPress={() => { tap(); setF((x: any) => ({ ...x, icon: ic })); }} style={[s.iconBtn, f.icon === ic && { backgroundColor: C.accent }]}>
              <Ionicons name={ic as any} size={20} color={f.icon === ic ? '#fff' : C.accent} />
            </Pressable>
          ))}
        </View>
        <Text style={s.lbl}>{t('Save in')}</Text>
        <Chips options={GOAL_UNITS.map(u => u.label)} value={GOAL_UNITS.find(u => u.key === f.unit)?.label ?? 'L.E'}
          onChange={v => setF((x: any) => ({ ...x, unit: GOAL_UNITS.find(u => u.label === v)!.key }))} />
        <Field label={t('Target ({u})', { u: unitLabel(f.unit) })} keyboardType="numeric" placeholder="100,000" value={f.target} onChangeText={upd('target')} />
        <Field label={t('Already saved ({u})', { u: unitLabel(f.unit) })} keyboardType="numeric" placeholder="0" value={f.saved} onChangeText={upd('saved')} />
        <Field label={t('Deadline (optional)')} placeholder="2027-06" value={f.deadline} onChangeText={upd('deadline')} hint={t('Format: YYYY-MM, e.g. 2026-09')} />
      </Sheet>

      {/* Add money to goal */}
      <Sheet visible={open === 'fund'} title={fundGoal?.name ?? ''} onClose={close} onSave={saveFund}
        saveLabel={t(dir === 'add' ? 'Add to goal' : 'Take out')}>
        {fundGoal && (() => {
          const p = fundGoal.target ? Math.min(1, fundGoal.saved / fundGoal.target) : 0;
          return (
            <>
              <View style={s.fundHead}>
                <View style={s.fundIcon}><Ionicons name={fundGoal.icon as any} size={26} color={C.accent} /></View>
                <Text style={s.fundSaved}>{fmtUnit(fundGoal.unit, fundGoal.saved)}</Text>
                <Text style={s.fundOf}>{t('of {x}', { x: fmtUnit(fundGoal.unit, fundGoal.target) })} · {Math.round(p * 100)}%</Text>
              </View>
              <Progress value={p} color={p >= 1 ? C.green : C.accent} height={10} />
              <View style={{ height: 16 }} />
              <Segmented value={dir} onChange={k => setDir(k as any)} options={[{ key: 'add', label: t('Add money') }, { key: 'take', label: t('Take out') }]} />
              <Field label={t('Amount ({u})', { u: unitLabel(fundGoal.unit) })} keyboardType="numeric" autoFocus placeholder="0" value={f.amount} onChangeText={upd('amount')} style={[s.big, { color: dir === 'add' ? C.green : C.red }]}
                hint={num(f.amount) > 0 ? t('New total: {x}', { x: fmtUnit(fundGoal.unit, Math.max(0, fundGoal.saved + (dir === 'add' ? 1 : -1) * num(f.amount))) }) : undefined} />
              {!!fundGoal.history?.length && (
                <>
                  <Text style={s.lbl}>{t('History')}</Text>
                  <View style={s.hist}>
                    {fundGoal.history.slice(0, 8).map((h, i) => (
                      <View key={i} style={[s.histRow, i > 0 && { borderTopWidth: 1, borderColor: C.line }]}>
                        <Text style={s.histDate}>{new Date(h.date).toLocaleDateString(locale(), { day: 'numeric', month: 'short' })}</Text>
                        <Text style={[s.histAmt, { color: h.amount >= 0 ? C.green : C.red }]}>{h.amount >= 0 ? '+' : '−'}{fmtUnit(fundGoal.unit, Math.abs(h.amount))}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
              <Pressable onPress={() => { tap(); editGoal(fundGoal); }} style={s.editLink}>
                <Ionicons name="create-outline" size={17} color={C.primary} />
                <Text style={s.editTxt}>{t('Edit goal')}</Text>
              </Pressable>
            </>
          );
        })()}
      </Sheet>
      <Sheet visible={open === 'alert'} title={t('New price alert')} onClose={close} onSave={saveAlert}>
        <Text style={s.lbl}>{t('What to watch')}</Text>
        <Chips options={ALERT_KINDS.map(k => ALERT_NAMES[k])} value={ALERT_NAMES[f.kind] ?? 'Gold 21K'}
          onChange={v => { const k = ALERT_KINDS.find(x => ALERT_NAMES[x] === v)!; setF((x: any) => ({ ...x, kind: k, price: String(Math.round(d.rates[k] * (x.dir === 'above' ? 1.03 : 0.97) * 100) / 100) })); }} />
        <Segmented value={f.dir ?? 'above'} onChange={k => setF((x: any) => ({ ...x, dir: k }))}
          options={[{ key: 'above', label: t('Goes above') }, { key: 'below', label: t('Drops below') }]} />
        <View style={{ height: 12 }} />
        <Field label={t('Price in L.E')} keyboardType="numeric" value={f.price} onChangeText={upd('price')} style={s.big}
          hint={t('Now: {x}', { x: le(d.rates[f.kind] ?? 0) })} />
      </Sheet>
    </Screen>
  );
}

const s = themed(() => StyleSheet.create({
  hero: { backgroundColor: C.accent, borderRadius: 14, padding: 22 },
  heroLabel: { color: C.pale, fontWeight: '600', fontSize: 15 },
  heroVal: { color: '#fff', fontSize: 36, fontWeight: '800', letterSpacing: -1, marginTop: 6 },
  goal: { paddingBottom: 14, marginBottom: 10 },
  goalFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, gap: 10 },
  goalHint: { flex: 1, color: C.sub, fontSize: 13 },
  fundBtn: { backgroundColor: C.soft, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  fundHead: { alignItems: 'center', marginBottom: 14 },
  fundIcon: { width: 56, height: 56, borderRadius: 12, backgroundColor: C.soft, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  fundSaved: { fontSize: 30, fontWeight: '800', color: C.ink },
  fundOf: { fontSize: 14, color: C.sub, marginTop: 3 },
  hist: { backgroundColor: C.soft, borderRadius: 10, paddingHorizontal: 14, marginBottom: 16 },
  histRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 11 },
  histDate: { color: C.sub, fontSize: 14 },
  histAmt: { fontWeight: '700', fontSize: 15 },
  editLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, marginBottom: 4 },
  editTxt: { color: C.primary, fontWeight: '700', fontSize: 15 },
  fundTxt: { color: C.primary, fontWeight: '700', fontSize: 14 },
  live: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, paddingHorizontal: 4 },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  liveTxt: { flex: 1, color: C.sub, fontSize: 13 },
  refresh: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.soft, alignItems: 'center', justifyContent: 'center' },
  rate: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  rateName: { fontWeight: '600', fontSize: 16, color: C.ink },
  rateUnit: { color: C.sub, fontSize: 13, marginTop: 2 },
  rateInput: { backgroundColor: C.soft, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, minWidth: 110, textAlign: 'right', fontWeight: '700', fontSize: 16, color: C.ink },
  lbl: { fontSize: 14, fontWeight: '600', color: C.ink, marginBottom: 10 },
  big: { fontSize: 30, fontWeight: '800' },
  icons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  iconBtn: { width: 44, height: 44, borderRadius: 13, backgroundColor: C.soft, alignItems: 'center', justifyContent: 'center' },
}));
