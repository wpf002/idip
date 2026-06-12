import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { COLORS, RADIUS, SPACE, TYPE } from '../theme';
import { Icon, IconName } from './Icon';

// ---- Button ----
interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export function Button({ label, onPress, variant = 'primary', icon, disabled, loading, style }: ButtonProps) {
  const bg =
    variant === 'primary' ? COLORS.accent : variant === 'secondary' ? COLORS.surfaceHigh : 'transparent';
  const fg = variant === 'primary' ? COLORS.onColor : COLORS.textPrimary;
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.btn, { backgroundColor: bg }, variant === 'ghost' && styles.btnGhost, disabled && styles.btnDisabled, style]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.btnRow}>
          {icon ? <Icon name={icon} size={20} color={fg} /> : null}
          <Text style={[styles.btnLabel, { color: fg }]}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ---- Card ----
export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

// ---- Chip / flag badge ----
export function Chip({ label, weight, tone = 'neutral' }: { label: string; weight?: number; tone?: 'neutral' | 'good' | 'bad' }) {
  const accent = tone === 'good' ? COLORS.allow : tone === 'bad' ? COLORS.deny : COLORS.textTertiary;
  return (
    <View style={styles.chip}>
      {weight !== undefined ? (
        <View style={[styles.chipWeight, { backgroundColor: accent + '22' }]}>
          <Text style={[styles.chipWeightText, { color: accent }]}>
            {weight >= 0 ? `+${weight}` : `${weight}`}
          </Text>
        </View>
      ) : null}
      <Text style={styles.chipLabel} numberOfLines={2}>{label}</Text>
    </View>
  );
}

// ---- Stat card ----
export function StatCard({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, accent ? { color: accent } : null]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ---- Settings / list row ----
export function ListRow({ icon, title, subtitle, right, onPress, danger }: {
  icon: IconName; title: string; subtitle?: string; right?: string; onPress?: () => void; danger?: boolean;
}) {
  const tint = danger ? COLORS.deny : COLORS.textPrimary;
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} disabled={!onPress} style={styles.row}>
      <View style={styles.rowIcon}><Icon name={icon} size={20} color={danger ? COLORS.deny : COLORS.accent} /></View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, { color: tint }]}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {right ? <Text style={styles.rowRight}>{right}</Text> : null}
      {onPress && !right ? <Icon name="chevron" size={18} color={COLORS.textTertiary} /> : null}
    </TouchableOpacity>
  );
}

// ---- Segmented control ----
export function Segmented<T extends string>({ options, value, onChange }: {
  options: { key: T; label: string }[]; value: T; onChange: (k: T) => void;
}) {
  return (
    <View style={styles.segment}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <TouchableOpacity key={o.key} activeOpacity={0.8} onPress={() => onChange(o.key)} style={[styles.segItem, active && styles.segItemActive]}>
            <Text style={[styles.segLabel, active && styles.segLabelActive]}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: { minHeight: 56, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACE.xl },
  btnGhost: { borderWidth: 1, borderColor: COLORS.border },
  btnDisabled: { opacity: 0.4 },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm },
  btnLabel: { fontSize: 17, fontWeight: '700' },

  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACE.lg },

  chip: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.md, paddingVertical: SPACE.sm, paddingHorizontal: SPACE.md, marginBottom: SPACE.sm },
  chipWeight: { borderRadius: RADIUS.sm, paddingHorizontal: SPACE.sm, paddingVertical: 2, minWidth: 40, alignItems: 'center' },
  chipWeightText: { fontSize: 13, fontWeight: '800' },
  chipLabel: { ...TYPE.body, color: COLORS.textPrimary, flex: 1 },

  stat: { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACE.lg, minHeight: 96, justifyContent: 'center' },
  statValue: { fontSize: 34, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -1 },
  statLabel: { ...TYPE.label, marginTop: 2 },

  row: { flexDirection: 'row', alignItems: 'center', gap: SPACE.md, paddingVertical: SPACE.md, paddingHorizontal: SPACE.lg },
  rowIcon: { width: 36, height: 36, borderRadius: RADIUS.md, backgroundColor: COLORS.accentSoft, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
  rowSubtitle: { ...TYPE.caption, marginTop: 1 },
  rowRight: { ...TYPE.body, color: COLORS.textTertiary },

  segment: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: 4, borderWidth: 1, borderColor: COLORS.border },
  segItem: { flex: 1, paddingVertical: SPACE.sm, borderRadius: RADIUS.sm, alignItems: 'center' },
  segItemActive: { backgroundColor: COLORS.surfaceHigh },
  segLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textTertiary },
  segLabelActive: { color: COLORS.textPrimary },
});
