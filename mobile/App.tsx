import React, { useEffect, useMemo, useState } from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from './src/store/authStore';
import { IDIPClient, ScanResult } from './src/api/client';
import { COLORS } from './src/theme';
import { MainTab, TabBar } from './src/components/Chrome';
import { Icon } from './src/components/Icon';
import { SetupScreen } from './src/screens/SetupScreen';
import { PINLoginScreen } from './src/screens/PINLoginScreen';
import { ScanHomeScreen, ScanMode } from './src/screens/ScanHomeScreen';
import { ScanScreen } from './src/screens/ScanScreen';
import { PassportScanScreen } from './src/screens/PassportScanScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { ChallengeScreen } from './src/screens/ChallengeScreen';
import { SettingsScreen, SettingsRoute } from './src/screens/SettingsScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { MetricsScreen } from './src/screens/MetricsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';

type Route = 'BOOT' | 'SETUP' | 'PIN' | 'APP';
type Overlay = null | 'RESULT' | 'CHALLENGE';

const CHALLENGE_PROMPTS = ['What is your star sign?', 'What height is on the ID?', 'What eye color is listed?', 'What ZIP code is on the ID?'];

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <Root />
    </SafeAreaProvider>
  );
}

function Root() {
  const { apiUrl, apiKey, isAuthenticated, loadCredentials, logout, reset } = useAuthStore();
  const [route, setRoute] = useState<Route>('BOOT');
  const [tab, setTab] = useState<MainTab>('SCAN');
  const [scanMode, setScanMode] = useState<ScanMode | null>(null);
  const [settingsRoute, setSettingsRoute] = useState<SettingsRoute | null>(null);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);

  useEffect(() => {
    loadCredentials().then((found) => setRoute(found ? 'PIN' : 'SETUP'));
  }, [loadCredentials]);

  const client = useMemo(() => new IDIPClient(apiUrl, apiKey), [apiUrl, apiKey]);

  const scan = async (barcode: string, method: 'camera' | 'manual') => {
    const res = await client.scan({ barcode_data: barcode, scan_method: method });
    setLastResult(res); setOverlay('RESULT');
    return res;
  };
  const scanMrz = async (mrz: string) => {
    const res = await client.scan({ barcode_data: mrz, document_input_type: 'MRZ' });
    setLastResult(res); setOverlay('RESULT');
    return res;
  };

  if (route === 'BOOT') {
    return (
      <View style={styles.boot}>
        <View style={styles.bootLogo}><Icon name="shield" size={34} color={COLORS.accent} /></View>
        <Text style={styles.bootText}>IDIP</Text>
      </View>
    );
  }
  if (route === 'SETUP') return <SetupScreen onDone={() => setRoute('PIN')} />;
  if (route === 'PIN' || !isAuthenticated) return <PINLoginScreen onAuth={() => setRoute('APP')} />;

  const busyOverlay = overlay !== null || settingsRoute !== null;
  const dlActive = tab === 'SCAN' && scanMode === 'DL' && !busyOverlay;
  const passportActive = tab === 'SCAN' && scanMode === 'PASSPORT' && !busyOverlay;

  return (
    <View style={styles.shell}>
      {/* Persistent shell — the camera stays mounted so it never has to cold-restart */}
      <View style={styles.content}>
        {tab === 'SCAN' && scanMode === null && <ScanHomeScreen onChoose={setScanMode} />}
        {tab === 'SCAN' && scanMode === 'DL' && (
          <ScanScreen active={dlActive} scan={scan} onResult={() => setOverlay('RESULT')} onBack={() => setScanMode(null)} />
        )}
        {tab === 'SCAN' && scanMode === 'PASSPORT' && (
          <PassportScanScreen active={passportActive} scanMrz={scanMrz} onResult={() => setOverlay('RESULT')} onBack={() => setScanMode(null)} />
        )}
        {tab === 'SETTINGS' && <SettingsScreen onOpen={setSettingsRoute} pendingCount={0} />}
      </View>
      <TabBar
        active={tab}
        onChange={(t) => {
          setTab(t);
          if (t === 'SCAN') setScanMode(null);
          if (t === 'SETTINGS') setSettingsRoute(null);
        }}
      />

      {/* Settings sub-screens (overlay on top of the shell) */}
      {settingsRoute === 'HISTORY' && <Overlayed><HistoryScreen client={client} onBack={() => setSettingsRoute(null)} /></Overlayed>}
      {settingsRoute === 'METRICS' && <Overlayed><MetricsScreen client={client} onBack={() => setSettingsRoute(null)} /></Overlayed>}
      {settingsRoute === 'PROFILE' && (
        <Overlayed>
          <ProfileScreen
            onBack={() => setSettingsRoute(null)}
            onSignOut={() => { logout(); setRoute('PIN'); }}
            onReset={async () => { await reset(); setRoute('SETUP'); }}
          />
        </Overlayed>
      )}

      {/* Decision overlays */}
      {overlay === 'RESULT' && lastResult && (
        <Overlayed>
          <ResultScreen result={lastResult} onScanNext={() => setOverlay(null)} onChallenge={() => setOverlay('CHALLENGE')} />
        </Overlayed>
      )}
      {overlay === 'CHALLENGE' && lastResult && (
        <Overlayed>
          <ChallengeScreen
            questions={CHALLENGE_PROMPTS}
            submit={(failures) => client.submitChallenge(lastResult.scan_id, failures)}
            onComplete={(res) => { setLastResult(res); setOverlay('RESULT'); }}
            onCancel={() => setOverlay('RESULT')}
          />
        </Overlayed>
      )}
    </View>
  );
}

function Overlayed({ children }: { children: React.ReactNode }) {
  return <View style={styles.overlayFill}>{children}</View>;
}

const styles = StyleSheet.create({
  boot: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center', gap: 16 },
  bootLogo: { width: 68, height: 68, borderRadius: 20, backgroundColor: COLORS.accentSoft, alignItems: 'center', justifyContent: 'center' },
  bootText: { color: COLORS.textPrimary, fontSize: 40, fontWeight: '800', letterSpacing: 4 },
  shell: { flex: 1, backgroundColor: COLORS.bg },
  content: { flex: 1 },
  overlayFill: { ...StyleSheet.absoluteFillObject, backgroundColor: COLORS.bg },
});
