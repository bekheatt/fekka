// Home-screen card for the Financial Health Score + a detail sheet when tapped
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, themed } from '../../theme';
import { useStore, useTotals, ym } from '../../store';
import { Progress, tap } from '../../ui';
import { t } from '../../i18n';
import { calculateHealthScore, Band, HealthScore } from './calculator';
import { isHealthScoreEnabled } from './config';

export const bandColor = (b: Band) =>
  b === 'Excellent' || b === 'Healthy' ? C.green : b === 'Fair' ? '#E0AA3E' : b === 'Warning' ? C.orange : C.red;

const BAND_MSG: Record<Band, string> = {
  Excellent: "You're in great shape. Keep building.",
  Healthy: "You're on the right track.",
  Fair: 'Room to improve — start with the tips below.',
  Warning: 'Your finances are fragile. Hold off on new installments.',
  Critical: 'Act now: cut commitments before adding anything new.',
};

// Last month's score, so we can show "+4 since last month"
function previousScore(history: Record<string, number> | undefined, now: string) {
  const keys = Object.keys(history ?? {}).filter(k => k < now).sort();
  return keys.length ? history![keys[keys.length - 1]] : undefined;
}

export default function HealthCard({ onAddIncome }: { onAddIncome: () => void }) {
  if (!isHealthScoreEnabled()) return null;
  return <Inner onAddIncome={onAddIncome} />;
}

