import { drizzle } from "drizzle-orm/bun-sql";
import { migrate } from "drizzle-orm/bun-sql/migrator";
import * as schema from "./schema.js";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set — see .env.example");
  process.exit(1);
}

export const db = drizzle(url, { schema });

export async function runMigrations(): Promise<void> {
  await migrate(db, { migrationsFolder: "./drizzle" });
}

export { schema };
