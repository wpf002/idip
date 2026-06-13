import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from './src/store/authStore';
import { IDIPClient, ScanResult } from './src/api/client';
import { scanWithBlinkId } from './src/services/blinkid';
import { COLORS } from './src/theme';
import { MainTab, TabBar } from './src/components/Chrome';
import { Icon } from './src/components/Icon';
import { SetupScreen } from './src/screens/SetupScreen';
import { PINLoginScreen } from './src/screens/PINLoginScreen';
import { ScanHomeScreen, ScanMode } from './src/screens/ScanHomeScreen';
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
  const [settingsRoute, setSettingsRoute] = useState<SettingsRoute | null>(null);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    loadCredentials().then((found) => setRoute(found ? 'PIN' : 'SETUP'));
  }, [loadCredentials]);

  const client = useMemo(() => new IDIPClient(apiUrl, apiKey), [apiUrl, apiKey]);

  const startScan = async (mode: ScanMode) => {
    try {
      const r = await scanWithBlinkId(mode); // opens BlinkID's camera UI
      if (!r) return;                    // cancelled / nothing scanned
      setScanning(true);
      const res = await client.scanStructured(r.payload);
      setLastResult(res);
      setFaceImage(r.faceImage ?? null);
      setOverlay('RESULT');
    } catch {
      // cancelled, license error, or network error — return to the chooser
    } finally {
      setScanning(false);
    }
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

  return (
    <View style={styles.shell}>
      <View style={styles.content}>
        {tab === 'SCAN' && <ScanHomeScreen onChoose={startScan} />}
        {tab === 'SETTINGS' && <SettingsScreen onOpen={setSettingsRoute} pendingCount={0} />}
      </View>
      <TabBar active={tab} onChange={(t) => { setTab(t); if (t === 'SETTINGS') setSettingsRoute(null); }} />

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

      {overlay === 'RESULT' && lastResult && (
        <Overlayed>
          <ResultScreen result={lastResult} photoUri={faceImage} onScanNext={() => setOverlay(null)} onChallenge={() => setOverlay('CHALLENGE')} />
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

      {scanning && (
        <View style={styles.scrim}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.scrimText}>Checking…</Text>
        </View>
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
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,10,11,0.7)', alignItems: 'center', justifyContent: 'center', gap: 12 },
  scrimText: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '600' },
});