function Inner({ onAddIncome }: { onAddIncome: () => void }) {
  const { d, set } = useStore();
  const tot = useTotals();
  const [open, setOpen] = useState(false);
  const hs = calculateHealthScore(d, tot);
  const m = ym();

  // Save one score per month (overwritten until the month ends) for the trend
  useEffect(() => {
    if (hs && d.scoreHistory?.[m] !== hs.score) set(x => ({ ...x, scoreHistory: { ...(x.scoreHistory ?? {}), [m]: hs.score } }));
  }, [hs?.score, m]);

  if (!hs) {
    return (
      <Pressable style={s.top} onPress={() => { tap(); onAddIncome(); }}>
        <View style={s.head}>
          <Ionicons name="pulse" size={18} color={C.primary} />
          <Text style={s.title}>{t('Financial health')}</Text>
        </View>
        <Text style={s.emptyTxt}>{t('Add your income to see your health score')}</Text>
      </Pressable>
    );
  }

  const color = bandColor(hs.band);
  const prev = previousScore(d.scoreHistory, m);
  const change = prev === undefined ? undefined : hs.score - prev;

  return (
    <>
      <Pressable style={({ pressed }) => [s.top, pressed && { opacity: 0.8 }]} onPress={() => { tap(); setOpen(true); }}>
        <View style={s.head}>
          <Ionicons name="pulse" size={18} color={color} />
          <Text style={s.title}>{t('Financial health')}</Text>
          <Ionicons name="chevron-forward" size={18} color={C.sub} style={{ marginLeft: 'auto' }} />
        </View>
        <View style={s.scoreRow}>
          <Text style={[s.score, { color }]}>{hs.score}</Text>
          <Text style={s.outOf}>/100</Text>
          <View style={[s.badge, { backgroundColor: color + '1F' }]}>
            <Text style={[s.badgeTxt, { color }]}>{t(hs.band)}</Text>
          </View>
        </View>
        <Progress value={hs.score / 100} color={color} height={8} />
        {change !== undefined && change !== 0 && (
          <Text style={[s.trend, { color: change > 0 ? C.green : C.red }]}>
            {t(change > 0 ? '▲ {n} since last month' : '▼ {n} since last month', { n: Math.abs(change) })}
          </Text>
        )}
      </Pressable>
      <Detail hs={hs} visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

function Detail({ hs, visible, onClose }: { hs: HealthScore; visible: boolean; onClose: () => void }) {
  const color = bandColor(hs.band);
  const weakest = [...hs.parts].sort((a, b) => a.score - b.score).filter(p => p.score < 80).slice(0, 3);
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={s.sheetHead}>
          <Text style={s.sheetTitle}>{t('Financial health')}</Text>
          <Pressable onPress={onClose} hitSlop={10}><Text style={s.done}>{t('Done')}</Text></Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 60 }}>
          <View style={[s.bigCard, { borderColor: color + '55' }]}>
            <Text style={[s.bigScore, { color }]}>{hs.score}</Text>
            <Text style={[s.bigBand, { color }]}>{t(hs.band)}</Text>
            <Text style={s.bigMsg}>{t(BAND_MSG[hs.band])}</Text>
          </View>

          {weakest.length > 0 && <>
            <Text style={s.section}>{t('Improve your score')}</Text>
            <View style={s.card}>
              {weakest.map((p, i) => (
                <View key={p.key} style={[s.tipRow, i < weakest.length - 1 && s.line]}>
                  <View style={s.tipN}><Text style={s.tipNTxt}>{i + 1}</Text></View>
                  <Text style={s.tipTxt}>{p.tip}</Text>
                </View>
              ))}
            </View>
          </>}

          <Text style={s.section}>{t("What's in your score")}</Text>
          <View style={s.card}>
            {hs.parts.map((p, i) => {
              const pc = p.score >= 80 ? C.green : p.score >= 60 ? '#E0AA3E' : p.score >= 40 ? C.orange : C.red;
              return (
                <View key={p.key} style={[{ paddingVertical: 12 }, i < hs.parts.length - 1 && s.line]}>
                  <View style={s.partHead}>
                    <Text style={s.partName}>{t(p.label)}</Text>
                    <Text style={s.partWeight}>{Math.round(p.weight * 100)}%</Text>
                    <Text style={[s.partScore, { color: pc }]}>{p.score}</Text>
                  </View>
                  <Progress value={p.score / 100} color={pc} />
                  <Text style={s.partDetail}>{p.detail}</Text>
                </View>
              );
            })}
          </View>
          <Text style={s.foot}>{t('Your score is calculated on your phone from the numbers you entered. It updates as you add payments, savings and income.')}</Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

const s = themed(() => StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: 20, padding: 16, marginTop: 14 },
  top: { backgroundColor: C.card, borderRadius: 24, padding: 20, marginBottom: 14, shadowColor: '#0F2440', shadowOpacity: 0.05, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 16, fontWeight: '600', color: C.ink },
  emptyTxt: { color: C.sub, fontSize: 14, marginTop: 8 },
  scoreRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 8, marginBottom: 12 },
  score: { fontSize: 50, fontWeight: '700', letterSpacing: -1, lineHeight: 56 },
  outOf: { fontSize: 17, color: C.sub, fontWeight: '600', marginLeft: 4, marginBottom: 6 },
  badge: { marginLeft: 'auto', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 6 },
  badgeTxt: { fontSize: 14, fontWeight: '600' },
  trend: { fontSize: 13, fontWeight: '600', marginTop: 10 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, paddingTop: 22 },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: C.ink },
  done: { fontSize: 17, fontWeight: '700', color: C.primary },
  bigCard: { backgroundColor: C.card, borderRadius: 26, padding: 24, alignItems: 'center', borderWidth: 2 },
  bigScore: { fontSize: 68, fontWeight: '700', letterSpacing: -1.5 },
  bigBand: { fontSize: 20, fontWeight: '800', marginTop: -4 },
  bigMsg: { fontSize: 15, color: C.sub, textAlign: 'center', marginTop: 8 },
  section: { fontSize: 13, fontWeight: '700', color: C.sub, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 24, marginLeft: 4 },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  tipN: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.primary + '1F', alignItems: 'center', justifyContent: 'center' },
  tipNTxt: { color: C.primary, fontWeight: '800' },
  tipTxt: { flex: 1, fontSize: 15, color: C.ink, fontWeight: '600' },
  line: { borderBottomWidth: 1, borderColor: C.line },
  partHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  partName: { fontSize: 15, fontWeight: '700', color: C.ink, flex: 1 },
  partWeight: { fontSize: 12, color: C.sub, marginRight: 10 },
  partScore: { fontSize: 16, fontWeight: '800', minWidth: 30, textAlign: 'right' },
  partDetail: { fontSize: 13, color: C.sub, marginTop: 7 },
  foot: { fontSize: 12, color: C.sub, textAlign: 'center', marginTop: 20, paddingHorizontal: 10 },
}));
