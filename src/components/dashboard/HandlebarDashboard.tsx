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
import Svg, { Path, Circle, Ellipse } from 'react-native-svg';
import type { PartHealth, PartCategory } from '../../types';
import { HEALTH_COLORS } from '../../constants/colors';
import { PART_PRESETS, CATEGORY_ICONS } from '../../constants/partPresets';

// ─── SVG geometry ─────────────────────────────────────────────────────────
const VW = 400;
const VH = 250;

// Traced from a frontal product shot of an integrated aero cockpit:
// - the wing's top edge is HIGHEST at the ends and dips toward the centre
// - the drop hooks curl up OVER the wing ends (the tallest points), then
//   descend almost vertically to angled tube openings at the bottom
// - the stem tapers from the wing centre through a cone into the steerer
//   column, with the silver stem bolt recessed at the cone.
// The wing is drawn deep enough to carry all fourteen telltales in two
// rows across the horizontal section.
const WING =
  'M 62,72 ' +
  'C 120,75 160,79 200,81 ' +
  'C 240,79 280,75 338,72 ' +
  'C 347,73 350,88 344,120 ' +
  'C 286,128 242,133 200,135 ' +
  'C 158,133 114,128 56,120 ' +
  'C 50,88 53,73 62,72 Z';

// Lighter top surface band of the wing (top-lit)
const WING_TOP_BAND =
  'M 62,72 ' +
  'C 120,75 160,79 200,81 ' +
  'C 240,79 280,75 338,72 ' +
  'C 345,73 347,77 344,81 ' +
  'C 288,84 240,89 200,91 ' +
  'C 160,89 112,84 56,81 ' +
  'C 53,77 55,73 62,72 Z';

const WING_SHEEN = 'M 70,75 C 128,78 164,81 200,83 C 236,81 272,78 330,75';
const WING_UNDER_SHADOW = 'M 72,118 C 130,124 165,130 200,132 C 235,130 270,124 328,118';

// Hooks drawn as closed solids whose top edge leaves the wing's top edge
// tangentially (shallow slope at the seam, steepening outboard) and rolls
// over a wide rounded shoulder into the drop. The inner edge climbs back
// as a concave cove and tucks behind the wing's outer edge, so the
// tops-to-drops transition reads as one continuously moulded surface with
// no thin neck or notch at the junction.
const LEFT_HOOK_FILL =
  'M 84,77 ' +
  'C 62,73.5 47,69.5 36,63 ' +
  'C 24,56.5 12,60 10,74 ' +
  'C 7,96 8,128 13,155 ' +
  'C 15,170 16,182 16.5,190 ' +
  'C 17,199 27,199 27.5,191 ' +
  'C 28.5,176 27.5,160 26,146 ' +
  'C 24.5,132 26,116 33,108 ' +
  'C 39,101 48,101 54,108 ' +
  'C 61,116 72,90 84,77 Z';
const RIGHT_HOOK_FILL =
  'M 316,77 ' +
  'C 338,73.5 353,69.5 364,63 ' +
  'C 376,56.5 388,60 390,74 ' +
  'C 393,96 392,128 387,155 ' +
  'C 385,170 384,182 383.5,190 ' +
  'C 383,199 373,199 372.5,191 ' +
  'C 371.5,176 372.5,160 374,146 ' +
  'C 375.5,132 374,116 367,108 ' +
  'C 361,101 352,101 346,108 ' +
  'C 339,116 328,90 316,77 Z';

// Light catch along each hook's outer edge
const LEFT_HOOK_EDGE =
  'M 66,74 C 50,70.5 38,66 30,61 C 20,56.5 13,61 11,75 C 9,96 10,128 14,154 C 16,168 17,180 17.5,188';
const RIGHT_HOOK_EDGE =
  'M 334,74 C 350,70.5 362,66 370,61 C 380,56.5 387,61 389,75 C 391,96 390,128 386,154 C 384,168 383,180 382.5,188';

// Integrated stem: tapered body, cone step, then steerer column.
const STEM =
  'M 180,128 L 220,128 ' +
  'C 219,148 217,162 214,172 L 216,176 ' +
  'C 213,188 211,192 208,194 L 207,214 ' +
  'C 205,218 195,218 193,214 L 192,194 ' +
  'C 189,192 187,188 184,176 L 186,172 ' +
  'C 183,162 181,148 180,128 Z';

