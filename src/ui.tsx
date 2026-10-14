import React, { useEffect, useRef } from 'react';
import { View, Pressable, StyleSheet, Modal, ScrollView, KeyboardAvoidingView, Platform, Alert, Animated, Switch, AccessibilityInfo, Easing, I18nManager } from 'react-native';
import { Text, TextInput } from './fonts';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { C, themed } from './theme';
import { t } from './i18n';

// Gentle press feedback for buttons: style={({ pressed }) => [s.btn, pressed && pressedStyle]}
export const pressedStyle = { opacity: 0.85, transform: [{ scale: 0.98 }] };

export const tap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

// A sideways-scrolling row. In Arabic the iPhone still opens it at the left end, which cuts off the
// first item on the right, so jump to the start (the right end) once the row knows its size.
export const HScroll = ({ children, ...p }: any) => {
  const ref = useRef<ScrollView>(null);
  return (
    <ScrollView ref={ref} horizontal showsHorizontalScrollIndicator={false} {...p}
      onContentSizeChange={() => { if (I18nManager.isRTL) ref.current?.scrollToEnd({ animated: false }); }}>
      {children}
    </ScrollView>
  );
};

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

// Padded card for summaries (the big numbers at the top of each screen)
export const Panel = ({ children, style }: any) => <View style={[s.card, { padding: 20, paddingVertical: 20 }, style]}>{children}</View>;

// Tinted circle with an icon in it
export const Bubble = ({ icon, color, size = 40 }: { icon: any; color: string; size?: number }) => (
  <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color + '1F', alignItems: 'center', justifyContent: 'center' }}>
    <Ionicons name={icon} size={size * 0.5} color={color} />
  </View>
);

// Thin multi-colour bar (budget split, savings split)
export const SplitBar = ({ parts, height = 10 }: { parts: { v: number; c: string }[]; height?: number }) => {
  const shown = parts.filter(p => p.v > 0);
  return (
    <View style={{ flexDirection: 'row', height, gap: 3, borderRadius: height / 2, overflow: 'hidden', backgroundColor: shown.length ? 'transparent' : C.soft }}>
      {shown.map((p, i) => <View key={i} style={{ flex: p.v, backgroundColor: p.c, borderRadius: height / 2 }} />)}
    </View>
  );
};

// A list row. Tap opens the item's edit screen, which has the Delete button.
export const Row = ({ icon, color, title, sub, value, valueColor, onPress, left, last, dim }: any) => {
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

  return <Pressable disabled={!onPress} onPress={onPress} style={({ pressed }) => [!last && s.rowLine, pressed && { opacity: 0.6 }]}>{content}</Pressable>;
};

export const Empty = ({ icon, text, button, onPress }: { icon: any; text: string; button?: string; onPress?: () => void }) => (
  <View style={s.empty}>
    <View style={s.emptyIcon}><Ionicons name={icon} size={24} color={C.primary} /></View>
    <Text style={s.emptyTxt}>{text}</Text>
    {!!button && <Pressable onPress={() => { tap(); onPress?.(); }} style={({ pressed }) => [s.emptyBtn, pressed && pressedStyle]}><Text style={s.emptyBtnTxt}>{button}</Text></Pressable>}
  </View>
);

export const AddBtn = ({ onPress, label }: { onPress: () => void; label?: string }) => (
  <Pressable onPress={() => { tap(); onPress(); }} style={({ pressed }) => [s.add, pressed && pressedStyle]} hitSlop={10}>
    <Ionicons name="add" size={18} color="#fff" />
    <Text style={s.addTxt}>{label ?? t('Add')}</Text>
  </Pressable>
);

export const Chips = ({ options, value, onChange, colors, translate = true }: { options: string[]; value: string; onChange: (v: string) => void; colors?: Record<string, string>; translate?: boolean }) => (
  <View style={s.chips}>
    {options.map(o => {
      const on = o === value;
      return (
        <Pressable key={o} onPress={() => { tap(); onChange(o); }} style={({ pressed }) => [s.chip, on && { backgroundColor: colors?.[o] ?? C.primary }, pressed && { opacity: 0.7 }]}>
          <Text style={[s.chipTxt, on && { color: '#fff' }]}>{translate ? t(o) : o}</Text>
        </Pressable>
      );
    })}
  </View>
);

// error: red text under the field (and a red outline), e.g. when Save was tapped with no amount
export const Field = ({ label, hint, error, style, ...p }: any) => (
  <View style={{ marginBottom: 16 }}>
    <Text style={s.label}>{label}</Text>
    <TextInput placeholderTextColor={C.sub + '99'} {...p} style={[s.input, !!error && s.inputErr, style]} />
    {!!error ? <Text style={s.err} accessibilityLiveRegion="polite">{error}</Text> : !!hint && <Text style={s.hint}>{hint}</Text>}
  </View>
);

// Amounts: a positive number is required before anything can be saved
export const amountError = (tried: boolean, v: string | undefined) => (tried && !(num(v ?? '') > 0) ? t('Enter an amount to save') : '');

