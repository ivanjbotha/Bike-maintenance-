import { drizzle, ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import { openDatabaseAsync, deleteDatabaseAsync, SQLiteDatabase } from 'expo-sqlite';
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

const DB_NAME = 'bikeservice.db';

let rawDb: SQLiteDatabase | null = null;
let dbInstance: DrizzleDb | null = null;
let initPromise: Promise<DrizzleDb> | null = null;

export function initDb(): Promise<DrizzleDb> {
  if (!initPromise) {
    initPromise = (async () => {
      const expo = await openDatabaseAsync(DB_NAME, { enableChangeListener: true });
      rawDb = expo;
      const d = drizzle(expo, { schema });
      await migrate(d, migrations);
      dbInstance = d;
      return d;
    })().catch((e) => {
      // Leave state clean so a retry re-attempts instead of replaying the
      // same rejected promise.
      initPromise = null;
      dbInstance = null;
      throw e;
    });
  }
  return initPromise;
}

// Last-resort recovery for a corrupted local database (e.g. files left
// behind by older builds that opened multiple conflicting connections).
// Destroys all local data; only ever invoked from an explicit user action.
export async function resetLocalDatabase(): Promise<DrizzleDb> {
  try {
    await rawDb?.closeAsync();
  } catch {
    // Connection may already be broken - deletion is what matters.
  }
  rawDb = null;
  dbInstance = null;
  initPromise = null;
  await deleteDatabaseAsync(DB_NAME);
  return initDb();
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
