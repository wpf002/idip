import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { Icon } from '../components/Icon';
import { recognizeMrz } from '../services/ocr';
import { COLORS, RADIUS, SPACE, TYPE } from '../theme';
import type { ScanResult } from '../api/client';

interface Props {
  active: boolean;
  onResult: (r: ScanResult) => void;
  onBack: () => void;
  scanMrz: (mrz: string) => Promise<ScanResult>;
}

export function PassportScanScreen({ active, onResult, onBack, scanMrz }: Props) {
  const insets = useSafeAreaInsets();
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const camera = useRef<Camera>(null);
  const [reading, setReading] = useState(false);

  useEffect(() => { if (!hasPermission) requestPermission(); }, [hasPermission, requestPermission]);

  useEffect(() => {
    if (!active || !hasPermission || !device) return;
    let cancelled = false;
    let processing = false;

    const tick = async () => {
      if (processing || cancelled || !camera.current) return;
      processing = true;
      try {
        const photo = await camera.current.takePhoto({ enableShutterSound: false } as any);
        setReading(true);
        const mrz = await recognizeMrz(photo.path);
        if (mrz && !cancelled) {
          cancelled = true;
          clearInterval(id);
          onResult(await scanMrz(mrz));
        }
      } catch {
        // keep scanning
      } finally {
        processing = false;
        if (!cancelled) setReading(false);
      }
    };

    const id = setInterval(tick, 1500);
    return () => { cancelled = true; clearInterval(id); };
  }, [active, hasPermission, device, onResult, scanMrz]);

  return (
    <View style={styles.fill}>
      {device && hasPermission ? (
        <Camera ref={camera} style={StyleSheet.absoluteFill} device={device} isActive={active} photo />
      ) : (
        <View style={styles.noCam}>
          <Icon name="camera" size={36} color={COLORS.textTertiary} />
          <Text style={styles.noCamText}>{hasPermission ? 'No camera available' : 'Camera access needed'}</Text>
        </View>
      )}

      <View style={[styles.overlay, { paddingTop: insets.top + SPACE.md, paddingBottom: insets.bottom + SPACE.xl }]} pointerEvents="box-none">
        <TouchableOpacity style={styles.backBtn} hitSlop={12} onPress={onBack}>
          <Icon name="back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Scan passport</Text>
        <Text style={styles.subtitle}>Hold the photo page in view — the two code lines at the bottom</Text>

        <View style={styles.frameWrap} pointerEvents="none">
          <View style={styles.frame}>
            {(['tl', 'tr', 'bl', 'br'] as const).map((c) => <View key={c} style={[styles.corner, styles[c]]} />)}
            <View style={styles.mrzStrip}><Text style={styles.mrzStripText}>MRZ</Text></View>
          </View>
        </View>

        <View style={styles.statusPill}>
          {reading ? <ActivityIndicator color="#fff" size="small" /> : <Icon name="scan" size={18} color="#fff" />}
          <Text style={styles.statusText}>{reading ? 'Reading…' : 'Scanning automatically'}</Text>
        </View>
      </View>
    </View>
  );
}

const ACCENT = COLORS.accent;
const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#000' },
  noCam: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: SPACE.md },
  noCamText: { ...TYPE.body },
  overlay: { ...StyleSheet.absoluteFillObject, paddingHorizontal: SPACE.xl, alignItems: 'center' },
  backBtn: { position: 'absolute', left: SPACE.lg, top: SPACE.md, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.8)', marginTop: 4, textAlign: 'center' },
  frameWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  frame: { width: 300, height: 210, borderRadius: RADIUS.xl, justifyContent: 'flex-end' },
  corner: { position: 'absolute', width: 34, height: 34, borderColor: ACCENT },
  tl: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: RADIUS.xl },
  tr: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: RADIUS.xl },
  bl: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: RADIUS.xl },
  br: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: RADIUS.xl },
  mrzStrip: { height: 46, margin: 6, borderRadius: RADIUS.sm, borderWidth: 1.5, borderColor: 'rgba(91,140,255,0.7)', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  mrzStripText: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  statusPill: { flexDirection: 'row', gap: SPACE.sm, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: RADIUS.pill, paddingHorizontal: SPACE.lg, paddingVertical: SPACE.md },
  statusText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
