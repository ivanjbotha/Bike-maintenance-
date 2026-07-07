import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllRides, getRidesForBike, createRide, deleteRide, rideExternalIdExists } from '../db/queries/rides';
import { fetchNewActivities } from '../services/stravaService';
import { RideSource } from '../types';

export function useAllRides() {
  return useQuery({ queryKey: ['rides'], queryFn: getAllRides });
}

export function useRidesForBike(bikeId: string) {
  return useQuery({
    queryKey: ['rides', bikeId],
    queryFn: () => getRidesForBike(bikeId),
    enabled: !!bikeId,
  });
}

export function useCreateRide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      bikeId: string;
      distanceKm: number;
      date: number;
      title?: string;
      notes?: string;
      source?: RideSource;
      externalId?: string;
    }) => createRide(data),
    onSuccess: (ride) => {
      qc.invalidateQueries({ queryKey: ['rides'] });
      qc.invalidateQueries({ queryKey: ['rides', ride.bikeId] });
      qc.invalidateQueries({ queryKey: ['bike', ride.bikeId] });
      qc.invalidateQueries({ queryKey: ['bikes'] });
      qc.invalidateQueries({ queryKey: ['bikePartsHealth', ride.bikeId] });
    },
  });
}

export function useDeleteRide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteRide,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rides'] });
      qc.invalidateQueries({ queryKey: ['bikes'] });
    },
  });
}

export function useSyncStrava(bikeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const activities = await fetchNewActivities();
      let imported = 0;
      for (const activity of activities) {
        const extId = String(activity.id);
        const exists = await rideExternalIdExists(extId);
        if (exists) continue;
        await createRide({
          bikeId,
          distanceKm: activity.distance / 1000,
          date: new Date(activity.start_date).getTime(),
          title: activity.name,
          source: 'strava',
          externalId: extId,
        });
        imported++;
      }
      return imported;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rides'] });
      qc.invalidateQueries({ queryKey: ['bikes'] });
      qc.invalidateQueries({ queryKey: ['bike', bikeId] });
      qc.invalidateQueries({ queryKey: ['bikePartsHealth', bikeId] });
    },
  });
}
