import { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Modal, Pressable } from 'react-native';
import { Text, Surface, Button, Chip, Divider, ActivityIndicator } from 'react-native-paper';
import { router } from 'expo-router';
import { useAllBikes } from '../../src/hooks/useBikes';
import { useBikePartsHealth } from '../../src/hooks/usePartHealth';
import { useAppStore } from '../../src/store/appStore';
import { HandlebarDashboard } from '../../src/components/dashboard/HandlebarDashboard';
import { EmptyState } from '../../src/components/common/EmptyState';
import { UnitDisplay } from '../../src/components/common/UnitDisplay';
import { HEALTH_COLORS, HEALTH_LABELS } from '../../src/constants/colors';
import { PartHealth } from '../../src/types';
import { useLogService } from '../../src/hooks/usePartHealth';

function PartDetailModal({
  health,
  onClose,
  bikeId,
}: {
  health: PartHealth | null;
  onClose: () => void;
  bikeId: string;
}) {
  const { mutate: logSvc, isPending } = useLogService(bikeId);
  if (!health) return null;
  const color = HEALTH_COLORS[health.status];

  function handleLog(type: 'service' | 'replace') {
    logSvc({ partId: health!.partId, type }, { onSuccess: onClose });
  }

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <Surface style={styles.sheet} elevation={4}>
        <View style={[styles.sheetHandle, { backgroundColor: color }]} />
        <Text variant="titleLarge" style={[styles.sheetTitle, { color }]}>
          {health.partName}
        </Text>
        <Chip style={[styles.statusChip, { backgroundColor: color + '22' }]} textStyle={{ color }}>
          {HEALTH_LABELS[health.status]}
        </Chip>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text variant="bodySmall" style={styles.statLabel}>Km since service</Text>
            <UnitDisplay km={health.kmSinceLastService} variant="titleMedium" />
          </View>
          <View style={styles.stat}>
            <Text variant="bodySmall" style={styles.statLabel}>Days since service</Text>
            <Text variant="titleMedium">{Math.floor(health.daysSinceLastService)}d</Text>
          </View>
        </View>
        {health.nextReplaceInKm !== null && (
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text variant="bodySmall" style={styles.statLabel}>Km until replace</Text>
              <UnitDisplay km={Math.max(0, health.nextReplaceInKm)} variant="titleMedium" />
            </View>
            {health.nextReplaceInDays !== null && (
              <View style={styles.stat}>
                <Text variant="bodySmall" style={styles.statLabel}>Days until replace</Text>
                <Text variant="titleMedium">{Math.max(0, Math.floor(health.nextReplaceInDays))}d</Text>
              </View>
            )}
          </View>
        )}
        <Divider style={styles.divider} />
        <View style={styles.actionRow}>
          <Button
            mode="outlined"
            onPress={() => handleLog('service')}
            loading={isPending}
            style={styles.actionBtn}
            icon="wrench"
          >
            Mark Serviced
          </Button>
          <Button
            mode="contained"
            onPress={() => handleLog('replace')}
            loading={isPending}
            style={styles.actionBtn}
            icon="swap-horizontal"
          >
            Mark Replaced
          </Button>
        </View>
        <Button
          mode="text"
          onPress={() => {
            onClose();
            router.push(`/part/${health.partId}`);
          }}
          icon="history"
        >
          View Full History
        </Button>
      </Surface>
    </Modal>
  );
}

function BikeSelector({
  bikeId,
  onSelect,
}: {
  bikeId: string | null;
  onSelect: (id: string) => void;
}) {
  const { data: bikes = [] } = useAllBikes();
  if (!bikes.length) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bikeScroll} contentContainerStyle={styles.bikeScrollContent}>
      {bikes.map((bike) => (
        <Chip
          key={bike.id}
          selected={bike.id === bikeId}
          onPress={() => onSelect(bike.id)}
          style={styles.bikeChip}
          icon="bike"
        >
          {bike.name}
        </Chip>
      ))}
    </ScrollView>
  );
}

