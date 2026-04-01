# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).

# Pattern Factory API Documentation

## Base URL
http://localhost:3001/api


## Authentication
Protected routes require a **Bearer token** in the `Authorization` header:

Authorization: Bearer <your_token>


---

## 🔐 Auth

| Method | Endpoint              | Auth | Body                                              | Description                                      |
|--------|----------------------|------|---------------------------------------------------|--------------------------------------------------|
| POST   | /auth/register       | ✗    | `{ username, email, password, factoryName }`      | Register new user, creates default save          |
| POST   | /auth/login          | ✗    | `{ email, password }`                             | Login, returns JWT                               |
| GET    | /auth/verify/:token  | ✗    | —                                                 | Verify email address                             |
| GET    | /auth/me             | ✓    | —                                                 | Get current user info                            |

---

## 💾 Save

| Method | Endpoint   | Auth | Body         | Description                                 |
|--------|------------|------|--------------|---------------------------------------------|
| GET    | /save      | ✓    | —            | Load full save (all sub-entities)            |
| PUT    | /save      | ✓    | `SavePayload`| Overwrite full save (autosave target)        |
| DELETE | /save      | ✓    | —            | Delete save (prestige reset)                 |

---

## 🏆 Leaderboard

| Method | Endpoint               | Auth | Body | Description                         |
|--------|------------------------|------|------|-------------------------------------|
| GET    | /leaderboard           | ✗    | —    | Top 100 entries with rank           |
| GET    | /leaderboard/me        | ✓    | —    | Current user's best rank            |
| POST   | /leaderboard/submit    | ✓    | —    | Submit current save as score        |

---

## ❤️ Health

| Method | Endpoint  | Auth | Description           |
|--------|----------|------|-----------------------|
| GET    | /health  | ✗    | Server health check   |

---

## 📌 Notes

- All protected endpoints require a valid JWT token.
- Save data is handled as a single object (`SavePayload`).
- Leaderboard submission typically uses the current save state.
- `/health` can be used for uptime monitoring.

---