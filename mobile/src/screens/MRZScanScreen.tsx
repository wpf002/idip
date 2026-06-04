import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { THEME } from '../utils/decision';
import type { ScanResult } from '../api/client';

interface Props {
  onResult: (result: ScanResult) => void;
  scanMrz: (mrz: string) => Promise<ScanResult>;
}

// MRZ uses manual text entry only — no auto OCR until a commercial SDK is added.
export function MRZScanScreen({ onResult, scanMrz }: Props) {
  const device = useCameraDevice('back');
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!value) return;
    setBusy(true);
    try {
      onResult(await scanMrz(value));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      {device ? <Camera style={styles.preview} device={device} isActive={true} /> : null}
      <View style={styles.panel}>
        <Text style={styles.title}>Passport MRZ</Text>
        <TextInput
          style={styles.input}
          placeholder="Type the two MRZ lines"
          placeholderTextColor="#6b7280"
          autoCapitalize="characters"
          multiline
          value={value}
          onChangeText={setValue}
        />
        <TouchableOpacity style={styles.cta} onPress={submit} disabled={busy}>
          <Text style={styles.ctaText}>Verify</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background },
  preview: { height: 220 },
  panel: { flex: 1, padding: 20 },
  title: { color: THEME.textPrimary, fontSize: 20, fontWeight: '700', marginBottom: 12 },
  input: { backgroundColor: THEME.card, color: THEME.textPrimary, borderRadius: 10, padding: 14, minHeight: 90, marginBottom: 12 },
  cta: { backgroundColor: '#2563eb', borderRadius: 12, minHeight: 56, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
