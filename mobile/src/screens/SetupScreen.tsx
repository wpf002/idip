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
import { isValidApiKey, isValidApiUrl, isValidPin } from '../utils/validation';

export function SetupScreen({ onDone }: { onDone: () => void }) {
  const saveSetup = useAuthStore((s) => s.saveSetup);
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [staffName, setStaffName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const valid =
    isValidApiUrl(apiUrl) && isValidApiKey(apiKey) && staffName.length > 0 && isValidPin(pin);

  async function submit() {
    if (!valid) {
      setError('Check the API URL, key, name and 4-digit PIN.');
      return;
    }
    await saveSetup({ apiUrl, apiKey, staffName }, pin);
    onDone();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>IDIP Setup</Text>
      <TextInput style={styles.input} placeholder="API URL" placeholderTextColor="#6b7280"
        autoCapitalize="none" value={apiUrl} onChangeText={setApiUrl} />
      <TextInput style={styles.input} placeholder="API Key" placeholderTextColor="#6b7280"
        autoCapitalize="none" value={apiKey} onChangeText={setApiKey} />
      <TextInput style={styles.input} placeholder="Staff Name" placeholderTextColor="#6b7280"
        value={staffName} onChangeText={setStaffName} />
      <TextInput style={styles.input} placeholder="4-digit PIN" placeholderTextColor="#6b7280"
        keyboardType="number-pad" secureTextEntry maxLength={4} value={pin} onChangeText={setPin} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={[styles.button, !valid && styles.buttonDisabled]} onPress={submit}>
        <Text style={styles.buttonText}>Save & Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background, padding: 24, justifyContent: 'center' },
  title: { color: THEME.textPrimary, fontSize: 28, fontWeight: '800', marginBottom: 24 },
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
