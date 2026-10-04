// Home-screen card for the Financial Health Score + a detail sheet when tapped
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import { Text } from '../../fonts';
import { Ionicons } from '@expo/vector-icons';
import { C, themed } from '../../theme';
import { useStore, useTotals, ym } from '../../store';
import { Progress, tap } from '../../ui';
import { t } from '../../i18n';
import { calculateHealthScore, Band, HealthScore } from './calculator';
import { isHealthScoreEnabled } from './config';
import Ring from '../../Ring';

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

  // Same for each part, so each box can show if it went up or down
  const partsKey = hs ? hs.parts.map(p => p.score).join(',') : '';
  useEffect(() => {
    if (!hs) return;
    const now = Object.fromEntries(hs.parts.map(p => [p.key, p.score]));
    const saved = d.partHistory?.[m];
    if (!saved || hs.parts.some(p => saved[p.key] !== p.score)) set(x => ({ ...x, partHistory: { ...(x.partHistory ?? {}), [m]: now } }));
  }, [partsKey, m]);

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

  // Three boxes under the ring, each with an arrow vs last month
  const lastKey = Object.keys(d.partHistory ?? {}).filter(k => k < m).sort().pop();
  const lastParts = lastKey ? d.partHistory![lastKey] : undefined;
  const BOXES = [{ key: 'load', label: 'Installments' }, { key: 'emergency', label: 'Safety net' }, { key: 'networth', label: 'Debt' }];
  const word = (n: number) => (n >= 80 ? 'Good' : n >= 60 ? 'Okay' : 'Weak');

  return (
    <>
      <Pressable style={({ pressed }) => [s.top, pressed && { opacity: 0.9 }]} onPress={() => { tap(); setOpen(true); }}>
        <View style={s.ringRow}>
          <Ring size={88} stroke={9} value={hs.score / 100} color={color} track={C.soft}>
            <Text style={s.ringNum}>{hs.score}</Text>
          </Ring>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>{t('Financial health')}</Text>
            <Text style={[s.band, { color }]}>{t(hs.band)}</Text>
            {change !== undefined && change !== 0 && (
              <Text style={[s.trend, { color: change > 0 ? C.green : C.red }]}>
                {change > 0 ? '▲' : '▼'} {Math.abs(change)}
              </Text>
            )}
          </View>
          <View style={s.pro}>
            <Ionicons name="lock-closed" size={11} color="#fff" />
            <Text style={s.proTxt}>PRO</Text>
          </View>
        </View>
        <View style={s.factors}>
          {BOXES.map(f => {
            const p = hs.parts.find(x => x.key === f.key);
            if (!p) return null;
            const before = lastParts?.[f.key];
            const diff = before === undefined ? 0 : p.score - before;
            return (
              <View key={f.key} style={s.factor}>
                <Text style={s.factorLabel} numberOfLines={1}>{t(f.label)}</Text>
                <View style={s.factorRow}>
                  <Text style={s.factorVal}>{t(word(p.score))}</Text>
                  {diff !== 0 && (
                    <Ionicons name={diff > 0 ? 'arrow-up' : 'arrow-down'} size={14} color={diff > 0 ? C.green : C.red} />
                  )}
                </View>
              </View>
            );
          })}
        </View>
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
  card: { backgroundColor: C.card, borderRadius: 14, padding: 16, marginTop: 14 },
  top: { backgroundColor: C.card, borderRadius: 24, padding: 20, marginBottom: 14, shadowColor: '#14294A', shadowOpacity: 0.06, shadowRadius: 20, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  ringRow: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  ringNum: { fontSize: 28, fontWeight: '700', color: C.ink, letterSpacing: -0.5 },
  label: { fontSize: 13, color: C.sub, fontWeight: '500' },
  band: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3, marginTop: 2 },
  ringOf: { fontSize: 12, color: C.sub, fontWeight: '500' },
  pill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  pillTxt: { fontSize: 12, fontWeight: '600' },
  headline: { fontSize: 16, fontWeight: '600', color: C.ink, lineHeight: 21 },
  factors: { flexDirection: 'row', gap: 8, marginTop: 18 },
  factor: { flex: 1, backgroundColor: C.bg, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10 },
  factorLabel: { fontSize: 11, color: C.sub, fontWeight: '500' },
  factorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  factorDot: { width: 7, height: 7, borderRadius: 4 },
  factorVal: { fontSize: 15, fontWeight: '600', color: C.ink },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.soft, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, marginTop: 14 },
  ctaTxt: { flex: 1, fontSize: 14, fontWeight: '600', color: C.primary },
  pro: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.primary, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  proTxt: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.6 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 16, fontWeight: '600', color: C.ink },
  emptyTxt: { color: C.sub, fontSize: 14, marginTop: 8 },
  scoreRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 8, marginBottom: 12 },
  score: { fontSize: 50, fontWeight: '700', letterSpacing: -1, lineHeight: 56 },
  outOf: { fontSize: 17, color: C.sub, fontWeight: '600', marginLeft: 4, marginBottom: 6 },
  badge: { marginLeft: 'auto', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginBottom: 6 },
  badgeTxt: { fontSize: 14, fontWeight: '600' },
  trend: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, paddingTop: 22 },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: C.ink },
  done: { fontSize: 17, fontWeight: '700', color: C.primary },
  bigCard: { backgroundColor: C.card, borderRadius: 14, padding: 24, alignItems: 'center', borderWidth: 2 },
  bigScore: { fontSize: 68, fontWeight: '700', letterSpacing: -1.5 },
  bigBand: { fontSize: 20, fontWeight: '800', marginTop: -4 },
  bigMsg: { fontSize: 15, color: C.sub, textAlign: 'center', marginTop: 8 },
  section: { fontSize: 13, fontWeight: '700', color: C.sub, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 24, marginLeft: 4 },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  tipN: { width: 28, height: 28, borderRadius: 10, backgroundColor: C.primary + '1F', alignItems: 'center', justifyContent: 'center' },
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
