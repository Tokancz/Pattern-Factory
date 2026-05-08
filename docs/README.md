# Pattern Factory — Documentation

Pattern Factory is an idle / incremental browser game with a persistent
backend. The player runs a "Reality Engine" that produces geometric
patterns; each pattern feeds a different currency, currencies unlock
upgrades, upgrades feed back into production, and periodic resets
(prestige and ascension) trade short-term progress for permanent ones.

This folder is the project's documentation. If you're new to the
codebase, read in this order:

| Doc                                | What's in it                                       |
| ---------------------------------- | -------------------------------------------------- |
| [GAME.md](./GAME.md)               | Game design: every mechanic, currency, formula     |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Code layout, stack, Pinia stores, save sync flow |
| [API.md](./API.md)                 | REST endpoints, request/response shapes            |
| [SECURITY.md](./SECURITY.md)       | Threat model, validation rules, audit notes        |
| [EXPANSION.md](./EXPANSION.md)     | Design spec for the Reality Engine expansion       |

## Stack at a glance

- **Client:** Vue 3 + TypeScript, Pinia for state, Vue Router, Vite, SCSS
- **Server:** Node.js + Express, PostgreSQL (`pg`), JWT bearer auth, bcrypt, express-rate-limit
- **Auth:** email + password, 7-day JWT, optional email-verification token
- **Persistence:** server-authoritative for identity; client-authoritative for
  game progression with optimistic concurrency on save (`save_version`)
- **Deploy:** static client (Vite build → GH Pages or any CDN) + a single
  Node process backed by Postgres

## Running locally

```sh
# client
npm install
npm run dev          # http://localhost:5173

# server
cd server
npm install
cp .env.example .env # set DATABASE_URL, JWT_SECRET, FRONTEND_URL
npm run dev          # http://localhost:3001
```

The client expects the API at `VITE_API_URL` (defaults to
`http://localhost:3001`). The server hard-fails at startup if
`JWT_SECRET` is missing or shorter than 16 chars in production —
see [SECURITY.md](./SECURITY.md).

## Repository layout

```
src/                # Vue 3 client
├── components/     # presentational + game UI components
├── views/          # routed views (one per main panel)
├── stores/         # Pinia stores (game, slot, pattern, upgrade, …)
├── data/           # static gameplay data tables (patterns, upgrades, …)
├── utils/          # save sync, API client, formatter, sounds
└── router/         # Vue Router config

server/src/         # Express API
├── controllers/    # auth, save, leaderboard, admin
├── middleware/     # auth, validate, errorHandler
├── routes/         # router files matching controllers
├── sql/            # schema.sql + migrations/
├── utils/          # logger
├── config.ts       # central env / secret loader
├── db.ts           # pg pool + slow-query logging
└── server.ts       # entry point

shared/types.ts     # types shared client ↔ server
docs/               # this folder
```
