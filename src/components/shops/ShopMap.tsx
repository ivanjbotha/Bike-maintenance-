import { StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CachedShop } from '../../types';

interface Props {
  region: Region;
  shops: CachedShop[];
  color: string;
  onMarkerPress: (shopId: string) => void;
}

export function ShopMap({ region, shops, color, onMarkerPress }: Props) {
  return (
    <MapView style={styles.map} region={region} provider={PROVIDER_DEFAULT} showsUserLocation>
      {shops.map((shop) => (
        <Marker
          key={shop.id}
          coordinate={{ latitude: shop.lat, longitude: shop.lon }}
          title={shop.name}
          description={shop.address ?? undefined}
          onCalloutPress={() => onMarkerPress(shop.id)}
        >
          <MaterialCommunityIcons name="bike" size={28} color={color} />
        </Marker>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
});
