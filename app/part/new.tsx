import { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, TextInput, Button, Divider, Checkbox, useTheme } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { useCreatePart } from '../../src/hooks/useParts';
import { PART_PRESETS } from '../../src/constants/partPresets';
import { PartPreset } from '../../src/types';

export default function NewPartScreen() {
  const theme = useTheme();
  const { bikeId } = useLocalSearchParams<{ bikeId: string }>();
  const { mutate: createPart, isPending } = useCreatePart(bikeId ?? '');

  const [selectedPreset, setSelectedPreset] = useState<PartPreset | null>(null);
  const [customName, setCustomName] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [svcKm, setSvcKm] = useState('');
  const [repKm, setRepKm] = useState('');
  const [svcDays, setSvcDays] = useState('');
  const [repDays, setRepDays] = useState('');

  function applyPreset(preset: PartPreset) {
    setSelectedPreset(preset);
    setCustomName(preset.name);
    setSvcKm(preset.serviceIntervalKm?.toString() ?? '');
    setRepKm(preset.replaceIntervalKm?.toString() ?? '');
    setSvcDays(preset.serviceIntervalDays?.toString() ?? '');
    setRepDays(preset.replaceIntervalDays?.toString() ?? '');
  }

  function handleSave() {
    if (!customName.trim()) return Alert.alert('Name required');
    if (!bikeId) return Alert.alert('No bike', 'Return to the bike and try again.');
    createPart(
      {
        name: customName.trim(),
        category: selectedPreset?.category ?? 'other',
        serviceIntervalKm: svcKm ? parseFloat(svcKm) : null,
        replaceIntervalKm: repKm ? parseFloat(repKm) : null,
        serviceIntervalDays: svcDays ? parseInt(svcDays) : null,
        replaceIntervalDays: repDays ? parseInt(repDays) : null,
      },
      {
        onSuccess: () => router.back(),
        onError: (e: any) => {
          // Alert.alert is a no-op on web, so surface the error inline as well.
          console.error('Add part failed:', e);
          const msg = e?.message ?? 'Something went wrong. Please try again.';
          setSaveError(msg);
          Alert.alert('Could not add part', msg);
        },
      }
    );
  }

  return (
    <ScrollView style={[styles.screen, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
      <Text variant="titleMedium" style={styles.label}>Choose a preset (or set custom values below)</Text>
      {PART_PRESETS.map((preset) => (
        <View key={preset.name} style={styles.presetRow}>
          <Checkbox
            status={selectedPreset?.name === preset.name ? 'checked' : 'unchecked'}
            onPress={() => applyPreset(preset)}
          />
          <Text variant="bodyMedium" onPress={() => applyPreset(preset)}>{preset.name}</Text>
        </View>
      ))}

      <Divider style={styles.divider} />
      <Text variant="titleMedium" style={styles.label}>Custom / Override</Text>

      <TextInput mode="outlined" label="Part Name *" value={customName} onChangeText={setCustomName} style={styles.input} />
      <TextInput mode="outlined" label="Service interval (km)" value={svcKm} onChangeText={setSvcKm} keyboardType="decimal-pad" style={styles.input} />
      <TextInput mode="outlined" label="Replace interval (km)" value={repKm} onChangeText={setRepKm} keyboardType="decimal-pad" style={styles.input} />
      <TextInput mode="outlined" label="Service interval (days)" value={svcDays} onChangeText={setSvcDays} keyboardType="number-pad" style={styles.input} />
      <TextInput mode="outlined" label="Replace interval (days)" value={repDays} onChangeText={setRepDays} keyboardType="number-pad" style={styles.input} />

      {saveError && (
        <Text variant="bodyMedium" style={{ color: '#ef4444', marginTop: 8 }}>
          Could not add part: {saveError}
        </Text>
      )}
      <Button mode="contained" onPress={handleSave} loading={isPending} icon="check" style={styles.btn}>
        Add Part
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 20, gap: 6 },
  label: { fontWeight: '600', marginTop: 8, marginBottom: 4 },
  divider: { marginVertical: 12 },
  presetRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 2 },
  input: { marginBottom: 4 },
  btn: { marginTop: 16 },
});
