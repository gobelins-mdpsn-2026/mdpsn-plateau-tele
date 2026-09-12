# plateau-tele

Shared movie/TV watchlist. French-first, mobile-first, iOS conventions.

Template for a class exercise on web development and deployment. Deployed with
Docker on Coolify — see `README.md`. There is no authentication: the app is
world-accessible for the duration of the class.

## Run

```sh
bun install
bun run dev          # bun --watch server/index.ts
bun run start        # same, without --watch
```

There is no build step. The server transpiles `client/*.ts` and `shared/*.ts` to ES
modules on the fly with `Bun.Transpiler` (see `server/index.ts`) — no bundler, no
`dist/` output.

Needs a `.env` with `TMDB_API_KEY` and `DATABASE_URL` (PostgreSQL). `PORT`, `HOST`
and `LOCALE` are optional. See `.env.example`. `docker compose up -d db` starts a
local Postgres matching the example URL.

Without `TMDB_API_KEY` the server still boots (and warns); `/api/search` and
`/detail/*` answer 503 with an explicit message.

`HOST` defaults to `0.0.0.0` so the app is reachable from outside its Docker
container. Set `HOST=127.0.0.1` locally if you want loopback only.

## Docker

```sh
docker compose up --build   # needs TMDB_API_KEY in the environment or in .env
```

`Dockerfile` runs `bun server/index.ts` on `oven/bun:1-slim`. `docker-compose.yml`
adds a `postgres:17` service and is what Coolify deploys (Docker Compose build
pack); it exposes ports but never binds host ports. `docker-compose.override.yml`
adds the host bindings for local use. `/healthz` is the container health check.

## Test

```sh
bun test             # 86 tests across 6 files
bun run typecheck    # tsc --noEmit, must stay clean
bun run test:watch
```

`bunfig.toml` sets the test root to `server/__tests__`, so `bun test` runs the backend
suite only. `client/lib/format-watched-at.test.ts` exists but is outside that root —
run it explicitly with `bun test ./client/lib/format-watched-at.test.ts`.

Tests use an in-process Postgres (PGlite) via `server/test-utils.ts`: one database
per file, truncated before each test. Pattern:

```ts
import { createApp } from "../app.js";
import { createTestDb } from "../test-utils.js";

let db: DbInstance;
let close: () => Promise<void>;
let app: ReturnType<typeof createApp>;

beforeAll(async () => {
  ({ db, close } = await createTestDb());
  app = createApp(db);
});
beforeEach(() => resetTestDb(db));
afterAll(() => close());
```

Test requests go through `app.request()` — no HTTP server needed.

## Database

PostgreSQL via Drizzle ORM, using Bun's built-in `SQL` driver (`drizzle-orm/bun-sql`).
Single table `watch_items` in `server/db/schema.ts`. Timestamps are `timestamptz`
columns read as `Date` and serialised to ISO strings in `rowToItem`.

```sh
bun run db:generate  # generate migration from schema changes
bun run db:migrate   # apply migrations
```

Migrations live in `drizzle/` and run automatically at server start.

## Project structure

```
client/                 # Browser code, transpiled per-request by the server
  components/           # Web Components (<search-bar>, <watch-list>, <watched-list>)
  i18n/                 # Client-side i18n (imports shared keys)
  lib/                  # Pure utilities (debounce, title display, accent color,
                        #   watch-item helpers, watched-at formatting + its unit test)
  services/             # API client (fetch wrappers) and SSE subscription
  styles/               # CSS files, layered: reset → base → layout → components
  index.html            # Home page (SPA shell)
  watched.html          # Watched-list page
  main.ts               # Home page entry point
  detail.ts             # Detail + add-modal entry point
  watched.ts            # Watched page entry point
  styles.css            # CSS import aggregator (@import)

server/                 # Hono API, runs on Bun
  __tests__/            # Backend tests (bun:test)
  db/                   # Drizzle schema + connection
  routes/               # Route modules (items, search, events, detail)
  views/                # Server-rendered HTML templates (hono/html)
  app.ts                # Hono app factory, route registration
  index.ts              # Entry point (migrations, TS transpilation, static serving)
  sse.ts                # SSE broadcast hub
  tmdb.ts               # TMDB API client
  test-utils.ts         # PGlite test DB factory

shared/                 # Code shared between server and client
  i18n/                 # Translation strings (en.ts, fr.ts)
  config.ts             # Shared constants
  tmdb-image.ts         # TMDB image URL builder
  types.ts              # TypeScript interfaces (WatchItem, SSEEvent, etc.)

drizzle.config.ts       # Drizzle-kit config
Dockerfile              # Production image (used by Coolify)
docker-compose.yml      # App + Postgres, deployed as-is by Coolify
docker-compose.override.yml  # Host port bindings for local runs
```

## Key routes

| Method | Path | Handler |
|--------|------|---------|
| GET | `/api/items` | List unwatched items (or `?watched=true`) |
| POST | `/api/items` | Add item to watchlist |
| PATCH | `/api/items/:id` | Update item (mark watched, edit note) |
| DELETE | `/api/items/:id` | Remove item |
| POST | `/api/items/reorder` | Batch reorder |
| GET | `/api/search?q=` | Search TMDB (movies, TV, people) |
| GET | `/api/search/details/:type/:id` | TMDB details for one title |
| GET | `/api/events` | SSE stream |
| GET | `/detail/:type/:id` | Server-rendered detail page |
| GET | `/detail/:type/:id/add` | Server-rendered add-to-list modal |
| GET | `/healthz` | Health check (used by Docker/Coolify) |

## How things connect

- Home page is a static HTML shell (`client/index.html`) with two web components
  (`<search-bar>`, `<watch-list>`); `/watched` serves `client/watched.html`
- `<search-bar>` calls `/api/search`, renders results as links to `/detail/:type/:id`
- Detail and add-modal pages are server-rendered by Hono views, with client JS for interactivity
- Cross-document View Transitions (`@view-transition { navigation: auto }`) animate between pages
- SSE keeps multiple open tabs in sync — any mutation broadcasts to all clients
- `?q=` param threads search context through detail → add → cancel → home

## Code standards

- No frameworks on the client. Vanilla TypeScript, web components, platform APIs.
- No build step at all — the server transpiles TS to ES modules per request. Client
  code must therefore be valid as unbundled ES modules: relative imports carry
  explicit `.js` extensions, and npm deps are resolved by an import map in the page
  head against a server route (`sortablejs` → `/vendor/sortable.esm.js`).
- Semantic HTML. Accessible. Use `<template>` for repeated structures.
- Server views use `hono/html` tagged template literals, not JSX or a template engine.
- i18n: all user-facing strings go through `t(locale, key)`. Keys are typed via `as const`.
- CSS uses `@layer` for ordering, custom properties for tokens, `color-mix()` for derived colors.
- Keep functions small. Prefer composition over inheritance. No classes except web components.
- Tests are backend-first. Each backend test file covers one route module and uses
  `app.request()` directly. Pure client utilities may have unit tests next to them.
- One concern per file. If a file does two things, split it.
- Commit messages: one line, no signing, atomic changes.
