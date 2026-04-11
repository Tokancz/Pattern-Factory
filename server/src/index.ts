import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { errorHandler } from "./middleware/errorHandler.js"
import authRoutes        from "./routes/auth.js"
import saveRoutes        from "./routes/save.js"
import leaderboardRoutes from "./routes/leaderboard.js"

dotenv.config()

const app  = express()
const PORT = process.env.PORT ?? 3001

app.use(cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:5173", credentials: true }))
app.use(express.json())

app.use("/api/auth",        authRoutes)
app.use("/api/save",        saveRoutes)
app.use("/api/leaderboard", leaderboardRoutes)

app.get("/api/health", (_req, res) => res.json({ status: "ok" }))

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})