import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { Text } from 'react-native-paper';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import type { PartHealth, PartCategory } from '../../types';
import { HEALTH_COLORS } from '../../constants/colors';
import { PART_PRESETS, CATEGORY_ICONS } from '../../constants/partPresets';

// ─── SVG geometry ─────────────────────────────────────────────────────────
const VW = 400;
const VH = 260;

// Integrated aero handlebar silhouette (frontal view).
// Clockwise from top-left corner of bar through right end, down stem, back up and around left end.
const HANDLEBAR_PATH =
  'M 40,28 L 165,28 C 178,26 190,24 200,24 C 210,24 222,26 235,28 ' +
  'L 360,28 C 382,28 392,42 392,66 C 392,89 381,104 364,108 ' +
  'L 234,94 C 231,92 230,96 230,104 L 230,224 ' +
  'C 230,236 220,242 200,242 C 180,242 170,236 170,224 ' +
  'L 170,104 C 170,96 169,92 166,94 ' +
  'L 36,108 C 19,104 8,89 8,66 C 8,42 18,28 40,28 Z';

// Subtle inner relief line across the bar bottom surface
const INNER_LINE = 'M 36,95 C 100,88 150,85 200,85 C 250,85 300,88 364,95';

// ─── Slot definitions ─────────────────────────────────────────────────────
type SlotDef = {
  id: string;
  x: number;     // center x in VW×VH space
  y: number;     // center y in VW×VH space
  icon: string;  // fallback icon when no part is assigned
  label: string;
  category: PartCategory;
  keywords: string[]; // substrings to match against part names (case-insensitive)
};

const SLOTS: SlotDef[] = [
  {
    id: 'l_end', x: 26, y: 68, icon: 'hand-left', label: 'Bar Tape', category: 'other',
    keywords: ['bar tape', 'grip'],
  },
  {
    id: 'l_br', x: 77, y: 62, icon: 'hand-back-left', label: 'Brake F', category: 'brakes',
    keywords: ['brake pad (rim)', 'brake pad (disc)', 'brake cable (front)', 'front brake'],
  },
  {
    id: 'l_ca', x: 123, y: 58, icon: 'cable-data', label: 'Cables', category: 'cables',
    keywords: ['front derailleur', 'gear cable'],
  },
  {
    id: 'l_cr', x: 164, y: 56, icon: 'cog-outline', label: 'Chainring', category: 'drivetrain',
    keywords: ['chainring'],
  },
  {
    id: 'chain', x: 200, y: 55, icon: 'link-variant', label: 'Chain', category: 'drivetrain',
    keywords: ['chain'],
  },
  {
    id: 'cass', x: 236, y: 56, icon: 'cog', label: 'Cassette', category: 'drivetrain',
    keywords: ['cassette'],
  },
  {
    id: 'r_ca', x: 277, y: 58, icon: 'cable-data', label: 'Cables', category: 'cables',
    keywords: ['rear derailleur', 'brake cable (rear)'],
  },
  {
    id: 'r_br', x: 323, y: 62, icon: 'disc', label: 'Brake R', category: 'brakes',
    keywords: ['brake rotor', 'brake pad', 'brake cable'],
  },
  {
    id: 'r_end', x: 374, y: 68, icon: 'circle-double', label: 'Tubes', category: 'other',
    keywords: ['inner tube', 'cleat', 'wheel bearing'],
  },
  {
    id: 'stem_bb', x: 200, y: 120, icon: 'axis-z-rotate-clockwise', label: 'Bottom Bracket',
    category: 'drivetrain',
    keywords: ['bottom bracket', 'headset', 'general service'],
  },
  {
    id: 'stem_fl', x: 183, y: 156, icon: 'ski', label: 'Fork', category: 'suspension',
    keywords: ['fork', 'suspension', 'shock'],
  },
  {
    id: 'stem_sv', x: 217, y: 156, icon: 'wrench', label: 'Service', category: 'other',
    keywords: ['service', 'general', 'bearing'],
  },
  {
    id: 'stem_ft', x: 183, y: 194, icon: 'tire', label: 'Tyre F', category: 'tyres',
    keywords: ['front tyre', 'front tire'],
  },
  {
    id: 'stem_rt', x: 217, y: 194, icon: 'tire', label: 'Tyre R', category: 'tyres',
    keywords: ['rear tyre', 'rear tire'],
  },
];

