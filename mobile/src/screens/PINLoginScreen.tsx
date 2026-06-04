import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { THEME } from '../utils/decision';

export function PINLoginScreen({ onAuth }: { onAuth: () => void }) {
  const verifyPin = useAuthStore((s) => s.verifyPin);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (pin.length === 4) {
      verifyPin(pin).then((ok) => {
        if (ok) onAuth();
        else {
          setError(true);
          setPin('');
        }
      });
    }
  }, [pin, verifyPin, onAuth]);

  const press = (digit: string) => {
    setError(false);
    setPin((p) => (p.length < 4 ? p + digit : p));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter PIN</Text>
      <View style={styles.dots}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.dot, i < pin.length && styles.dotFilled]} />
        ))}
      </View>
      {error ? <Text style={styles.error}>Incorrect PIN</Text> : null}
      <View style={styles.pad}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k, i) => (
          <TouchableOpacity
            key={i}
            style={styles.key}
            disabled={k === ''}
            onPress={() => (k === '⌫' ? setPin((p) => p.slice(0, -1)) : k && press(k))}
          >
            <Text style={styles.keyText}>{k}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background, alignItems: 'center', justifyContent: 'center' },
  title: { color: THEME.textPrimary, fontSize: 24, fontWeight: '700', marginBottom: 24 },
  dots: { flexDirection: 'row', marginBottom: 16 },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#6b7280', margin: 8 },
  dotFilled: { backgroundColor: '#ffffff', borderColor: '#ffffff' },
  error: { color: '#ef4444', marginBottom: 12 },
  pad: { width: 280, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  key: {
    width: 80, height: 80, alignItems: 'center', justifyContent: 'center', margin: 4,
    borderRadius: 40, backgroundColor: THEME.card,
  },
  keyText: { color: THEME.textPrimary, fontSize: 28 },
});
