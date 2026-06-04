import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { decisionColor, THEME, Decision } from '../utils/decision';
import { IDIPClient } from '../api/client';

interface LogItem {
  scan_id: string;
  timestamp: string;
  result: Decision;
  risk_score: number;
  state: string | null;
}

const FILTERS: Array<Decision | 'ALL'> = ['ALL', 'ALLOW', 'REVIEW', 'DENY'];

export function LogsScreen({ client }: { client: IDIPClient }) {
  const [items, setItems] = useState<LogItem[]>([]);
  const [filter, setFilter] = useState<Decision | 'ALL'>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const params = filter === 'ALL' ? {} : { decision: filter };
      const data = (await client.getLogs(params)) as { items: LogItem[] };
      setItems(data.items);
    } finally {
      setRefreshing(false);
    }
  }, [client, filter]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {FILTERS.map((f) => (
          <TouchableOpacity key={f} style={[styles.tab, filter === f && styles.tabActive]} onPress={() => setFilter(f)}>
            <Text style={styles.tabText}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={items}
        keyExtractor={(i) => i.scan_id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor="#fff" />}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={[styles.dot, { backgroundColor: decisionColor(item.result) }]} />
            <Text style={styles.rowText}>{item.result} · {item.state ?? '—'} · risk {item.risk_score}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No scans yet</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background, padding: 16 },
  tabs: { flexDirection: 'row', marginBottom: 12 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', backgroundColor: THEME.card, marginHorizontal: 2 },
  tabActive: { backgroundColor: '#2563eb' },
  tabText: { color: '#fff', fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomColor: '#1f2937', borderBottomWidth: 1 },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  rowText: { color: THEME.textPrimary },
  empty: { color: THEME.textSecondary, textAlign: 'center', marginTop: 40 },
});
