# API Reference

All endpoints are mounted on the Express server defined in
[server/src/server.ts](../server/src/server.ts). Default base URL in
development is `http://localhost:3001`.

## Conventions

- **Content type:** request and response bodies are JSON.
- **Auth:** protected endpoints require an `Authorization: Bearer <jwt>`
  header. Tokens are issued by `/auth/register` and `/auth/login`,
  expire in 7 days, and embed `{ userId, username, isAdmin }`.
- **Errors:** non-2xx responses use the shape `{ "error": "<message>" }`.
  In development, 500s also include `{ "details": "<error.message>" }`;
  production omits this field.
- **Rate limits:**
  - `/auth/*` (login, register): **10 / 15 min** per IP
  - everything else (global): **100 / 15 min** per IP
- **Body size:** capped at 256 KB (defends against payload-bomb DoS).
- **CORS:** single origin, `FRONTEND_URL`, with credentials allowed.

---

## Health

### `GET /health`

Liveness probe. No auth, no rate limit beyond the global one.

```json
{ "status": "ok" }
```

---

## Auth

Defined in [server/src/routes/auth.ts](../server/src/routes/auth.ts).

### `POST /auth/register`

Register a new account, seed a default save, return a JWT.

**Body:**

```json
{
  "username":    "string (3–15, ^[A-Za-z0-9_-]+$)",
  "email":       "string (RFC-ish, ≤255)",
  "password":    "string (8–128)",
  "factoryName": "string (1–15, no whitespace/control)"
}
```

**Responses:**

| Status | Body                                            | When                                              |
| ------ | ----------------------------------------------- | ------------------------------------------------- |
| 201    | `{ token, user: { id, username, email, factoryName } }` | success                              |
| 400    | `{ error: "<field> <reason>" }`                 | validation failed (see [SECURITY.md](./SECURITY.md)) |
| 409    | `{ error: "Username or email already taken" }`  | conflict on UNIQUE                                |
| 429    | `{ error: "Too many auth attempts, …" }`        | rate-limited                                      |

### `POST /auth/login`

Verify credentials, return a JWT.

**Body:**

```json
{ "email": "string", "password": "string" }
```

**Responses:**

| Status | Body                                                         | When                       |
| ------ | ------------------------------------------------------------ | -------------------------- |
| 200    | `{ token, user: { id, username, email, factoryName, isAdmin } }` | success                |
| 401    | `{ error: "Invalid credentials" }`                           | unknown email or bad password (no leak) |
| 400    | `{ error: "<field> <reason>" }`                              | validation failed          |

### `GET /auth/verify/:token`

Mark the user's email as verified and consume the token.

| Status | Body                                          |
| ------ | --------------------------------------------- |
| 200    | `{ message: "Email verified successfully" }`  |
| 400    | `{ error: "Invalid verification token" }` or `{ error: "Token expired" }` |

### `GET /auth/me` 🔒

Returns the authenticated user's profile.

```json
{
  "id":          1,
  "username":    "alice",
  "email":       "alice@example.com",
  "factoryName": "Foo Engine",
  "isAdmin":     false,
  "verified":    false,
  "createdAt":   "2026-04-01T08:30:00.000Z"
}
```

---

## Save

Defined in [server/src/routes/save.ts](../server/src/routes/save.ts).
**All save endpoints require auth.**

### `GET /save` 🔒

Returns the authenticated user's full save, including all related
tables (slots, upgrades, machines, patterns, glyph upgrades).

| Status | Body                                                                     |
| ------ | ------------------------------------------------------------------------ |
| 200    | full `SavePayload` (see [shared/types.ts](../shared/types.ts))           |
| 404    | `{ error: "No save found" }`                                             |

Tables are joined with `Promise.all`, so total round-trip is one DB
trip per related table in parallel.

### `PUT /save` 🔒

Upsert the authenticated user's save. Optimistically version-checked.

**Body:** `SavePayload` (see [shared/types.ts](../shared/types.ts)).
Numeric fields must be **finite, non-negative**. Array sizes are
capped (5 slots, ≤200 upgrades, ≤50 machines, ≤10 patterns, ≤100
glyph upgrades) — pathological payloads are rejected with 400.

**Behaviour:**

1. `UPDATE … WHERE user_id = $X AND save_version = $clientVersion`
   - If a row was returned → update succeeded; increment version.
2. Else, look up the existing save:
   - If a row exists → version conflict → `409 { serverVersion }`.
     The client is expected to `GET /save` and replay locally.
   - If no row → first save ever → `INSERT` with `save_version = 1`.
3. Upsert all child rows (slots, upgrades, machines, patterns, glyph
   upgrades) by composite key.

| Status | Body                                                                     |
| ------ | ------------------------------------------------------------------------ |
| 200    | `{ saveVersion: <new int> }`                                             |
| 400    | `{ error: "<field> must be a finite, non-negative number" }` …            |
| 409    | `{ error: "Save conflict", serverVersion: <int> }`                       |

### `DELETE /save` 🔒

Delete the user's save row (cascades to all child tables).

```json
{ "message": "Save deleted" }
```

---

## Leaderboard

Defined in
[server/src/routes/leaderboard.ts](../server/src/routes/leaderboard.ts).

### `GET /leaderboard`

Public — top 100 entries ordered by PP DESC, level DESC, money DESC.

```json
[
  {
    "rank": 1,
    "username": "alice",
    "factoryName": "Foo Engine",
    "prestigePoints": 320,
    "money": 5000000,
    "level": 87,
    "submittedAt": "2026-05-08T10:15:00.000Z",
    "ascensionCount": 4,
    "glyphs": 12,
    "endgameState": null
  }
]
```

### `GET /leaderboard/me` 🔒

Returns the caller's rank.

```json
{ "rank": 42, "prestigePoints": 60, "money": 1200000, "level": 30, "submittedAt": "…" }
```

`404` if the caller has never submitted a score.

### `POST /leaderboard/submit` 🔒

Take a snapshot of the user's current `game_saves` row and upsert it
into `leaderboard_entries`. Idempotent per user — repeated calls just
update the existing entry.

```json
{ "message": "Score submitted" }
```

---

## Admin 🔒 admin only

Defined in [server/src/routes/admin.ts](../server/src/routes/admin.ts).
Every admin endpoint requires both a valid JWT *and* the `is_admin`
claim.

### `GET /admin/users`

List every user (no save data attached).

### `GET /admin/users/:id`

Single user + their save row.

| Status | When                                |
| ------ | ----------------------------------- |
| 200    | found                               |
| 400    | `{ error: "Invalid user id" }`      |
| 404    | `{ error: "User not found" }`       |

### `PATCH /admin/users/:id/save`

Patch one or more save numeric fields. Each field is `optional` —
`COALESCE`d on the SQL side, so unspecified fields keep their value.

**Body** (all optional):

```json
{
  "money": 0,           "dc": 0,                 "prestige_points": 0,
  "level": 1,           "exp": 0,                "glyphs": 0,
  "pending_glyphs": 0,  "glyph_pattern_count": 0
}
```

Numbers must be **finite, non-negative**; otherwise `400`.

### `PATCH /admin/users/:id`

Promote/demote admin status.

```json
{ "isAdmin": true }
```

Self-demotion is rejected with `400` to prevent operators from
accidentally locking themselves out.
