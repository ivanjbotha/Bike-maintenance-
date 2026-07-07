import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPartHealth, getPartsForBike } from '../db/queries/parts';
import { logService } from '../db/queries/service';
import { PartHealth, ServiceType } from '../types';

export function usePartHealth(partId: string) {
  return useQuery({
    queryKey: ['partHealth', partId],
    queryFn: () => getPartHealth(partId),
    staleTime: 30000,
  });
}

export function useBikePartsHealth(bikeId: string) {
  return useQuery({
    queryKey: ['bikePartsHealth', bikeId],
    queryFn: async () => {
      const parts = await getPartsForBike(bikeId);
      const healthArr: PartHealth[] = [];
      for (const part of parts) {
        const h = await getPartHealth(part.id);
        if (h) healthArr.push(h);
      }
      return healthArr;
    },
    staleTime: 30000,
  });
}

export function useLogService(bikeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { partId: string; type: ServiceType; cost?: number; notes?: string }) =>
      logService(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bikePartsHealth', bikeId] });
      qc.invalidateQueries({ queryKey: ['partHealth'] });
      qc.invalidateQueries({ queryKey: ['serviceRecords'] });
      qc.invalidateQueries({ queryKey: ['bikes'] });
    },
  });
}
