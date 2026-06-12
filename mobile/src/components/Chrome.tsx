import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Edge, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SPACE, TYPE } from '../theme';
import { Icon, IconName } from './Icon';

export function Screen({ children, edges = ['top'], style }: { children: React.ReactNode; edges?: Edge[]; style?: ViewStyle }) {
  return (
    <SafeAreaView edges={edges} style={[styles.screen, style]}>
      {children}
    </SafeAreaView>
  );
}

export function Header({ title, subtitle, onBack, right }: {
  title: string; subtitle?: string; onBack?: () => void; right?: React.ReactNode;
}) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} hitSlop={12} style={styles.backBtn}>
          <Icon name="back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export type MainTab = 'SCAN' | 'SETTINGS';

const TABS: { key: MainTab; icon: IconName; label: string }[] = [
  { key: 'SCAN', icon: 'scan', label: 'Scan' },
  { key: 'SETTINGS', icon: 'settings', label: 'Settings' },
];

export function TabBar({ active, onChange, floating }: { active: MainTab; onChange: (t: MainTab) => void; floating?: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, SPACE.sm) }, floating && styles.tabBarFloating]}>
      {TABS.map((t) => {
        const on = t.key === active;
        const tint = on ? COLORS.accent : COLORS.textTertiary;
        return (
          <TouchableOpacity key={t.key} activeOpacity={0.8} onPress={() => onChange(t.key)} style={styles.tab}>
            <Icon name={t.icon} size={24} color={tint} />
            <Text style={[styles.tabLabel, { color: tint }]}>{t.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACE.md, paddingHorizontal: SPACE.lg, paddingTop: SPACE.md, paddingBottom: SPACE.lg },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginLeft: -4 },
  headerTitle: { ...TYPE.h1 },
  headerSubtitle: { ...TYPE.body, marginTop: 2 },

  tabBar: { flexDirection: 'row', backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACE.sm },
  tabBarFloating: { backgroundColor: 'rgba(20,20,22,0.92)' },
  tab: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 4 },
  tabLabel: { fontSize: 11, fontWeight: '600' },
});
