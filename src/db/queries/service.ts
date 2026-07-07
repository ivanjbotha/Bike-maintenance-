import { eq, desc } from 'drizzle-orm';
import { db } from '../client';
import { serviceRecords } from '../schema';
import { ServiceRecord, ServiceType } from '../../types';
import { getBikeById } from './bikes';
import { getPartById, updatePart } from './parts';

function genId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function getServiceRecordsForPart(partId: string): Promise<ServiceRecord[]> {
  const rows = await db
    .select()
    .from(serviceRecords)
    .where(eq(serviceRecords.partId, partId))
    .orderBy(desc(serviceRecords.date));
  return rows.map(rowToRecord);
}

export async function getServiceRecordsForBike(bikeId: string): Promise<ServiceRecord[]> {
  const rows = await db
    .select()
    .from(serviceRecords)
    .where(eq(serviceRecords.bikeId, bikeId))
    .orderBy(desc(serviceRecords.date));
  return rows.map(rowToRecord);
}

export async function logService(data: {
  partId: string;
  type: ServiceType;
  cost?: number;
  shopId?: string;
  notes?: string;
}): Promise<ServiceRecord> {
  const now = Date.now();
  const id = genId();
  const part = await getPartById(data.partId);
  if (!part) throw new Error('Part not found');
  const bike = await getBikeById(part.bikeId);
  if (!bike) throw new Error('Bike not found');

  await db.insert(serviceRecords).values({
    id,
    partId: data.partId,
    bikeId: part.bikeId,
    type: data.type,
    bikeKmAtService: bike.totalKm,
    cost: data.cost ?? null,
    shopId: data.shopId ?? null,
    notes: data.notes ?? null,
    date: now,
    createdAt: now,
  });

  if (data.type === 'service') {
    await updatePart(data.partId, {
      kmAtLastService: bike.totalKm,
      dateLastService: now,
    });
  } else {
    await updatePart(data.partId, {
      kmAtLastService: bike.totalKm,
      kmAtLastReplace: bike.totalKm,
      dateLastService: now,
      dateLastReplace: now,
    });
  }

  const rows = await db.select().from(serviceRecords).where(eq(serviceRecords.id, id));
  return rowToRecord(rows[0]);
}

function rowToRecord(row: typeof serviceRecords.$inferSelect): ServiceRecord {
  return {
    id: row.id,
    partId: row.partId,
    bikeId: row.bikeId,
    type: row.type as ServiceType,
    bikeKmAtService: row.bikeKmAtService,
    cost: row.cost,
    shopId: row.shopId,
    notes: row.notes,
    date: row.date,
    createdAt: row.createdAt,
  };
}
