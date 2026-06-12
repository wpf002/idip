import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { THEME } from '../utils/decision';
import { isValidPin } from '../utils/validation';

// Door staff only set up who they are. The backend URL + venue API key are
// provisioned by the build (see src/config.ts) and never entered here.
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
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to IDIP</Text>
      <Text style={styles.subtitle}>Set up your door profile to get started.</Text>

      <TextInput
        style={styles.input}
        placeholder="Your Name"
        placeholderTextColor="#6b7280"
        value={staffName}
        onChangeText={setStaffName}
        autoFocus
      />
      <TextInput
        style={styles.input}
        placeholder="Create a 4-digit PIN"
        placeholderTextColor="#6b7280"
        keyboardType="number-pad"
        secureTextEntry
        maxLength={4}
        value={pin}
        onChangeText={setPin}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity
        style={[styles.button, !valid && styles.buttonDisabled]}
        onPress={submit}
      >
        <Text style={styles.buttonText}>Save & Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background, padding: 24, justifyContent: 'center' },
  title: { color: THEME.textPrimary, fontSize: 28, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: THEME.textSecondary, fontSize: 15, marginBottom: 28 },
  input: {
    backgroundColor: THEME.card, color: THEME.textPrimary, borderRadius: 10,
    padding: 16, marginBottom: 12, fontSize: 16,
  },
  error: { color: '#ef4444', marginBottom: 12 },
  button: {
    backgroundColor: '#2563eb', borderRadius: 12, minHeight: 56,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
});
