// Paste bank SMS → review → add. Automatic logging (iPhone Shortcuts) is set up in AutoLogSetup.
import React, { useEffect, useMemo, useState } from 'react';
import { Modal, View, Pressable, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput } from '../../fonts';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { C, le, EXPENSE_CATS, themed } from '../../theme';
import { useStore } from '../../store';
import { Card, Check, Bubble, Section, tap, pressedStyle } from '../../ui';
import { t, locale } from '../../i18n';
import { parseSms, splitMessages } from './parse';
import { guessCategory, describe, isLogged, inPounds, logTransactions } from './log';
import { prefetchCrowd, canShare, teach } from './crowd';
import AutoLogSetup from './AutoLogSetup';

export default function SmsImport({ visible, onClose, initialText }: { visible: boolean; onClose: () => void; initialText?: string }) {
  const { d, set } = useStore();
  const [text, setText] = useState('');
  const [off, setOff] = useState<Record<string, boolean>>({});      // unticked rows
  const [cats, setCats] = useState<Record<string, string>>({});     // category changes
  const [setup, setSetup] = useState(false);
  const [crowdTick, setCrowdTick] = useState(0); // redraws once shared shop categories arrive

  useEffect(() => { if (visible) { setText(initialText ?? ''); setOff({}); setCats({}); } }, [visible]);

  const { rows, unread } = useMemo(() => {
    const msgs = splitMessages(text);
    const rows = msgs.map(m => parseSms(m)).filter(Boolean).map(tx => ({
      tx: tx!, dup: isLogged(d, tx!.fingerprint), cat: guessCategory(tx!, d.merchantCats),
    }));
    // the same message pasted twice shows once
    const unique = rows.filter((r, i) => rows.findIndex(x => x.tx.fingerprint === r.tx.fingerprint) === i);
    return { rows: unique, unread: msgs.length - rows.length };
  }, [text, d.expenses, d.incomes, crowdTick]);
  useEffect(() => { if (rows.length) prefetchCrowd(rows.map(r => r.tx)).then(() => setCrowdTick(x => x + 1)); }, [text]);

  const chosen = rows.filter(r => !r.dup && !off[r.tx.fingerprint]);
  const paste = async () => { tap(); const s = await Clipboard.getStringAsync(); if (s) setText(x => (x ? x + '\n' : '') + s); };
  const cycle = (fp: string, now: string) => {
    tap();
    const i = EXPENSE_CATS.findIndex(c => c.name === now);
    setCats(c => ({ ...c, [fp]: EXPENSE_CATS[(i + 1) % EXPENSE_CATS.length].name }));
  };
  const add = () => {
    if (!chosen.length) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    set(x => logTransactions(x, chosen.map(r => ({ tx: r.tx, cat: cats[r.tx.fingerprint] ?? r.cat, chosen: !!cats[r.tx.fingerprint] }))).next);
    chosen.forEach(r => { const c = cats[r.tx.fingerprint]; if (c && canShare(r.tx)) teach(r.tx.party!, c); });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.card }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.head}>
          <Pressable onPress={onClose} hitSlop={10}><Text style={s.cancel}>{t('Cancel')}</Text></Pressable>
          <Text style={s.title}>{t('Import from SMS')}</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <Text style={s.lead}>{t('Copy your bank or InstaPay messages and paste them here. Fakka finds the amount, the shop or person, and the date.')}</Text>

          <View style={s.box}>
            <TextInput style={s.input} value={text} onChangeText={setText} multiline textAlignVertical="top"
              placeholder={t('Paste one or more messages…')} placeholderTextColor={C.sub + '99'} />
            <View style={s.boxBar}>
              <Pressable onPress={paste} style={s.pasteBtn} hitSlop={6}>
                <Ionicons name="clipboard-outline" size={16} color={C.primary} />
                <Text style={s.pasteTxt}>{t('Paste')}</Text>
              </Pressable>
              {!!text && <Pressable onPress={() => { tap(); setText(''); }} hitSlop={6}><Text style={s.clear}>{t('Clear')}</Text></Pressable>}
            </View>
          </View>

          {rows.length > 0 && <Section>{t('Found {n}', { n: rows.length })}</Section>}
          {rows.length > 0 && (
            <Card>
              {rows.map((r, i) => {
                const fp = r.tx.fingerprint, cat = cats[fp] ?? r.cat;
                const c = EXPENSE_CATS.find(x => x.name === cat) ?? EXPENSE_CATS[EXPENSE_CATS.length - 1];
                const income = r.tx.kind === 'income';
                const when = r.tx.date ? r.tx.date.toLocaleDateString(locale(), { day: 'numeric', month: 'short' }) + ' · ' + r.tx.date.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' }) : t('Now');
                return (
                  <View key={fp} style={[s.row, i < rows.length - 1 && s.line, r.dup && { opacity: 0.45 }]}>
                    {!r.dup && <Check on={!off[fp]} onPress={() => setOff(o => ({ ...o, [fp]: !o[fp] }))} color={C.primary} />}
                    <Bubble icon={income ? 'arrow-down' : (c.icon as any)} color={income ? C.green : c.color} size={38} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.rowTitle} numberOfLines={1}>{describe(r.tx)}</Text>
                      <Text style={s.rowSub} numberOfLines={1}>{r.dup ? t('Already added') : when}</Text>
                      {!income && !r.dup && (
                        <Pressable onPress={() => cycle(fp, cat)} hitSlop={6} style={[s.catPill, { backgroundColor: c.color + '1F' }]}>
                          <Text style={[s.catTxt, { color: c.color }]}>{t(cat)}</Text>
                          <Ionicons name="swap-horizontal" size={12} color={c.color} />
                        </Pressable>
                      )}
                    </View>
                    <Text style={[s.amt, { color: income ? C.green : C.ink }]}>
                      {income ? '+' : '-'}{le(inPounds(r.tx, d.rates))}
                    </Text>
                  </View>
                );
              })}
            </Card>
          )}
          {unread > 0 && <Text style={s.hint}>{t("{n} message(s) didn't look like a payment and were skipped (codes, offers, balance only).", { n: unread })}</Text>}

          {rows.length > 0 && (
            <Pressable onPress={add} disabled={!chosen.length} style={({ pressed }) => [s.addBtn, !chosen.length && { opacity: 0.4 }, pressed && pressedStyle]}>
              <Text style={s.addTxt}>{chosen.length ? t('Add {n}', { n: chosen.length }) : t('Nothing new to add')}</Text>
            </Pressable>
          )}

          <Pressable onPress={() => { tap(); setSetup(true); }} style={s.helpHead}>
            <Ionicons name="flash-outline" size={18} color={C.primary} />
            <View style={{ flex: 1 }}>
              <Text style={s.helpTitle}>{t('Log new messages automatically')}</Text>
              <Text style={s.helpSub}>{t("iPhone: your bank messages are added in the background, without opening the app")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.sub} />
          </Pressable>
          <AutoLogSetup visible={setup} onClose={() => setSetup(false)} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = themed(() => StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderColor: C.line },
  title: { fontSize: 17, fontWeight: '600', color: C.ink },
  cancel: { fontSize: 16, color: C.sub, width: 50 },
  lead: { fontSize: 15, color: C.sub, lineHeight: 21, marginBottom: 14 },
  box: { backgroundColor: C.soft, borderRadius: 18, padding: 14 },
  input: { minHeight: 110, maxHeight: 220, fontSize: 15, color: C.ink, lineHeight: 21 },
  boxBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  pasteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.card, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  pasteTxt: { color: C.primary, fontWeight: '600', fontSize: 14 },
  clear: { color: C.sub, fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  line: { borderBottomWidth: 1, borderColor: C.line },
  rowTitle: { fontSize: 15, fontWeight: '600', color: C.ink },
  rowSub: { fontSize: 13, color: C.sub, marginTop: 2 },
  catPill: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 12, marginTop: 6 },
  catTxt: { fontSize: 12, fontWeight: '600' },
  amt: { fontSize: 15, fontWeight: '700' },
  hint: { color: C.sub, fontSize: 13, lineHeight: 18, marginTop: 12 },
  addBtn: { backgroundColor: C.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 16 },
  addTxt: { color: '#fff', fontSize: 17, fontWeight: '600' },
  helpHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 28, paddingVertical: 10 },
  helpTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: C.ink },
  helpSub: { fontSize: 13, color: C.sub, marginTop: 2 },
}));
