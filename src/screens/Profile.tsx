import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, TextInput } from '../fonts';
import { Ionicons } from '@expo/vector-icons';
import { C, le, leShort, themed } from '../theme';
import { useStore, useTotals, ym } from '../store';
import { Header, Section, Card, Screen, tap } from '../ui';
import { t, locale } from '../i18n';
import Settings from './Settings';

const WORK_LABEL: Record<string, string> = { employee: 'Employee', freelancer: 'Freelancer', business: 'Business owner', student: 'Student', retired: 'Retired', other: 'Other' };

export default function Profile() {
  const { d, set } = useStore();
  const tot = useTotals();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(d.settings.name);
  const [showSettings, setShowSettings] = useState(false);

  const initials = d.settings.name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('') || '؟';
  const since = new Date(d.settings.since).toLocaleDateString(locale(), { month: 'long', year: 'numeric' });
  const saveName = () => { set(x => ({ ...x, settings: { ...x.settings, name: name.trim() } })); setEditing(false); };

  const savedThisMonth = Math.max(0, tot.left);
  const rate = tot.income > 0 ? Math.round((savedThisMonth / tot.income) * 100) : 0;
  const debtMonths = Math.max(0,
    ...d.installments.map(i => i.monthsLeft),
    ...d.loans.map(l => (l.monthly > 0 ? Math.ceil(l.remaining / l.monthly) : 0)));
  const m = ym();

  if (showSettings) return <Settings onBack={() => setShowSettings(false)} />;

  return (
    <Screen>
      <Header title={t('Profile')} subtitle={t('Your money at a glance')}
        right={<Pressable onPress={() => { tap(); setShowSettings(true); }} hitSlop={10} style={s.gear} accessibilityRole="button" accessibilityLabel={t('Settings')}><Ionicons name="settings-outline" size={22} color={C.primary} /></Pressable>} />

      <View style={s.card}>
        <View style={s.avatar}><Text style={s.avatarTxt}>{initials}</Text></View>
        {editing ? (
          <View style={s.editRow}>
            <TextInput value={name} onChangeText={setName} autoFocus placeholder={t('Your name')} placeholderTextColor={C.sub}
              style={s.input} onSubmitEditing={saveName} returnKeyType="done" />
            <Pressable onPress={saveName} style={s.ok}><Ionicons name="checkmark" size={20} color="#fff" /></Pressable>
          </View>
        ) : (
          <Pressable onPress={() => setEditing(true)} style={s.nameRow}>
            <Text style={s.name}>{d.settings.name || t('Tap to add your name')}</Text>
            <Ionicons name="pencil" size={15} color={C.pale} />
          </Pressable>
        )}
        {!!d.settings.work && <Text style={s.work}>{t(WORK_LABEL[d.settings.work])}</Text>}
        <Text style={s.since}>{t('Member since {d}', { d: since })}</Text>
      </View>

      <View style={s.grid}>
        <Stat icon="trending-up" color={C.accent} label={t('Net worth')} value={leShort(tot.netWorth)} />
        <Stat icon="wallet" color={C.green} label={t('Saved this month')} value={leShort(savedThisMonth)} />
        <Stat icon="pie-chart" color={C.sky} label={t('Savings rate')} value={`${rate}%`} />
        <Stat icon="flag" color={C.orange} label={t('Debt-free in')} value={debtMonths ? t('{n} months', { n: debtMonths }) : t('No debt')} />
      </View>

      <Section>{t('Your numbers')}</Section>
      <Card>
        <Line label={t('Expenses logged')} value={String(d.expenses.length)} />
        <Line label={t('This month')} value={le(tot.spent)} />
        <Line label={t('Active installments')} value={String(d.installments.filter(i => i.monthsLeft > 0).length)} />
        <Line label={t('Bills')} value={String(d.bills.length)} />
        <Line label={t("Gam'eya")} value={String(d.gameyas.length)} />
        <Line label={t('Goals')} value={String(d.goals.length)} />
        <Line label={t('Due this month')} value={`${tot.due.filter(x => x.paid).length}/${tot.due.length} ${t('paid')}`} last />
      </Card>

      <Pressable onPress={() => { tap(); setShowSettings(true); }} style={s.settingsBtn}>
        <View style={s.settingsIcon}><Ionicons name="settings" size={18} color={C.primary} /></View>
        <View style={{ flex: 1 }}>
          <Text style={s.settingsTitle}>{t('Settings')}</Text>
          <Text style={s.settingsSub}>{t('Language, theme, Face ID, reminders')}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={C.sub} />
      </Pressable>
    </Screen>
  );
}

const Stat = ({ icon, color, label, value }: any) => (
  <View style={s.stat}>
    <View style={[s.statIcon, { backgroundColor: color + '22' }]}><Ionicons name={icon} size={18} color={color} /></View>
    <Text style={s.statLabel}>{label}</Text>
    <Text style={s.statVal} adjustsFontSizeToFit numberOfLines={1}>{value}</Text>
  </View>
);

const Line = ({ label, value, last }: any) => (
  <View style={[s.line, !last && { borderBottomWidth: 1, borderColor: C.line }]}>
    <Text style={s.lineLabel}>{label}</Text>
    <Text style={s.lineVal}>{value}</Text>
  </View>
);

const s = themed(() => StyleSheet.create({
  gear: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  settingsBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: 20, padding: 16, marginTop: 16 },
  settingsIcon: { width: 38, height: 38, borderRadius: 8, backgroundColor: C.soft, alignItems: 'center', justifyContent: 'center' },
  settingsTitle: { fontSize: 16, fontWeight: '700', color: C.ink },
  settingsSub: { fontSize: 13, color: C.sub, marginTop: 2 },
  card: { backgroundColor: C.hero, borderRadius: 24, padding: 24, alignItems: 'center' },
  avatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)', alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: '#fff', fontSize: 32, fontWeight: '700' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  name: { color: '#fff', fontSize: 22, fontWeight: '700' },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, alignSelf: 'stretch' },
  input: { flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', color: '#fff', borderRadius: 10, padding: 12, fontSize: 17, textAlign: 'center' },
  ok: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  since: { color: C.pale, fontSize: 13, marginTop: 6 },
  work: { color: '#fff', fontSize: 13, fontWeight: '700', marginTop: 8, backgroundColor: 'rgba(255,255,255,0.14)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, overflow: 'hidden' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 14 },
  stat: { width: '47.5%', backgroundColor: C.card, borderRadius: 14, padding: 16 },
  statIcon: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statLabel: { color: C.sub, fontSize: 14 },
  statVal: { color: C.ink, fontSize: 20, fontWeight: '700', marginTop: 3 },
  line: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14 },
  lineLabel: { color: C.ink, fontSize: 15 },
  lineVal: { color: C.ink, fontSize: 15, fontWeight: '700' },
}));
