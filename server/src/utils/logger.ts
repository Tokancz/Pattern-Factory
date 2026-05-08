// Tiny structured logger. Format: `<ISO-timestamp> [LEVEL] [scope] msg ...`.
// Anything passed in `meta` is JSON-stringified once, so logs stay grep-able
// (e.g. `grep "auth.login" server.log`). We don't pull in a 3rd-party logger
// because the server only has a handful of call sites and the goal is just
// to remove `console.error(err)` noise and make ops events scannable.

type Level = "info" | "warn" | "error" | "debug"

const LEVELS: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 }

// Drop debug logs unless LOG_LEVEL=debug. Production stays at info+.
const minLevel: number = LEVELS[(process.env.LOG_LEVEL as Level) ?? "info"] ?? LEVELS.info

function emit(level: Level, scope: string, msg: string, meta?: Record<string, unknown>): void {
  if (LEVELS[level] < minLevel) return
  const ts   = new Date().toISOString()
  const tail = meta && Object.keys(meta).length ? " " + safeStringify(meta) : ""
  const line = `${ts} [${level.toUpperCase()}] [${scope}] ${msg}${tail}`
  if (level === "error" || level === "warn") console.error(line)
  else console.log(line)
}

// Errors and circular refs would otherwise crash JSON.stringify. Strip both.
function safeStringify(meta: Record<string, unknown>): string {
  const seen = new WeakSet<object>()
  return JSON.stringify(meta, (_k, v) => {
    if (v instanceof Error) return { name: v.name, message: v.message }
    if (typeof v === "object" && v !== null) {
      if (seen.has(v)) return "[Circular]"
      seen.add(v)
    }
    return v
  })
}

export const log = {
  debug: (scope: string, msg: string, meta?: Record<string, unknown>) => emit("debug", scope, msg, meta),
  info:  (scope: string, msg: string, meta?: Record<string, unknown>) => emit("info",  scope, msg, meta),
  warn:  (scope: string, msg: string, meta?: Record<string, unknown>) => emit("warn",  scope, msg, meta),
  error: (scope: string, msg: string, meta?: Record<string, unknown>) => emit("error", scope, msg, meta),
}
