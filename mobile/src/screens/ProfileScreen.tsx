import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Header, Screen } from '../components/Chrome';
import { Button, ListRow } from '../components/ui';
import { Icon } from '../components/Icon';
import { useAuthStore } from '../store/authStore';
import { COLORS, RADIUS, SPACE, TYPE } from '../theme';

export function ProfileScreen({ onBack, onSignOut, onReset }: { onBack: () => void; onSignOut: () => void; onReset: () => void }) {
  const staffName = useAuthStore((s) => s.staffName);
  return (
    <Screen edges={['top', 'bottom']}>
      <Header title="Profile" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.hero}>
          <View style={styles.avatar}><Icon name="user" size={34} color={COLORS.accent} /></View>
          <Text style={styles.name}>{staffName ?? 'Door Staff'}</Text>
          <Text style={styles.role}>DOOR STAFF</Text>
        </View>

        <Text style={styles.section}>Security</Text>
        <View style={styles.group}>
          <ListRow icon="lock" title="Credentials" subtitle="Stored in iOS Keychain" />
        </View>

        <View style={styles.actions}>
          <Button label="Sign Out" variant="secondary" icon="logout" onPress={onSignOut} />
          <Button label="Reset" variant="ghost" onPress={onReset} />
        </View>
        <Text style={styles.version}>IDIP v1.0.0</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: SPACE.lg, gap: SPACE.sm },
  hero: { alignItems: 'center', paddingVertical: SPACE.xl },
  avatar: { width: 88, height: 88, borderRadius: RADIUS.pill, backgroundColor: COLORS.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: SPACE.md },
  name: { ...TYPE.h2 },
  role: { ...TYPE.label, color: COLORS.textTertiary, letterSpacing: 1, marginTop: 4 },
  section: { ...TYPE.label, textTransform: 'uppercase', marginTop: SPACE.lg, marginBottom: SPACE.sm, marginLeft: SPACE.xs },
  group: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', paddingVertical: SPACE.xs },
  actions: { gap: SPACE.md, marginTop: SPACE.xl },
  version: { ...TYPE.caption, textAlign: 'center', marginTop: SPACE.xl },
});