// ─── Animation timing ─────────────────────────────────────────────────────
const FLASH_MS = 200;        // delay before all-icons-on flash
const HOLD_MS = 1500;        // how long to hold the all-on ignition state
const STAGGER_MS = 85;       // delay between each icon turning to its final state
const SCAN_START = FLASH_MS + HOLD_MS;
const COMPLETE_MS = SCAN_START + SLOTS.length * STAGGER_MS + 400;

const IGNITION_COLOR = '#fbbf24';
const DIM_COLOR = '#374151';
const DIM_OPACITY = 0.22;

// ─── Helpers ──────────────────────────────────────────────────────────────
function getIcon(partName: string, category: PartCategory): string {
  return PART_PRESETS.find((p) => p.name === partName)?.icon
    ?? CATEGORY_ICONS[category]
    ?? 'wrench';
}

function matchToSlots(parts: PartHealth[]): (PartHealth | null)[] {
  const used = new Set<string>();
  return SLOTS.map((slot) => {
    const match = parts.find(
      (p) =>
        !used.has(p.partId) &&
        slot.keywords.some((kw) => p.partName.toLowerCase().includes(kw.toLowerCase()))
    );
    if (match) {
      used.add(match.partId);
      return match;
    }
    return null;
  });
}

function getOverflow(parts: PartHealth[], slotted: (PartHealth | null)[]): PartHealth[] {
  const ids = new Set(slotted.filter(Boolean).map((p) => p!.partId));
  return parts.filter((p) => !ids.has(p.partId));
}

// ─── DashboardIcon ────────────────────────────────────────────────────────
interface IconProps {
  slot: SlotDef;
  health: PartHealth | null;
  idx: number;
  svgScale: number;
  onPress: (h: PartHealth) => void;
}

