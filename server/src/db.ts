import pg from "pg"
import dotenv from "dotenv"
import type { QueryResultRow } from "pg"

dotenv.config()

const { Pool } = pg

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

pool.on("error", (err) => {
  console.error("Unexpected DB error", err)
  process.exit(-1)
})

export async function query<T extends QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<pg.QueryResult<T>> {
  const start = Date.now()
  const res = await pool.query<T>(text, params)
  console.log(`Query executed in ${Date.now() - start}ms`)
  return res
}