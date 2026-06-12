import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Header, Screen } from '../components/Chrome';
import { Segmented } from '../components/ui';
import { Icon } from '../components/Icon';
import { COLORS, DECISION, RADIUS, SPACE, TYPE, Decision } from '../theme';
import { IDIPClient } from '../api/client';

interface LogItem {
  scan_id: string;
  timestamp: string;
  result: Decision;
  risk_score: number;
  state: string | null;
  age: number | null;
}

type Filter = 'ALL' | Decision;
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'ALLOW', label: 'Allow' },
  { key: 'REVIEW', label: 'Review' },
  { key: 'DENY', label: 'Deny' },
];

function timeAgo(iso: string): string {
  try {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return 'now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  } catch { return ''; }
}

export function LogsScreen({ client, onBack }: { client: IDIPClient; onBack: () => void }) {
  const [items, setItems] = useState<LogItem[]>([]);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const params = filter === 'ALL' ? {} : { decision: filter };
      const data = (await client.getLogs(params)) as { items: LogItem[] };
      setItems(data.items);
    } catch { /* offline */ } finally { setRefreshing(false); }
  }, [client, filter]);

  useEffect(() => { load(); }, [load]);

  return (
    <Screen>
      <Header title="Logs" onBack={onBack} right={
        <TouchableOpacity hitSlop={10} onPress={() => client.getLogs({})}>
          <Icon name="refresh" size={22} color={COLORS.textSecondary} />
        </TouchableOpacity>
      } />
      <View style={styles.filterWrap}>
        <Segmented options={FILTERS} value={filter} onChange={setFilter} />
      </View>
      <FlatList
        data={items}
        keyExtractor={(i) => i.scan_id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={COLORS.textSecondary} />}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        renderItem={({ item }) => {
          const d = DECISION[item.result];
          return (
            <View style={styles.row}>
              <View style={[styles.dot, { backgroundColor: d.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{d.label} · {item.state ?? '—'}</Text>
                <Text style={styles.rowSub}>Risk {item.risk_score}{item.age != null ? ` · age ${item.age}` : ''}</Text>
              </View>
              <Text style={styles.time}>{timeAgo(item.timestamp)}</Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="logs" size={36} color={COLORS.textTertiary} />
            <Text style={styles.emptyText}>No scans yet</Text>
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  filterWrap: { paddingHorizontal: SPACE.lg, paddingBottom: SPACE.md },
  list: { paddingHorizontal: SPACE.lg, paddingBottom: SPACE.xxl, flexGrow: 1 },
  sep: { height: 1, backgroundColor: COLORS.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACE.md, paddingVertical: SPACE.lg },
  dot: { width: 12, height: 12, borderRadius: 6 },
  rowTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
  rowSub: { ...TYPE.caption, marginTop: 1 },
  time: { ...TYPE.caption, color: COLORS.textTertiary },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: SPACE.md },
  emptyText: { ...TYPE.body },
});
