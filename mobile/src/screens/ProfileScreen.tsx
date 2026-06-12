import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Header, Screen } from '../components/Chrome';
import { Avatar } from '../components/Avatar';
import { Button, ListRow } from '../components/ui';
import { useAuthStore } from '../store/authStore';
import { pickProfilePhoto } from '../services/photo';
import { COLORS, RADIUS, SPACE, TYPE } from '../theme';

export function ProfileScreen({ onBack, onSignOut, onReset }: { onBack: () => void; onSignOut: () => void; onReset: () => void }) {
  const { staffName, avatar, setAvatar } = useAuthStore();

  async function changePhoto() {
    const uri = await pickProfilePhoto();
    if (uri) await setAvatar(uri);
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <Header title="Profile" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.hero}>
          <Avatar size={96} uri={avatar} name={staffName} editable onPress={changePhoto} />
          <Text style={styles.name}>{staffName ?? 'Door Staff'}</Text>
          <Text style={styles.role}>DOOR STAFF</Text>
          <Text style={styles.hint}>Tap your photo to change it</Text>
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
  hero: { alignItems: 'center', paddingVertical: SPACE.xl, gap: SPACE.xs },
  name: { ...TYPE.h2, marginTop: SPACE.md },
  role: { ...TYPE.label, color: COLORS.textTertiary, letterSpacing: 1, marginTop: 2 },
  hint: { ...TYPE.caption, marginTop: SPACE.xs },
  section: { ...TYPE.label, textTransform: 'uppercase', marginTop: SPACE.lg, marginBottom: SPACE.sm, marginLeft: SPACE.xs },
  group: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', paddingVertical: SPACE.xs },
  actions: { gap: SPACE.md, marginTop: SPACE.xl },
  version: { ...TYPE.caption, textAlign: 'center', marginTop: SPACE.xl },
});
