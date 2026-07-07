import { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import { useAllBikes } from '../../src/hooks/useBikes';
import { useCreateRide } from '../../src/hooks/useRides';
import { useAppStore } from '../../src/store/appStore';
import { displayToKm } from '../../src/services/unitsService';

export default function LogRideScreen() {
  const theme = useTheme();
  const { units, activeBikeId } = useAppStore();
  const { data: bikes = [] } = useAllBikes();
  const { mutate: createRide, isPending } = useCreateRide();

  const defaultBikeId = activeBikeId ?? bikes[0]?.id ?? '';
  const [bikeId, setBikeId] = useState(defaultBikeId);
  const [distanceStr, setDistanceStr] = useState('');
  const [title, setTitle] = useState('');

  function handleSave() {
    const dist = parseFloat(distanceStr);
    if (!dist || dist <= 0) return Alert.alert('Invalid distance', 'Enter a distance greater than 0.');
    if (!bikeId) return Alert.alert('No bike', 'Select a bike.');

    const distKm = displayToKm(dist, units);
    createRide(
      { bikeId, distanceKm: distKm, date: Date.now(), title: title || undefined, source: 'manual' },
      { onSuccess: () => router.back() }
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView style={[styles.screen, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
        <Text variant="titleMedium" style={styles.label}>Bike</Text>
        <SegmentedButtons
          value={bikeId}
          onValueChange={setBikeId}
          buttons={bikes.map((b) => ({ value: b.id, label: b.name }))}
          style={styles.segment}
        />

        <Text variant="titleMedium" style={styles.label}>Distance ({units})</Text>
        <TextInput
          mode="outlined"
          keyboardType="decimal-pad"
          value={distanceStr}
          onChangeText={setDistanceStr}
          placeholder={`e.g. 42.5`}
          right={<TextInput.Affix text={units} />}
          style={styles.input}
        />

        <Text variant="titleMedium" style={styles.label}>Title (optional)</Text>
        <TextInput
          mode="outlined"
          value={title}
          onChangeText={setTitle}
          placeholder="Morning ride"
          style={styles.input}
        />

        <Button mode="contained" onPress={handleSave} loading={isPending} style={styles.btn} icon="check">
          Save Ride
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 20, gap: 8 },
  label: { fontWeight: '600', marginTop: 8 },
  segment: { marginBottom: 8 },
  input: { marginBottom: 8 },
  btn: { marginTop: 16 },
});
