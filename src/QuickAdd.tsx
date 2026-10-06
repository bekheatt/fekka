import React, { useEffect, useState } from 'react';
import { Modal, View, Pressable, StyleSheet, ScrollView, Image } from 'react-native';
import { Text, TextInput } from './fonts';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { C, EXPENSE_CATS, themed } from './theme';
import { useStore, uid } from './store';
import { t } from './i18n';
import { tap, pressedStyle } from './ui';
import { pickReceipt, deleteReceipt } from './receipts';

// Fast "on the go" expense entry: big keypad, one tap category, optional receipt photo.
export default function QuickAdd({ visible, onClose, initial }: { visible: boolean; onClose: () => void; initial?: { amount?: string; cat?: string } }) {
  const { set } = useStore();
  const [amt, setAmt] = useState('');
  const [cat, setCat] = useState('Food');
  const [note, setNote] = useState('');
  const [receipt, setReceipt] = useState<string | undefined>();

  useEffect(() => {
    if (visible) {
      setAmt(initial?.amount ?? '');
      setCat(EXPENSE_CATS.some(c => c.name === initial?.cat) ? initial!.cat! : 'Food');
      setNote(''); setReceipt(undefined);
    }
  }, [visible]);

  const press = (k: string) => {
    Haptics.selectionAsync().catch(() => {});
    setAmt(a => {
      if (k === '⌫') return a.slice(0, -1);
      if (k === '.' && a.includes('.')) return a;
      if (a.replace('.', '').length >= 9) return a;
      if (a === '0' && k !== '.') return k;
      return a + k;
    });
  };

  const close = (keepReceipt = false) => { if (!keepReceipt) deleteReceipt(receipt); onClose(); };
  const save = () => {
    const v = parseFloat(amt);
    if (!v) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    set(x => ({ ...x, expenses: [{ id: uid(), cat, amount: v, note: note.trim(), date: new Date().toISOString(), receipt }, ...x.expenses] }));
    close(true);
  };

  const snap = async (from: 'camera' | 'library') => {
    const uri = await pickReceipt(from);
    if (uri) { deleteReceipt(receipt); setReceipt(uri); }
  };

  const color = EXPENSE_CATS.find(c => c.name === cat)?.color ?? C.accent;
  const shown = amt ? Number(amt.endsWith('.') ? amt.slice(0, -1) : amt).toLocaleString('en-US', { maximumFractionDigits: 2 }) + (amt.endsWith('.') ? '.' : '') : '0';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => close()}>
      <SafeAreaView style={s.wrap} edges={['bottom']}>
        <View style={s.head}>
          <Pressable onPress={() => close()} hitSlop={10}><Text style={s.cancel}>{t('Cancel')}</Text></Pressable>
          <Text style={s.title}>{t('Quick expense')}</Text>
          <View style={{ width: 50 }} />
        </View>

        <View style={s.amountBox}>
          <Text style={s.cur}>{t('L.E')}</Text>
          <Text style={[s.amount, { color: amt ? C.ink : C.sub }]} adjustsFontSizeToFit numberOfLines={1}>{shown}</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.cats} style={{ flexGrow: 0 }}>
          {EXPENSE_CATS.map(c => {
            const on = c.name === cat;
            return (
              <Pressable key={c.name} onPress={() => { tap(); setCat(c.name); }} style={[s.cat, on && { backgroundColor: c.color }]}>
                <Ionicons name={c.icon as any} size={16} color={on ? '#fff' : c.color} />
                <Text style={[s.catTxt, on && { color: '#fff' }]}>{t(c.name)}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={s.noteRow}>
          <TextInput style={s.note} value={note} onChangeText={setNote} placeholder={t('Note (optional)')} placeholderTextColor={C.sub} />
          {receipt ? (
            <Pressable onPress={() => { deleteReceipt(receipt); setReceipt(undefined); }} accessibilityRole="button" accessibilityLabel={t('Remove receipt')}>
              <Image source={{ uri: receipt }} style={s.thumb} />
              <View style={s.thumbX}><Ionicons name="close" size={12} color="#fff" /></View>
            </Pressable>
          ) : (
            <>
              <Pressable onPress={() => { tap(); snap('camera'); }} style={s.camBtn} accessibilityRole="button" accessibilityLabel={t('Take photo')}><Ionicons name="camera" size={20} color={C.primary} /></Pressable>
              <Pressable onPress={() => { tap(); snap('library'); }} style={s.camBtn} accessibilityRole="button" accessibilityLabel={t('From photos')}><Ionicons name="image" size={20} color={C.primary} /></Pressable>
            </>
          )}
        </View>

        <View style={s.pad}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'].map(k => (
            <Pressable key={k} onPress={() => press(k)} onLongPress={() => k === '⌫' && setAmt('')} accessibilityRole="button" accessibilityLabel={k === '⌫' ? t('Delete') : k}
              style={({ pressed }) => [s.key, pressed && { backgroundColor: C.soft }]}>
              {k === '⌫' ? <Ionicons name="backspace-outline" size={26} color={C.ink} /> : <Text style={s.keyTxt}>{k}</Text>}
            </Pressable>
          ))}
        </View>

        <Pressable onPress={save} disabled={!parseFloat(amt)} style={({ pressed }) => [s.save, { backgroundColor: color }, !parseFloat(amt) && { opacity: 0.4 }, pressed && pressedStyle]}>
          <Text style={s.saveTxt}>{t('Save expense')}</Text>
        </Pressable>
      </SafeAreaView>
    </Modal>
  );
}

const s = themed(() => StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.card },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18 },
  cancel: { fontSize: 16, color: C.sub, width: 50 },
  title: { fontSize: 17, fontWeight: '600', color: C.ink },
  amountBox: { alignItems: 'center', paddingVertical: 10, paddingHorizontal: 24 },
  cur: { fontSize: 16, fontWeight: '700', color: C.sub },
  amount: { fontSize: 60, fontWeight: '700', letterSpacing: -1.5 },
  cats: { gap: 8, paddingHorizontal: 18, paddingVertical: 10 },
  cat: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: C.soft },
  catTxt: { fontWeight: '600', color: C.ink, fontSize: 15 },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, marginTop: 4 },
  note: { flex: 1, backgroundColor: C.soft, borderRadius: 14, padding: 13, fontSize: 16, color: C.ink },
  camBtn: { width: 46, height: 46, borderRadius: 12, backgroundColor: C.soft, alignItems: 'center', justifyContent: 'center' },
  thumb: { width: 46, height: 46, borderRadius: 12 },
  thumbX: { position: 'absolute', top: -5, right: -5, width: 18, height: 18, borderRadius: 9, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center' },
  pad: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 18, marginTop: 'auto' },
  key: { width: '33.33%', height: 62, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  keyTxt: { fontSize: 28, fontWeight: '600', color: C.ink },
  save: { marginHorizontal: 18, marginTop: 8, marginBottom: 10, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  saveTxt: { color: '#fff', fontSize: 17, fontWeight: '600' },
}));
