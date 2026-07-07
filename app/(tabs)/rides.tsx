import { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { Text, FAB, Surface, Chip, Button, useTheme, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAllRides, useDeleteRide, useSyncStrava } from '../../src/hooks/useRides';
import { useAllBikes } from '../../src/hooks/useBikes';
import { useAppStore } from '../../src/store/appStore';
import { isStravaConnected } from '../../src/services/stravaService';
import { pickAndParseFitFile } from '../../src/services/fitService';
import { pickAndParseGpxFile } from '../../src/services/gpxService';
import { useCreateRide } from '../../src/hooks/useRides';
import { EmptyState } from '../../src/components/common/EmptyState';
import { UnitDisplay } from '../../src/components/common/UnitDisplay';
import { Ride } from '../../src/types';

const SOURCE_ICONS: Record<string, string> = {
  manual: 'pencil',
  strava: 'run-fast',
  fit: 'file-upload',
  gpx: 'map',
};

function RideItem({ ride, onDelete }: { ride: Ride; onDelete: () => void }) {
  const date = new Date(ride.date);
  return (
    <Surface style={styles.rideCard} elevation={1}>
      <View style={styles.rideRow}>
        <MaterialCommunityIcons name={SOURCE_ICONS[ride.source] as any ?? 'bike'} size={20} color="#6b7280" />
        <View style={styles.rideInfo}>
          <Text variant="bodyMedium" style={{ fontWeight: '600' }}>
            {ride.title ?? 'Ride'}
          </Text>
          <Text variant="bodySmall" style={styles.rideDate}>
            {date.toLocaleDateString()} · {ride.source}
          </Text>
        </View>
        <UnitDisplay km={ride.distanceKm} variant="titleMedium" style={{ fontWeight: '700' }} />
      </View>
    </Surface>
  );
}

export default function RidesScreen() {
  const theme = useTheme();
  const [stravaConnected, setStravaConnected] = useState(false);
  const { activeBikeId } = useAppStore();
  const { data: bikes = [] } = useAllBikes();
  const bikeId = activeBikeId ?? bikes[0]?.id ?? '';
  const { data: rides = [], isLoading } = useAllRides();
  const { mutateAsync: createRide } = useCreateRide();
  const { mutate: deleteRide } = useDeleteRide();
  const { mutate: syncStrava, isPending: syncing } = useSyncStrava(bikeId);
  const [fabOpen, setFabOpen] = useState(false);

  useEffect(() => {
    isStravaConnected().then(setStravaConnected);
  }, []);

  async function handleFitUpload() {
    if (!bikeId) return Alert.alert('No bike', 'Select a bike first in the Garage tab.');
    try {
      const activity = await pickAndParseFitFile();
      if (!activity) return;
      await createRide({ ...activity, bikeId, source: 'fit' });
      Alert.alert('Imported', `${activity.name} (${activity.distanceKm.toFixed(1)} km) added.`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  async function handleGpxUpload() {
    if (!bikeId) return Alert.alert('No bike', 'Select a bike first in the Garage tab.');
    try {
      const activity = await pickAndParseGpxFile();
      if (!activity) return;
      await createRide({ ...activity, bikeId, source: 'gpx' });
      Alert.alert('Imported', `${activity.name} (${activity.distanceKm.toFixed(1)} km) added.`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  function handleStravaSync() {
    if (!bikeId) return Alert.alert('No bike', 'Select a bike first in the Garage tab.');
    syncStrava(undefined, {
      onSuccess: (count) => Alert.alert('Synced', `${count} new ride${count !== 1 ? 's' : ''} imported.`),
      onError: (e: any) => Alert.alert('Sync failed', e.message),
    });
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <Surface style={styles.toolbar} elevation={0}>
        {stravaConnected ? (
          <Button
            icon="run-fast"
            mode="outlined"
            onPress={handleStravaSync}
            loading={syncing}
            compact
          >
            Sync Strava
          </Button>
        ) : (
          <Button
            icon="run-fast"
            mode="outlined"
            onPress={() => router.push('/strava/connect')}
            compact
          >
            Connect Strava
          </Button>
        )}
        <Button icon="file-upload" mode="outlined" onPress={handleFitUpload} compact>.FIT</Button>
        <Button icon="map" mode="outlined" onPress={handleGpxUpload} compact>.GPX</Button>
      </Surface>

      {isLoading ? (
        <ActivityIndicator style={{ flex: 1 }} />
      ) : rides.length === 0 ? (
        <EmptyState
          icon="bike"
          title="No rides yet"
          message="Log a ride manually, connect Strava, or upload a .FIT / .GPX file."
          actionLabel="Log Ride"
          onAction={() => router.push('/ride/log')}
        />
      ) : (
        <FlatList
          data={rides}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <RideItem
              ride={item}
              onDelete={() =>
                Alert.alert('Delete ride?', 'This will subtract the distance from your bike.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => deleteRide(item.id) },
                ])
              }
            />
          )}
        />
      )}

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => router.push('/ride/log')}
        label="Log Ride"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  toolbar: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    flexWrap: 'wrap',
  },
  list: { padding: 12, gap: 8, paddingBottom: 80 },
  rideCard: { borderRadius: 12, padding: 14 },
  rideRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rideInfo: { flex: 1 },
  rideDate: { color: '#6b7280', marginTop: 2 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
});
