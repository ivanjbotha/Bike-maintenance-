import { eq } from 'drizzle-orm';
import { db } from '../client';
import { cachedShops } from '../schema';
import { CachedShop } from '../../types';

export async function upsertShops(shops: CachedShop[]): Promise<void> {
  for (const shop of shops) {
    await db
      .insert(cachedShops)
      .values({
        id: shop.id,
        name: shop.name,
        lat: shop.lat,
        lon: shop.lon,
        address: shop.address,
        phone: shop.phone,
        website: shop.website,
        openingHours: shop.openingHours,
        tags: shop.tags,
        userNotes: shop.userNotes,
        cachedAt: shop.cachedAt,
      })
      .onConflictDoUpdate({
        target: cachedShops.id,
        set: {
          name: shop.name,
          lat: shop.lat,
          lon: shop.lon,
          address: shop.address,
          phone: shop.phone,
          website: shop.website,
          openingHours: shop.openingHours,
          tags: shop.tags,
          cachedAt: shop.cachedAt,
        },
      });
  }
}

export async function getShopById(id: string): Promise<CachedShop | null> {
  const rows = await db.select().from(cachedShops).where(eq(cachedShops.id, id));
  return rows.length ? rowToShop(rows[0]) : null;
}

export async function updateShopNotes(id: string, notes: string): Promise<void> {
  await db.update(cachedShops).set({ userNotes: notes }).where(eq(cachedShops.id, id));
}

function rowToShop(row: typeof cachedShops.$inferSelect): CachedShop {
  return {
    id: row.id,
    name: row.name,
    lat: row.lat,
    lon: row.lon,
    address: row.address,
    phone: row.phone,
    website: row.website,
    openingHours: row.openingHours,
    tags: row.tags,
    userNotes: row.userNotes,
    cachedAt: row.cachedAt,
  };
}
