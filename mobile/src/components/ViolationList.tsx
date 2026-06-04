import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { THEME } from '../utils/decision';

export interface Flag {
  code: string;
  message: string;
  weight: number;
}

export function ViolationList({ flags }: { flags: Flag[] }) {
  if (!flags.length) {
    return <Text style={styles.empty}>No violations</Text>;
  }
  return (
    <View style={styles.container}>
      {flags.map((f, i) => (
        <View key={`${f.code}-${i}`} style={styles.row}>
          <View style={styles.penalty}>
            <Text style={styles.penaltyText}>
              {f.weight >= 0 ? `+${f.weight}` : `${f.weight}`}
            </Text>
          </View>
          <Text style={styles.message}>{f.message}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 16 },
  empty: { color: THEME.textSecondary, marginTop: 16 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  penalty: {
    backgroundColor: '#374151',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 12,
    minWidth: 44,
    alignItems: 'center',
  },
  penaltyText: { color: '#ffffff', fontWeight: '700' },
  message: { color: THEME.textPrimary, flex: 1 },
});
