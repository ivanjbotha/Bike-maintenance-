import { useEffect } from 'react';
import { View, StyleSheet, FlatList, Linking } from 'react-native';
import { Text, Surface, Button, ActivityIndicator, useTheme, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useNearbyShops } from '../../src/hooks/useNearbyShops';
import { EmptyState } from '../../src/components/common/EmptyState';

// react-native-maps has no web target, so the web build shows a list instead
// of the native interactive map used on iOS/Android.
export default function ShopsScreen() {
  const theme = useTheme();
  const { shops, loading, error, userLocation, fetchShops } = useNearbyShops();

  useEffect(() => {
    fetchShops();
  }, []);

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 12, color: '#6b7280' }}>Finding nearby shops…</Text>
        </View>
      ) : error ? (
        <EmptyState
          icon="map-marker-off"
          title="Location unavailable"
          message={error}
          actionLabel="Retry"
          onAction={fetchShops}
        />
      ) : shops.length === 0 ? (
        <EmptyState
          icon="store-off"
          title="No shops found"
          message="No bike shops found within 8 km. Try again or expand your area."
          actionLabel="Refresh"
          onAction={fetchShops}
        />
      ) : (
        <FlatList
          data={shops}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            userLocation ? (
              <Text variant="bodySmall" style={styles.hint}>
                {shops.length} shops within 8 km. Open the mobile app for an interactive map.
              </Text>
            ) : null
          }
          renderItem={({ item }) => (
            <Surface style={styles.shopCard} elevation={1} onTouchEnd={() => router.push(`/shop/${item.id}`)}>
              <MaterialCommunityIcons name="bike" size={22} color={theme.colors.primary} />
              <View style={styles.shopInfo}>
                <Text variant="bodyLarge" style={{ fontWeight: '700' }}>{item.name}</Text>
                <Text variant="bodySmall" style={{ color: '#6b7280' }}>{item.address ?? 'No address'}</Text>
                <View style={styles.shopMeta}>
                  <Chip compact icon="map-marker">{item.distanceKm.toFixed(1)} km</Chip>
                  {item.website && (
                    <Button compact mode="text" onPress={() => Linking.openURL(item.website!)}>
                      Website
                    </Button>
                  )}
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#9ca3af" />
            </Surface>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}

      <Button mode="elevated" onPress={fetchShops} icon="refresh" style={styles.refreshBtn} compact>
        Refresh
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, paddingBottom: 80 },
  hint: { color: '#6b7280', marginBottom: 10 },
  shopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
  },
  shopInfo: { flex: 1, gap: 4 },
  shopMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  refreshBtn: { position: 'absolute', top: 10, right: 10 },
});
