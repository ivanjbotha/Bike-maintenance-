import { create } from 'zustand';
import { Unit } from '../types';

export interface SearchLocation {
  lat: number;
  lon: number;
  label: string;
}

interface AppState {
  activeBikeId: string | null;
  units: Unit;
  notificationsEnabled: boolean;
  searchLocation: SearchLocation | null;
  setActiveBikeId: (id: string | null) => void;
  setUnits: (units: Unit) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setSearchLocation: (location: SearchLocation | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeBikeId: null,
  units: 'km',
  notificationsEnabled: true,
  searchLocation: null,
  setActiveBikeId: (id) => set({ activeBikeId: id }),
  setUnits: (units) => set({ units }),
  setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
  setSearchLocation: (location) => set({ searchLocation: location }),
}));
