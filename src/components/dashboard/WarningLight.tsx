import { useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { PartHealth } from '../../types';
import { HEALTH_COLORS, HEALTH_LABELS } from '../../constants/colors';
import { CATEGORY_ICONS } from '../../constants/partPresets';

interface Props {
  health: PartHealth;
  onPress: () => void;
}

export function WarningLight({ health, onPress }: Props) {
  const color = HEALTH_COLORS[health.status];
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (health.status === 'critical') {
      opacity.value = withRepeat(
        withSequence(withTiming(0.4, { duration: 750 }), withTiming(1, { duration: 750 })),
        -1
      );
    } else if (health.status === 'overdue') {
      opacity.value = withRepeat(
        withSequence(withTiming(0.3, { duration: 400 }), withTiming(1, { duration: 400 })),
        -1
      );
      scale.value = withRepeat(
        withSequence(withTiming(1.05, { duration: 400, easing: Easing.ease }), withTiming(1, { duration: 400 })),
        -1
      );
    } else {
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withTiming(1, { duration: 200 });
    }
  }, [health.status]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const icon = CATEGORY_ICONS[health.category] ?? 'wrench';
  const nextKm = health.nextServiceInKm ?? health.nextReplaceInKm;

  return (
    <Pressable onPress={onPress} style={styles.wrapper}>
      <Animated.View style={[styles.container, { borderColor: color }, animStyle]}>
        <View style={[styles.iconBg, { backgroundColor: color + '22' }]}>
          <MaterialCommunityIcons name={icon as any} size={26} color={color} />
        </View>
        <Text numberOfLines={2} style={[styles.name, { color }]}>
          {health.partName}
        </Text>
        {nextKm !== null && health.status !== 'overdue' && (
          <Text style={styles.badge}>{Math.round(nextKm)} km</Text>
        )}
        {health.status === 'overdue' && (
          <Text style={[styles.badge, { color: HEALTH_COLORS.overdue }]}>OVERDUE</Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    margin: 6,
    maxWidth: '33%',
  },
  container: {
    borderWidth: 2.5,
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    minHeight: 110,
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  name: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
  },
  badge: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 3,
    textAlign: 'center',
  },
});