const PANEL_BG = '#eef0f3';

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

// All fourteen telltales live on the horizontal wing in two rows of seven;
// each row's y follows the wing's dip toward the centre.
const SLOTS: SlotDef[] = [
  // ── Row 1 ──
  {
    id: 'l_end', x: 80, y: 87, icon: 'bandage', label: 'Bar Tape', category: 'other',
    keywords: ['bar tape', 'grip'],
  },
  {
    id: 'l_br', x: 120, y: 89, icon: 'hand-back-left', label: 'Brake F', category: 'brakes',
    keywords: ['brake pad (rim)', 'brake pad (disc)', 'brake cable (front)', 'front brake'],
  },
  {
    id: 'l_ca', x: 160, y: 91.5, icon: 'cable-data', label: 'Cables', category: 'cables',
    keywords: ['front derailleur', 'gear cable'],
  },
  {
    // Listed before the chain slot so "Chainring" (which contains "chain")
    // is claimed by its own slot first. Array order sets match priority;
    // x/y alone set where a slot renders.
    id: 'l_cr', x: 120, y: 110.5, icon: 'cog-outline', label: 'Chainring', category: 'drivetrain',
    keywords: ['chainring'],
  },
  {
    id: 'chain', x: 200, y: 93, icon: 'link-variant', label: 'Chain', category: 'drivetrain',
    keywords: ['chain'],
  },
  {
    id: 'cass', x: 240, y: 91.5, icon: 'cog', label: 'Cassette', category: 'drivetrain',
    keywords: ['cassette'],
  },
  {
    id: 'r_ca', x: 280, y: 89, icon: 'cable-data', label: 'Cables', category: 'cables',
    keywords: ['rear derailleur', 'brake cable (rear)'],
  },
  {
    id: 'r_br', x: 320, y: 87, icon: 'disc', label: 'Brake R', category: 'brakes',
    keywords: ['brake rotor', 'brake pad', 'brake cable'],
  },
  // ── Row 2 ──
  {
    id: 'stem_ft', x: 80, y: 108, icon: 'tire', label: 'Tyre F', category: 'tyres',
    keywords: ['front tyre', 'front tire'],
  },
  {
    id: 'stem_bb', x: 160, y: 113.5, icon: 'axis-z-rotate-clockwise', label: 'Bottom Bracket',
    category: 'drivetrain',
    keywords: ['bottom bracket', 'headset', 'general service'],
  },
  {
    id: 'stem_sv', x: 200, y: 115.5, icon: 'wrench', label: 'Service', category: 'other',
    keywords: ['service', 'general', 'bearing'],
  },
  {
    id: 'stem_fl', x: 240, y: 113.5, icon: 'ski', label: 'Fork', category: 'suspension',
    keywords: ['fork', 'suspension', 'shock'],
  },
  {
    id: 'r_end', x: 280, y: 110.5, icon: 'circle-double', label: 'Tubes', category: 'other',
    keywords: ['inner tube', 'cleat', 'wheel bearing'],
  },
  {
    id: 'stem_rt', x: 320, y: 108, icon: 'tire', label: 'Tyre R', category: 'tyres',
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
// Icons sit on the dark carbon bar: dim state is a faint light grey, like
// unlit telltales etched into an instrument cluster.
const DIM_COLOR = '#8b949e';
const DIM_OPACITY = 0.4;

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

  const BOX = 26 * svgScale;
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
          style={
            color === DIM_COLOR
              ? {
                  // Unlit: engraved into the carbon
                  textShadowColor: 'rgba(0,0,0,0.9)',
                  textShadowOffset: { width: 0.5, height: 1.2 },
                  textShadowRadius: 1,
                }
              : {
                  // Lit: LED glow in the telltale's own colour
                  textShadowColor: color,
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 8,
                }
          }
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
          {/* Studio floor shadow (stacked ellipses fake a radial falloff;
              gradient url() refs don't paint under react-native-svg web) */}
          <Ellipse cx={200} cy={234} rx={175} ry={10} fill="#000000" opacity={0.04} />
          <Ellipse cx={200} cy={234} rx={130} ry={8} fill="#000000" opacity={0.05} />
          <Ellipse cx={200} cy={234} rx={80} ry={6} fill="#000000" opacity={0.06} />
          <Ellipse cx={200} cy={232} rx={30} ry={5} fill="#000000" opacity={0.1} />

          {/* Drop hooks: tapered solids flowing out of the wing ends */}
          <Path d={LEFT_HOOK_FILL} fill="#111316" stroke="#08090b" strokeWidth={0.8} />
          <Path d={RIGHT_HOOK_FILL} fill="#111316" stroke="#08090b" strokeWidth={0.8} />
          {/* Mid-tone body + outer-edge light catch for a round-tube read */}
          <Path d={LEFT_HOOK_EDGE} fill="none" stroke="#26292e" strokeWidth={5} opacity={0.8} strokeLinecap="round" />
          <Path d={RIGHT_HOOK_EDGE} fill="none" stroke="#26292e" strokeWidth={5} opacity={0.8} strokeLinecap="round" />
          <Path d={LEFT_HOOK_EDGE} fill="none" stroke="#787d85" strokeWidth={1.8} opacity={0.4} strokeLinecap="round" />
          <Path d={RIGHT_HOOK_EDGE} fill="none" stroke="#787d85" strokeWidth={1.8} opacity={0.4} strokeLinecap="round" />
          {/* Angled tube openings at the hook tips */}
          <Ellipse cx={21.5} cy={193} rx={7} ry={8.5} fill="#060708" transform="rotate(-10 21.5 193)" />
          <Ellipse cx={21.5} cy={193} rx={7} ry={8.5} fill="none" stroke="#565b62" strokeWidth={0.8} opacity={0.7} transform="rotate(-10 21.5 193)" />
          <Ellipse cx={378.5} cy={193} rx={7} ry={8.5} fill="#060708" transform="rotate(10 378.5 193)" />
          <Ellipse cx={378.5} cy={193} rx={7} ry={8.5} fill="none" stroke="#565b62" strokeWidth={0.8} opacity={0.7} transform="rotate(10 378.5 193)" />

          {/* Stem + steerer (behind the wing so the junction is hidden) */}
          <Path d={STEM} fill="#17191d" stroke="#08090b" strokeWidth={0.8} />
          {/* Stem left-edge light catch */}
          <Path d="M 183,136 C 182,150 184,162 186,172" fill="none" stroke="#41454c" strokeWidth={1.6} opacity={0.5} />

          {/* Wing: base, then a lighter top band for the top-lit surface */}
          <Path d={WING} fill="#141619" stroke="#08090b" strokeWidth={0.8} />
          <Path d={WING_TOP_BAND} fill="#2e3238" />
          {/* Top-edge sheen */}
          <Path d={WING_SHEEN} fill="none" stroke="#9aa0a8" strokeWidth={1.6} opacity={0.5} strokeLinecap="round" />
          {/* Underside core shadow */}
          <Path d={WING_UNDER_SHADOW} fill="none" stroke="#000000" strokeWidth={3} opacity={0.25} strokeLinecap="round" />
          {/* Ambient shadow where the stem meets the wing */}
          <Ellipse cx={200} cy={138} rx={26} ry={4.5} fill="#000000" opacity={0.25} />
          {/* Recessed silver stem bolt */}
          <Circle cx={200} cy={182} r={8} fill="#060708" />
          <Circle cx={200} cy={182} r={5} fill="#b9bcc2" />
          <Circle cx={198.5} cy={180.5} r={2.2} fill="#e8eaed" />
          <Circle cx={200} cy={182} r={1.4} fill="#585c63" />
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
            const col = isAlert ? HEALTH_COLORS[h.status] : '#64748b';
            return (
              <Pressable
                key={h.partId}
                onPress={() => onIconPress(h)}
                style={[styles.chip, { borderColor: isAlert ? col : '#cbd5e1' }]}
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
  wrapper: { backgroundColor: PANEL_BG },
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
    backgroundColor: PANEL_BG,
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
