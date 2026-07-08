import { CachedShop } from '../../types';

// react-native-maps has no web target and pulls in React Native internals
// that don't bundle for the browser. The web build relies on the shop list
// below the map slot instead; this component intentionally renders nothing.
interface Props {
  region: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number };
  shops: CachedShop[];
  color: string;
  onMarkerPress: (shopId: string) => void;
}

export function ShopMap(_props: Props) {
  return null;
}
