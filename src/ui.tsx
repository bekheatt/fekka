import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet, Modal, ScrollView, KeyboardAvoidingView, Platform, Alert, Animated, PanResponder, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { C, themed } from './theme';
import { t } from './i18n';

export const tap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

export const Header = ({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) => (
  <View style={s.header}>
    <View style={{ flex: 1 }}>
      <Text style={s.title}>{title}</Text>
      {!!subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
    </View>
    {right}
  </View>
);

export const Section = ({ children, action, onAction }: { children: string; action?: string; onAction?: () => void }) => (
  <View style={s.sectionRow}>
    <Text style={s.section}>{children}</Text>
    {!!action && <Pressable onPress={() => { tap(); onAction?.(); }} hitSlop={10}><Text style={s.sectionAction}>{action}</Text></Pressable>}
  </View>
);

export const Card = ({ children, style }: any) => <View style={[s.card, style]}>{children}</View>;

// Swipe left to reveal Delete (like Mail). Swipe far to delete instantly.
const ACTION_W = 88;
export const Row = ({ icon, color, title, sub, value, valueColor, onDelete, onPress, left, last, dim }: any) => {
  const x = useRef(new Animated.Value(0)).current;
  const h = useRef(new Animated.Value(1)).current;
  const open = useRef(false);
  const width = useRef(360);

  const snap = (to: number) => {
    open.current = to !== 0;
    Animated.spring(x, { toValue: to, useNativeDriver: false, friction: 8 }).start();
  };
  const remove = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    Animated.parallel([
      Animated.timing(x, { toValue: -width.current, duration: 200, useNativeDriver: false }),
      Animated.timing(h, { toValue: 0, duration: 220, delay: 120, useNativeDriver: false }),
    ]).start(() => onDelete?.());
  };

  const pan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => !!onDelete && Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
    onPanResponderTerminationRequest: () => false,
    onPanResponderMove: (_, g) => {
      const base = open.current ? -ACTION_W : 0;
      x.setValue(Math.min(0, base + g.dx));
    },
    onPanResponderRelease: (_, g) => {
      const pos = (open.current ? -ACTION_W : 0) + g.dx;
      if (pos < -width.current * 0.55) return remove();
      if (pos < -ACTION_W / 2 || g.vx < -0.6) { tap(); snap(-ACTION_W); } else snap(0);
    },
    onPanResponderTerminate: () => snap(0),
  })).current;

  const content = (
    <View style={[s.row, dim && { opacity: 0.45 }]}>
      {left}
      <View style={[s.badge, { backgroundColor: (color ?? C.primary) + '22' }]}>
        {icon.length <= 2
          ? <Text style={[s.badgeTxt, { color: color ?? C.primary }]}>{icon}</Text>
          : <Ionicons name={icon} size={19} color={color ?? C.primary} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.rowTitle} numberOfLines={1}>{title}</Text>
        {!!sub && <Text style={s.rowSub} numberOfLines={1}>{sub}</Text>}
      </View>
      <Text style={[s.rowVal, valueColor && { color: valueColor }]}>{value}</Text>
    </View>
  );

  if (!onDelete) return <Pressable disabled={!onPress} onPress={onPress} style={({ pressed }) => [!last && s.rowLine, pressed && { opacity: 0.6 }]}>{content}</Pressable>;

  return (
    <Animated.View
      onLayout={e => { width.current = e.nativeEvent.layout.width; }}
      style={[{ overflow: 'hidden', opacity: h, transform: [{ scaleY: h }] }, !last && s.rowLine]}>
      <View style={s.deleteWrap}>
        <Pressable onPress={remove} style={s.deleteBtn}>
          <Ionicons name="trash" size={20} color="#fff" />
          <Text style={s.deleteTxt}>{t('Delete')}</Text>
        </Pressable>
      </View>
      <Animated.View {...pan.panHandlers} style={{ backgroundColor: C.card, transform: [{ translateX: x }] }}>
        <Pressable onPress={() => (open.current ? snap(0) : onPress?.())}>{content}</Pressable>
      </Animated.View>
    </Animated.View>
  );
};

