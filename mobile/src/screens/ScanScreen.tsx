import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCodeScanner,
} from 'react-native-vision-camera';
import { THEME } from '../utils/decision';
import type { ScanResult } from '../api/client';

interface Props {
  onResult: (result: ScanResult) => void;
  scan: (barcode: string, method: 'camera' | 'manual') => Promise<ScanResult>;
}

export function ScanScreen({ onResult, scan }: Props) {
  const device = useCameraDevice('back');
  const [manual, setManual] = useState(false);
  const [manualValue, setManualValue] = useState('');
  const [busy, setBusy] = useState(false);

  const codeScanner = useCodeScanner({
    codeTypes: ['pdf-417'],
    onCodeScanned: async (codes) => {
      if (busy || !codes.length || !codes[0].value) return;
      setBusy(true);
      try {
        onResult(await scan(codes[0].value, 'camera'));
      } finally {
        setBusy(false);
      }
    },
  });

  async function submitManual() {
    if (!manualValue) return;
    setBusy(true);
    try {
      onResult(await scan(manualValue, 'manual'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      {device ? (
        <Camera style={StyleSheet.absoluteFill} device={device} isActive={!manual} codeScanner={codeScanner} />
      ) : (
        <View style={styles.noCamera}><Text style={styles.noCameraText}>No camera available</Text></View>
      )}

      {manual && (
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Manual Entry (+15 risk)</Text>
          <TextInput
            style={styles.input}
            placeholder="Paste barcode / MRZ data"
            placeholderTextColor="#6b7280"
            autoCapitalize="characters"
            value={manualValue}
            onChangeText={setManualValue}
          />
          <TouchableOpacity style={styles.cta} onPress={submitManual}>
            <Text style={styles.ctaText}>Submit</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.manualToggle} onPress={() => setManual((m) => !m)}>
        <Text style={styles.manualToggleText}>{manual ? 'Use Camera' : 'Manual Entry'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background },
  noCamera: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  noCameraText: { color: THEME.textSecondary },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: THEME.card,
    padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20,
  },
  sheetTitle: { color: THEME.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 12 },
  input: { backgroundColor: '#111827', color: THEME.textPrimary, borderRadius: 10, padding: 14, marginBottom: 12 },
  cta: { backgroundColor: '#2563eb', borderRadius: 12, minHeight: 56, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  manualToggle: {
    position: 'absolute', bottom: 24, alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24,
  },
  manualToggleText: { color: '#fff', fontWeight: '600' },
});
