import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Header, Screen } from '../components/Chrome';
import { Button } from '../components/ui';
import { Icon } from '../components/Icon';
import { COLORS, RADIUS, SPACE, TYPE } from '../theme';
import type { ScanResult } from '../api/client';

interface Props {
  questions: string[];
  submit: (failures: number) => Promise<ScanResult>;
  onComplete: (r: ScanResult) => void;
  onCancel: () => void;
}

export function ChallengeScreen({ questions, submit, onComplete, onCancel }: Props) {
  const [marks, setMarks] = useState<Record<number, boolean>>({});
  const [busy, setBusy] = useState(false);
  const answered = Object.keys(marks).length;

  async function finish() {
    setBusy(true);
    const failures = questions.reduce((acc, _q, i) => acc + (marks[i] === false ? 1 : 0), 0);
    try { onComplete(await submit(failures)); } finally { setBusy(false); }
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <Header title="Face challenge" subtitle="Ask each question; mark pass or fail" onBack={onCancel} />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {questions.map((q, i) => (
          <View key={i} style={styles.card}>
            <Text style={styles.q}>{q}</Text>
            <View style={styles.actions}>
              <TouchableOpacity activeOpacity={0.85} style={[styles.mark, marks[i] === true && styles.pass]} onPress={() => setMarks((m) => ({ ...m, [i]: true }))}>
                <Icon name="check" size={18} color={marks[i] === true ? '#fff' : COLORS.allow} />
                <Text style={[styles.markText, marks[i] === true && styles.markTextOn]}>Pass</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.85} style={[styles.mark, marks[i] === false && styles.fail]} onPress={() => setMarks((m) => ({ ...m, [i]: false }))}>
                <Icon name="x" size={18} color={marks[i] === false ? '#fff' : COLORS.deny} />
                <Text style={[styles.markText, marks[i] === false && styles.markTextOn]}>Fail</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={styles.footer}>
        <Button label={`Submit challenge (${answered}/${questions.length})`} onPress={finish} loading={busy} icon="shield" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: SPACE.lg, gap: SPACE.md },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACE.lg },
  q: { ...TYPE.title, marginBottom: SPACE.md },
  actions: { flexDirection: 'row', gap: SPACE.md },
  mark: { flex: 1, flexDirection: 'row', gap: SPACE.sm, minHeight: 48, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surfaceHigh, borderWidth: 1, borderColor: COLORS.border },
  pass: { backgroundColor: COLORS.allow, borderColor: COLORS.allow },
  fail: { backgroundColor: COLORS.deny, borderColor: COLORS.deny },
  markText: { fontWeight: '700', fontSize: 15, color: COLORS.textSecondary },
  markTextOn: { color: '#fff' },
  footer: { padding: SPACE.lg },
});
