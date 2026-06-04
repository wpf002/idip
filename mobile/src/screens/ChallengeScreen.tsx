import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { THEME } from '../utils/decision';
import type { ScanResult } from '../api/client';

interface Props {
  questions: string[]; // prompts derived from ID data
  submit: (failures: number) => Promise<ScanResult>;
  onComplete: (result: ScanResult) => void;
}

export function ChallengeScreen({ questions, submit, onComplete }: Props) {
  const [marks, setMarks] = useState<Record<number, boolean>>({});

  const setMark = (i: number, pass: boolean) =>
    setMarks((m) => ({ ...m, [i]: pass }));

  async function finish() {
    const failures = questions.reduce(
      (acc, _q, i) => acc + (marks[i] === false ? 1 : 0),
      0,
    );
    onComplete(await submit(failures));
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Face Challenge</Text>
      {questions.map((q, i) => (
        <View key={i} style={styles.row}>
          <Text style={styles.q}>{q}</Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.mark, marks[i] === true && styles.pass]}
              onPress={() => setMark(i, true)}
            >
              <Text style={styles.markText}>Pass</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.mark, marks[i] === false && styles.fail]}
              onPress={() => setMark(i, false)}
            >
              <Text style={styles.markText}>Fail</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
      <TouchableOpacity style={styles.cta} onPress={finish}>
        <Text style={styles.ctaText}>Submit Challenge</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background, padding: 20 },
  title: { color: THEME.textPrimary, fontSize: 22, fontWeight: '700', marginBottom: 16 },
  row: { backgroundColor: THEME.card, borderRadius: 12, padding: 14, marginBottom: 10 },
  q: { color: THEME.textPrimary, fontSize: 16, marginBottom: 10 },
  actions: { flexDirection: 'row' },
  mark: {
    flex: 1, marginHorizontal: 4, minHeight: 48, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#374151',
  },
  pass: { backgroundColor: '#22c55e' },
  fail: { backgroundColor: '#ef4444' },
  markText: { color: '#fff', fontWeight: '700' },
  cta: { backgroundColor: '#2563eb', borderRadius: 12, minHeight: 56, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  ctaText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
