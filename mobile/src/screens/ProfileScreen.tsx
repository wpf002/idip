import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Header, Screen } from '../components/Chrome';
import { Button, Card, ListRow } from '../components/ui';
import { Icon } from '../components/Icon';
import { useAuthStore } from '../store/authStore';
import { COLORS, RADIUS, SPACE, TYPE } from '../theme';

function hostOf(url: string): string {
  try { return new URL(url).host; } catch { return url; }
}

export function ProfileScreen({ onBack, onSignOut, onReset }: { onBack: () => void; onSignOut: () => void; onReset: () => void }) {
  const { staffName, apiUrl } = useAuthStore();
  return (
    <Screen edges={['top', 'bottom']}>
      <Header title="Profile" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.body}>
        <Card style={styles.hero}>
          <View style={styles.avatar}><Icon name="user" size={30} color={COLORS.accent} /></View>
          <Text style={styles.name}>{staffName ?? 'Door staff'}</Text>
          <Text style={styles.role}>Door staff</Text>
        </Card>

        <Text style={styles.section}>Connection</Text>
        <View style={styles.group}>
          <ListRow icon="shield" title="Backend" subtitle={hostOf(apiUrl)} right="Live" />
          <View style={styles.divider} />
          <ListRow icon="lock" title="Credentials" subtitle="Stored in iOS Keychain" />
        </View>

        <View style={styles.actions}>
          <Button label="Sign out" variant="secondary" icon="logout" onPress={onSignOut} />
          <Button label="Reset this device" variant="ghost" onPress={onReset} />
        </View>
        <Text style={styles.version}>IDIP v1.0.0</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: SPACE.lg, gap: SPACE.sm },
  hero: { alignItems: 'center', paddingVertical: SPACE.xl, marginBottom: SPACE.md },
  avatar: { width: 72, height: 72, borderRadius: RADIUS.pill, backgroundColor: COLORS.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: SPACE.md },
  name: { ...TYPE.h2 },
  role: { ...TYPE.body, marginTop: 2 },
  section: { ...TYPE.label, textTransform: 'uppercase', marginTop: SPACE.lg, marginBottom: SPACE.sm, marginLeft: SPACE.xs },
  group: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', paddingVertical: SPACE.xs },
  divider: { height: 1, backgroundColor: COLORS.border, marginLeft: 64 },
  actions: { gap: SPACE.md, marginTop: SPACE.xl },
  version: { ...TYPE.caption, textAlign: 'center', marginTop: SPACE.xl },
});
