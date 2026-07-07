import { Unit } from '../types';

const KM_TO_MI = 0.621371;

export function kmToDisplay(km: number, unit: Unit): number {
  return unit === 'mi' ? Math.round(km * KM_TO_MI * 10) / 10 : Math.round(km * 10) / 10;
}

export function displayToKm(value: number, unit: Unit): number {
  return unit === 'mi' ? value / KM_TO_MI : value;
}

export function formatDistance(km: number, unit: Unit): string {
  const val = kmToDisplay(km, unit);
  return `${val} ${unit}`;
}

export function unitLabel(unit: Unit): string {
  return unit;
}