export const Empty = ({ icon, text, button, onPress }: { icon: any; text: string; button?: string; onPress?: () => void }) => (
  <View style={s.empty}>
    <View style={s.emptyIcon}><Ionicons name={icon} size={24} color={C.primary} /></View>
    <Text style={s.emptyTxt}>{text}</Text>
    {!!button && <Pressable onPress={() => { tap(); onPress?.(); }} style={s.emptyBtn}><Text style={s.emptyBtnTxt}>{button}</Text></Pressable>}
  </View>
);

export const AddBtn = ({ onPress, label }: { onPress: () => void; label?: string }) => (
  <Pressable onPress={() => { tap(); onPress(); }} style={s.add} hitSlop={10}>
    <Ionicons name="add" size={18} color="#fff" />
    <Text style={s.addTxt}>{label ?? t('Add')}</Text>
  </Pressable>
);

export const Chips = ({ options, value, onChange, colors, translate = true }: { options: string[]; value: string; onChange: (v: string) => void; colors?: Record<string, string>; translate?: boolean }) => (
  <View style={s.chips}>
    {options.map(o => {
      const on = o === value;
      return (
        <Pressable key={o} onPress={() => { tap(); onChange(o); }} style={[s.chip, on && { backgroundColor: colors?.[o] ?? C.primary }]}>
          <Text style={[s.chipTxt, on && { color: '#fff' }]}>{translate ? t(o) : o}</Text>
        </Pressable>
      );
    })}
  </View>
);

export const Field = ({ label, hint, style, ...p }: any) => (
  <View style={{ marginBottom: 16 }}>
    <Text style={s.label}>{label}</Text>
    <TextInput placeholderTextColor={C.sub + '99'} {...p} style={[s.input, style]} />
    {!!hint && <Text style={s.hint}>{hint}</Text>}
  </View>
);

export const Sheet = ({ visible, title, onClose, onSave, children, saveLabel }: any) => (
  <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.card }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.sheetHead}>
        <Pressable onPress={onClose} hitSlop={10}><Text style={s.cancel}>{t('Cancel')}</Text></Pressable>
        <Text style={s.sheetTitle}>{title}</Text>
        <View style={{ width: 50 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        {children}
        <Pressable onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); onSave(); }} style={s.saveBtn}>
          <Text style={s.saveTxt}>{saveLabel ?? t('Save ')}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  </Modal>
);

export const Hint = ({ children }: { children: string }) => <Text style={s.footHint}>{children}</Text>;

export const confirmDelete = (name: string, onYes: () => void) =>
  Alert.alert(t('Delete'), name, [{ text: t('Cancel'), style: 'cancel' }, { text: t('Delete'), style: 'destructive', onPress: onYes }]);


export const Toggle = ({ title, sub, value, onChange, icon, last }: { title: string; sub?: string; value: boolean; onChange: (v: boolean) => void; icon: any; last?: boolean }) => (
  <View style={[s.setRow, !last && s.rowLine]}>
    <View style={[s.setIcon]}><Ionicons name={icon} size={18} color={C.primary} /></View>
    <View style={{ flex: 1 }}>
      <Text style={s.rowTitle}>{title}</Text>
      {!!sub && <Text style={s.rowSub}>{sub}</Text>}
    </View>
    <Switch value={value} onValueChange={v => { tap(); onChange(v); }} trackColor={{ true: C.accent, false: C.line }} thumbColor="#fff" />
  </View>
);

export const Segmented = ({ options, value, onChange }: { options: { key: string; label: string }[]; value: string; onChange: (k: string) => void }) => (
  <View style={s.seg}>
    {options.map(o => (
      <Pressable key={o.key} onPress={() => { tap(); onChange(o.key); }} style={[s.segItem, value === o.key && s.segOn]}>
        <Text style={[s.segTxt, value === o.key && { color: '#fff' }]}>{o.label}</Text>
      </Pressable>
    ))}
  </View>
);

