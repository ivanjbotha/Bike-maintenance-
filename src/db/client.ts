import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import migrations from './migrations/migrations';
import * as schema from './schema';

const expo = openDatabaseSync('bikeservice.db', { enableChangeListener: true });
export const db = drizzle(expo, { schema });

export function useDbMigrations() {
  return useMigrations(db, migrations);
}
