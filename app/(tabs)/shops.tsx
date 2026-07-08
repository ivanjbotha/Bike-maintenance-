import { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Linking, Alert } from 'react-native';
import { Text, Surface, Button, ActivityIndicator, useTheme, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useNearbyShops } from '../../src/hooks/useNearbyShops';
import { EmptyState } from '../../src/components/common/EmptyState';
import { LocationPicker } from '../../src/components/common/LocationPicker';
import { ShopMap } from '../../src/components/shops/ShopMap';

export default function ShopsScreen() {
  const theme = useTheme();
  const { shops, loading, error, userLocation, fetchShops } = useNearbyShops();

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  const region = userLocation
    ? {
        latitude: userLocation.lat,
        longitude: userLocation.lon,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      }
    : undefined;

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
        >
          <View style={styles.errorPicker}>
            <LocationPicker />
          </View>
        </EmptyState>
      ) : shops.length === 0 ? (
        <EmptyState
          icon="store-off"
          title="No shops found"
          message="No bike shops found within 8 km. Try again or expand your area."
          actionLabel="Refresh"
          onAction={fetchShops}
        />
      ) : (
        <View style={{ flex: 1 }}>
          {region && (
            <ShopMap
              region={region}
              shops={shops}
              color={theme.colors.primary}
              onMarkerPress={(shopId) => router.push(`/shop/${shopId}`)}
            />
          )}

          <FlatList
            data={shops}
            keyExtractor={(s) => s.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.shopList}
            contentContainerStyle={styles.shopListContent}
            renderItem={({ item }) => (
              <Surface style={styles.shopCard} elevation={2} onTouchEnd={() => router.push(`/shop/${item.id}`)}>
                <Text variant="bodyMedium" style={{ fontWeight: '700' }} numberOfLines={1}>{item.name}</Text>
                <Text variant="bodySmall" style={{ color: '#6b7280' }} numberOfLines={1}>{item.address ?? 'No address'}</Text>
                <Chip compact icon="map-marker" style={{ marginTop: 4 }}>
                  {item.distanceKm.toFixed(1)} km
                </Chip>
              </Surface>
            )}
          />
        </View>
      )}

      <Button
        mode="elevated"
        onPress={fetchShops}
        icon="refresh"
        style={styles.refreshBtn}
        compact
      >
        Refresh
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorPicker: { width: '100%', maxWidth: 420, marginTop: 8 },
  shopList: { maxHeight: 140, position: 'absolute', bottom: 0, left: 0, right: 0 },
  shopListContent: { padding: 10, gap: 10 },
  shopCard: { width: 180, padding: 14, borderRadius: 12 },
  refreshBtn: { position: 'absolute', top: 10, right: 10 },
});
