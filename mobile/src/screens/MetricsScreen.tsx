import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Header, Screen } from '../components/Chrome';
import { Segmented, StatCard } from '../components/ui';
import { COLORS, SPACE } from '../theme';
import { IDIPClient } from '../api/client';

interface Metrics {
  total_scans: number;
  allow: number;
  review: number;
  deny: number;
  underage_blocked: number;
}

const PERIODS = [
  { key: 'today', label: 'Tonight' },
  { key: 'this_week', label: 'Week' },
  { key: 'this_month', label: 'Month' },
];

export function MetricsScreen({ client, onBack }: { client: IDIPClient; onBack: () => void }) {
  const [period, setPeriod] = useState('today');
  const [data, setData] = useState<Metrics | null>(null);

  const load = useCallback(async () => {
    try { setData((await client.getMetrics(period)) as Metrics); } catch { /* offline */ }
  }, [client, period]);

  useEffect(() => { load(); }, [load]);

  const m = data ?? { total_scans: 0, allow: 0, review: 0, deny: 0, underage_blocked: 0 };

  return (
    <Screen>
      <Header title="Metrics" onBack={onBack} />
      <View style={styles.filterWrap}>
        <Segmented options={PERIODS} value={period} onChange={setPeriod} />
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <StatCard label="Total scans" value={m.total_scans} />
        <View style={styles.grid}>
          <StatCard label="Allowed" value={m.allow} accent={COLORS.allow} />
          <StatCard label="Review" value={m.review} accent={COLORS.review} />
        </View>
        <View style={styles.grid}>
          <StatCard label="Denied" value={m.deny} accent={COLORS.deny} />
          <StatCard label="Underage" value={m.underage_blocked} accent={COLORS.deny} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  filterWrap: { paddingHorizontal: SPACE.lg, paddingBottom: SPACE.md },
  body: { padding: SPACE.lg, gap: SPACE.md },
  grid: { flexDirection: 'row', gap: SPACE.md },
});
