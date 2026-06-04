import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Decision, decisionColor } from '../utils/decision';

interface Props {
  decision: Decision;
  riskScore: number;
}

export function DecisionBadge({ decision, riskScore }: Props) {
  return (
    <View style={[styles.badge, { backgroundColor: decisionColor(decision) }]}>
      <Text style={styles.decision}>{decision}</Text>
      <Text style={styles.score}>Risk {riskScore}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  decision: { color: '#ffffff', fontSize: 28, fontWeight: '800' },
  score: { color: '#ffffff', fontSize: 14, marginTop: 4, opacity: 0.9 },
});
