import pg from "pg"
import dotenv from "dotenv"

dotenv.config()

const { Pool } = pg

export const pool = new Pool({
  host:     process.env.DB_HOST     ?? "localhost",
  port:     Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME     ?? "pattern-factory",
  user:     process.env.DB_USER     ?? "postgres",
  password: process.env.DB_PASSWORD ?? "",
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  options: '-c search_path=pattern_factory'
})

pool.on("error", (err) => {
  console.error("Unexpected DB error", err)
  process.exit(-1)
})

export async function query<T>(
  text: string,
  params?: unknown[]
): Promise<pg.QueryResult<T>> {
  const start = Date.now()
  const res = await pool.query<T>(text, params)
  console.log(`Query executed in ${Date.now() - start}ms`)
  return res
}