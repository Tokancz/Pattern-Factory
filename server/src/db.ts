import pg from "pg"
import dotenv from "dotenv"
import type { QueryResultRow } from "pg"
import { log } from "./utils/logger.js"

dotenv.config()

const { Pool } = pg

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

// A pool-level error means the client lost the DB connection. Log it loudly,
// then exit so the orchestrator (PM2 / systemd / Docker) restarts the
// process cleanly instead of leaving a half-broken server up.
pool.on("error", (err) => {
  log.error("db.pool", "lost connection", { err })
  process.exit(-1)
})

// Anything slower than this gets logged for ops visibility. Faster queries
// stay silent so logs aren't drowned out at steady state.
const SLOW_QUERY_MS = 200

export async function query<T extends QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<pg.QueryResult<T>> {
  const start = Date.now()
  try {
    const res = await pool.query<T>(text, params)
    const ms = Date.now() - start
    if (ms >= SLOW_QUERY_MS) {
      // Statement is included so the offender is identifiable, but trimmed
      // to keep one slow query from blowing up the log line.
      log.warn("db.query", "slow query", { ms, sql: text.slice(0, 120).replace(/\s+/g, " ") })
    }
    return res
  } catch (err) {
    log.error("db.query", "query failed", { err, sql: text.slice(0, 120).replace(/\s+/g, " ") })
    throw err
  }
}
