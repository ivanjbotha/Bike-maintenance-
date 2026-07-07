import { create } from 'zustand';
import { Unit } from '../types';

interface AppState {
  activeBikeId: string | null;
  units: Unit;
  notificationsEnabled: boolean;
  setActiveBikeId: (id: string | null) => void;
  setUnits: (units: Unit) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeBikeId: null,
  units: 'km',
  notificationsEnabled: true,
  setActiveBikeId: (id) => set({ activeBikeId: id }),
  setUnits: (units) => set({ units }),
  setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
}));
