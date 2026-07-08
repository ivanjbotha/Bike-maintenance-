import { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, Checkbox, Divider, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import { useCreateBike } from '../../src/hooks/useBikes';
import { useCreatePart } from '../../src/hooks/useParts';
import { PART_PRESETS } from '../../src/constants/partPresets';
import { BikeType, PartPreset } from '../../src/types';
import { useAppStore } from '../../src/store/appStore';

const BIKE_TYPES: { value: BikeType; label: string }[] = [
  { value: 'road', label: 'Road' },
  { value: 'mtb', label: 'MTB' },
  { value: 'gravel', label: 'Gravel' },
  { value: 'commuter', label: 'Commuter' },
  { value: 'ebike', label: 'E-Bike' },
];

export default function NewBikeScreen() {
  const theme = useTheme();
  const { units } = useAppStore();
  const { mutateAsync: createBike, isPending: creatingBike } = useCreateBike();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [bikeType, setBikeType] = useState<BikeType>('road');
  const [odometerStr, setOdometerStr] = useState('0');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [selectedPresets, setSelectedPresets] = useState<Set<string>>(
    new Set(PART_PRESETS.slice(0, 6).map((p) => p.name))
  );

  function togglePreset(name: string) {
    setSelectedPresets((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  async function handleFinish() {
    try {
      const totalKm = parseFloat(odometerStr) || 0;
      const bike = await createBike({ name, brand, model, type: bikeType, totalKm });
      const createPart = async (preset: PartPreset) => {
        const { createPart: cp } = await import('../../src/db/queries/parts');
        await cp({
          bikeId: bike.id,
          name: preset.name,
          category: preset.category,
          serviceIntervalKm: preset.serviceIntervalKm,
          replaceIntervalKm: preset.replaceIntervalKm,
          serviceIntervalDays: preset.serviceIntervalDays,
          replaceIntervalDays: preset.replaceIntervalDays,
          installKm: totalKm,
        });
      };

      const presetsToAdd = PART_PRESETS.filter((p) => selectedPresets.has(p.name));
      for (const p of presetsToAdd) await createPart(p);

      router.replace('/');
    } catch (e: any) {
      // Alert.alert is a no-op on web, so surface the error inline as well.
      console.error('Create bike failed:', e);
      const msg = e?.message ?? 'Something went wrong. Please try again.';
      setSaveError(msg);
      Alert.alert('Could not create bike', msg);
    }
  }

  return (
    <ScrollView style={[styles.screen, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
      {step === 0 && (
        <>
          <Text variant="headlineSmall" style={styles.heading}>Bike Details</Text>
          <TextInput mode="outlined" label="Bike Name *" value={name} onChangeText={setName} style={styles.input} />
          <TextInput mode="outlined" label="Brand (optional)" value={brand} onChangeText={setBrand} style={styles.input} />
          <TextInput mode="outlined" label="Model (optional)" value={model} onChangeText={setModel} style={styles.input} />
          <Text variant="titleSmall" style={styles.label}>Type</Text>
          <SegmentedButtons value={bikeType} onValueChange={(v) => setBikeType(v as BikeType)} buttons={BIKE_TYPES} style={styles.input} />
          <Button mode="contained" onPress={() => { if (!name.trim()) return Alert.alert('Name required'); setStep(1); }} style={styles.btn}>
            Next
          </Button>
        </>
      )}

      {step === 1 && (
        <>
          <Text variant="headlineSmall" style={styles.heading}>Current Odometer</Text>
          <Text variant="bodyMedium" style={styles.sub}>
            If this bike has existing mileage, enter it now so part wear is calculated correctly.
          </Text>
          <TextInput
            mode="outlined"
            label={`Odometer (${units})`}
            value={odometerStr}
            onChangeText={setOdometerStr}
            keyboardType="decimal-pad"
            right={<TextInput.Affix text={units} />}
            style={styles.input}
          />
          <View style={styles.rowBtns}>
            <Button mode="outlined" onPress={() => setStep(0)} style={{ flex: 1 }}>Back</Button>
            <Button mode="contained" onPress={() => setStep(2)} style={{ flex: 1 }}>Next</Button>
          </View>
        </>
      )}

      {step === 2 && (
        <>
          <Text variant="headlineSmall" style={styles.heading}>Add Parts</Text>
          <Text variant="bodyMedium" style={styles.sub}>Select the parts you want to track. You can add more later.</Text>
          <Divider style={styles.divider} />
          {PART_PRESETS.map((preset) => (
            <View key={preset.name} style={styles.presetRow}>
              <Checkbox
                status={selectedPresets.has(preset.name) ? 'checked' : 'unchecked'}
                onPress={() => togglePreset(preset.name)}
              />
              <View style={styles.presetInfo}>
                <Text variant="bodyMedium" style={{ fontWeight: '600' }}>{preset.name}</Text>
                <Text variant="bodySmall" style={{ color: '#6b7280' }}>
                  {[
                    preset.serviceIntervalKm && `Service: ${preset.serviceIntervalKm} km`,
                    preset.replaceIntervalKm && `Replace: ${preset.replaceIntervalKm} km`,
                  ].filter(Boolean).join(' · ')}
                </Text>
              </View>
            </View>
          ))}
          <Divider style={styles.divider} />
          {saveError && (
            <Text variant="bodyMedium" style={{ color: '#ef4444' }}>
              Could not create bike: {saveError}
            </Text>
          )}
          <View style={styles.rowBtns}>
            <Button mode="outlined" onPress={() => setStep(1)} style={{ flex: 1 }}>Back</Button>
            <Button mode="contained" onPress={handleFinish} loading={creatingBike} style={{ flex: 1 }} icon="check">
              Create Bike
            </Button>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 20, gap: 12 },
  heading: { fontWeight: '700', marginBottom: 4 },
  sub: { color: '#6b7280', marginBottom: 8 },
  label: { fontWeight: '600', marginTop: 8 },
  input: { marginBottom: 4 },
  btn: { marginTop: 12 },
  rowBtns: { flexDirection: 'row', gap: 12, marginTop: 12 },
  divider: { marginVertical: 8 },
  presetRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  presetInfo: { flex: 1 },
});
