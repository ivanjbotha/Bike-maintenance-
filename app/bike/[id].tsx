import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { Text, Surface, FAB, Chip, useTheme, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useBike, useBikeParts } from '../../src/hooks/useBikes';
import { usePartHealth } from '../../src/hooks/usePartHealth';
import { UnitDisplay } from '../../src/components/common/UnitDisplay';
import { EmptyState } from '../../src/components/common/EmptyState';
import { WearGauge } from '../../src/components/common/WearGauge';
import { HEALTH_COLORS } from '../../src/constants/colors';
import { CATEGORY_ICONS } from '../../src/constants/partPresets';
import { Part } from '../../src/types';

function PartRow({ part }: { part: Part }) {
  const { data: health } = usePartHealth(part.id);
  const color = health ? HEALTH_COLORS[health.status] : '#9ca3af';
  const icon = CATEGORY_ICONS[part.category] ?? 'wrench';

  return (
    <Surface
      style={[styles.partCard, { borderLeftColor: color, borderLeftWidth: 4 }]}
      elevation={1}
      onTouchEnd={() => router.push(`/part/${part.id}`)}
    >
      <MaterialCommunityIcons name={icon as any} size={22} color={color} />
      <View style={styles.partInfo}>
        <Text variant="bodyLarge" style={{ fontWeight: '600' }}>{part.name}</Text>
        <View style={styles.partMeta}>
          <Chip compact textStyle={{ fontSize: 10 }}>{part.category}</Chip>
          {health && (
            <Text variant="bodySmall" style={{ color }}>
              {health.status === 'good'
                ? `${Math.round(health.nextReplaceInKm ?? health.nextServiceInKm ?? 0)} km left`
                : health.status === 'overdue'
                ? 'OVERDUE'
                : `Due soon`}
            </Text>
          )}
        </View>
        {health && (
          <WearGauge
            pct={Math.max(health.serviceHealthPct, health.replaceHealthPct)}
            status={health.status}
            showLabel={false}
          />
        )}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color="#9ca3af" />
    </Surface>
  );
}

export default function BikeDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: bike, isLoading: bikeLoading } = useBike(id);
  const { data: parts = [], isLoading: partsLoading } = useBikeParts(id);

  if (bikeLoading || partsLoading) return <ActivityIndicator style={{ flex: 1 }} />;
  if (!bike) return <EmptyState icon="bike-off" title="Bike not found" message="" />;

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <Surface style={styles.header} elevation={0}>
        <Text variant="headlineMedium" style={{ fontWeight: '700' }}>{bike.name}</Text>
        {(bike.brand || bike.model) && (
          <Text variant="bodyMedium" style={{ color: '#6b7280' }}>{[bike.brand, bike.model].filter(Boolean).join(' ')}</Text>
        )}
        <View style={styles.headerRow}>
          <UnitDisplay km={bike.totalKm} variant="titleLarge" style={{ fontWeight: '700', color: '#22c55e' }} />
          <Text variant="bodyMedium" style={{ color: '#6b7280' }}>total distance</Text>
        </View>
      </Surface>

      {parts.length === 0 ? (
        <EmptyState
          icon="wrench"
          title="No parts tracked"
          message="Add parts to start monitoring wear and getting maintenance reminders."
          actionLabel="Add Part"
          onAction={() => router.push(`/part/new?bikeId=${id}`)}
        />
      ) : (
        <FlatList
          data={parts}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <PartRow part={item} />}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => router.push(`/part/new?bikeId=${id}`)}
        label="Add Part"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { padding: 20, gap: 6 },
  headerRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 4 },
  list: { padding: 16, paddingBottom: 80 },
  partCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
  },
  partInfo: { flex: 1, gap: 4 },
  partMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
});
