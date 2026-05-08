# Security Model

This document describes the security posture of Pattern Factory:
threats considered, defences in place, and known trade-offs.

---

## 1. Threat model

The product is a multiplayer-leaderboard idle game. Realistic
adversaries include:

- **Unauthenticated visitors** crawling the public API.
- **Authenticated players** trying to corrupt their own save (or other
  players') via crafted requests.
- **Malicious admins** — out of scope; admin access is fully trusted.
- **Internet-wide scanners** trying to brute-force credentials.

Because the game is single-player and progression is client-side
(idle-game economics with no PvP), **the client is authoritative for
its own save**. Cheating one's own progression is possible by design;
the leaderboard is a community ranking, not a competitive one.

---

## 2. SQL injection

**Status: not exploitable.** Every database call goes through
[server/src/db.ts → query()](../server/src/db.ts) which wraps
`pg.Pool.query(text, params)`. SQL is always passed as a literal
template; user input always goes through `$1, $2, …` placeholders.

There is **no string concatenation** anywhere in the controllers, no
dynamic table/column names from user input, and no raw query builder.

Verification:

```sh
grep -rn "query(" server/src --include='*.ts'
```

Every match passes a static SQL string and (if any) a parameter array.

---

## 3. Cross-site scripting (XSS)

**Status: not exploitable in practice.** The client is Vue 3 with
template interpolation `{{ }}`, which auto-escapes. The codebase
contains:

- **Zero** `v-html` directives.
- **Zero** `innerHTML` / `outerHTML` assignments.
- **Zero** `eval` or `new Function(...)` calls.

User-supplied strings (`username`, `factoryName`) are only ever
rendered via interpolation — see e.g. [Leaderboard.vue:50](../src/views/Leaderboard.vue#L50)
or [AdminView.vue:39](../src/views/AdminView.vue#L39). Even if the DB
contained an injection payload, the browser would render it as text.

Defence in depth: the **username** validator
([server/src/middleware/validate.ts](../server/src/middleware/validate.ts))
restricts usernames to ASCII letters/digits/`_`/`-` (3–15 chars), and
**factoryName** rejects whitespace and control chars. This blocks
unicode-lookalike attacks against the leaderboard display.

---

## 4. Authentication & sessions

### Password storage

Bcrypt with cost factor **12** (~250 ms hash). Plaintext passwords
never persist. See [authController.register](../server/src/controllers/authController.ts).

### Token issuance

JWT, HS256, 7-day expiry. Payload: `{ userId, username, isAdmin }`.

The signing/verification key is loaded **once** at startup via
[server/src/config.ts](../server/src/config.ts):

- **Production** (`NODE_ENV=production`): `JWT_SECRET` must be set and
  ≥ 16 chars. The server **hard-fails at startup** otherwise. (Pre-audit
  the code silently fell back to the literal string `"fallback_secret"`,
  which would have allowed trivial token forgery in any deployment that
  forgot to set the env var. That fallback has been removed.)
- **Development**: a warning is logged and a random 32-byte hex secret
  is generated for the process — old tokens become invalid on each
  restart.

### Token transport

The client stores the JWT in `localStorage` and sends it in
`Authorization: Bearer <jwt>`. Trade-off: localStorage is XSS-readable
in principle, but since the app contains no XSS sink and Vue
auto-escapes, the practical risk is low. Moving to an HttpOnly
cookie + CSRF token is a possible future hardening — not done because
it materially complicates the session bootstrap for marginal gain
given the no-XSS posture above.

### Brute force

- Auth endpoints (`/auth/login`, `/auth/register`) are rate-limited at
  **10 / 15 min per IP**. Anything else is at **100 / 15 min per IP**.
- Login uses a **constant-message** failure mode ("Invalid
  credentials") whether the email is unknown or the password is wrong
  — no email enumeration via timing or message content.

---

## 5. Authorisation

- **Save endpoints** are scoped to the caller via `WHERE user_id = $1`
  with the userId taken from the JWT, never from the URL or body. A
  user can never load or write someone else's save.
- **Admin endpoints** are gated by both `verifyToken` and
  `requireAdmin`. The admin status comes from the **JWT claim**, not a
  per-request DB lookup, so a freshly-revoked admin keeps admin access
  until their token expires (≤ 7 days). This is a deliberate
  performance trade-off — short-cycle revocation is not a requirement
  here.
- **Self-demotion** is blocked: an admin cannot patch their own
  `isAdmin: false` and lock themselves out of the panel.

---

## 6. Input validation

[server/src/middleware/validate.ts](../server/src/middleware/validate.ts)
provides reusable rules wired into routes via `validateBody({...})`.
Anything that fails returns **400** with a specific error.

| Field         | Rule                                                |
| ------------- | --------------------------------------------------- |
| `username`    | 3–15 chars, `^[A-Za-z0-9_-]+$`                       |
| `email`       | RFC-ish regex, ≤ 255 chars                          |
| `password`    | 8–128 chars                                         |
| `factoryName` | 1–15 chars, no whitespace/control                    |
| `*` numerics  | `Number.isFinite()`, ≥ 0 (rejects NaN, Infinity)    |

### Save payload validation

`PUT /save` runs `validateSavePayload()`
([saveController.ts](../server/src/controllers/saveController.ts))
which:

- Rejects any of `money / dc / prestigePoints / pendingPrestigePoints /
  level / exp / unlockedSlots / lastPlayed / saveVersion / glyphs /
  pendingGlyphs / ascensionCount / glyphPatternCount` if not finite or
  if negative.
- Caps array sizes (5 slots, ≤ 200 upgrades, ≤ 50 machines, ≤ 10
  patterns, ≤ 100 glyph upgrades) so a hostile client can't OOM the
  server with a giant payload.

### Admin patch validation

`PATCH /admin/users/:id/save` runs the same finite-non-negative check
on every numeric field; `:id` is parsed and required to be a positive
integer. `PATCH /admin/users/:id` requires `isAdmin: boolean` —
truthy strings/numbers don't sneak through.

---

## 7. Persisted secrets / sensitive data

| Datum                        | Storage                              | Lifetime              |
| ---------------------------- | ------------------------------------ | --------------------- |
| Password                     | bcrypt(cost 12) in `users.password_hash` | until account delete |
| JWT                          | client `localStorage`                | 7 days from issue     |
| Email-verification token     | `email_verification_tokens.token`    | 24h, deleted on use   |

**Email-verification tokens** are currently logged in development only
(`config.isProd` is false → debug-level log line). In production they
are never logged. This is a stopgap until nodemailer is wired up — at
that point the token only lives in the DB and the email body. Audit
log: pre-audit the token + email were `console.log`'d on every
registration regardless of environment, leaking the verification link
into deployment logs. That has been moved behind the dev-only branch.

---

## 8. CORS / CSRF

- CORS is configured for a **single allowlisted origin** (`FRONTEND_URL`),
  with `credentials: true`. There is no wildcard.
- CSRF is **not applicable**: the API is auth'd via Bearer tokens in the
  `Authorization` header, which browsers do not attach automatically
  to cross-origin requests.

---

## 9. DoS / abuse surface

| Vector                 | Mitigation                                                         |
| ---------------------- | ------------------------------------------------------------------ |
| Mass auth attempts     | per-IP rate limit 10 / 15 min on `/auth/*`                         |
| API flood              | per-IP global rate limit 100 / 15 min                              |
| Payload bomb           | `express.json({ limit: "256kb" })` + array size caps in save validator |
| Slow query exhaustion  | DB queries ≥ 200 ms log a warn line for ops visibility             |
| DB connection drop     | pool error handler logs and exits so the orchestrator restarts    |

---

## 10. Logging & monitoring

Server logs are structured one-liners
(see [ARCHITECTURE.md → Logging](./ARCHITECTURE.md#logging)). Useful
events emitted at `info`:

- `[server] listening`               — startup
- `[auth.register] user registered`  — every account creation
- `[auth.login] user logged in`      — every successful login
- `[auth.login] failed: …`           — every failed login (timing-safe)
- `[save.upsert] version conflict`   — multi-tab / multi-device drift
- `[save.delete] save deleted`       — account-cleanup signal
- `[leaderboard.submit] score submitted`
- `[admin.patchSave] save patched`   — adminId + targetId trail

`error` logs always include the failing route and (where available)
the userId. The DB layer logs slow queries (≥ 200 ms) with a 120-char
SQL prefix.

---

## 11. Audit trail (this round)

Pre-audit issues found and fixed in commit history:

| # | Issue                                                                         | Fix                                                                  |
| - | ----------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 1 | `JWT_SECRET ?? "fallback_secret"` allowed forgeable tokens if env was unset    | Centralised secret loader in `config.ts`; hard-fail in production    |
| 2 | Email verification token `console.log`'d on every registration                | Dev-only debug log; never logged in production                       |
| 3 | No password / username / email format validation                              | New rule-based validator in `middleware/validate.ts`                 |
| 4 | No login/register-specific rate limit (only the global 100 / 15 min)          | Added per-route limiter at 10 / 15 min                               |
| 5 | `patchUserSave` admin endpoint accepted NaN / Infinity / negative numbers     | Per-field finite-non-negative check; rejects with 400                |
| 6 | `upsertSave` accepted same                                                    | Whole-payload validator runs before DB writes                        |
| 7 | Per-query `console.log` flooded server output                                 | Replaced with a 200 ms slow-query threshold                          |
| 8 | `console.error(err)` everywhere with no context                               | Structured logger emits ISO timestamp, level, scope, JSON metadata   |
| 9 | `as any[]` casts in client `save.ts` hid load shape                           | Typed `ServerSave` interface mirroring snake_case server rows        |
| 10| `express.json()` had no body-size limit                                        | Capped at 256 KB                                                     |

What was already solid before this audit:

- Parameterised SQL throughout (no injection risk).
- Vue auto-escaping + no `v-html` (no XSS risk).
- Bcrypt cost 12 for passwords.
- Optimistic concurrency (`save_version`) on every save write.
- FK cascade-on-delete for clean account removal.
- Global rate limiter mounted before any route.
