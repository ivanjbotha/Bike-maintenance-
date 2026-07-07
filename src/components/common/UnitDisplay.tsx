import { Text } from 'react-native-paper';
import { useAppStore } from '../../store/appStore';
import { formatDistance } from '../../services/unitsService';

interface Props {
  km: number;
  variant?: 'bodySmall' | 'bodyMedium' | 'bodyLarge' | 'titleMedium' | 'titleLarge';
  style?: object;
}

export function UnitDisplay({ km, variant = 'bodyMedium', style }: Props) {
  const units = useAppStore((s) => s.units);
  return <Text variant={variant} style={style}>{formatDistance(km, units)}</Text>;
}
