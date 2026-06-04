import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { decisionColor } from '../utils/decision';
import { DecisionBadge } from '../components/DecisionBadge';
import { ViolationList } from '../components/ViolationList';
import type { ScanResult } from '../api/client';

interface Props {
  result: ScanResult;
  onScanNext: () => void;
  onChallenge: () => void;
  triggerHaptic?: () => void;
}

// The full-screen color IS the decision — readable in 0.5 seconds.
export function ResultScreen({ result, onScanNext, onChallenge, triggerHaptic }: Props) {
  useEffect(() => {
    triggerHaptic?.();
  }, [triggerHaptic]);

  const showChallenge = result.result === 'REVIEW' && result.challenge_available;

  return (
    <View style={[styles.container, { backgroundColor: decisionColor(result.result) }]}>
      <View style={styles.content}>
        <DecisionBadge decision={result.result} riskScore={result.risk_score} />
        <Text style={styles.name}>{result.name ?? 'Unknown'}</Text>
        {result.age != null ? <Text style={styles.meta}>Age {result.age}</Text> : null}
        <ViolationList flags={result.flags} />
      </View>

      {showChallenge ? (
        <TouchableOpacity style={styles.secondary} onPress={onChallenge}>
          <Text style={styles.secondaryText}>Run Face Challenge</Text>
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity style={styles.cta} onPress={onScanNext}>
        <Text style={styles.ctaText}>Scan Next</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'space-between' },
  content: { flex: 1, justifyContent: 'center' },
  name: { color: '#fff', fontSize: 22, fontWeight: '700', marginTop: 24 },
  meta: { color: '#fff', fontSize: 16, opacity: 0.9, marginTop: 4 },
  secondary: {
    backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 12, minHeight: 56,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  secondaryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cta: {
    backgroundColor: '#0a0a0a', borderRadius: 12, minHeight: 64,
    alignItems: 'center', justifyContent: 'center',
  },
  ctaText: { color: '#fff', fontSize: 20, fontWeight: '800' },
});