export const Progress = ({ value, color, height = 8 }: { value: number; color?: string; height?: number }) => (
  <View style={{ height, borderRadius: height / 2, backgroundColor: C.soft, overflow: 'hidden' }}>
    <View style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, height: '100%', borderRadius: height / 2, backgroundColor: color ?? C.accent }} />
  </View>
);

export const Check = ({ on, onPress, color }: { on: boolean; onPress: () => void; color?: string }) => (
  <Pressable hitSlop={10} onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); onPress(); }}
    style={[s.check, on && { backgroundColor: color ?? C.green, borderColor: color ?? C.green }]}>
    {on && <Ionicons name="checkmark" size={16} color="#fff" />}
  </Pressable>
);

export const num = (t?: string) => parseFloat((t ?? '').replace(/,/g, '')) || 0;

// Screens fade and drift up gently when you switch tabs
export const Screen = ({ children }: { children: React.ReactNode }) => {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(a, { toValue: 1, duration: 260, useNativeDriver: true }).start(); }, []);
  return (
    <Animated.ScrollView style={{ opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: 170 }} showsVerticalScrollIndicator={false}>
      {children}
    </Animated.ScrollView>
  );
};

const s = themed(() => StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 18 },
  title: { fontSize: 28, fontWeight: '700', color: C.ink, letterSpacing: -0.4 },
  subtitle: { fontSize: 15, color: C.sub, marginTop: 3 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, marginBottom: 10, paddingHorizontal: 4 },
  section: { fontSize: 17, fontWeight: '600', color: C.ink },
  sectionAction: { fontSize: 15, fontWeight: '500', color: C.accent },
  card: { backgroundColor: C.card, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 4, shadowColor: '#0F2440', shadowOpacity: 0.04, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 1 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  rowLine: { borderBottomWidth: 1, borderColor: C.line },
  deleteWrap: { direction: 'ltr', position: 'absolute', top: 0, bottom: 0, right: -14, left: 0, backgroundColor: C.red, alignItems: 'flex-end', justifyContent: 'center' },
  deleteBtn: { width: ACTION_W + 14, height: '100%', alignItems: 'center', justifyContent: 'center', gap: 3, paddingRight: 14 },
  deleteTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
  badge: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  badgeTxt: { fontWeight: '700', fontSize: 16 },
  rowTitle: { fontSize: 16, fontWeight: '500', color: C.ink },
  rowSub: { fontSize: 13, color: C.sub, marginTop: 3 },
  rowVal: { fontSize: 16, fontWeight: '600', color: C.ink },
  empty: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 10 },
  emptyIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: C.soft, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  emptyTxt: { color: C.sub, textAlign: 'center', fontSize: 15, lineHeight: 21 },
  emptyBtn: { marginTop: 14, backgroundColor: C.primary, paddingHorizontal: 20, paddingVertical: 11, borderRadius: 999 },
  emptyBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
  add: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.primary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999 },
  addTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 999, backgroundColor: C.soft },
  chipTxt: { fontWeight: '600', color: C.ink, fontSize: 15 },
  label: { fontSize: 14, fontWeight: '600', color: C.ink, marginBottom: 7 },
  input: { backgroundColor: C.soft, borderRadius: 14, padding: 15, fontSize: 17, color: C.ink },
  hint: { fontSize: 13, color: C.sub, marginTop: 6 },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderColor: C.line },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: C.ink },
  cancel: { fontSize: 16, color: C.sub, width: 50 },
  saveBtn: { backgroundColor: C.primary, borderRadius: 18, paddingVertical: 17, alignItems: 'center', marginTop: 8 },
  saveTxt: { color: '#fff', fontSize: 17, fontWeight: '600' },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  setIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: C.soft, alignItems: 'center', justifyContent: 'center' },
  seg: { flexDirection: 'row', backgroundColor: C.soft, borderRadius: 12, padding: 3, marginVertical: 8 },
  segItem: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  segOn: { backgroundColor: C.primary },
  segTxt: { fontWeight: '600', color: C.ink, fontSize: 14 },
  check: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: C.sub, alignItems: 'center', justifyContent: 'center' },
  footHint: { color: C.sub, fontSize: 13, textAlign: 'center', marginTop: 16 },
}));
