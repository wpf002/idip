import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Header, Screen } from '../components/Chrome';
import { Card, ListRow } from '../components/ui';
import { Avatar } from '../components/Avatar';
import { useAuthStore } from '../store/authStore';
import { COLORS, RADIUS, SPACE, TYPE } from '../theme';

export type SettingsRoute = 'HISTORY' | 'METRICS' | 'PROFILE';

export function SettingsScreen({ onOpen, pendingCount }: { onOpen: (r: SettingsRoute) => void; pendingCount: number }) {
  const { staffName, avatar } = useAuthStore();
  return (
    <Screen>
      <Header title="Settings" />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Card style={styles.profileCard}>
          <Avatar size={48} uri={avatar} name={staffName} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{staffName ?? 'Door Staff'}</Text>
            <Text style={styles.role}>On Duty</Text>
          </View>
        </Card>

        <Text style={styles.section}>Compliance</Text>
        <View style={styles.group}>
          <ListRow icon="logs" title="History" subtitle="Scan History & Export" onPress={() => onOpen('HISTORY')} />
          <View style={styles.divider} />
          <ListRow icon="chart" title="Metrics" subtitle="Tonight, Week & Month" onPress={() => onOpen('METRICS')} />
        </View>

        <Text style={styles.section}>Account</Text>
        <View style={styles.group}>
          <ListRow icon="user" title="Profile" subtitle="Staff & Venue Info" onPress={() => onOpen('PROFILE')} />
          {pendingCount > 0 ? (
            <>
              <View style={styles.divider} />
              <ListRow icon="refresh" title="Pending Sync" right={`${pendingCount}`} />
            </>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: SPACE.lg, gap: SPACE.sm },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: SPACE.md, marginBottom: SPACE.lg },
  avatar: { width: 48, height: 48, borderRadius: RADIUS.pill, backgroundColor: COLORS.accentSoft, alignItems: 'center', justifyContent: 'center' },
  name: { ...TYPE.title, fontSize: 18 },
  role: { ...TYPE.caption, color: COLORS.allow, marginTop: 1 },
  section: { ...TYPE.label, textTransform: 'uppercase', marginTop: SPACE.lg, marginBottom: SPACE.sm, marginLeft: SPACE.xs },
  group: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', paddingVertical: SPACE.xs },
  divider: { height: 1, backgroundColor: COLORS.border, marginLeft: 64 },
});
