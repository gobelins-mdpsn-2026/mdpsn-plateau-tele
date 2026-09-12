import { pgTable, serial, text, integer, doublePrecision, boolean, timestamp } from "drizzle-orm/pg-core";

export const watchItems = pgTable("watch_items", {
  id: serial("id").primaryKey(),
  tmdbId: integer("tmdb_id").notNull(),
  mediaType: text("media_type", { enum: ["movie", "tv"] }).notNull(),
  title: text("title").notNull(),
  originalTitle: text("original_title"),
  originalLanguage: text("original_language").notNull().default("en"),
  posterPath: text("poster_path"),
  year: text("year"),
  note: text("note").notNull().default(""),
  addedBy: text("added_by").notNull(),
  director: text("director"),
  country: text("country"),
  duration: text("duration"),
  position: doublePrecision("position").notNull(),
  watched: boolean("watched").notNull().default(false),
  watchedAt: timestamp("watched_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
