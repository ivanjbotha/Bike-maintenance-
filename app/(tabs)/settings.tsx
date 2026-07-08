import { View, ScrollView, StyleSheet, Alert, Share } from 'react-native';
import { Text, Surface, Switch, SegmentedButtons, Divider, Button, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../../src/store/appStore';
import { getAllBikes } from '../../src/db/queries/bikes';
import { getAllRides } from '../../src/db/queries/rides';
import { LocationPicker } from '../../src/components/common/LocationPicker';
import { Unit } from '../../src/types';

export default function SettingsScreen() {
  const theme = useTheme();
  const { units, setUnits, notificationsEnabled, setNotificationsEnabled } = useAppStore();

  async function handleExport() {
    try {
      const bikes = await getAllBikes();
      const rides = await getAllRides();
      const json = JSON.stringify({ bikes, rides, exportedAt: new Date().toISOString() }, null, 2);
      await Share.share({ title: 'Bike Service Data', message: json });
    } catch (e: any) {
      Alert.alert('Export failed', e.message);
    }
  }

  return (
    <ScrollView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <Surface style={styles.section} elevation={1}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Units</Text>
        <SegmentedButtons
          value={units}
          onValueChange={(v) => setUnits(v as Unit)}
          buttons={[
            { value: 'km', label: 'Kilometres (km)' },
            { value: 'mi', label: 'Miles (mi)' },
          ]}
        />
      </Surface>

      <Surface style={styles.section} elevation={1}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Shop Search Location</Text>
        <Text variant="bodySmall" style={{ color: '#9ca3af' }}>
          Used to find nearby bike shops on the Shops tab. Set this if you're searching a city other than where you are, or if location permission isn't available.
        </Text>
        <LocationPicker />
      </Surface>

      <Surface style={styles.section} elevation={1}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text variant="bodyMedium">Maintenance reminders</Text>
            <Text variant="bodySmall" style={{ color: '#9ca3af' }}>
              Alert when parts need service or replacement
            </Text>
          </View>
          <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} />
        </View>
      </Surface>

      <Surface style={styles.section} elevation={1}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Data</Text>
        <Button mode="outlined" icon="export" onPress={handleExport} style={styles.btn}>
          Export All Data (JSON)
        </Button>
        <Text variant="bodySmall" style={{ color: '#9ca3af', marginTop: 8 }}>
          Exports bikes and rides as JSON. Import not yet available.
        </Text>
      </Surface>

      <Surface style={styles.section} elevation={1}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Strava API Setup</Text>
        <Text variant="bodySmall" style={{ color: '#6b7280', lineHeight: 20 }}>
          To enable Strava sync, register an app at strava.com/settings/api and add your Client ID and Client Secret to:
          {'\n\n'}src/services/stravaService.ts
          {'\n\n'}Set the authorization callback domain to "bikeservice".
        </Text>
      </Surface>

      <Surface style={styles.section} elevation={1}>
        <Text variant="titleMedium" style={styles.sectionTitle}>About</Text>
        <View style={styles.aboutRow}>
          <MaterialCommunityIcons name="bike" size={28} color={theme.colors.primary} />
          <View>
            <Text variant="bodyMedium" style={{ fontWeight: '700' }}>Bike Service</Text>
            <Text variant="bodySmall" style={{ color: '#9ca3af' }}>v1.0.0</Text>
          </View>
        </View>
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  section: { margin: 12, borderRadius: 14, padding: 20, gap: 12 },
  sectionTitle: { fontWeight: '700', marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowInfo: { flex: 1 },
  btn: { alignSelf: 'flex-start' },
  aboutRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
