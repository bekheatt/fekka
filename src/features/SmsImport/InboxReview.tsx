// Shown when the app opens and bank messages arrived while it was closed: keep or discard each one,
// or switch on "keep all future transactions" so this screen never shows again.
import React, { useEffect, useState } from 'react';
import { Modal, View, Pressable, StyleSheet, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Text } from '../../fonts';
import { C, le, EXPENSE_CATS, themed } from '../../theme';
import { useStore } from '../../store';
import { Bubble, tap, pressedStyle } from '../../ui';
import { t, locale } from '../../i18n';
import type { ParsedTx } from './parse';
import { describe, guessCategory, inPounds, isTransfer, type Pick } from './log';

export type Pending = { id: string; tx: ParsedTx };

export default function InboxReview({ items, onDone }: { items: Pending[]; onDone: (keep: Pick[], alwaysKeep: boolean) => void }) {
  const { d } = useStore();
  const [drop, setDrop] = useState<Record<string, boolean>>({});   // discarded rows
  const [cats, setCats] = useState<Record<string, string>>({});
  const [always, setAlways] = useState(false);

  useEffect(() => { setDrop({}); setCats({}); setAlways(false); }, [items]);

  const catOf = (p: Pending) => cats[p.id] ?? guessCategory(p.tx, d.merchantCats);
  const kept = items.filter(p => !drop[p.id]);
  const finish = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    onDone(kept.map(p => ({ tx: p.tx, cat: catOf(p), chosen: !!cats[p.id] })), always);
  };
  const cycle = (p: Pending) => {
    tap();
    const i = EXPENSE_CATS.findIndex(c => c.name === catOf(p));
    setCats(c => ({ ...c, [p.id]: EXPENSE_CATS[(i + 1) % EXPENSE_CATS.length].name }));
  };

  return (
    <Modal visible={items.length > 0} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => finish()}>
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: C.card }}>
        <View style={s.head}>
          <View style={s.headIcon}><Ionicons name="chatbubble-ellipses" size={22} color={C.primary} /></View>
          <Text style={s.title}>{t('New from your bank')}</Text>
          <Text style={s.sub}>{t('{n} transaction(s) arrived while the app was closed. Keep the ones you want.', { n: items.length })}</Text>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}>
          {items.map((p, i) => {
            const income = p.tx.kind === 'income';
            const cat = catOf(p);
            const c = EXPENSE_CATS.find(x => x.name === cat) ?? EXPENSE_CATS[EXPENSE_CATS.length - 1];
            const off = !!drop[p.id];
            const date = p.tx.date ?? new Date();
            return (
              <View key={p.id} style={[s.row, i < items.length - 1 && s.line]}>
                <View style={[s.rowTop, off && { opacity: 0.4 }]}>
                  <Bubble icon={income ? (isTransfer(p.tx) ? 'swap-horizontal' : 'arrow-down') : (c.icon as any)} color={income ? C.green : c.color} size={40} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.rowTitle, off && s.struck]} numberOfLines={1}>{describe(p.tx)}</Text>
                    <Text style={s.rowSub}>{date.toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short' })} · {date.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' })}</Text>
                  </View>
                  <Text style={[s.amt, { color: income ? C.green : C.red }, off && s.struck]}>{income ? '+' : '-'}{le(inPounds(p.tx, d.rates))}</Text>
                </View>
                <View style={s.rowBottom}>
                  {!income && !off ? (
                    <Pressable onPress={() => cycle(p)} hitSlop={6} style={[s.catPill, { backgroundColor: c.color + '1F' }]}>
                      <Text style={[s.catTxt, { color: c.color }]}>{t(cat)}</Text>
                      <Ionicons name="swap-horizontal" size={12} color={c.color} />
                    </Pressable>
                  ) : <View />}
                  <View style={s.choice}>
                    <Pressable onPress={() => { tap(); setDrop(x => ({ ...x, [p.id]: false })); }} style={[s.opt, !off && { backgroundColor: C.green }]}>
                      <Ionicons name="checkmark" size={14} color={!off ? '#fff' : C.sub} />
                      <Text style={[s.optTxt, !off && { color: '#fff' }]}>{t('Keep')}</Text>
                    </Pressable>
                    <Pressable onPress={() => { tap(); setDrop(x => ({ ...x, [p.id]: true })); }} style={[s.opt, off && { backgroundColor: C.red }]}>
                      <Ionicons name="close" size={14} color={off ? '#fff' : C.sub} />
                      <Text style={[s.optTxt, off && { color: '#fff' }]}>{t('Discard')}</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>

        <View style={s.foot}>
          <View style={s.always}>
            <View style={{ flex: 1 }}>
              <Text style={s.alwaysTitle}>{t('Keep all future transactions')}</Text>
              <Text style={s.alwaysSub}>{t("Add them automatically and don't show this screen again. You can change this in Settings.")}</Text>
            </View>
            <Switch value={always} onValueChange={v => { tap(); setAlways(v); }} trackColor={{ true: C.accent, false: C.line }} thumbColor="#fff" />
          </View>
          <Pressable onPress={() => finish()} style={({ pressed }) => [s.save, pressed && pressedStyle]}>
            <Text style={s.saveTxt}>
              {kept.length === items.length ? t('Keep all {n}', { n: items.length })
                : kept.length === 0 ? t('Discard all')
                : t('Keep {k}, discard {x}', { k: kept.length, x: items.length - kept.length })}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const s = themed(() => StyleSheet.create({
  head: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 26, paddingBottom: 14 },
  headIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.soft, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', color: C.ink, textAlign: 'center' },
  sub: { fontSize: 14, color: C.sub, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  row: { paddingVertical: 14 },
  line: { borderBottomWidth: 1, borderColor: C.line },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: C.ink },
  rowSub: { fontSize: 13, color: C.sub, marginTop: 2 },
  struck: { textDecorationLine: 'line-through' },
  amt: { fontSize: 15, fontWeight: '700' },
  rowBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingLeft: 52 },
  catPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12 },
  catTxt: { fontSize: 12, fontWeight: '600' },
  choice: { flexDirection: 'row', gap: 6 },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 12, backgroundColor: C.soft },
  optTxt: { fontSize: 13, fontWeight: '600', color: C.sub },
  foot: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderColor: C.line },
  always: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 12 },
  alwaysTitle: { fontSize: 15, fontWeight: '600', color: C.ink },
  alwaysSub: { fontSize: 12, color: C.sub, marginTop: 2, lineHeight: 17 },
  save: { backgroundColor: C.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 8 },
  saveTxt: { color: '#fff', fontSize: 17, fontWeight: '600' },
}));
