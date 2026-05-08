// Tiny client logger. We intentionally keep this dead-simple: production
// builds drop debug() calls entirely, while warn/error always survive so
// real failures still land in the browser console for support.

const isProd = import.meta.env.PROD

type LogFn = (msg: string, ...rest: unknown[]) => void

export const log: { debug: LogFn; info: LogFn; warn: LogFn; error: LogFn } = {
  debug: (msg, ...rest) => { if (!isProd) console.debug(`[debug] ${msg}`, ...rest) },
  info:  (msg, ...rest) => { if (!isProd) console.info (`[info ] ${msg}`, ...rest) },
  warn:  (msg, ...rest) => console.warn(`[warn ] ${msg}`, ...rest),
  error: (msg, ...rest) => console.error(`[error] ${msg}`, ...rest)
}
