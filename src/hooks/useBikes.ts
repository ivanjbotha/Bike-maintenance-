import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllBikes, getBikeById, createBike, updateBike, deleteBike } from '../db/queries/bikes';
import { getPartsForBike } from '../db/queries/parts';
import { BikeType } from '../types';

export function useAllBikes() {
  return useQuery({ queryKey: ['bikes'], queryFn: getAllBikes });
}

export function useBike(id: string) {
  return useQuery({ queryKey: ['bike', id], queryFn: () => getBikeById(id), enabled: !!id });
}

export function useBikeParts(bikeId: string) {
  return useQuery({
    queryKey: ['parts', bikeId],
    queryFn: () => getPartsForBike(bikeId),
    enabled: !!bikeId,
  });
}

export function useCreateBike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; brand?: string; model?: string; year?: number; type: BikeType; totalKm?: number }) =>
      createBike(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bikes'] }),
  });
}

export function useUpdateBike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateBike>[1] }) =>
      updateBike(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bikes'] }),
  });
}

export function useDeleteBike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBike(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bikes'] }),
  });
}
