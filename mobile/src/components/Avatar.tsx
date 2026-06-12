import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../theme';
import { Icon } from './Icon';

function initials(name?: string | null): string | null {
  if (!name) return null;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return null;
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

interface Props {
  size: number;
  uri?: string | null;
  name?: string | null;
  editable?: boolean;
  onPress?: () => void;
}

export function Avatar({ size, uri, name, editable, onPress }: Props) {
  const ini = initials(name);
  const body = (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
      ) : ini ? (
        <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{ini}</Text>
      ) : (
        <Icon name="user" size={size * 0.5} color={COLORS.accent} />
      )}
      {editable ? (
        <View style={[styles.editBadge, { width: size * 0.32, height: size * 0.32, borderRadius: size * 0.16 }]}>
          <Icon name="camera" size={size * 0.18} color="#fff" />
        </View>
      ) : null}
    </View>
  );
  if (onPress) {
    return <TouchableOpacity activeOpacity={0.85} onPress={onPress}>{body}</TouchableOpacity>;
  }
  return body;
}

const styles = StyleSheet.create({
  circle: { backgroundColor: COLORS.accentSoft, alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  initials: { color: COLORS.accent, fontWeight: '800' },
  editBadge: { position: 'absolute', right: -2, bottom: -2, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.bg },
});
