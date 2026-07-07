import { eq, desc } from 'drizzle-orm';
import { db } from '../client';
import { rides } from '../schema';
import { Ride, RideSource } from '../../types';
import { addDistanceToBike } from './bikes';

function genId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function getRidesForBike(bikeId: string): Promise<Ride[]> {
  const rows = await db.select().from(rides).where(eq(rides.bikeId, bikeId)).orderBy(desc(rides.date));
  return rows.map(rowToRide);
}

export async function getAllRides(): Promise<Ride[]> {
  const rows = await db.select().from(rides).orderBy(desc(rides.date));
  return rows.map(rowToRide);
}

export async function rideExternalIdExists(externalId: string): Promise<boolean> {
  const rows = await db.select().from(rides).where(eq(rides.externalId, externalId));
  return rows.length > 0;
}

export async function createRide(data: {
  bikeId: string;
  distanceKm: number;
  date: number;
  title?: string;
  notes?: string;
  source?: RideSource;
  externalId?: string;
}): Promise<Ride> {
  const now = Date.now();
  const id = genId();
  await db.insert(rides).values({
    id,
    bikeId: data.bikeId,
    distanceKm: data.distanceKm,
    date: data.date,
    title: data.title ?? null,
    notes: data.notes ?? null,
    source: data.source ?? 'manual',
    externalId: data.externalId ?? null,
    createdAt: now,
  });
  await addDistanceToBike(data.bikeId, data.distanceKm);
  const rows = await db.select().from(rides).where(eq(rides.id, id));
  return rowToRide(rows[0]);
}

export async function deleteRide(id: string): Promise<void> {
  const rows = await db.select().from(rides).where(eq(rides.id, id));
  if (rows.length) {
    await addDistanceToBike(rows[0].bikeId, -rows[0].distanceKm);
  }
  await db.delete(rides).where(eq(rides.id, id));
}

function rowToRide(row: typeof rides.$inferSelect): Ride {
  return {
    id: row.id,
    bikeId: row.bikeId,
    distanceKm: row.distanceKm,
    date: row.date,
    title: row.title,
    notes: row.notes,
    source: row.source as RideSource,
    externalId: row.externalId,
    createdAt: row.createdAt,
  };
}
