import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuthStore } from './src/store/authStore';
import { IDIPClient, ScanResult } from './src/api/client';
import { THEME } from './src/utils/decision';
import { SetupScreen } from './src/screens/SetupScreen';
import { PINLoginScreen } from './src/screens/PINLoginScreen';
import { ScanScreen } from './src/screens/ScanScreen';
import { MRZScanScreen } from './src/screens/MRZScanScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { ChallengeScreen } from './src/screens/ChallengeScreen';
import { LogsScreen } from './src/screens/LogsScreen';
import { MetricsScreen } from './src/screens/MetricsScreen';

type Route = 'BOOT' | 'SETUP' | 'PIN' | 'SCAN' | 'MRZ' | 'RESULT' | 'CHALLENGE' | 'LOGS' | 'METRICS';
type Tab = 'SCAN' | 'MRZ' | 'LOGS' | 'METRICS';

export default function App() {
  const { apiUrl, apiKey, hasCredentials, isAuthenticated, loadCredentials } = useAuthStore();
  const [route, setRoute] = useState<Route>('BOOT');
  const [tab, setTab] = useState<Tab>('SCAN');
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);

  useEffect(() => {
    loadCredentials().then((found) => setRoute(found ? 'PIN' : 'SETUP'));
  }, [loadCredentials]);

  const client = useMemo(
    () => (apiUrl && apiKey ? new IDIPClient(apiUrl, apiKey) : null),
    [apiUrl, apiKey],
  );

  const scan = async (barcode: string, method: 'camera' | 'manual') => {
    const res = await client!.scan({ barcode_data: barcode, scan_method: method });
    setLastResult(res);
    return res;
  };
  const scanMrz = async (mrz: string) => {
    const res = await client!.scan({ barcode_data: mrz, document_input_type: 'MRZ' });
    setLastResult(res);
    return res;
  };

  if (route === 'BOOT') {
    return <View style={styles.boot}><Text style={styles.bootText}>IDIP</Text></View>;
  }
  if (route === 'SETUP') {
    return <SetupScreen onDone={() => setRoute('PIN')} />;
  }
  if (route === 'PIN' || !isAuthenticated) {
    return <PINLoginScreen onAuth={() => setRoute('SCAN')} />;
  }

  if (route === 'RESULT' && lastResult) {
    return (
      <ResultScreen
        result={lastResult}
        onScanNext={() => setRoute('SCAN')}
        onChallenge={() => setRoute('CHALLENGE')}
      />
    );
  }
  if (route === 'CHALLENGE' && lastResult && client) {
    return (
      <ChallengeScreen
        questions={['Star sign?', 'Height on ID?', 'Eye color?', 'ZIP on ID?']}
        submit={(failures) => client.submitChallenge(lastResult.scan_id, failures)}
        onComplete={(res) => {
          setLastResult(res);
          setRoute('RESULT');
        }}
      />
    );
  }

  const body = () => {
    if (!client) return null;
    switch (tab) {
      case 'SCAN':
        return <ScanScreen scan={scan} onResult={() => setRoute('RESULT')} />;
      case 'MRZ':
        return <MRZScanScreen scanMrz={scanMrz} onResult={() => setRoute('RESULT')} />;
      case 'LOGS':
        return <LogsScreen client={client} />;
      case 'METRICS':
        return <MetricsScreen client={client} />;
    }
  };

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'SCAN', label: 'Scan' },
    { key: 'MRZ', label: 'Passport' },
    { key: 'LOGS', label: 'Logs' },
    { key: 'METRICS', label: 'Metrics' },
  ];

  return (
    <View style={styles.shell}>
      <View style={styles.content}>{body()}</View>
      <View style={styles.tabBar}>
        {tabs.map((t) => (
          <TouchableOpacity key={t.key} style={styles.tabItem} onPress={() => setTab(t.key)}>
            <Text style={[styles.tabLabel, tab === t.key && styles.tabActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  boot: { flex: 1, backgroundColor: THEME.background, alignItems: 'center', justifyContent: 'center' },
  bootText: { color: '#fff', fontSize: 40, fontWeight: '900', letterSpacing: 4 },
  shell: { flex: 1, backgroundColor: THEME.background },
  content: { flex: 1 },
  tabBar: { flexDirection: 'row', backgroundColor: THEME.card, paddingVertical: 10 },
  tabItem: { flex: 1, alignItems: 'center' },
  tabLabel: { color: THEME.textSecondary, fontWeight: '600' },
  tabActive: { color: '#fff' },
});
