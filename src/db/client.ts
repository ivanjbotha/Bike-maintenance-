import { drizzle, ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import { openDatabaseAsync } from 'expo-sqlite';
import migrations from './migrations/migrations';
import * as schema from './schema';

// The database must be opened asynchronously and exactly once. On web,
// expo-sqlite runs SQLite in a worker over OPFS, which only permits one
// exclusive connection per file - a second open fails with
// NoModificationAllowedError. openDatabaseSync is worse still: called with a
// cold worker it busy-waits the main thread and throws a sync timeout before
// the worker can even download. So: single connection, async open, and
// migrations run on that same connection before the app renders.
type DrizzleDb = ExpoSQLiteDatabase<typeof schema>;

let dbInstance: DrizzleDb | null = null;
let initPromise: Promise<DrizzleDb> | null = null;

export function initDb(): Promise<DrizzleDb> {
  if (!initPromise) {
    initPromise = (async () => {
      const expo = await openDatabaseAsync('bikeservice.db', { enableChangeListener: true });
      const d = drizzle(expo, { schema });
      await migrate(d, migrations);
      dbInstance = d;
      return d;
    })();
  }
  return initPromise;
}

// Queries import `db` directly; the proxy defers resolution until initDb()
// has completed (the app gates rendering on it, so queries never run before).
export const db: DrizzleDb = new Proxy({} as DrizzleDb, {
  get(_target, prop) {
    if (!dbInstance) {
      throw new Error('Database not initialized - initDb() must complete first');
    }
    const value = (dbInstance as any)[prop];
    return typeof value === 'function' ? value.bind(dbInstance) : value;
  },
});
