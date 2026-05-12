import express from "express"
import cors from "cors"
import { rateLimit } from "express-rate-limit"
import { config }     from "./config.js"
import { log }        from "./utils/logger.js"
import { errorHandler } from "./middleware/errorHandler.js"
import authRoutes        from "./routes/auth.js"
import saveRoutes        from "./routes/save.js"
import leaderboardRoutes from "./routes/leaderboard.js"
import adminRoutes       from "./routes/admin.js"

// Global limiter — broad protection against runaway clients. Tighter
// per-route limiters live alongside their routes (see routes/auth.ts).
// Ceiling is sized for the 5s autosave (~180/15min) plus reads, refreshes,
// and navigation, with headroom — anything above this is pathological.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: "draft-8",
  legacyHeaders:   false,
  ipv6Subnet: 56
})

const app = express()

app.use(cors({ origin: config.frontendOrigin, credentials: true }))
app.use(express.json({ limit: "256kb" })) // saves stay well under this; cap defends against payload-bomb DoS
app.use(globalLimiter)

app.use("/auth",        authRoutes)
app.use("/save",        saveRoutes)
app.use("/leaderboard", leaderboardRoutes)
app.use("/admin",       adminRoutes)

app.get("/health", (_req, res) => res.json({ status: "ok" }))

app.use(errorHandler)

app.listen(config.port, () => {
  log.info("server", "listening", { port: config.port, env: config.isProd ? "production" : "development" })
})
