# Architecture

## Stack

```
┌────────────────────────────────────────────────────┐
│  Browser                                           │
│  ┌──────────────┐  ┌──────────────┐                │
│  │  Vue 3 + TS  │──│  Pinia       │  state         │
│  │  components  │  │  stores      │                │
│  └──────┬───────┘  └──────┬───────┘                │
│         │                 │                        │
│         │       fetch()   ▼                        │
│         └─────────► /utils/api.ts ── Bearer JWT ───┼──┐
│                                                    │  │
└────────────────────────────────────────────────────┘  │
                                                        │
┌─────────────────────────────────────────────────┐     │
│  Express server                                 │ ◄───┘
│  ┌─────────────────────────────────────────┐    │
│  │ rateLimit → CORS → json → routes        │    │
│  │   /auth      /save     /leaderboard     │    │
│  │   /admin     /health                    │    │
│  └─────────────────┬───────────────────────┘    │
│                    │                            │
│                    ▼                            │
│  ┌─────────────────────────────────────────┐    │
│  │  pg.Pool  (db.ts) — slow-query logging  │    │
│  └─────────────────┬───────────────────────┘    │
└────────────────────┼────────────────────────────┘
                     ▼
                ┌─────────┐
                │ Postgres│
                └─────────┘
```

## Project layout

```
src/
├── components/
│   ├── game/         in-game widgets (Slot, Stats, Navbar, …)
│   ├── system/       layout primitives (Panel, Modal, …)
│   └── ui/           auth + chrome (Login, Toasts, …)
├── views/            one Vue file per routed panel
├── stores/           Pinia stores — see “Stores” below
├── data/             static gameplay tables
├── composables/      shared reactive logic
├── styles/           global SCSS (variables, mixins)
├── utils/            api, save, logger, format, sound, architect
└── router/           Vue Router config

server/src/
├── controllers/      one file per resource
├── middleware/       auth, validate, errorHandler
├── routes/           Express Router files matching controllers
├── sql/              schema + migrations (run manually for now)
├── utils/logger.ts   structured server logger
├── config.ts         loads env, validates JWT_SECRET, exports `config`
├── db.ts             pg pool + slow-query detection
└── server.ts         entry point — wires middleware + routes + listen()

shared/types.ts       types used by both ends of the wire
```

## Stores

All stores live in [src/stores/](../src/stores/) and use Pinia's
composition / options API. The dependency graph between stores is
deliberately loose — most stores reach for others lazily inside getters
or actions to avoid circular imports.

| Store        | Owns                                           | Survives prestige | Survives ascension |
| ------------ | ---------------------------------------------- | ----------------- | ------------------ |
| `game`       | money, dc, exp, level, prestigePoints, pendingPP | PP only         | nothing            |
| `slot`       | slot array, baseSpeed, selectedSlotId          | no                | no                 |
| `pattern`    | per-pattern level/exp, unlockedPatterns        | square only       | square only        |
| `upgrade`    | levels (money), dcLevels, prestigeLevels       | prestigeLevels    | nothing            |
| `machine`    | machine levels                                  | no                | no                 |
| `synergy`    | derived (computed from slot+pattern+glyph)     | n/a               | n/a                |
| `boss`       | active anomaly state, click count, timer       | yes (transient)   | yes (transient)    |
| `glyph`      | glyphs, pendingGlyphs, ascensionCount, glyphUpgrades, endgameState, seenIntro | yes | yes (the whole point) |
| `user`       | logged-in user object, JWT in localStorage     | yes               | yes                |

The `synergy` store is fully derived — it doesn't store its own state,
just computeds over slot composition + pattern levels + Glyph upgrades.

## Save sync flow

Two endpoints are involved: `GET /save` (load) and `PUT /save` (write).
Both are JSON, both are authenticated via Bearer JWT.

### Load — on app boot

```
loadGame()
  ├── api.get<ServerSave>("/save")
  ├── 404 ⇒ first-ever play, set gameLoaded = true, return null
  ├── 200 ⇒ patch every store from the server payload
  │         (game / glyph / slots / upgrades / machines / patterns)
  ├── set saveVersion to whatever the server reported
  └── set gameLoaded = true
```

`gameLoaded` is a flag that **blocks** any saveGame() until the initial
load has completed. Without it, an autosave racing the first load would
PUT default empty state and wipe the server save.

### Save — every 5s + on key actions

```
saveGame()
  ├── if !token or !gameLoaded → no-op
  ├── if inFlight save exists → wait then retry (serializes writes)
  ├── PUT /save buildSavePayload()
  │     ↳ 200: take new saveVersion from response
  │     ↳ 409 conflict: another device wrote more recently —
  │                     pull server state via loadGame() instead
  │     ↳ other error: log via /utils/logger
  └── clear inFlight
```

### Optimistic concurrency

Every save row has an integer `save_version`. The client sends its
known version; the server runs:

```sql
UPDATE game_saves
SET … , save_version = save_version + 1
WHERE user_id = $X AND save_version = $clientVersion
RETURNING save_version
```

If `RETURNING` is empty:
- if a row exists → version mismatch, return `409 { serverVersion }`
- if no row exists → first-ever save, insert with `save_version = 1`

The client treats `409` as "the other tab/device is ahead" and reloads.
This is the lightest workable strategy for an idle game where
client-authoritative is the design choice.

## Logging

### Server — `server/src/utils/logger.ts`

Structured one-line format:

```
2026-05-08T12:34:56.789Z [INFO] [auth.login] user logged in {"userId":42,"username":"alice"}
```

- `LOG_LEVEL` env var (`debug | info | warn | error`) gates output.
- `Error` instances are stripped of stack traces in the JSON tail to
  keep lines parseable; the stack still goes to stderr.
- The DB layer logs queries that take ≥ 200 ms (slow-query monitor),
  not every query.

### Client — `src/utils/logger.ts`

Tiny wrapper. `debug` and `info` are dropped in production; `warn`
and `error` always survive so real failures end up in the console.

## Configuration

`server/src/config.ts` is the single source of truth for env-derived
config. It reads `.env` once at import, validates `JWT_SECRET`
(production: hard-fail if missing or shorter than 16 chars; dev:
warn and use a random per-process secret), and exports a frozen
`config` object used everywhere — no other module reads
`process.env` directly.

Required env vars:

| Variable        | Required in prod | Default (dev)               |
| --------------- | ---------------- | --------------------------- |
| `DATABASE_URL`  | ✅                | —                           |
| `JWT_SECRET`    | ✅ (≥16 chars)    | random per-process          |
| `FRONTEND_URL`  | ✅                | `http://localhost:5173`     |
| `PORT`          | optional         | `3001`                      |
| `NODE_ENV`      | `production`     | unset                       |
| `LOG_LEVEL`     | optional         | `info`                      |

## Database

Schema in [server/src/sql/schema.sql](../server/src/sql/schema.sql).
Migrations are append-only files in `migrations/` and are applied
manually (no migration runner at this size).

```
users ──┬── 1:1 ── game_saves ──┬── 1:N ── slot_states          (5 max via CHECK)
        │                       ├── 1:N ── upgrade_levels       (per upgrade_id, type)
        │                       ├── 1:N ── machine_levels       (per machine_id)
        │                       ├── 1:N ── pattern_progress     (per pattern_id)
        │                       └── 1:N ── glyph_upgrade_levels (per upgrade_id)
        │
        ├── 1:N ── email_verification_tokens
        └── 1:1 ── leaderboard_entries
```

All foreign keys cascade on user delete, so removing a user wipes
their save and leaderboard entry atomically.
