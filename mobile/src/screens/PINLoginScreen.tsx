import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Screen } from '../components/Chrome';
import { Icon } from '../components/Icon';
import { Avatar } from '../components/Avatar';
import { useAuthStore } from '../store/authStore';
import { COLORS, RADIUS, SPACE, TYPE } from '../theme';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

export function PINLoginScreen({ onAuth }: { onAuth: () => void }) {
  const { verifyPin, staffName, avatar } = useAuthStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (pin.length === 4) {
      verifyPin(pin).then((ok) => {
        if (ok) onAuth();
        else { setError(true); setPin(''); }
      });
    }
  }, [pin, verifyPin, onAuth]);

  const press = (k: string) => {
    setError(false);
    if (k === 'del') setPin((p) => p.slice(0, -1));
    else if (k) setPin((p) => (p.length < 4 ? p + k : p));
  };

  return (
    <Screen edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.top}>
        <Avatar size={72} uri={avatar} name={staffName} />
        <Text style={styles.hi}>{staffName ? `Hi, ${staffName}` : 'Enter PIN'}</Text>
        <Text style={styles.sub}>Enter your PIN to start</Text>
        <View style={styles.dots}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.dot, i < pin.length && styles.dotFilled, error && styles.dotError]} />
          ))}
        </View>
        {error ? <Text style={styles.err}>Incorrect PIN</Text> : <View style={{ height: 18 }} />}
      </View>

      <View style={styles.pad}>
        {KEYS.map((k, i) => (
          <View key={i} style={styles.keyWrap}>
            {k ? (
              <TouchableOpacity activeOpacity={0.6} style={styles.key} onPress={() => press(k)}>
                {k === 'del' ? <Icon name="back" size={24} color={COLORS.textPrimary} /> : <Text style={styles.keyText}>{k}</Text>}
              </TouchableOpacity>
            ) : null}
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: 'space-between', paddingHorizontal: SPACE.xl, paddingVertical: SPACE.xxl },
  top: { alignItems: 'center', marginTop: SPACE.xxl },
  avatar: { width: 64, height: 64, borderRadius: RADIUS.pill, backgroundColor: COLORS.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: SPACE.lg },
  hi: { ...TYPE.h2 },
  sub: { ...TYPE.body, marginTop: SPACE.xs },
  dots: { flexDirection: 'row', gap: SPACE.lg, marginTop: SPACE.xl },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: COLORS.borderStrong },
  dotFilled: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  dotError: { borderColor: COLORS.deny },
  err: { color: COLORS.deny, marginTop: SPACE.md, fontSize: 14, height: 18 },
  pad: { flexDirection: 'row', flexWrap: 'wrap' },
  keyWrap: { width: '33.33%', alignItems: 'center', paddingVertical: SPACE.sm },
  key: { width: 76, height: 76, borderRadius: RADIUS.pill, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  keyText: { fontSize: 30, fontWeight: '600', color: COLORS.textPrimary },
});
