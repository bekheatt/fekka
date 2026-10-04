// Small card that slides down after a bank SMS is logged automatically: "Added L.E 58 · Oracle Ireland  [Undo]"
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../fonts';
import { C, themed } from '../../theme';
import { t } from '../../i18n';
import { tap } from '../../ui';

export type BannerInfo = { key: number; title: string; sub?: string; icon: string; color: string; onUndo?: () => void };

export default function Banner({ info, onHide }: { info: BannerInfo | null; onHide: () => void }) {
  const y = useRef(new Animated.Value(-160)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!info) return;
    Animated.spring(y, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
    const id = setTimeout(hide, 6000);
    return () => clearTimeout(id);
  }, [info?.key]);

  const hide = () => Animated.timing(y, { toValue: -160, duration: 200, useNativeDriver: true }).start(onHide);

  if (!info) return null;
  return (
    <Animated.View style={[s.wrap, { top: insets.top + 6, transform: [{ translateY: y }] }]}>
      <Pressable onPress={hide} style={s.card}>
        <View style={[s.icon, { backgroundColor: info.color + '1F' }]}><Ionicons name={info.icon as any} size={18} color={info.color} /></View>
        <View style={{ flex: 1 }}>
          <Text style={s.title} numberOfLines={1}>{info.title}</Text>
          {!!info.sub && <Text style={s.sub} numberOfLines={1}>{info.sub}</Text>}
        </View>
        {info.onUndo && (
          <Pressable onPress={() => { tap(); info.onUndo!(); hide(); }} hitSlop={10} style={s.undo}>
            <Text style={s.undoTxt}>{t('Undo')}</Text>
          </Pressable>
        )}
      </Pressable>
    </Animated.View>
  );
}

const s = themed(() => StyleSheet.create({
  wrap: { position: 'absolute', left: 12, right: 12, zIndex: 150 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: 20, padding: 12, borderWidth: 1, borderColor: C.line,
    shadowColor: '#14294A', shadowOpacity: 0.12, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '600', color: C.ink },
  sub: { fontSize: 13, color: C.sub, marginTop: 1 },
  undo: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: C.soft },
  undoTxt: { color: C.primary, fontWeight: '700', fontSize: 14 },
}));
