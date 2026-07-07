export type PartCategory = 'drivetrain' | 'brakes' | 'tyres' | 'cables' | 'suspension' | 'other';
export type BikeType = 'road' | 'mtb' | 'gravel' | 'commuter' | 'ebike';
export type ServiceType = 'service' | 'replace';
export type HealthStatus = 'good' | 'warning' | 'critical' | 'overdue';
export type RideSource = 'manual' | 'strava' | 'fit' | 'gpx';
export type Unit = 'km' | 'mi';

export interface Bike {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  type: BikeType;
  totalKm: number;
  imageUri: string | null;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Part {
  id: string;
  bikeId: string;
  name: string;
  category: PartCategory;
  serviceIntervalKm: number | null;
  replaceIntervalKm: number | null;
  serviceIntervalDays: number | null;
  replaceIntervalDays: number | null;
  kmAtLastService: number;
  kmAtLastReplace: number;
  dateLastService: number | null;
  dateLastReplace: number | null;
  installKm: number;
  notes: string | null;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Ride {
  id: string;
  bikeId: string;
  distanceKm: number;
  date: number;
  title: string | null;
  notes: string | null;
  source: RideSource;
  externalId: string | null;
  createdAt: number;
}

export interface ServiceRecord {
  id: string;
  partId: string;
  bikeId: string;
  type: ServiceType;
  bikeKmAtService: number;
  cost: number | null;
  shopId: string | null;
  notes: string | null;
  date: number;
  createdAt: number;
}

export interface CachedShop {
  id: string;
  name: string;
  lat: number;
  lon: number;
  address: string | null;
  phone: string | null;
  website: string | null;
  openingHours: string | null;
  tags: string | null;
  userNotes: string | null;
  cachedAt: number;
}

export interface PartHealth {
  partId: string;
  partName: string;
  category: PartCategory;
  kmSinceLastService: number;
  kmSinceLastReplace: number;
  daysSinceLastService: number;
  daysSinceLastReplace: number;
  serviceHealthPct: number;
  replaceHealthPct: number;
  status: HealthStatus;
  nextServiceInKm: number | null;
  nextReplaceInKm: number | null;
  nextServiceInDays: number | null;
  nextReplaceInDays: number | null;
}

export interface PartPreset {
  name: string;
  category: PartCategory;
  icon: string;
  serviceIntervalKm: number | null;
  replaceIntervalKm: number | null;
  serviceIntervalDays: number | null;
  replaceIntervalDays: number | null;
}

export interface StravaActivity {
  id: number;
  name: string;
  distance: number;
  start_date: string;
  type: string;
  sport_type: string;
}
