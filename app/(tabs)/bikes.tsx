import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { Text, Surface, FAB, Chip, useTheme, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAllBikes } from '../../src/hooks/useBikes';
import { EmptyState } from '../../src/components/common/EmptyState';
import { UnitDisplay } from '../../src/components/common/UnitDisplay';
import { Bike } from '../../src/types';

const TYPE_ICONS: Record<string, string> = {
  road: 'bike',
  mtb: 'bike',
  gravel: 'terrain',
  commuter: 'city',
  ebike: 'lightning-bolt',
};

function BikeCard({ bike }: { bike: Bike }) {
  return (
    <Surface style={styles.card} elevation={2}>
      <MaterialCommunityIcons name={(TYPE_ICONS[bike.type] ?? 'bike') as any} size={32} color="#22c55e" />
      <View style={styles.cardInfo}>
        <Text variant="titleMedium" style={styles.bikeName}>{bike.name}</Text>
        {(bike.brand || bike.model) && (
          <Text variant="bodySmall" style={styles.bikeSub}>{[bike.brand, bike.model].filter(Boolean).join(' ')}</Text>
        )}
        <View style={styles.cardRow}>
          <UnitDisplay km={bike.totalKm} variant="bodyMedium" />
          <Chip compact icon="tag-outline" style={styles.typeChip}>{bike.type}</Chip>
        </View>
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={24}
        color="#9ca3af"
        onPress={() => router.push(`/bike/${bike.id}`)}
      />
    </Surface>
  );
}

export default function BikesScreen() {
  const theme = useTheme();
  const { data: bikes = [], isLoading } = useAllBikes();

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      {bikes.length === 0 ? (
        <EmptyState
          icon="garage"
          title="Your garage is empty"
          message="Add your first bike to start tracking parts and maintenance."
          actionLabel="Add Bike"
          onAction={() => router.push('/bike/new')}
        />
      ) : (
        <FlatList
          data={bikes}
          keyExtractor={(b) => b.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <MaterialCommunityIcons.Button
              name="arrow-right"
              backgroundColor="transparent"
              onPress={() => router.push(`/bike/${item.id}`)}
              iconStyle={{ display: 'none' }}
            >
              <BikeCard bike={item} />
            </MaterialCommunityIcons.Button>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => router.push('/bike/new')}
        label="Add Bike"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { padding: 16, paddingBottom: 80 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 14,
  },
  cardInfo: { flex: 1, gap: 4 },
  bikeName: { fontWeight: '700' },
  bikeSub: { color: '#6b7280' },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  typeChip: { height: 24 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
});
