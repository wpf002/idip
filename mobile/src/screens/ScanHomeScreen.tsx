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

export function ScanHomeScreen({ onChoose }: { onChoose: (m: ScanMode) => void }) {
  return (
    <Screen>
      <Header title="Scan ID" subtitle="Choose the document type" />
      <View style={styles.body}>
        <Choice icon="scan" title="Driver's License" subtitle="Scan the barcode on the back" onPress={() => onChoose('DL')} />
        <Choice icon="passport" title="Passport" subtitle="Auto-reads the code lines" onPress={() => onChoose('PASSPORT')} />
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
});