export default function DashboardScreen() {
  const { activeBikeId, setActiveBikeId } = useAppStore();
  const { data: bikes = [] } = useAllBikes();
  const [selectedHealth, setSelectedHealth] = useState<PartHealth | null>(null);

  const effectiveBikeId = activeBikeId ?? bikes[0]?.id ?? null;

  const { data: partsHealth = [], isLoading, refetch } = useBikePartsHealth(effectiveBikeId ?? '');
  const activeBike = bikes.find((b) => b.id === effectiveBikeId);

  const criticalCount = partsHealth.filter((h) => h.status === 'critical' || h.status === 'overdue').length;
  const warningCount = partsHealth.filter((h) => h.status === 'warning').length;

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (!bikes.length) {
    return (
      <EmptyState
        icon="bike"
        title="No bikes yet"
        message="Add your first bike to start tracking maintenance."
        actionLabel="Add Bike"
        onAction={() => router.push('/bike/new')}
      />
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: '#0d1520' }]}>
      <View style={styles.topBar}>
        <BikeSelector bikeId={effectiveBikeId} onSelect={setActiveBikeId} />
        {activeBike && (
          <Surface style={styles.statsBar} elevation={0}>
            <View style={styles.statItem}>
              <UnitDisplay km={activeBike.totalKm} variant="titleMedium" style={styles.statValue} />
              <Text variant="bodySmall" style={styles.statItemLabel}>Total</Text>
            </View>
            {criticalCount > 0 && (
              <View style={styles.statItem}>
                <Text variant="titleMedium" style={[styles.statValue, { color: HEALTH_COLORS.critical }]}>
                  {criticalCount}
                </Text>
                <Text variant="bodySmall" style={[styles.statItemLabel, { color: HEALTH_COLORS.critical }]}>
                  Urgent
                </Text>
              </View>
            )}
            {warningCount > 0 && (
              <View style={styles.statItem}>
                <Text variant="titleMedium" style={[styles.statValue, { color: HEALTH_COLORS.warning }]}>
                  {warningCount}
                </Text>
                <Text variant="bodySmall" style={[styles.statItemLabel, { color: HEALTH_COLORS.warning }]}>
                  Soon
                </Text>
              </View>
            )}
          </Surface>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ flex: 1 }} color="#22c55e" />
      ) : partsHealth.length === 0 ? (
        <EmptyState
          icon="wrench"
          title="No parts tracked"
          message="Open the Garage tab, select your bike, and add parts to start tracking."
          actionLabel="Go to Garage"
          onAction={() => router.push('/bikes')}
        />
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />}
          contentContainerStyle={styles.scrollContent}
        >
          <HandlebarDashboard
            key={effectiveBikeId ?? 'no-bike'}
            partsHealth={partsHealth}
            onIconPress={setSelectedHealth}
          />
        </ScrollView>
      )}

      <PartDetailModal
        health={selectedHealth}
        bikeId={effectiveBikeId ?? ''}
        onClose={() => setSelectedHealth(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: { backgroundColor: '#0a0f1a' },
  bikeScroll: { maxHeight: 52 },
  bikeScrollContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  bikeChip: { marginRight: 4 },
  statsBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 24,
    borderRadius: 0,
    backgroundColor: '#0a0f1a',
  },
  statItem: { alignItems: 'center' },
  statValue: { fontWeight: '700', color: '#e5e7eb' },
  statItemLabel: { color: '#6b7280', marginTop: 2 },
  scrollContent: { flexGrow: 1 },
  backdrop: { flex: 1, backgroundColor: '#00000077' },
  sheet: {
    padding: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    gap: 12,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  sheetTitle: { fontWeight: '700', textAlign: 'center' },
  statusChip: { alignSelf: 'center' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center', gap: 4 },
  statLabel: { color: '#6b7280' },
  divider: { marginVertical: 8 },
  actionRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1 },
});
