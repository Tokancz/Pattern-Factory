# Pattern Factory

An idle / incremental game where you run a **Reality Engine**. Geometric primitives — square, triangle, circle, cross — are the building blocks the engine uses to render existence; you, the **Architect**, keep them stable, repel **anomalies**, and inscribe yourself ever deeper into the substrate.

Lore-first naming throughout the UI; under the hood it's still patterns, slots, currencies and a leaderboard. A planned expansion (see [`docs/EXPANSION.md`](docs/EXPANSION.md)) layers on Glyphs, Ascension, and a true ending.

## Gameplay

- **Patterns** generate substrate resources: IGM (Iterative Generation Mass), EXP, DC (Drift Coins), and PP (Persistence Points).
- **Threads** (slots) hold patterns — your thread composition determines which **Resonances** (synergies) fire.
- **Resonances** grant output/speed bonuses when the right combination is threaded (pair, triple, dual, dominant, full).
- **Protocols** (upgrades) come in three tracks: regular (IGM), DC, and persistence (PP).
- **Modules** (machines) provide passive engine effects, including a resonance amplifier.
- **Anomalies** (boss fights) trigger periodically — defeat them to keep your currencies; fail and one is drained.
- **Re-render** (prestige) collapses the run in exchange for permanent multipliers.
- **Registry** (leaderboard) ranks Architects across the shared backend.

## Tech stack

- **Client** — Vue 3 + TypeScript, Pinia, Vue Router, Vite, Sass
- **Server** — Node/Express + TypeScript, PostgreSQL (`pg`), JWT auth (`jsonwebtoken`, `bcryptjs`), `nodemailer`

## Project layout

```
Pattern-Factory/
├── src/
│   ├── components/
│   │   ├── game/        Navbar, Simulation, Slot, Stats, SynergyPanel
│   │   ├── system/      Panel wrapper
│   │   └── ui/          Login, CurrencyDisplay, ProgressBar, BossFight, TutorialOverlay, AfkReport
│   ├── composables/     gameLoop
│   ├── data/            patterns, synergies, upgrades, machines, bosses, tutorial
│   ├── router/          vue-router setup
│   ├── stores/          Pinia stores (game, pattern, slot, synergy, upgrade, machine, boss, user)
│   ├── styles/          main.scss, _breakpoints, _mixins, views.scss
│   ├── utils/           api, format, save, sound, ascii
│   └── views/           PatternView, UpgradeView, SynergyView, MachineView,
│                        InventoryView, PrestigeView, Leaderboard, AdminView
├── server/
│   └── src/
│       ├── routes/      auth, save, leaderboard, admin
│       ├── controllers/ route handlers
│       ├── middleware/  auth guards
│       └── sql/         schema + migrations
├── docs/                EXPANSION.md (Reality Engine expansion design spec)
└── public/              fonts, icons, patterns, tutorial images, sound
```

## UI naming map

The UI uses lore-first names; internal code keeps the original gameplay terms so saves stay portable.

| Lore name (UI)      | Code term            |
|---------------------|----------------------|
| Architect           | user / player        |
| Engine Name         | factoryName          |
| Threads             | slots                |
| Patterns            | patterns             |
| Resonances          | synergies            |
| Protocols           | upgrades             |
| Modules             | machines             |
| Archive             | inventory            |
| Re-render           | prestige (action)    |
| Recursion           | prestige (top tab)   |
| Anomaly             | boss                 |
| Registry            | leaderboard          |
| IGM                 | money                |
| DC (Drift Coins)    | dc                   |
| PP (Persistence Points) | prestige_points  |
| Γ (Glyphs)          | glyphs *(planned)*   |

## Getting started

### Client

```bash
npm install
npm run dev        # start Vite dev server
npm run build      # type-check + production build
npm run preview    # serve the build locally
npm run deploy     # publish dist/ to gh-pages
```

### Server

```bash
cd server
npm install
npm run dev        # tsx watch src/server.ts
npm run build      # tsc → dist/
npm start          # node dist/server.js
```

The server needs a PostgreSQL database and environment variables for the DB connection, JWT secret, and SMTP credentials. Migrations live in `server/src/sql/migrations`.

## Client routes

| Path           | View          | UI label   |
|----------------|---------------|------------|
| `/patterns`    | PatternView   | PATTERNS   |
| `/upgrades`    | UpgradeView   | PROTOCOLS  |
| `/synergies`   | SynergyView   | RESONANCES |
| `/machines`    | MachineView   | MODULES    |
| `/inventory`   | InventoryView | ARCHIVE    |
| `/prestige`    | PrestigeView  | RECURSION  |
| `/leaderboard` | Leaderboard   | REGISTRY   |
| `/admin`       | AdminView     | (admin)    |

## Saves

The game autosaves and restores from the backend when logged in. Offline progress on re-entry is capped by the current offline-cap protocol.

---

# API

## Base URL

`http://localhost:3001/api`

## Authentication

Protected routes require a **Bearer token** in the `Authorization` header:

```
Authorization: Bearer <your_token>
```

### Auth

| Method | Endpoint              | Auth | Body                                         | Description                             |
|--------|-----------------------|------|----------------------------------------------|-----------------------------------------|
| POST   | `/auth/register`      | ✗    | `{ username, email, password, factoryName }` | Register new user, creates default save |
| POST   | `/auth/login`         | ✗    | `{ email, password }`                        | Login, returns JWT                      |
| GET    | `/auth/verify/:token` | ✗    | —                                            | Verify email address                    |
| GET    | `/auth/me`            | ✓    | —                                            | Get current user info                   |

### Save

| Method | Endpoint | Auth | Body          | Description                            |
|--------|----------|------|---------------|----------------------------------------|
| GET    | `/save`  | ✓    | —             | Load full save (all sub-entities)      |
| PUT    | `/save`  | ✓    | `SavePayload` | Overwrite full save (autosave target)  |
| DELETE | `/save`  | ✓    | —             | Delete save (re-render reset)          |

### Leaderboard

| Method | Endpoint              | Auth | Body | Description                          |
|--------|-----------------------|------|------|--------------------------------------|
| GET    | `/leaderboard`        | ✗    | —    | Top 100 Registry entries with rank   |
| GET    | `/leaderboard/me`     | ✓    | —    | Current Architect's best rank        |
| POST   | `/leaderboard/submit` | ✓    | —    | Submit current run to the Registry   |

### Health

| Method | Endpoint  | Auth | Description         |
|--------|-----------|------|---------------------|
| GET    | `/health` | ✗    | Server health check |

### Notes

- All protected endpoints require a valid JWT.
- Save data is handled as a single object (`SavePayload`).
- Registry submission uses the current save state.
- `/health` is suitable for uptime monitoring.

---

## Credits

Created by Mates.
