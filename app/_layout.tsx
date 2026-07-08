import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useDbMigrations } from '../src/db/client';
import { lightTheme, darkTheme } from '../src/constants/theme';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

function MigrationRunner({ children }: { children: React.ReactNode }) {
  const { success, error } = useDbMigrations();

  useEffect(() => {
    if (success || error) {
      SplashScreen.hideAsync();
    }
  }, [success, error]);

  if (!success && !error) return null;
  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={theme}>
          <MigrationRunner>
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
          </MigrationRunner>
        </PaperProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
