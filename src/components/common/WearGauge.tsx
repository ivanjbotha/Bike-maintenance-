import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { HEALTH_COLORS } from '../../constants/colors';
import { HealthStatus } from '../../types';

interface Props {
  pct: number;
  status: HealthStatus;
  showLabel?: boolean;
}

export function WearGauge({ pct, status, showLabel = true }: Props) {
  const color = HEALTH_COLORS[status];
  const fillPct = Math.min(100, Math.max(0, pct));

  return (
    <View style={styles.wrapper}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${fillPct}%`, backgroundColor: color }]} />
        {status === 'overdue' && <View style={styles.overdueCap} />}
      </View>
      {showLabel && (
        <Text variant="bodySmall" style={[styles.label, { color }]}>
          {Math.round(Math.min(999, pct))}%
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  track: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e5e7eb1a',
    overflow: 'hidden',
    flexDirection: 'row',
  },
  fill: { height: '100%', borderRadius: 3 },
  overdueCap: { width: 2, height: '100%', backgroundColor: '#450a0a' },
  label: { minWidth: 34, textAlign: 'right', fontWeight: '700', fontSize: 11 },
});
