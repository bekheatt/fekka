import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert, I18nManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, themed } from '../theme';
import { useStore, Settings as S } from '../store';
import { Header, Section, Card, Screen, Toggle, Segmented, tap } from '../ui';
import { t } from '../i18n';
import { canUseLock } from '../Lock';
import { askPermission } from '../notify';
import { useCloud } from '../cloud/CloudProvider';
import { wasCancelled } from '../cloud/auth';

export default function Settings({ onBack }: { onBack?: () => void }) {
  const { d, set, reset, redoSetup } = useStore();
  const cloud = useCloud();
  const st = d.settings;
  const change = (patch: Partial<S>) => set(x => ({ ...x, settings: { ...x.settings, ...patch } }));

  const setLanguage = (lang: 'en' | 'ar') => {
    if (lang === st.lang) return;
    change({ lang });
    const rtl = lang === 'ar';
    if (I18nManager.isRTL !== rtl) {
      I18nManager.allowRTL(rtl);
      I18nManager.forceRTL(rtl);
      setTimeout(() => Alert.alert(t('Restart needed'), t('Close Fakka and open it again to switch the layout direction.')), 300);
    }
  };

  const setLock = async (on: boolean) => {
    if (on && !(await canUseLock())) return Alert.alert(t("Your device has no Face ID, fingerprint or passcode set up."));
    change({ lock: on });
  };

  const setNotify = async (on: boolean) => {
    if (on && !(await askPermission())) return Alert.alert(t('Notifications are off for Fakka in your phone settings.'));
    change({ notify: on });
  };

  const wipe = () => Alert.alert(t('Delete all data'), t('This removes everything you entered. It cannot be undone.'), [
    { text: t('Cancel'), style: 'cancel' },
    { text: t('Delete'), style: 'destructive', onPress: reset },
  ]);

  const removeAccount = () => Alert.alert(t('Delete your account?'), t('This deletes your Fakka account and everything backed up in it, and removes the data from this phone. It cannot be undone.'), [
    { text: t('Cancel'), style: 'cancel' },
    { text: t('Delete account'), style: 'destructive', onPress: async () => {
      try { await cloud.deleteAccount(); }
      catch (e: any) { if (!wasCancelled(e)) Alert.alert(t("Couldn't delete the account"), t('Please try again.')); }
    } },
  ]);

  const statusText = cloud.status === 'syncing' ? t('Backing up…') : cloud.status === 'error' ? t("Couldn't back up — will retry") : cloud.lastSynced
    ? t('Backed up at {x}', { x: cloud.lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }) : t('Backed up');

  return (
    <Screen>
      {onBack && (
        <Pressable onPress={() => { tap(); onBack(); }} hitSlop={10} style={s.back}>
          <Ionicons name="chevron-back" size={22} color={C.primary} />
          <Text style={s.backTxt}>{t('Profile')}</Text>
        </Pressable>
      )}
      <Header title={t('Settings')} subtitle={t('Personalise Fakka')} />

      {cloud.enabled && <>
        <Section>{t('Account')}</Section>
        <Card>
          {cloud.account ? <>
            <View style={[s.danger, { borderBottomWidth: 1, borderColor: C.line }]}>
              <View style={[s.icon, { backgroundColor: C.soft }]}><Ionicons name={cloud.account.provider === 'apple' ? 'logo-apple' : cloud.account.provider === 'google' ? 'logo-google' : 'person'} size={18} color={C.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={[s.dangerTxt, { color: C.ink }]} numberOfLines={1}>{cloud.account.name || cloud.account.email || t('Signed in')}</Text>
                <Text style={s.aboutVal} numberOfLines={1}>{statusText}</Text>
              </View>
              <Pressable onPress={() => { tap(); cloud.syncNow(); }} hitSlop={10}><Ionicons name="cloud-upload-outline" size={22} color={C.primary} /></Pressable>
            </View>
            <Pressable onPress={() => { tap(); cloud.signOut(); }} style={[s.danger, { borderBottomWidth: 1, borderColor: C.line }]}>
              <View style={[s.icon, { backgroundColor: C.soft }]}><Ionicons name="log-out-outline" size={18} color={C.primary} /></View>
              <Text style={[s.dangerTxt, { color: C.ink }]}>{t('Sign out')}</Text>
            </Pressable>
            <Pressable onPress={() => { tap(); removeAccount(); }} style={s.danger}>
              <View style={[s.icon, { backgroundColor: C.red + '22' }]}><Ionicons name="person-remove" size={18} color={C.red} /></View>
              <Text style={s.dangerTxt}>{t('Delete account')}</Text>
            </Pressable>
          </> : (
            <Pressable onPress={() => { tap(); change({ cloudSkipped: false }); }} style={s.danger}>
              <View style={[s.icon, { backgroundColor: C.soft }]}><Ionicons name="cloud-outline" size={18} color={C.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={[s.dangerTxt, { color: C.ink }]}>{t('Sign in to back up')}</Text>
                <Text style={s.aboutVal}>{t('Keep your data safe when you change phones')}</Text>
              </View>
            </Pressable>
          )}
        </Card>
      </>}

      <Section>{t('Appearance')}</Section>
      <Card style={{ paddingVertical: 12 }}>
        <Text style={s.lbl}>{t('Language')}</Text>
        <Segmented value={st.lang} onChange={k => setLanguage(k as any)} options={[{ key: 'en', label: 'English' }, { key: 'ar', label: 'العربية' }]} />
        <Text style={[s.lbl, { marginTop: 10 }]}>{t('Theme')}</Text>
        <Segmented value={st.theme} onChange={k => change({ theme: k as any })}
          options={[{ key: 'system', label: t('System') }, { key: 'light', label: t('Light') }, { key: 'dark', label: t('Dark') }]} />
      </Card>

      <Section>{t('Security')}</Section>
      <Card>
        <Toggle icon="finger-print" title={t('Lock with Face ID / fingerprint')} sub={t('Locks the moment you leave the app, like a banking app')} value={st.lock} onChange={setLock} />
        <Toggle icon="eye-off" title={t('Hide amounts')} sub={t('Show ••••• instead of numbers. Tap the eye on Home to switch quickly.')} value={!!st.hideAmounts} onChange={v => change({ hideAmounts: v })} last />
      </Card>

      <Section>{t('Notifications')}</Section>
      <Card>
        <Toggle icon="notifications" title={t('Payment reminders')} sub={t('The day before and on the due day, at 10 AM')} value={st.notify} onChange={setNotify} last />
      </Card>

      <Section>{t('Data')}</Section>
      <Card>
        <Pressable onPress={() => { tap(); redoSetup(); }} style={[s.danger, { borderBottomWidth: 1, borderColor: C.line }]}>
          <View style={[s.icon, { backgroundColor: C.soft }]}><Ionicons name="refresh" size={18} color={C.primary} /></View>
          <View style={{ flex: 1 }}>
            <Text style={[s.dangerTxt, { color: C.ink }]}>{t('Redo setup')}</Text>
            <Text style={s.aboutVal}>{t('Go through the welcome questions again')}</Text>
          </View>
        </Pressable>
        <Pressable onPress={() => { tap(); wipe(); }} style={s.danger}>
          <View style={[s.icon, { backgroundColor: C.red + '22' }]}><Ionicons name="trash" size={18} color={C.red} /></View>
          <Text style={[s.dangerTxt]}>{t('Delete all data')}</Text>
        </Pressable>
      </Card>

      <Section>{t('About')}</Section>
      <Card>
        <View style={s.about}><Text style={s.aboutLabel}>{t('Version')}</Text><Text style={s.aboutVal}>1.1.0</Text></View>
        <View style={[s.about, { borderTopWidth: 1, borderColor: C.line }]}><Text style={s.aboutLabel}>Fakka · فكّة</Text><Text style={s.aboutVal}>{t('Made for Egypt 🇪🇬')}</Text></View>
      </Card>
    </Screen>
  );
}

const s = themed(() => StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginLeft: -4 },
  backTxt: { color: C.primary, fontSize: 16, fontWeight: '600' },
  lbl: { fontSize: 14, fontWeight: '600', color: C.sub, marginTop: 4 },
  danger: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  icon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dangerTxt: { color: C.red, fontSize: 16, fontWeight: '600' },
  about: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14 },
  aboutLabel: { color: C.ink, fontSize: 15 },
  aboutVal: { color: C.sub, fontSize: 15 },
}));
