import { useState, useCallback } from 'react';
import * as Location from 'expo-location';
import { fetchNearbyBikeShops, distanceBetween } from '../services/overpassService';
import { upsertShops } from '../db/queries/shops';
import { useAppStore } from '../store/appStore';
import { CachedShop } from '../types';

interface ShopWithDistance extends CachedShop {
  distanceKm: number;
}

export function useNearbyShops() {
  const searchLocation = useAppStore((s) => s.searchLocation);
  const [shops, setShops] = useState<ShopWithDistance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);

  const fetchShops = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let lat: number, lon: number;

      if (searchLocation) {
        ({ lat, lon } = searchLocation);
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Location permission denied. Enable location, or set a search location in Settings.');
          setLoading(false);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        lat = loc.coords.latitude;
        lon = loc.coords.longitude;
      }
      setUserLocation({ lat, lon });

      const fetched = await fetchNearbyBikeShops(lat, lon);
      await upsertShops(fetched);

      const withDist = fetched
        .map((s) => ({ ...s, distanceKm: distanceBetween(lat, lon, s.lat, s.lon) }))
        .sort((a, b) => a.distanceKm - b.distanceKm);

      setShops(withDist);
    } catch (e: any) {
      setError(e.message ?? 'Failed to fetch nearby shops');
    } finally {
      setLoading(false);
    }
  }, [searchLocation]);

  return { shops, loading, error, userLocation, fetchShops };
}
