import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPart, updatePart, deletePart, getPartById } from '../db/queries/parts';
import { getServiceRecordsForPart } from '../db/queries/service';
import { PartCategory } from '../types';

export function usePart(partId: string) {
  return useQuery({ queryKey: ['part', partId], queryFn: () => getPartById(partId), enabled: !!partId });
}

export function usePartServiceHistory(partId: string) {
  return useQuery({
    queryKey: ['serviceRecords', partId],
    queryFn: () => getServiceRecordsForPart(partId),
    enabled: !!partId,
  });
}

export function useCreatePart(bikeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      category: PartCategory;
      serviceIntervalKm?: number | null;
      replaceIntervalKm?: number | null;
      serviceIntervalDays?: number | null;
      replaceIntervalDays?: number | null;
      notes?: string;
    }) => createPart({ ...data, bikeId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parts', bikeId] });
      qc.invalidateQueries({ queryKey: ['bikePartsHealth', bikeId] });
    },
  });
}

export function useUpdatePart(bikeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updatePart>[1] }) =>
      updatePart(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['parts', bikeId] });
      qc.invalidateQueries({ queryKey: ['part', id] });
      qc.invalidateQueries({ queryKey: ['bikePartsHealth', bikeId] });
    },
  });
}

export function useDeletePart(bikeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (partId: string) => deletePart(partId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parts', bikeId] });
      qc.invalidateQueries({ queryKey: ['bikePartsHealth', bikeId] });
    },
  });
}
