import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/Icon';
import { DECISION, RADIUS, SPACE } from '../theme';
import type { ScanResult } from '../api/client';

interface Props {
  result: ScanResult;
  onScanNext: () => void;
  onChallenge: () => void;
}

const DOC_LABEL: Record<string, string> = {
  US_DRIVERS_LICENSE: "Driver's License",
  US_STATE_ID: 'State ID',
  US_PASSPORT: 'US Passport',
  PASSPORT_CARD: 'Passport Card',
  INTERNATIONAL_PASSPORT: 'Passport',
  INTERNATIONAL_ID: 'International ID',
  MILITARY_ID: 'Military ID',
};

function initials(name: string | null): string | null {
  if (!name) return null;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return null;
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export function ResultScreen({ result, onScanNext, onChallenge }: Props) {
  const insets = useSafeAreaInsets();
  const d = DECISION[result.result];
  const showChallenge = result.result === 'REVIEW' && result.challenge_available;
  const ini = initials(result.name);

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

      <View style={styles.body}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            {ini ? <Text style={[styles.initials, { color: d.color }]}>{ini}</Text> : <Icon name="user" size={48} color={d.color} />}
          </View>
          <View style={[styles.badge, { backgroundColor: d.deep }]}>
            <Icon name={d.icon as any} size={22} color="#fff" strokeWidth={3} />
          </View>
        </View>

        <Text style={styles.decision}>{d.label.toUpperCase()}</Text>
        <Text style={styles.name}>{result.name ?? 'Unknown'}</Text>
        {result.age != null ? <Text style={styles.age}>Age {result.age}</Text> : null}
      </View>

      <View style={styles.actions}>
        {showChallenge ? (
          <TouchableOpacity activeOpacity={0.85} style={styles.secondary} onPress={onChallenge}>
            <Icon name="user" size={20} color="#fff" />
            <Text style={styles.secondaryText}>Run Face Challenge</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity activeOpacity={0.85} style={styles.cta} onPress={onScanNext}>
          <Icon name="scan" size={22} color="#fff" />
          <Text style={styles.ctaText}>Scan Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const OVERLAY_STRONG = 'rgba(0,0,0,0.30)';

const styles = StyleSheet.create({
  fill: { flex: 1, paddingHorizontal: SPACE.xl },
  topRow: { alignItems: 'center', paddingTop: SPACE.sm },
  docType: { color: '#ffffff', fontSize: 13, fontWeight: '700', letterSpacing: 0.5, opacity: 0.9 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatarWrap: { marginBottom: SPACE.xl },
  avatar: { width: 124, height: 124, borderRadius: 62, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  initials: { fontSize: 46, fontWeight: '800' },
  badge: { position: 'absolute', right: -2, bottom: -2, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#ffffff' },
  decision: { color: '#ffffff', fontSize: 54, fontWeight: '800', letterSpacing: 1 },
  name: { color: '#ffffff', fontSize: 26, fontWeight: '800', marginTop: SPACE.lg, textAlign: 'center' },
  age: { color: '#ffffff', fontSize: 17, fontWeight: '600', opacity: 0.92, marginTop: 4 },
  actions: { gap: SPACE.sm },
  secondary: { flexDirection: 'row', gap: SPACE.sm, backgroundColor: OVERLAY_STRONG, borderRadius: RADIUS.lg, minHeight: 56, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  cta: { flexDirection: 'row', gap: SPACE.sm, backgroundColor: '#0A0A0B', borderRadius: RADIUS.lg, minHeight: 64, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#ffffff', fontSize: 19, fontWeight: '800' },
});
