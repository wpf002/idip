import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';
import { Icon } from '../components/Icon';
import { Button } from '../components/ui';
import { COLORS, RADIUS, SPACE, TYPE } from '../theme';
import type { ScanResult } from '../api/client';

interface Props {
  active: boolean;
  onResult: (r: ScanResult) => void;
  onBack: () => void;
  scan: (barcode: string, method: 'camera' | 'manual') => Promise<ScanResult>;
}

export function ScanScreen({ active, onResult, onBack, scan }: Props) {
  const insets = useSafeAreaInsets();
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const [manual, setManual] = useState(false);
  const [manualValue, setManualValue] = useState('');
  const [busy, setBusy] = useState(false);
  const fired = useRef(false);

  useEffect(() => { if (!hasPermission) requestPermission(); }, [hasPermission, requestPermission]);
  // Re-arm the scanner each time the screen becomes active (e.g. after "Scan next").
  useEffect(() => { if (active) fired.current = false; }, [active]);

  const submit = async (data: string, method: 'camera' | 'manual') => {
    if (busy || !data) return;
    setBusy(true);
    try { onResult(await scan(data, method)); }
    finally { setBusy(false); setManual(false); setManualValue(''); }
  };

  const codeScanner = useCodeScanner({
    codeTypes: ['pdf-417'],
    onCodeScanned: (codes) => {
      if (!active || manual || fired.current) return;
      const v = codes[0]?.value;
      if (v) { fired.current = true; submit(v, 'camera'); }
    },
  });

  return (
    <View style={styles.fill}>
      {device && hasPermission ? (
        <Camera style={StyleSheet.absoluteFill} device={device} isActive={active && !manual} codeScanner={codeScanner} />
      ) : (
        <View style={styles.noCam}>
          <Icon name="camera" size={36} color={COLORS.textTertiary} />
          <Text style={styles.noCamText}>{hasPermission ? 'No camera available' : 'Camera access needed'}</Text>
        </View>
      )}

      <TouchableOpacity style={[styles.backBtn, { top: insets.top + SPACE.sm }]} hitSlop={16} onPress={onBack}>
        <Icon name="back" size={24} color="#fff" />
      </TouchableOpacity>
      <View style={[styles.overlay, { paddingTop: insets.top + SPACE.xxl }]} pointerEvents="box-none">
        <Text style={styles.title}>Driver's License</Text>
        <Text style={styles.subtitle}>Point at the barcode on the back of the license</Text>

        <View style={styles.frameWrap} pointerEvents="none">
          <View style={styles.frame}>
            {(['tl', 'tr', 'bl', 'br'] as const).map((c) => <View key={c} style={[styles.corner, styles[c]]} />)}
          </View>
        </View>

        <View style={styles.bottom} pointerEvents="box-none">
          <TouchableOpacity activeOpacity={0.8} style={styles.manualBtn} onPress={() => setManual(true)}>
            <Icon name="edit" size={18} color={COLORS.textPrimary} />
            <Text style={styles.manualLabel}>Enter manually</Text>
          </TouchableOpacity>
        </View>
      </View>

      {manual ? (
        <View style={[styles.sheet, { paddingBottom: insets.bottom + SPACE.lg }]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Manual entry</Text>
          <Text style={styles.sheetHint}>Adds +15 risk. Paste the raw barcode / MRZ data.</Text>
          <TextInput
            style={styles.input}
            placeholder="Barcode data"
            placeholderTextColor={COLORS.textTertiary}
            autoCapitalize="characters"
            multiline
            value={manualValue}
            onChangeText={setManualValue}
          />
          <View style={styles.sheetActions}>
            <Button label="Cancel" variant="ghost" onPress={() => { setManual(false); setManualValue(''); }} style={{ flex: 1 }} />
            <Button label="Submit" onPress={() => submit(manualValue, 'manual')} loading={busy} icon="check" style={{ flex: 1 }} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const ACCENT = COLORS.accent;
const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#000' },
  noCam: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: SPACE.md },
  noCamText: { ...TYPE.body },
  overlay: { ...StyleSheet.absoluteFillObject, paddingHorizontal: SPACE.xl, alignItems: 'center' },
  backBtn: { position: 'absolute', left: SPACE.lg, zIndex: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.8)', marginTop: 4, textAlign: 'center' },
  frameWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  frame: { width: 300, height: 190, borderRadius: RADIUS.xl },
  corner: { position: 'absolute', width: 34, height: 34, borderColor: ACCENT },
  tl: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: RADIUS.xl },
  tr: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: RADIUS.xl },
  bl: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: RADIUS.xl },
  br: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: RADIUS.xl },
  bottom: { paddingBottom: SPACE.xxl, alignItems: 'center' },
  manualBtn: { flexDirection: 'row', gap: SPACE.sm, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: RADIUS.pill, paddingHorizontal: SPACE.lg, paddingVertical: SPACE.md },
  manualLabel: { color: '#fff', fontWeight: '700', fontSize: 15 },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: COLORS.surface, borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl, padding: SPACE.xl, borderTopWidth: 1, borderColor: COLORS.border },
  sheetHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.borderStrong, marginBottom: SPACE.lg },
  sheetTitle: { ...TYPE.h2 },
  sheetHint: { ...TYPE.body, marginTop: 4, marginBottom: SPACE.lg },
  input: { backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, color: COLORS.textPrimary, borderRadius: RADIUS.lg, padding: SPACE.lg, minHeight: 90, fontSize: 14, marginBottom: SPACE.lg },
  sheetActions: { flexDirection: 'row', gap: SPACE.md },
});
