import { useState, useEffect } from 'react';
import { View, StyleSheet, Linking, Alert } from 'react-native';
import { Text, Button, Surface, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getStravaAuthUrl, exchangeCodeForToken, isStravaConnected, disconnectStrava } from '../../src/services/stravaService';

export default function StravaConnectScreen() {
  const theme = useTheme();
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    isStravaConnected().then(setConnected);

    const sub = Linking.addEventListener('url', async ({ url }) => {
      const match = url.match(/[?&]code=([^&]+)/);
      if (!match) return;
      setLoading(true);
      const ok = await exchangeCodeForToken(match[1]);
      setLoading(false);
      if (ok) {
        setConnected(true);
        Alert.alert('Connected!', 'Strava is now linked. Use "Sync Strava" on the Rides tab to import activities.');
      } else {
        Alert.alert('Connection failed', 'Could not exchange the Strava code. Check your client credentials.');
      }
    });

    return () => sub.remove();
  }, []);

  async function handleConnect() {
    const url = getStravaAuthUrl();
    Linking.openURL(url);
  }

  async function handleDisconnect() {
    Alert.alert('Disconnect Strava?', 'This will remove your Strava credentials from the app.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: async () => {
          await disconnectStrava();
          setConnected(false);
        },
      },
    ]);
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <Surface style={styles.card} elevation={2}>
        <MaterialCommunityIcons name="run-fast" size={56} color="#fc4c02" />
        <Text variant="headlineSmall" style={styles.title}>Strava Integration</Text>

        {connected ? (
          <>
            <MaterialCommunityIcons name="check-circle" size={28} color="#22c55e" />
            <Text variant="bodyMedium" style={styles.body}>
              Strava is connected. Use the "Sync Strava" button on the Rides tab to import your latest cycling activities.
            </Text>
            <Button mode="outlined" onPress={handleDisconnect} icon="link-off" textColor="#ef4444">
              Disconnect Strava
            </Button>
          </>
        ) : (
          <>
            <Text variant="bodyMedium" style={styles.body}>
              Connect your Strava account to automatically import cycling activities. Each time you tap "Sync Strava", new rides are fetched and added to the selected bike.
            </Text>
            <Text variant="bodySmall" style={styles.note}>
              Note: Requires a Strava API app with your Client ID and Secret set in stravaService.ts
            </Text>
            <Button
              mode="contained"
              onPress={handleConnect}
              loading={loading}
              icon="run-fast"
              buttonColor="#fc4c02"
            >
              Connect to Strava
            </Button>
          </>
        )}

        <Button mode="text" onPress={() => router.back()}>Done</Button>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'center', padding: 20 },
  card: { borderRadius: 16, padding: 28, alignItems: 'center', gap: 16 },
  title: { fontWeight: '700' },
  body: { textAlign: 'center', color: '#6b7280', lineHeight: 20 },
  note: { textAlign: 'center', color: '#9ca3af', fontStyle: 'italic' },
});