// onSave can return false when something is missing: the sheet stays open and buzzes.
// onDelete (when editing) adds a Delete button under Save that asks first.
export const Sheet = ({ visible, title, onClose, onSave, children, saveLabel, onDelete, deleteName }: any) => (
  <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.card }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.sheetHead}>
        <Pressable onPress={onClose} hitSlop={10}><Text style={s.cancel}>{t('Cancel')}</Text></Pressable>
        <Text style={s.sheetTitle}>{title}</Text>
        <View style={{ width: 50 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        {children}
        <Pressable onPress={() => { const ok = onSave() !== false; Haptics.notificationAsync(ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error).catch(() => {}); }} style={({ pressed }) => [s.saveBtn, pressed && pressedStyle]}>
          <Text style={s.saveTxt}>{saveLabel ?? t('Save ')}</Text>
        </Pressable>
        {!!onDelete && (
          <Pressable onPress={() => { tap(); confirmDelete(deleteName ?? title, onDelete); }} accessibilityRole="button" style={({ pressed }) => [s.delBtn, pressed && { opacity: 0.6 }]}>
            <Ionicons name="trash-outline" size={18} color={C.red} />
            <Text style={s.delTxt}>{t('Delete')}</Text>
          </Pressable>
        )}
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
    <Switch accessibilityLabel={title} value={value} onValueChange={v => { tap(); onChange(v); }} trackColor={{ true: C.accent, false: C.line }} thumbColor="#fff" />
  </View>
);

export const Segmented = ({ options, value, onChange }: { options: { key: string; label: string }[]; value: string; onChange: (k: string) => void }) => (
  <View style={s.seg}>
    {options.map(o => (
      <Pressable key={o.key} onPress={() => { tap(); onChange(o.key); }} style={[s.segItem, value === o.key && s.segOn]}>
        <Text style={[s.segTxt, value === o.key && { color: C.ink }]}>{o.label}</Text>
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
  <Pressable hitSlop={10} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={t('Paid')} onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); onPress(); }}
    style={[s.check, on && { backgroundColor: color ?? C.green, borderColor: color ?? C.green }]}>
    {on && <Ionicons name="checkmark" size={16} color="#fff" />}
  </Pressable>
);

// Arabic keyboards type ٠١٢٣… and ٫ — read those too
export const num = (t?: string) => parseFloat((t ?? '')
  .replace(/[٠-٩]/g, c => String(c.charCodeAt(0) - 0x0660)).replace(/[۰-۹]/g, c => String(c.charCodeAt(0) - 0x06f0))
  .replace(/٫/g, '.').replace(/[,٬]/g, '')) || 0;

// Screens fade and drift up gently when you switch tabs
export const Screen = ({ children }: { children: React.ReactNode }) => {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(still => {
      if (still) a.setValue(1);
      else Animated.timing(a, { toValue: 1, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    });
  }, []);
  return (
    <Animated.ScrollView style={{ opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }}
      contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 10, paddingBottom: 170 }} showsVerticalScrollIndicator={false}>
      {children}
    </Animated.ScrollView>
  );
};

const s = themed(() => StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10, marginBottom: 18 },
  title: { fontSize: 28, fontWeight: '700', color: C.ink, letterSpacing: -0.4 },
  subtitle: { fontSize: 15, color: C.sub, marginTop: 3 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 30, marginBottom: 12, paddingHorizontal: 2 },
  section: { fontSize: 17, fontWeight: '700', color: C.ink },
  sectionAction: { fontSize: 14, fontWeight: '600', color: C.accent },
  card: { backgroundColor: C.card, borderRadius: 24, paddingHorizontal: 18, paddingVertical: 4, shadowColor: '#14294A', shadowOpacity: 0.06, shadowRadius: 20, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, gap: 12 },
  rowLine: { borderBottomWidth: 1, borderColor: C.line },
  badge: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  badgeTxt: { fontWeight: '700', fontSize: 16 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: C.ink },
  rowSub: { fontSize: 13, color: C.sub, marginTop: 3 },
  rowVal: { fontSize: 15, fontWeight: '600', color: C.ink },
  empty: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 10 },
  emptyIcon: { width: 52, height: 52, borderRadius: 18, backgroundColor: C.soft, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  emptyTxt: { color: C.sub, textAlign: 'center', fontSize: 15, lineHeight: 21 },
  emptyBtn: { marginTop: 14, backgroundColor: C.primary, paddingHorizontal: 20, paddingVertical: 11, borderRadius: 12 },
  emptyBtnTxt: { color: '#fff', fontWeight: '600', fontSize: 15 },
  add: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.primary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  addTxt: { color: '#fff', fontWeight: '600', fontSize: 15 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, backgroundColor: C.soft },
  chipTxt: { fontWeight: '600', color: C.ink, fontSize: 15 },
  label: { fontSize: 14, fontWeight: '600', color: C.ink, marginBottom: 7 },
  input: { backgroundColor: C.soft, borderRadius: 14, padding: 15, fontSize: 17, color: C.ink },
  hint: { fontSize: 13, color: C.sub, marginTop: 6 },
  err: { fontSize: 13, color: C.red, marginTop: 6, fontWeight: '500' },
  inputErr: { borderWidth: 1.5, borderColor: C.red },
  delBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, marginTop: 6 },
  delTxt: { color: C.red, fontSize: 16, fontWeight: '600' },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderColor: C.line },
  sheetTitle: { fontSize: 17, fontWeight: '600', color: C.ink },
  cancel: { fontSize: 16, color: C.sub, width: 50 },
  saveBtn: { backgroundColor: C.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  saveTxt: { color: '#fff', fontSize: 17, fontWeight: '600' },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  setIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: C.soft, alignItems: 'center', justifyContent: 'center' },
  seg: { flexDirection: 'row', backgroundColor: C.line, borderRadius: 14, padding: 4, marginVertical: 8 },
  segItem: { flex: 1, paddingVertical: 9, borderRadius: 11, alignItems: 'center' },
  segOn: { backgroundColor: C.card, shadowColor: '#14294A', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  segTxt: { fontWeight: '600', color: C.sub, fontSize: 14 },
  check: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: C.sub, alignItems: 'center', justifyContent: 'center' },
  footHint: { color: C.sub, fontSize: 13, textAlign: 'center', marginTop: 16 },
}));
