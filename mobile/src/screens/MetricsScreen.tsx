import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { THEME } from '../utils/decision';
import { IDIPClient } from '../api/client';

interface Metrics {
  total_scans: number;
  allow: number;
  review: number;
  deny: number;
  underage_blocked: number;
}

const PERIODS: Array<{ key: string; label: string }> = [
  { key: 'today', label: 'Tonight' },
  { key: 'this_week', label: 'This Week' },
  { key: 'this_month', label: 'This Month' },
];

export function MetricsScreen({ client }: { client: IDIPClient }) {
  const [period, setPeriod] = useState('today');
  const [data, setData] = useState<Metrics | null>(null);

  const load = useCallback(async () => {
    setData((await client.getMetrics(period)) as Metrics);
  }, [client, period]);

  useEffect(() => {
    load();
  }, [load]);

  const stat = (label: string, value: number | undefined) => (
    <View style={styles.card}>
      <Text style={styles.value}>{value ?? 0}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.toggle}>
        {PERIODS.map((p) => (
          <TouchableOpacity key={p.key} style={[styles.toggleBtn, period === p.key && styles.toggleActive]} onPress={() => setPeriod(p.key)}>
            <Text style={styles.toggleText}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.grid}>
        {stat('Total', data?.total_scans)}
        {stat('Allowed', data?.allow)}
        {stat('Review', data?.review)}
        {stat('Denied', data?.deny)}
        {stat('Underage', data?.underage_blocked)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background, padding: 16 },
  toggle: { flexDirection: 'row', marginBottom: 16 },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: THEME.card, borderRadius: 8, marginHorizontal: 2 },
  toggleActive: { backgroundColor: '#2563eb' },
  toggleText: { color: '#fff', fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  card: { width: '48%', margin: '1%', backgroundColor: THEME.card, borderRadius: 12, padding: 20, alignItems: 'center' },
  value: { color: '#fff', fontSize: 32, fontWeight: '800' },
  label: { color: THEME.textSecondary, marginTop: 4 },
});
