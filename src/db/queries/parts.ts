import { eq } from 'drizzle-orm';
import { db } from '../client';
import { parts } from '../schema';
import { Part, PartCategory, PartHealth, HealthStatus } from '../../types';
import { getBikeById } from './bikes';
import { getHealthStatus } from '../../constants/colors';

function genId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function getPartsForBike(bikeId: string): Promise<Part[]> {
  const rows = await db.select().from(parts).where(eq(parts.bikeId, bikeId));
  return rows.map(rowToPart).filter((p) => p.isActive);
}

export async function getPartById(id: string): Promise<Part | null> {
  const rows = await db.select().from(parts).where(eq(parts.id, id));
  return rows.length ? rowToPart(rows[0]) : null;
}

export async function createPart(data: {
  bikeId: string;
  name: string;
  category: PartCategory;
  serviceIntervalKm?: number | null;
  replaceIntervalKm?: number | null;
  serviceIntervalDays?: number | null;
  replaceIntervalDays?: number | null;
  installKm?: number;
  notes?: string;
}): Promise<Part> {
  const now = Date.now();
  const id = genId();
  const bike = await getBikeById(data.bikeId);
  const installKm = data.installKm ?? (bike?.totalKm ?? 0);
  await db.insert(parts).values({
    id,
    bikeId: data.bikeId,
    name: data.name,
    category: data.category,
    serviceIntervalKm: data.serviceIntervalKm ?? null,
    replaceIntervalKm: data.replaceIntervalKm ?? null,
    serviceIntervalDays: data.serviceIntervalDays ?? null,
    replaceIntervalDays: data.replaceIntervalDays ?? null,
    kmAtLastService: installKm,
    kmAtLastReplace: installKm,
    dateLastService: now,
    dateLastReplace: now,
    installKm,
    notes: data.notes ?? null,
    isActive: 1,
    createdAt: now,
    updatedAt: now,
  });
  return (await getPartById(id))!;
}

export async function updatePart(id: string, data: Partial<Omit<Part, 'id' | 'createdAt'>>): Promise<void> {
  const { isActive, ...rest } = data;
  const row: Record<string, any> = { ...rest, updatedAt: Date.now() };
  if (isActive !== undefined) row.isActive = isActive ? 1 : 0;
  await db.update(parts).set(row).where(eq(parts.id, id));
}

export async function deletePart(id: string): Promise<void> {
  await db.update(parts).set({ isActive: 0, updatedAt: Date.now() }).where(eq(parts.id, id));
}

export async function getPartHealth(partId: string): Promise<PartHealth | null> {
  const part = await getPartById(partId);
  if (!part) return null;
  const bike = await getBikeById(part.bikeId);
  if (!bike) return null;

  const bikeKm = bike.totalKm;
  const now = Date.now();

  const kmSinceLastService = bikeKm - part.kmAtLastService;
  const kmSinceLastReplace = bikeKm - part.kmAtLastReplace;
  const daysSinceLastService = part.dateLastService
    ? (now - part.dateLastService) / 86400000
    : 9999;
  const daysSinceLastReplace = part.dateLastReplace
    ? (now - part.dateLastReplace) / 86400000
    : 9999;

  const svcKmPct = part.serviceIntervalKm ? (kmSinceLastService / part.serviceIntervalKm) * 100 : 0;
  const svcDayPct = part.serviceIntervalDays ? (daysSinceLastService / part.serviceIntervalDays) * 100 : 0;
  const repKmPct = part.replaceIntervalKm ? (kmSinceLastReplace / part.replaceIntervalKm) * 100 : 0;
  const repDayPct = part.replaceIntervalDays ? (daysSinceLastReplace / part.replaceIntervalDays) * 100 : 0;

  const serviceHealthPct = Math.max(svcKmPct, svcDayPct);
  const replaceHealthPct = Math.max(repKmPct, repDayPct);
  const worstPct = Math.max(serviceHealthPct, replaceHealthPct);
  const status: HealthStatus = getHealthStatus(worstPct);

  const nextServiceInKm = part.serviceIntervalKm
    ? Math.max(0, part.serviceIntervalKm - kmSinceLastService)
    : null;
  const nextReplaceInKm = part.replaceIntervalKm
    ? Math.max(0, part.replaceIntervalKm - kmSinceLastReplace)
    : null;
  const nextServiceInDays = part.serviceIntervalDays
    ? Math.max(0, part.serviceIntervalDays - daysSinceLastService)
    : null;
  const nextReplaceInDays = part.replaceIntervalDays
    ? Math.max(0, part.replaceIntervalDays - daysSinceLastReplace)
    : null;

  return {
    partId,
    partName: part.name,
    category: part.category as PartCategory,
    kmSinceLastService,
    kmSinceLastReplace,
    daysSinceLastService,
    daysSinceLastReplace,
    serviceHealthPct,
    replaceHealthPct,
    status,
    nextServiceInKm,
    nextReplaceInKm,
    nextServiceInDays,
    nextReplaceInDays,
  };
}

function rowToPart(row: typeof parts.$inferSelect): Part {
  return {
    id: row.id,
    bikeId: row.bikeId,
    name: row.name,
    category: row.category as PartCategory,
    serviceIntervalKm: row.serviceIntervalKm,
    replaceIntervalKm: row.replaceIntervalKm,
    serviceIntervalDays: row.serviceIntervalDays,
    replaceIntervalDays: row.replaceIntervalDays,
    kmAtLastService: row.kmAtLastService,
    kmAtLastReplace: row.kmAtLastReplace,
    dateLastService: row.dateLastService,
    dateLastReplace: row.dateLastReplace,
    installKm: row.installKm,
    notes: row.notes,
    isActive: row.isActive === 1,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
