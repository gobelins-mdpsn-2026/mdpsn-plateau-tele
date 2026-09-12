import { Hono } from "hono";
import type { MiddlewareHandler } from "hono";
import { cors } from "hono/cors";
import { sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type * as schema from "./db/schema.js";
import { items } from "./routes/items.js";
import { search } from "./routes/search.js";
import { events } from "./routes/events.js";
import { detail } from "./routes/detail.js";

export type DbInstance = PgDatabase<PgQueryResultHKT, typeof schema>;

export type AppEnv = {
  Variables: {
    db: DbInstance;
  };
};

const requireTmdbKey: MiddlewareHandler = async (c, next) => {
  if (!process.env.TMDB_API_KEY) {
    return c.json({ error: "TMDB_API_KEY not set — add it to your environment" }, 503);
  }
  await next();
};

export function createApp(db: DbInstance) {
  const app = new Hono<AppEnv>();

  app.use("*", cors());

  // Inject db into context for all routes
  app.use("*", async (c, next) => {
    c.set("db", db);
    await next();
  });

  // Every TMDB-backed route needs the key. Fail with a clear message instead of a 500.
  app.use("/api/search/*", requireTmdbKey);
  app.use("/api/search", requireTmdbKey);
  app.use("/detail/*", requireTmdbKey);

  app.get("/healthz", async (c) => {
    const db = c.get("db");
    await db.execute(sql`SELECT 1`);
    return c.json({ status: "ok" });
  });

  app.route("/api/items", items);
  app.route("/api/search", search);
  app.route("/api/events", events);
  app.route("/detail", detail);

  app.onError((err, c) => {
    console.error(err.message);
    return c.json({ error: "internal server error" }, 500);
  });

  return app;
}
