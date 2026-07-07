import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Surface, Button, Chip, Divider, useTheme, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { usePart, usePartServiceHistory, useDeletePart } from '../../src/hooks/useParts';
import { usePartHealth, useLogService } from '../../src/hooks/usePartHealth';
import { useBike } from '../../src/hooks/useBikes';
import { UnitDisplay } from '../../src/components/common/UnitDisplay';
import { EmptyState } from '../../src/components/common/EmptyState';
import { HEALTH_COLORS, HEALTH_LABELS } from '../../src/constants/colors';
import { ServiceRecord } from '../../src/types';

function ServiceHistoryItem({ record }: { record: ServiceRecord }) {
  const date = new Date(record.date);
  return (
    <View style={styles.historyItem}>
      <MaterialCommunityIcons
        name={record.type === 'replace' ? 'swap-horizontal' : 'wrench'}
        size={18}
        color={record.type === 'replace' ? '#3b82f6' : '#22c55e'}
      />
      <View style={styles.historyInfo}>
        <Text variant="bodyMedium" style={{ fontWeight: '600', textTransform: 'capitalize' }}>
          {record.type}
        </Text>
        <Text variant="bodySmall" style={{ color: '#6b7280' }}>
          {date.toLocaleDateString()} · {record.bikeKmAtService.toFixed(0)} km on bike
          {record.cost != null ? ` · $${record.cost.toFixed(2)}` : ''}
        </Text>
        {record.notes && <Text variant="bodySmall" style={{ color: '#9ca3af' }}>{record.notes}</Text>}
      </View>
    </View>
  );
}

export default function PartDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: part, isLoading: partLoading } = usePart(id);
  const { data: health, isLoading: healthLoading } = usePartHealth(id);
  const { data: history = [] } = usePartServiceHistory(id);
  const { data: bike } = useBike(part?.bikeId ?? '');
  const { mutate: logSvc, isPending: logging } = useLogService(part?.bikeId ?? '');
  const { mutate: deletePart } = useDeletePart(part?.bikeId ?? '');

  if (partLoading || healthLoading) return <ActivityIndicator style={{ flex: 1 }} />;
  if (!part || !health) return <EmptyState icon="wrench" title="Part not found" message="" />;

  const color = HEALTH_COLORS[health.status];
  const totalCost = history.reduce((sum, r) => sum + (r.cost ?? 0), 0);

  function handleDelete() {
    Alert.alert('Remove part?', `This will hide "${part!.name}" from tracking.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          deletePart(id, { onSuccess: () => router.back() });
        },
      },
    ]);
  }

  return (
    <ScrollView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <Surface style={[styles.header, { borderTopColor: color, borderTopWidth: 4 }]} elevation={2}>
        <Text variant="headlineSmall" style={{ fontWeight: '700' }}>{part.name}</Text>
        <Chip style={{ backgroundColor: color + '22', alignSelf: 'flex-start' }} textStyle={{ color }}>
          {HEALTH_LABELS[health.status]}
        </Chip>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text variant="bodySmall" style={styles.statLabel}>Km since service</Text>
            <UnitDisplay km={health.kmSinceLastService} variant="titleMedium" />
          </View>
          <View style={styles.statBox}>
            <Text variant="bodySmall" style={styles.statLabel}>Days since service</Text>
            <Text variant="titleMedium">{Math.floor(health.daysSinceLastService)}d</Text>
          </View>
          {health.nextReplaceInKm !== null && (
            <View style={styles.statBox}>
              <Text variant="bodySmall" style={styles.statLabel}>Km until replace</Text>
              <UnitDisplay km={Math.max(0, health.nextReplaceInKm)} variant="titleMedium" />
            </View>
          )}
          {health.nextReplaceInDays !== null && (
            <View style={styles.statBox}>
              <Text variant="bodySmall" style={styles.statLabel}>Days until replace</Text>
              <Text variant="titleMedium">{Math.max(0, Math.floor(health.nextReplaceInDays))}d</Text>
            </View>
          )}
        </View>

        {totalCost > 0 && (
          <Text variant="bodySmall" style={{ color: '#6b7280', marginTop: 4 }}>
            Total spend: ${totalCost.toFixed(2)}
          </Text>
        )}
      </Surface>

      <View style={styles.actionRow}>
        <Button
          mode="outlined"
          onPress={() => logSvc({ partId: id, type: 'service' })}
          loading={logging}
          icon="wrench"
          style={{ flex: 1 }}
        >
          Serviced
        </Button>
        <Button
          mode="contained"
          onPress={() => logSvc({ partId: id, type: 'replace' })}
          loading={logging}
          icon="swap-horizontal"
          style={{ flex: 1 }}
        >
          Replaced
        </Button>
      </View>

      <Divider style={styles.divider} />
      <Text variant="titleMedium" style={styles.sectionTitle}>Service History</Text>

      {history.length === 0 ? (
        <Text style={styles.emptyHistory}>No service history yet.</Text>
      ) : (
        history.map((r) => <ServiceHistoryItem key={r.id} record={r} />)
      )}

      <Divider style={styles.divider} />
      <Button mode="text" onPress={handleDelete} textColor="#ef4444" icon="delete">
        Remove Part
      </Button>
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { margin: 16, borderRadius: 14, padding: 20, gap: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  statBox: { minWidth: '40%', gap: 4 },
  statLabel: { color: '#6b7280' },
  actionRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginTop: 4 },
  divider: { marginVertical: 16, marginHorizontal: 16 },
  sectionTitle: { fontWeight: '600', paddingHorizontal: 16, marginBottom: 8 },
  emptyHistory: { color: '#9ca3af', paddingHorizontal: 16 },
  historyItem: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 8 },
  historyInfo: { flex: 1, gap: 2 },
});
