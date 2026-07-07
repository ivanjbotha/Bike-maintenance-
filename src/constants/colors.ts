import { HealthStatus } from '../types';

export const HEALTH_COLORS: Record<HealthStatus, string> = {
  good: '#22c55e',
  warning: '#f59e0b',
  critical: '#ef4444',
  overdue: '#7f1d1d',
};

export const HEALTH_BG_COLORS: Record<HealthStatus, string> = {
  good: '#dcfce7',
  warning: '#fef3c7',
  critical: '#fee2e2',
  overdue: '#fecaca',
};

export const HEALTH_LABELS: Record<HealthStatus, string> = {
  good: 'Good',
  warning: 'Service Soon',
  critical: 'Service Now',
  overdue: 'Overdue',
};

export function getHealthStatus(pct: number): HealthStatus {
  if (pct < 75) return 'good';
  if (pct < 90) return 'warning';
  if (pct < 100) return 'critical';
  return 'overdue';
}

export const CATEGORY_COLORS: Record<string, string> = {
  drivetrain: '#3b82f6',
  brakes: '#ef4444',
  tyres: '#8b5cf6',
  cables: '#f59e0b',
  suspension: '#06b6d4',
  other: '#6b7280',
};
