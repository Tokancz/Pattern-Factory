# Pattern Factory

An idle / incremental game where you combine four geometric patterns — square, triangle, circle, cross — across production slots to generate currencies, unlock upgrades, fight bosses, and prestige through ever-deeper synergies.

## Gameplay

- **Patterns** produce resources: IGM (money), EXP, DC (dark currency), and PP (prestige points).
- **Slots** hold patterns — your slot composition determines which synergies fire.
- **Synergies** grant output/speed multipliers when the right combination of patterns is slotted (pair, triple, dual, dominant, full).
- **Upgrades** come in three tracks: regular (IGM), DC, and prestige (PP).
- **Machines** provide persistent passive boosts, including a synergy amplifier.
- **Boss fights** trigger periodically with their own music and rewards.
- **Prestige** resets progress in exchange for permanent multipliers.
- **Leaderboard** ranks players across the shared backend.

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
│   │   └── ui/          Login, CurrencyDisplay, ProgressBar, BossFight, TutorialOverlay
│   ├── composables/     gameLoop
│   ├── data/            patterns, synergies, upgrades, machines, bosses, tutorial
│   ├── router/          vue-router setup
│   ├── stores/          Pinia stores (game, pattern, slot, synergy, upgrade, machine, boss, user)
│   ├── styles/          main.scss, views.scss, mixins
│   ├── utils/           api, format, save, sound, ascii
│   └── views/           PatternView, UpgradeView, SynergyView, MachineView,
│                        InventoryView, PrestigeView, Leaderboard, AdminView
├── server/
│   └── src/
│       ├── routes/      auth, save, leaderboard, admin
│       ├── controllers/ route handlers
│       ├── middleware/  auth guards
│       └── sql/         schema + migrations
└── public/              fonts, icons, patterns, tutorial images, sound
```

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

| Path           | View |
|----------------|------|
| `/patterns`    | Pattern shop |
| `/upgrades`    | Upgrade shop (regular / DC / prestige, paginated) |
| `/synergies`   | Synergy browser with Active / Almost / All filter |
| `/machines`    | Machine shop |
| `/inventory`   | Pattern levels, EXP, values |
| `/prestige`    | Prestige controls |
| `/leaderboard` | Global ranking |
| `/admin`       | Admin panel (JWT `isAdmin` required) |

## Saves

The game autosaves and restores from the backend when logged in. Offline progress on re-entry is capped by the current offline-cap upgrade.

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

| Method | Endpoint | Auth | Body          | Description                           |
|--------|----------|------|---------------|---------------------------------------|
| GET    | `/save`  | ✓    | —             | Load full save (all sub-entities)     |
| PUT    | `/save`  | ✓    | `SavePayload` | Overwrite full save (autosave target) |
| DELETE | `/save`  | ✓    | —             | Delete save (prestige reset)          |

### Leaderboard

| Method | Endpoint              | Auth | Body | Description                  |
|--------|-----------------------|------|------|------------------------------|
| GET    | `/leaderboard`        | ✗    | —    | Top 100 entries with rank    |
| GET    | `/leaderboard/me`     | ✓    | —    | Current user's best rank     |
| POST   | `/leaderboard/submit` | ✓    | —    | Submit current save as score |

### Health

| Method | Endpoint  | Auth | Description         |
|--------|-----------|------|---------------------|
| GET    | `/health` | ✗    | Server health check |

### Notes

- All protected endpoints require a valid JWT.
- Save data is handled as a single object (`SavePayload`).
- Leaderboard submission uses the current save state.
- `/health` is suitable for uptime monitoring.

---

## Credits

Created by Mates.
