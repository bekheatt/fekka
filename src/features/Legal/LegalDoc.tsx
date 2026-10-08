// Full-screen, scrollable Privacy Policy / Terms of Service (opened from the sign-in screen and Settings)
import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../fonts';
import { C, themed } from '../../theme';
import { t, getLang } from '../../i18n';
import { tap } from '../../ui';
import { APP_NAME } from '../../brand';
import { LEGAL_DOCS, LegalDocKey, blocks } from './documents';

export default function LegalDoc({ doc, onClose }: { doc: LegalDocKey | null; onClose: () => void }) {
  const d = doc ? LEGAL_DOCS[doc] : null;
  const parts = useMemo(() => (d ? blocks(d.body.split('Fakka').join(APP_NAME)) : []), [d]);

  return (
    <Modal visible={!!d} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView style={s.wrap}>
        <View style={s.head}>
          <Pressable onPress={() => { tap(); onClose(); }} hitSlop={12} style={s.close} accessibilityRole="button" accessibilityLabel={t('Close')}>
            <Ionicons name="close" size={22} color={C.ink} />
          </Pressable>
          <Text style={s.headTitle} numberOfLines={1}>{d ? t(d.title) : ''}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* The documents are in English, so they always read left to right */}
        <ScrollView contentContainerStyle={s.body} style={{ direction: 'ltr' }}>
          <Text style={s.title} accessibilityRole="header">{d?.title}</Text>
          {getLang() === 'ar' && <Text style={s.note}>{t('This document is in English. The English version is the one that applies.')}</Text>}
          {parts.map((b, i) => {
            if (b.kind === 'h2') return <Text key={i} style={s.h2} accessibilityRole="header">{b.text}</Text>;
            if (b.kind === 'h3') return <Text key={i} style={s.h3} accessibilityRole="header">{b.text}</Text>;
            if (b.kind === 'li') return (
              <View key={i} style={s.li}>
                <Text style={s.dot}>•</Text>
                <Text style={[s.p, { flex: 1, marginBottom: 0 }]}>{b.text}</Text>
              </View>
            );
            return <Text key={i} style={i === 0 ? s.meta : s.p}>{b.text}</Text>;
          })}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const s = themed(() => StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderColor: C.line },
  close: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  headTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '600', color: C.ink },
  body: { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 60 },
  title: { fontSize: 28, fontWeight: '700', color: C.ink, textAlign: 'left', marginBottom: 10 },
  note: { fontSize: 14, color: C.sub, backgroundColor: C.soft, borderRadius: 12, padding: 12, marginBottom: 12, overflow: 'hidden', textAlign: 'right', writingDirection: 'rtl' },
  meta: { fontSize: 13, color: C.sub, lineHeight: 20, marginBottom: 14, textAlign: 'left' },
  h2: { fontSize: 19, fontWeight: '700', color: C.ink, marginTop: 22, marginBottom: 8, textAlign: 'left' },
  h3: { fontSize: 16, fontWeight: '600', color: C.ink, marginTop: 12, marginBottom: 6, textAlign: 'left' },
  p: { fontSize: 15, color: C.ink, lineHeight: 23, marginBottom: 10, textAlign: 'left' },
  li: { flexDirection: 'row', gap: 8, marginBottom: 8, paddingLeft: 4 },
  dot: { fontSize: 15, color: C.primary, lineHeight: 23 },
}));
