import { useEffect, useState } from 'react';
import { useColorScheme, Text, View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initDb, resetLocalDatabase } from '../src/db/client';
import { lightTheme, darkTheme } from '../src/constants/theme';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

// Opens the single database connection and runs migrations before anything
// that touches the db can render. Do NOT add expo-sqlite's SQLiteProvider
// around the tree: it opens a second connection to the same file, which the
// web backend (OPFS) rejects.
function DatabaseGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [busy, setBusy] = useState(false);

  function boot(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    action()
      .then(() => setReady(true))
      .catch((e: Error) => setError(e))
      .finally(() => {
        setBusy(false);
        SplashScreen.hideAsync();
      });
  }

  useEffect(() => {
    // Escape hatch for a corrupted local database: opening the app at
    // /?reset-local-data=1 wipes local data before booting, for users whose
    // error screen never renders or who are following support instructions.
    const wantsReset =
      typeof window !== 'undefined' && window.location?.search?.includes('reset-local-data');
    boot(wantsReset ? resetLocalDatabase : initDb);
  }, []);

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 }}>
        <Text style={{ fontWeight: '700' }}>Database failed to start</Text>
        <Text style={{ color: '#6b7280', textAlign: 'center' }}>{error.message}</Text>
        <Text style={{ color: '#6b7280', textAlign: 'center', fontSize: 12 }}>
          If this app is open in another tab, close it and press Try Again. If the problem
          persists, Reset Local Data clears this browser's saved data and starts fresh.
        </Text>
        <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
          <Text
            style={{ color: '#2563eb', fontWeight: '600', padding: 8 }}
            onPress={() => !busy && boot(initDb)}
          >
            Try Again
          </Text>
          <Text
            style={{ color: '#ef4444', fontWeight: '600', padding: 8 }}
            onPress={() => !busy && boot(resetLocalDatabase)}
          >
            Reset Local Data
          </Text>
        </View>
        {busy && <ActivityIndicator color="#22c55e" />}
      </View>
    );
  }
  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }
  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={theme}>
          <DatabaseGate>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="bike/new" options={{ title: 'Add Bike', presentation: 'modal' }} />
              <Stack.Screen name="bike/[id]" options={{ title: 'Bike Details' }} />
              <Stack.Screen name="bike/edit/[id]" options={{ title: 'Edit Bike', presentation: 'modal' }} />
              <Stack.Screen name="part/new" options={{ title: 'Add Part', presentation: 'modal' }} />
              <Stack.Screen name="part/[id]" options={{ title: 'Part Details' }} />
              <Stack.Screen name="part/edit/[id]" options={{ title: 'Edit Part', presentation: 'modal' }} />
              <Stack.Screen name="ride/log" options={{ title: 'Log Ride', presentation: 'modal' }} />
              <Stack.Screen name="ride/[id]" options={{ title: 'Ride Details' }} />
              <Stack.Screen name="shop/[id]" options={{ title: 'Shop Details' }} />
              <Stack.Screen name="strava/connect" options={{ title: 'Connect Strava', presentation: 'modal' }} />
            </Stack>
          </DatabaseGate>
        </PaperProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
