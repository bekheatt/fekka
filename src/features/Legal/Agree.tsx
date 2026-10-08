// "I agree to the Terms of Service and Privacy Policy" tick box. Never pre-ticked; both names open the full text.
import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Text } from '../../fonts';
import { C, themed } from '../../theme';
import { t } from '../../i18n';
import LegalDoc from './LegalDoc';
import type { LegalDocKey } from './documents';

export default function Agree({ on, onChange, warn }: { on: boolean; onChange: (v: boolean) => void; warn?: boolean }) {
  const [doc, setDoc] = useState<LegalDocKey | null>(null);
  const flip = () => { Haptics.selectionAsync().catch(() => {}); onChange(!on); };
  const bad = warn && !on;

  // "I agree to the {terms} and {privacy}", split so the two names can be links in either language
  const [before, rest = ''] = t('I agree to the {terms} and {privacy}').split('{terms}');
  const [middle, after = ''] = rest.split('{privacy}');

  return (
    <View>
      <View style={s.row}>
        <Pressable onPress={flip} hitSlop={12} accessibilityRole="checkbox" accessibilityState={{ checked: on }}
          accessibilityLabel={t('I agree to the Terms of Service and Privacy Policy')}
          style={[s.box, on && { backgroundColor: C.primary, borderColor: C.primary }, bad && { borderColor: C.red }]}>
          {on && <Ionicons name="checkmark" size={16} color="#fff" />}
        </Pressable>
        <Text style={s.txt} onPress={flip}>
          {before}
          <Text style={s.link} onPress={() => setDoc('terms')} accessibilityRole="link">{t('Terms of Service')}</Text>
          {middle}
          <Text style={s.link} onPress={() => setDoc('privacy')} accessibilityRole="link">{t('Privacy Policy')}</Text>
          {after}
        </Text>
      </View>
      {bad && <Text style={s.warn} accessibilityLiveRegion="polite">{t('Please accept the Terms of Service and Privacy Policy to continue.')}</Text>}
      <LegalDoc doc={doc} onClose={() => setDoc(null)} />
    </View>
  );
}

const s = themed(() => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  box: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: C.sub, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  txt: { flex: 1, fontSize: 14, lineHeight: 21, color: C.sub },
  link: { color: C.primary, fontWeight: '600', textDecorationLine: 'underline' },
  warn: { fontSize: 13, color: C.red, marginTop: 6, marginStart: 36 },
}));
