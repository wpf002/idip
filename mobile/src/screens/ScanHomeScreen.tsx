import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Header, Screen } from '../components/Chrome';
import { Icon, IconName } from '../components/Icon';
import { COLORS, RADIUS, SPACE, TYPE } from '../theme';

export type ScanMode = 'DL' | 'PASSPORT';

function Choice({ icon, title, subtitle, onPress }: { icon: IconName; title: string; subtitle: string; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.card} onPress={onPress}>
      <View style={styles.iconWrap}><Icon name={icon} size={30} color={COLORS.accent} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <Icon name="chevron" size={22} color={COLORS.textTertiary} />
    </TouchableOpacity>
  );
}

export function ScanHomeScreen({ onChoose, onBarcodeFallback }: {
  onChoose: (m: ScanMode) => void;
  onBarcodeFallback: () => void;
}) {
  return (
    <Screen>
      <Header title="Scan ID" subtitle="Choose the document type" />
      <View style={styles.body}>
        <Choice icon="scan" title="Driver's License" subtitle="Reads the card + photo, checks for tampering" onPress={() => onChoose('DL')} />
        <Choice icon="passport" title="Passport" subtitle="Reads the photo page + code lines" onPress={() => onChoose('PASSPORT')} />
        <TouchableOpacity activeOpacity={0.7} style={styles.fallback} onPress={onBarcodeFallback}>
          <Icon name="edit" size={16} color={COLORS.textTertiary} />
          <Text style={styles.fallbackText}>Barcode only — shows height & eye color</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: SPACE.lg, gap: SPACE.md },
  card: { flexDirection: 'row', alignItems: 'center', gap: SPACE.lg, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACE.xl },
  iconWrap: { width: 56, height: 56, borderRadius: RADIUS.lg, backgroundColor: COLORS.accentSoft, alignItems: 'center', justifyContent: 'center' },
  title: { ...TYPE.title, fontSize: 18 },
  subtitle: { ...TYPE.body, marginTop: 2 },
  fallback: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACE.sm, paddingVertical: SPACE.md, marginTop: SPACE.sm },
  fallbackText: { ...TYPE.caption, color: COLORS.textTertiary },
});
