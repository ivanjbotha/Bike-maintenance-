import { eq, desc } from 'drizzle-orm';
import { db } from '../client';
import { bikes } from '../schema';
import { Bike, BikeType } from '../../types';

function genId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function getAllBikes(): Promise<Bike[]> {
  const rows = await db.select().from(bikes).orderBy(desc(bikes.createdAt));
  return rows.map(rowToBike);
}

export async function getBikeById(id: string): Promise<Bike | null> {
  const rows = await db.select().from(bikes).where(eq(bikes.id, id));
  return rows.length ? rowToBike(rows[0]) : null;
}

export async function createBike(data: {
  name: string;
  brand?: string;
  model?: string;
  year?: number;
  type: BikeType;
  totalKm?: number;
}): Promise<Bike> {
  const now = Date.now();
  const id = genId();
  await db.insert(bikes).values({
    id,
    name: data.name,
    brand: data.brand ?? null,
    model: data.model ?? null,
    year: data.year ?? null,
    type: data.type,
    totalKm: data.totalKm ?? 0,
    imageUri: null,
    isActive: 1,
    createdAt: now,
    updatedAt: now,
  });
  return (await getBikeById(id))!;
}

export async function updateBike(id: string, data: Partial<Omit<Bike, 'id' | 'createdAt'>>): Promise<void> {
  const { isActive, ...rest } = data;
  const row: Record<string, any> = { ...rest, updatedAt: Date.now() };
  if (isActive !== undefined) row.isActive = isActive ? 1 : 0;
  await db.update(bikes).set(row).where(eq(bikes.id, id));
}

export async function addDistanceToBike(id: string, km: number): Promise<void> {
  const bike = await getBikeById(id);
  if (!bike) return;
  await db.update(bikes).set({ totalKm: bike.totalKm + km, updatedAt: Date.now() }).where(eq(bikes.id, id));
}

export async function deleteBike(id: string): Promise<void> {
  await db.delete(bikes).where(eq(bikes.id, id));
}

function rowToBike(row: typeof bikes.$inferSelect): Bike {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    model: row.model,
    year: row.year,
    type: row.type as BikeType,
    totalKm: row.totalKm,
    imageUri: row.imageUri,
    isActive: row.isActive === 1,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
