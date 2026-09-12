import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { sql } from "drizzle-orm";
import * as schema from "./db/schema.js";
import type { DbInstance } from "./app.js";

/**
 * Creates an in-process Postgres (PGlite) with migrations applied.
 * Create one per test file; call `resetTestDb` before each test.
 */
export async function createTestDb(): Promise<{ db: DbInstance; close: () => Promise<void> }> {
  const client = new PGlite();
  const testDb = drizzle(client, { schema });
  await migrate(testDb, { migrationsFolder: "./drizzle" });
  return { db: testDb, close: () => client.close() };
}

export async function resetTestDb(db: DbInstance): Promise<void> {
  await db.execute(sql`TRUNCATE TABLE watch_items RESTART IDENTITY`);
}
