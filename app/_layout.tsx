import { useEffect, useState } from 'react';
import { useColorScheme, Text, View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initDb } from '../src/db/client';
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

  useEffect(() => {
    initDb()
      .then(() => setReady(true))
      .catch((e: Error) => setError(e))
      .finally(() => SplashScreen.hideAsync());
  }, []);

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontWeight: '700', marginBottom: 8 }}>Database failed to start</Text>
        <Text style={{ color: '#6b7280', textAlign: 'center' }}>{error.message}</Text>
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
