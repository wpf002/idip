import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../components/Chrome';
import { Button } from '../components/ui';
import { Icon } from '../components/Icon';
import { useAuthStore } from '../store/authStore';
import { COLORS, RADIUS, SPACE, TYPE } from '../theme';
import { isValidPin } from '../utils/validation';

export function SetupScreen({ onDone }: { onDone: () => void }) {
  const saveSetup = useAuthStore((s) => s.saveSetup);
  const [staffName, setStaffName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const valid = staffName.trim().length > 0 && isValidPin(pin);

  async function submit() {
    if (!valid) {
      setError('Enter your name and a 4-digit PIN.');
      return;
    }
    await saveSetup(staffName.trim(), pin);
    onDone();
  }

  return (
    <Screen edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.logo}><Icon name="shield" size={30} color={COLORS.accent} /></View>
      <Text style={styles.brand}>IDIP</Text>
      <Text style={styles.tagline}>Set up your door profile</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Your name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Will"
          placeholderTextColor={COLORS.textTertiary}
          value={staffName}
          onChangeText={(t) => { setStaffName(t); setError(null); }}
          autoFocus
        />
        <Text style={[styles.label, { marginTop: SPACE.lg }]}>Create a 4-digit PIN</Text>
        <TextInput
          style={styles.input}
          placeholder="••••"
          placeholderTextColor={COLORS.textTertiary}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={4}
          value={pin}
          onChangeText={(t) => { setPin(t); setError(null); }}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <Button label="Save & Continue" onPress={submit} disabled={!valid} icon="check" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { padding: SPACE.xl, justifyContent: 'center' },
  logo: { width: 60, height: 60, borderRadius: RADIUS.xl, backgroundColor: COLORS.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: SPACE.lg },
  brand: { fontSize: 34, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: 2 },
  tagline: { ...TYPE.body, marginTop: SPACE.xs, marginBottom: SPACE.xxl },
  form: { marginBottom: SPACE.xl },
  label: { ...TYPE.label, marginBottom: SPACE.sm },
  input: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, color: COLORS.textPrimary, borderRadius: RADIUS.lg, paddingHorizontal: SPACE.lg, paddingVertical: SPACE.lg, fontSize: 17, fontWeight: '600' },
  error: { color: COLORS.deny, marginTop: SPACE.md, fontSize: 14 },
});
