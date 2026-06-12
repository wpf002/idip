import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Header, Screen } from '../components/Chrome';
import { Card, ListRow } from '../components/ui';
import { Icon } from '../components/Icon';
import { useAuthStore } from '../store/authStore';
import { COLORS, RADIUS, SPACE, TYPE } from '../theme';

export type SettingsRoute = 'LOGS' | 'METRICS' | 'PROFILE';

export function SettingsScreen({ onOpen, pendingCount }: { onOpen: (r: SettingsRoute) => void; pendingCount: number }) {
  const staffName = useAuthStore((s) => s.staffName);
  return (
    <Screen>
      <Header title="Settings" />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Card style={styles.profileCard}>
          <View style={styles.avatar}><Icon name="user" size={24} color={COLORS.accent} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{staffName ?? 'Door staff'}</Text>
            <Text style={styles.role}>On duty</Text>
          </View>
        </Card>

        <Text style={styles.section}>Compliance</Text>
        <View style={styles.group}>
          <ListRow icon="logs" title="Logs" subtitle="Scan history & CSV export" onPress={() => onOpen('LOGS')} />
          <View style={styles.divider} />
          <ListRow icon="chart" title="Metrics" subtitle="Tonight, week, month" onPress={() => onOpen('METRICS')} />
        </View>

        <Text style={styles.section}>Account</Text>
        <View style={styles.group}>
          <ListRow icon="user" title="Profile" subtitle="Staff & venue info" onPress={() => onOpen('PROFILE')} />
          {pendingCount > 0 ? (
            <>
              <View style={styles.divider} />
              <ListRow icon="refresh" title="Pending sync" right={`${pendingCount}`} />
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