function DashboardIcon({ slot, health, idx, svgScale, onPress }: IconProps) {
  const opacity = useSharedValue(DIM_OPACITY);
  const sc = useSharedValue(1);
  const [color, setColor] = useState(DIM_COLOR);
  const isMounted = useRef(false);

  function applyFinalState() {
    const isAlert = health?.status && health.status !== 'good';
    setColor(isAlert ? HEALTH_COLORS[health!.status] : DIM_COLOR);
    const targetOpacity = isAlert ? 1 : DIM_OPACITY;
    if (health?.status === 'critical') {
      opacity.value = withRepeat(
        withSequence(withTiming(0.3, { duration: 750 }), withTiming(1, { duration: 750 })),
        -1
      );
    } else if (health?.status === 'overdue') {
      opacity.value = withRepeat(
        withSequence(withTiming(0.2, { duration: 400 }), withTiming(1, { duration: 400 })),
        -1
      );
      sc.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 400, easing: Easing.ease }),
          withTiming(1, { duration: 400 })
        ),
        -1
      );
    } else {
      opacity.value = withTiming(targetOpacity, { duration: 300 });
      sc.value = withTiming(1, { duration: 300 });
    }
  }

  useEffect(() => {
    if (!isMounted.current) {
      // ── First mount: full car-ignition sequence ──
      isMounted.current = true;
      opacity.value = DIM_OPACITY;
      sc.value = 1;

      const t1 = setTimeout(() => {
        // All icons flash on simultaneously (amber ignition)
        setColor(IGNITION_COLOR);
        opacity.value = withTiming(1, { duration: 200 });
      }, FLASH_MS);

      const t2 = setTimeout(() => {
        // This icon scans off to its real state (staggered)
        const isAlert = health?.status && health.status !== 'good';
        setColor(isAlert ? HEALTH_COLORS[health!.status] : DIM_COLOR);
        opacity.value = withTiming(isAlert ? 1 : DIM_OPACITY, { duration: 200 });
      }, SCAN_START + idx * STAGGER_MS);

      const t3 = setTimeout(applyFinalState, COMPLETE_MS);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }

    // ── Subsequent health changes: quick transition (no ignition) ──
    sc.value = withTiming(1, { duration: 300 });
    const t = setTimeout(applyFinalState, 100);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [health?.status]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: sc.value }],
  }));

  const BOX = 34 * svgScale;
  const ICO = Math.round(BOX * 0.64);

  return (
    <Pressable
      onPress={health ? () => onPress(health) : undefined}
      hitSlop={8}
      style={[
        styles.iconSlot,
        {
          left: slot.x * svgScale - BOX / 2,
          top: slot.y * svgScale - BOX / 2,
          width: BOX,
          height: BOX,
        },
      ]}
    >
      <Animated.View style={[styles.iconInner, animStyle]}>
        <MaterialCommunityIcons
          name={(health ? getIcon(health.partName, health.category) : slot.icon) as any}
          size={ICO}
          color={color}
        />
      </Animated.View>
    </Pressable>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────
interface Props {
  partsHealth: PartHealth[];
  onIconPress: (h: PartHealth) => void;
}

export function HandlebarDashboard({ partsHealth, onIconPress }: Props) {
  const { width } = useWindowDimensions();
  // Cap width on tablets so the handlebar isn't enormous
  const containerW = Math.min(width, 540);
  const svgH = Math.round(containerW * (VH / VW));
  const scale = containerW / VW;

  const slotted = matchToSlots(partsHealth);
  const overflow = getOverflow(partsHealth, slotted);

  return (
    <View style={[styles.wrapper, { width }]}>
      {/* Dark instrument-cluster panel */}
      <View style={[styles.hero, { width: containerW, height: svgH, alignSelf: 'center' }]}>
        <Svg
          width={containerW}
          height={svgH}
          viewBox={`0 0 ${VW} ${VH}`}
          style={StyleSheet.absoluteFillObject}
        >
          {/* Handlebar body */}
          <Path d={HANDLEBAR_PATH} fill="#101820" stroke="#1a2a3a" strokeWidth={1.5} />
          {/* Inner relief groove */}
          <Path d={INNER_LINE} fill="none" stroke="#1a2d40" strokeWidth={1} />
          {/* Steerer clamp ring */}
          <Circle cx={200} cy={224} r={20} fill="none" stroke="#1a2d40" strokeWidth={1.5} />
          {/* Steerer clamp slot gap (the bolt split) */}
          <Line x1={200} y1={244} x2={200} y2={251} stroke="#0d1520" strokeWidth={4} />
          {/* Stem shoulder line */}
          <Line x1={170} y1={116} x2={230} y2={116} stroke="#1a2d40" strokeWidth={1} />
        </Svg>

        {/* Icon overlays (absolutely positioned over the SVG) */}
        {SLOTS.map((slot, i) => (
          <DashboardIcon
            key={slot.id}
            slot={slot}
            health={slotted[i]}
            idx={i}
            svgScale={scale}
            onPress={onIconPress}
          />
        ))}
      </View>

      {/* Overflow: any parts that didn't fit a named slot */}
      {overflow.length > 0 && (
        <View style={styles.overflow}>
          {overflow.map((h) => {
            const isAlert = h.status !== 'good';
            const col = isAlert ? HEALTH_COLORS[h.status] : '#6b7280';
            return (
              <Pressable
                key={h.partId}
                onPress={() => onIconPress(h)}
                style={[styles.chip, { borderColor: isAlert ? col : '#374151' }]}
              >
                <MaterialCommunityIcons
                  name={getIcon(h.partName, h.category) as any}
                  size={13}
                  color={col}
                />
                <Text style={[styles.chipLabel, { color: col }]}>{h.partName}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { backgroundColor: '#0d1520' },
  hero: { position: 'relative' },
  iconSlot: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  overflow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 7,
    backgroundColor: '#0d1520',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  chipLabel: { fontSize: 11, fontWeight: '600' },
});
