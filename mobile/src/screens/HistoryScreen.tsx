import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Header, Screen } from '../components/Chrome';
import { Segmented } from '../components/ui';
import { Icon } from '../components/Icon';
import { COLORS, DECISION, RADIUS, SPACE, TYPE, Decision } from '../theme';
import { IDIPClient } from '../api/client';

interface Flag { code: string; message: string; weight: number }
interface LogItem {
  scan_id: string;
  timestamp: string;
  result: Decision;
  risk_score: number;
  state: string | null;
  age: number | null;
  flags?: Flag[];
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
    if (diff < 60) return 'Now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch { return ''; }
}

function reasonFor(item: LogItem): string {
  const flags = item.flags ?? [];
  if (!flags.length) return 'Clean — no flags raised';
  const top = [...flags].sort((a, b) => b.weight - a.weight)[0];
  const msg = top.message || top.code;
  return msg.charAt(0).toUpperCase() + msg.slice(1);
}

export function HistoryScreen({ client, onBack }: { client: IDIPClient; onBack: () => void }) {
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
      <Header title="History" onBack={onBack} />
      <View style={styles.filterWrap}>
        <Segmented options={FILTERS} value={filter} onChange={setFilter} />
      </View>
      <FlatList
        data={items}
        keyExtractor={(i) => i.scan_id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={COLORS.textSecondary} />}
        ListHeaderComponent={
          <View style={styles.legend}>
            <Text style={styles.legendTitle}>Risk score</Text>
            <Text style={styles.legendText}>
              Every scan is scored 0–100 from age, expiry, format and fraud checks.
              <Text style={{ color: COLORS.allow }}>  0–30 Allow</Text> ·
              <Text style={{ color: COLORS.review }}> 31–70 Review</Text> ·
              <Text style={{ color: COLORS.deny }}> 71+ Deny</Text>.
            </Text>
            <Text style={styles.legendNote}>No names or ID numbers are stored — only the decision and its reasons.</Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        renderItem={({ item }) => {
          const d = DECISION[item.result];
          return (
            <View style={styles.row}>
              <View style={[styles.dot, { backgroundColor: d.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{d.label}{item.state ? ` · ${item.state}` : ''}{item.age != null ? ` · Age ${item.age}` : ''}</Text>
                <Text style={styles.rowReason} numberOfLines={2}>{reasonFor(item)}</Text>
              </View>
              <View style={styles.rowRight}>
                <View style={[styles.riskBadge, { backgroundColor: d.color + '22' }]}>
                  <Text style={[styles.riskText, { color: d.color }]}>{item.risk_score}</Text>
                </View>
                <Text style={styles.time}>{timeAgo(item.timestamp)}</Text>
              </View>
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
  legend: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACE.lg, marginBottom: SPACE.md },
  legendTitle: { ...TYPE.label, color: COLORS.textSecondary, textTransform: 'uppercase', marginBottom: SPACE.xs },
  legendText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19 },
  legendNote: { ...TYPE.caption, marginTop: SPACE.sm },
  sep: { height: 1, backgroundColor: COLORS.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACE.md, paddingVertical: SPACE.lg },
  dot: { width: 12, height: 12, borderRadius: 6 },
  rowTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  rowReason: { ...TYPE.caption, color: COLORS.textSecondary, marginTop: 2 },
  rowRight: { alignItems: 'flex-end', gap: 4 },
  riskBadge: { borderRadius: RADIUS.sm, paddingHorizontal: SPACE.sm, paddingVertical: 2, minWidth: 34, alignItems: 'center' },
  riskText: { fontSize: 13, fontWeight: '800' },
  time: { ...TYPE.caption, color: COLORS.textTertiary },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: SPACE.md },
  emptyText: { ...TYPE.body },
});
