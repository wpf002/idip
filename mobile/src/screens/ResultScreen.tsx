import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/Icon';
import { DECISION, RADIUS, SPACE } from '../theme';
import type { ScanResult } from '../api/client';

interface Props {
  result: ScanResult;
  photoUri?: string | null;
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

const EYE: Record<string, string> = { BLK: 'Black', BLU: 'Blue', BRO: 'Brown', GRY: 'Gray', GRN: 'Green', HAZ: 'Hazel', MAR: 'Maroon', PNK: 'Pink', DIC: 'Dichromatic' };
const HAIR: Record<string, string> = { BAL: 'Bald', BLK: 'Black', BLN: 'Blond', BRO: 'Brown', GRY: 'Gray', RED: 'Red', SDY: 'Sandy', WHI: 'White' };

function formatHeight(h?: string | null): string | null {
  if (!h) return null;
  const inMatch = h.match(/(\d+)\s*in/i);
  if (inMatch) {
    const total = parseInt(inMatch[1], 10);
    return `${Math.floor(total / 12)}'${total % 12}"`;
  }
  const cmMatch = h.match(/(\d+)\s*cm/i);
  if (cmMatch) return `${cmMatch[1]} cm`;
  return h;
}

function details(r: ScanResult): { label: string; value: string }[] {
  const out: { label: string; value: string }[] = [];
  const ht = formatHeight(r.height);
  if (ht) out.push({ label: 'Height', value: ht });
  if (r.eye_color) out.push({ label: 'Eyes', value: EYE[r.eye_color.toUpperCase()] ?? r.eye_color });
  if (r.hair_color) out.push({ label: 'Hair', value: HAIR[r.hair_color.toUpperCase()] ?? r.hair_color });
  if (r.sex) out.push({ label: 'Sex', value: r.sex === 'M' ? 'Male' : r.sex === 'F' ? 'Female' : r.sex });
  return out;
}

export function ResultScreen({ result, photoUri, onScanNext, onChallenge }: Props) {
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
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.avatarImg} />
            ) : ini ? (
              <Text style={[styles.initials, { color: d.color }]}>{ini}</Text>
            ) : (
              <Icon name="user" size={48} color={d.color} />
            )}
          </View>
          <View style={[styles.badge, { backgroundColor: d.deep }]}>
            <Icon name={d.icon as any} size={22} color="#fff" strokeWidth={3} />
          </View>
        </View>

        <Text style={styles.decision}>{d.label.toUpperCase()}</Text>
        <Text style={styles.name}>{result.name ?? 'Unknown'}</Text>
        {result.age != null ? <Text style={styles.age}>Age {result.age}</Text> : null}

        {details(result).length > 0 ? (
          <View style={styles.detailRow}>
            {details(result).map((item) => (
              <View key={item.label} style={styles.detailItem}>
                <Text style={styles.detailValue}>{item.value}</Text>
                <Text style={styles.detailLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        ) : null}
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
  avatar: { width: 124, height: 124, borderRadius: 62, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: 124, height: 124 },
  initials: { fontSize: 46, fontWeight: '800' },
  badge: { position: 'absolute', right: -2, bottom: -2, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#ffffff' },
  decision: { color: '#ffffff', fontSize: 54, fontWeight: '800', letterSpacing: 1 },
  name: { color: '#ffffff', fontSize: 26, fontWeight: '800', marginTop: SPACE.lg, textAlign: 'center' },
  age: { color: '#ffffff', fontSize: 17, fontWeight: '600', opacity: 0.92, marginTop: 4 },
  detailRow: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.18)', borderRadius: RADIUS.lg, marginTop: SPACE.xl, paddingVertical: SPACE.md, paddingHorizontal: SPACE.sm },
  detailItem: { flex: 1, alignItems: 'center' },
  detailValue: { color: '#ffffff', fontSize: 17, fontWeight: '800' },
  detailLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginTop: 2, textTransform: 'uppercase' },
  actions: { gap: SPACE.sm },
  secondary: { flexDirection: 'row', gap: SPACE.sm, backgroundColor: OVERLAY_STRONG, borderRadius: RADIUS.lg, minHeight: 56, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  cta: { flexDirection: 'row', gap: SPACE.sm, backgroundColor: '#0A0A0B', borderRadius: RADIUS.lg, minHeight: 64, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#ffffff', fontSize: 19, fontWeight: '800' },
});
