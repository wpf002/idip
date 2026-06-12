import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/Icon';
import { COLORS, DECISION, RADIUS, SPACE, TYPE } from '../theme';
import type { ScanResult } from '../api/client';

interface Props {
  result: ScanResult;
  onScanNext: () => void;
  onChallenge: () => void;
}

const DOC_LABEL: Record<string, string> = {
  US_DRIVERS_LICENSE: "Driver's license",
  US_STATE_ID: 'State ID',
  US_PASSPORT: 'US passport',
  PASSPORT_CARD: 'Passport card',
  INTERNATIONAL_PASSPORT: 'Passport',
  INTERNATIONAL_ID: 'International ID',
  MILITARY_ID: 'Military ID',
};

export function ResultScreen({ result, onScanNext, onChallenge }: Props) {
  const insets = useSafeAreaInsets();
  const d = DECISION[result.result];
  const showChallenge = result.result === 'REVIEW' && result.challenge_available;

  useEffect(() => {
    Vibration.vibrate(result.result === 'DENY' ? [0, 80, 60, 80] : 40);
  }, [result.result]);

  return (
    <View style={[styles.fill, { backgroundColor: d.color, paddingTop: insets.top, paddingBottom: insets.bottom + SPACE.md }]}>
      <View style={styles.topRow}>
        <Text style={styles.docType}>
          {DOC_LABEL[result.document_type ?? ''] ?? 'ID'}{result.state ? ` · ${result.state}` : ''}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.badge}><Icon name={d.icon as any} size={40} color={d.color} strokeWidth={2.5} /></View>
        <Text style={styles.decision}>{d.label.toUpperCase()}</Text>
        <View style={styles.riskPill}><Text style={styles.riskText}>Risk {result.risk_score}</Text></View>

        <Text style={styles.name}>{result.name ?? 'Unknown'}</Text>
        {result.age != null ? <Text style={styles.age}>Age {result.age}</Text> : null}

        {result.flags.length > 0 ? (
          <View style={styles.flagsCard}>
            {result.flags.map((f, i) => (
              <View key={`${f.code}-${i}`} style={[styles.flagRow, i > 0 && styles.flagDivider]}>
                <View style={styles.flagWeight}>
                  <Text style={styles.flagWeightText}>{f.weight >= 0 ? `+${f.weight}` : `${f.weight}`}</Text>
                </View>
                <Text style={styles.flagMsg}>{f.message}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.cleanRow}>
            <Icon name="check" size={18} color="#ffffff" />
            <Text style={styles.cleanText}>No violations</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.actions}>
        {showChallenge ? (
          <TouchableOpacity activeOpacity={0.85} style={styles.secondary} onPress={onChallenge}>
            <Icon name="user" size={20} color="#fff" />
            <Text style={styles.secondaryText}>Run face challenge</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity activeOpacity={0.85} style={styles.cta} onPress={onScanNext}>
          <Icon name="scan" size={22} color="#fff" />
          <Text style={styles.ctaText}>Scan next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const OVERLAY = 'rgba(0,0,0,0.18)';
const OVERLAY_STRONG = 'rgba(0,0,0,0.30)';

const styles = StyleSheet.create({
  fill: { flex: 1, paddingHorizontal: SPACE.xl },
  topRow: { alignItems: 'center', paddingTop: SPACE.sm },
  docType: { color: '#ffffff', fontSize: 13, fontWeight: '700', letterSpacing: 0.5, opacity: 0.9 },
  body: { alignItems: 'center', paddingTop: SPACE.xxl, paddingBottom: SPACE.xl, flexGrow: 1, justifyContent: 'center' },
  badge: { width: 84, height: 84, borderRadius: RADIUS.pill, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', marginBottom: SPACE.lg },
  decision: { color: '#ffffff', fontSize: 52, fontWeight: '800', letterSpacing: 1 },
  riskPill: { backgroundColor: OVERLAY, borderRadius: RADIUS.pill, paddingHorizontal: SPACE.lg, paddingVertical: 6, marginTop: SPACE.sm },
  riskText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  name: { color: '#ffffff', fontSize: 26, fontWeight: '800', marginTop: SPACE.xxl, textAlign: 'center' },
  age: { color: '#ffffff', fontSize: 16, fontWeight: '600', opacity: 0.9, marginTop: 2 },
  flagsCard: { alignSelf: 'stretch', backgroundColor: OVERLAY, borderRadius: RADIUS.lg, padding: SPACE.sm, marginTop: SPACE.xl },
  flagRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.md, padding: SPACE.md },
  flagDivider: { borderTopWidth: 1, borderTopColor: OVERLAY },
  flagWeight: { backgroundColor: OVERLAY_STRONG, borderRadius: RADIUS.sm, paddingHorizontal: SPACE.sm, paddingVertical: 3, minWidth: 44, alignItems: 'center' },
  flagWeightText: { color: '#ffffff', fontWeight: '800', fontSize: 13 },
  flagMsg: { color: '#ffffff', fontSize: 14, fontWeight: '500', flex: 1 },
  cleanRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, marginTop: SPACE.xl, opacity: 0.9 },
  cleanText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
  actions: { gap: SPACE.sm },
  secondary: { flexDirection: 'row', gap: SPACE.sm, backgroundColor: OVERLAY_STRONG, borderRadius: RADIUS.lg, minHeight: 56, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  cta: { flexDirection: 'row', gap: SPACE.sm, backgroundColor: '#0A0A0B', borderRadius: RADIUS.lg, minHeight: 64, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#ffffff', fontSize: 19, fontWeight: '800' },
});
