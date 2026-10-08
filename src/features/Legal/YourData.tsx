// Settings → Legal & Privacy → Your data: where everything is kept, what you agreed to, and a copy to take away.
import React from 'react';
import { View, StyleSheet, Pressable, Modal, ScrollView, Share, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../fonts';
import { C, themed } from '../../theme';
import { t, locale } from '../../i18n';
import { tap } from '../../ui';
import { useStore, hasAccount } from '../../store';
import { shared } from '../../cloud/sync';
import { APP_NAME } from '../../brand';

export default function YourData({ visible, onClose, onDelete }: { visible: boolean; onClose: () => void; onDelete: () => void }) {
  const { d } = useStore();
  const st = d.settings;
  const online = hasAccount(st);
  const accepted = st.consent ? new Date(st.consent.at).toLocaleString(locale(), { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

  // Everything you entered, as a JSON file's text, through the phone's share sheet (save to Files, email…)
  const exportData = async () => {
    tap();
    const copy = { exportedAt: new Date().toISOString(), app: APP_NAME, account: online ? { email: st.email, signIn: st.account } : 'guest', data: shared(d) };
    try { await Share.share({ title: t('My {app} data', { app: APP_NAME }), message: JSON.stringify(copy, null, 2) }); }
    catch { Alert.alert(t("Couldn't open sharing on this phone.")); }
  };

  const rows: { icon: any; title: string; sub: string }[] = [
    online
      ? { icon: 'cloud-done', title: t('Your account'), sub: t('{e} · signed in with {how}', { e: st.email ?? '', how: st.account === 'google' ? 'Google' : t('email') }) }
      : { icon: 'phone-portrait', title: t('Guest mode'), sub: t('Nothing is sent to our servers') },
    { icon: 'server', title: t('Your money data'), sub: online ? t('On this phone, and in your account on secure servers in the EU (Germany)') : t('Only on this phone') },
    { icon: 'image', title: t('Receipt photos'), sub: t('Only on this phone, never uploaded') },
    { icon: 'finger-print', title: t('Face ID / fingerprint'), sub: t('Checked by your phone. Fakka never sees it.') },
    { icon: 'chatbubble-ellipses', title: t('Bank messages'), sub: st.smsKey ? t('On. Only the amount, shop and date are kept, never the message.') : t('Off') },
    { icon: 'people', title: t('Shared shop categories'), sub: online ? t('Shop categories you pick help others, without your name') : t('Off for guests') },
    { icon: 'megaphone', title: t('Ads and tracking'), sub: t('None. We never sell your data.') },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={s.head}>
          <View style={{ width: 50 }} />
          <Text style={s.title}>{t('Your data')}</Text>
          <Pressable onPress={onClose} hitSlop={10}><Text style={s.done}>{t('Done')}</Text></Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 50 }}>
          <View style={s.card}>
            {rows.map((r, i) => (
              <View key={r.title} style={[s.row, i < rows.length - 1 && s.line]}>
                <View style={s.icon}><Ionicons name={r.icon} size={18} color={C.primary} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.rowTitle}>{r.title}</Text>
                  <Text style={s.rowSub}>{r.sub}</Text>
                </View>
              </View>
            ))}
          </View>

          {!!st.consent && (
            <Text style={s.foot}>{t('You accepted the Terms of Service and Privacy Policy (version {v}) on {d}.', { v: st.consent.terms, d: accepted })}</Text>
          )}

          <View style={[s.card, { marginTop: 18 }]}>
            <Pressable onPress={exportData} style={[s.row, s.line]} accessibilityRole="button">
              <View style={s.icon}><Ionicons name="download" size={18} color={C.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle}>{t('Export my data')}</Text>
                <Text style={s.rowSub}>{t('A copy of everything you entered, to save or send')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.sub} />
            </Pressable>
            <Pressable onPress={() => { tap(); onDelete(); }} style={s.row} accessibilityRole="button">
              <View style={[s.icon, { backgroundColor: C.red + '22' }]}><Ionicons name="trash" size={18} color={C.red} /></View>
              <Text style={[s.rowTitle, { color: C.red, flex: 1 }]}>{t(online ? 'Delete account' : 'Delete all data')}</Text>
              <Ionicons name="chevron-forward" size={18} color={C.sub} />
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const s = themed(() => StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderColor: C.line, backgroundColor: C.card },
  title: { fontSize: 17, fontWeight: '600', color: C.ink },
  done: { fontSize: 16, color: C.primary, fontWeight: '600', width: 50, textAlign: 'right' },
  card: { backgroundColor: C.card, borderRadius: 24, paddingHorizontal: 18, paddingVertical: 4, shadowColor: '#14294A', shadowOpacity: 0.06, shadowRadius: 20, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  line: { borderBottomWidth: 1, borderColor: C.line },
  icon: { width: 34, height: 34, borderRadius: 10, backgroundColor: C.soft, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 15, fontWeight: '600', color: C.ink },
  rowSub: { fontSize: 13, color: C.sub, marginTop: 3, lineHeight: 18 },
  foot: { fontSize: 13, color: C.sub, textAlign: 'center', marginTop: 14, lineHeight: 19, paddingHorizontal: 8 },
}));
