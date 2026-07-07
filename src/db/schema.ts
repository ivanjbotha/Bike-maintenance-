import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const bikes = sqliteTable('bikes', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  brand: text('brand'),
  model: text('model'),
  year: integer('year'),
  type: text('type').notNull().default('road'),
  totalKm: real('total_km').notNull().default(0),
  imageUri: text('image_uri'),
  isActive: integer('is_active').notNull().default(1),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const parts = sqliteTable('parts', {
  id: text('id').primaryKey(),
  bikeId: text('bike_id').notNull().references(() => bikes.id),
  name: text('name').notNull(),
  category: text('category').notNull().default('other'),
  serviceIntervalKm: real('service_interval_km'),
  replaceIntervalKm: real('replace_interval_km'),
  serviceIntervalDays: integer('service_interval_days'),
  replaceIntervalDays: integer('replace_interval_days'),
  kmAtLastService: real('km_at_last_service').notNull().default(0),
  kmAtLastReplace: real('km_at_last_replace').notNull().default(0),
  dateLastService: integer('date_last_service'),
  dateLastReplace: integer('date_last_replace'),
  installKm: real('install_km').notNull().default(0),
  notes: text('notes'),
  isActive: integer('is_active').notNull().default(1),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const rides = sqliteTable('rides', {
  id: text('id').primaryKey(),
  bikeId: text('bike_id').notNull().references(() => bikes.id),
  distanceKm: real('distance_km').notNull(),
  date: integer('date').notNull(),
  title: text('title'),
  notes: text('notes'),
  source: text('source').notNull().default('manual'),
  externalId: text('external_id'),
  createdAt: integer('created_at').notNull(),
});

export const serviceRecords = sqliteTable('service_records', {
  id: text('id').primaryKey(),
  partId: text('part_id').notNull().references(() => parts.id),
  bikeId: text('bike_id').notNull().references(() => bikes.id),
  type: text('type').notNull(),
  bikeKmAtService: real('bike_km_at_service').notNull(),
  cost: real('cost'),
  shopId: text('shop_id'),
  notes: text('notes'),
  date: integer('date').notNull(),
  createdAt: integer('created_at').notNull(),
});

export const cachedShops = sqliteTable('cached_shops', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  lat: real('lat').notNull(),
  lon: real('lon').notNull(),
  address: text('address'),
  phone: text('phone'),
  website: text('website'),
  openingHours: text('opening_hours'),
  tags: text('tags'),
  userNotes: text('user_notes'),
  cachedAt: integer('cached_at').notNull(),
});
