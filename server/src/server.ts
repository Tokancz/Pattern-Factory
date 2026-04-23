import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { errorHandler } from "./middleware/errorHandler.js"
import authRoutes        from "./routes/auth.js"
import saveRoutes        from "./routes/save.js"
import leaderboardRoutes from "./routes/leaderboard.js"
import adminRoutes       from "./routes/admin.js"
import { rateLimit } from 'express-rate-limit'

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 100,
	standardHeaders: 'draft-8',
	legacyHeaders: false,
	ipv6Subnet: 56
})


dotenv.config()

const app  = express()
const PORT = process.env.PORT ?? 3001

app.use(cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:5173", credentials: true }))
app.use(express.json())
app.use(limiter)

app.use("/auth",        authRoutes)
app.use("/save",        saveRoutes)
app.use("/leaderboard", leaderboardRoutes)
app.use("/admin",       adminRoutes)

app.get("/health", (_req, res) => res.json({ status: "ok" }))

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})