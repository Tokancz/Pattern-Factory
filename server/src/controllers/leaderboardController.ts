import { Request, Response } from "express"
import { query } from "../db.js"
import { log }   from "../utils/logger.js"
import { AuthRequest } from "../middleware/auth.js"

export async function getLeaderboard(_req: Request, res: Response): Promise<void> {
  try {
    const result = await query<{
      rank: number; username: string; factory_name: string
      prestige_points: number; money: number; level: number; submitted_at: string
      ascension_count: number; glyphs: number; endgame_state: string | null
    }>(
      `SELECT
        RANK() OVER (ORDER BY le.prestige_points DESC, le.level DESC, le.money DESC) AS rank,
        u.username,
        le.factory_name    AS "factoryName",
        le.prestige_points AS "prestigePoints",
        le.money,
        le.level,
        le.submitted_at    AS "submittedAt",
        gs.ascension_count AS "ascensionCount",
        gs.glyphs,
        gs.endgame_state   AS "endgameState"
       FROM leaderboard_entries le
       JOIN users u ON u.id = le.user_id
       LEFT JOIN game_saves gs ON gs.user_id = le.user_id
       ORDER BY le.prestige_points DESC
       LIMIT 100`
    )

    res.json(result.rows)
  } catch (err) {
    log.error("leaderboard.get", "fetch failed", { err })
    res.status(500).json({ error: "Failed to fetch leaderboard" })
  }
}

export async function getMyRank(req: AuthRequest, res: Response): Promise<void> {
  try {
    const result = await query<{
      rank: number; prestige_points: number; money: number
      level: number; submitted_at: string
    }>(
      `SELECT rank, prestige_points, money, level, submitted_at FROM (
         SELECT
           le.*,
           RANK() OVER (ORDER BY prestige_points DESC, level DESC, money DESC) AS rank
         FROM leaderboard_entries le
       ) ranked
       WHERE user_id = $1
       ORDER BY rank
       LIMIT 1`,
      [req.userId]
    )

    if (result.rows.length === 0) {
      res.status(404).json({ error: "No leaderboard entry found" })
      return
    }

    res.json(result.rows[0])
  } catch (err) {
    log.error("leaderboard.me", "fetch failed", { err, userId: req.userId })
    res.status(500).json({ error: "Failed to fetch rank" })
  }
}

export async function submitScore(req: AuthRequest, res: Response): Promise<void> {
  try {
    const saveResult = await query<{
      prestige_points: number; money: number; level: number
    }>(
      "SELECT prestige_points, money, level FROM game_saves WHERE user_id = $1",
      [req.userId]
    )

    if (saveResult.rows.length === 0) {
      res.status(404).json({ error: "No save found" })
      return
    }

    const { prestige_points, money, level } = saveResult.rows[0]

    const userResult = await query<{ factory_name: string }>(
      "SELECT factory_name FROM users WHERE id = $1",
      [req.userId]
    )
    const factoryName = userResult.rows[0].factory_name

    await query(
      `INSERT INTO leaderboard_entries
        (user_id, factory_name, prestige_points, money, level)
      VALUES ($1,$2,$3,$4,$5)
      ON CONFLICT (user_id)
      DO UPDATE SET
        factory_name    = EXCLUDED.factory_name,
        prestige_points = EXCLUDED.prestige_points,
        money           = EXCLUDED.money,
        level           = EXCLUDED.level,
        submitted_at    = NOW()`,
      [req.userId, factoryName, prestige_points, money, level]
    )

    log.info("leaderboard.submit", "score submitted", {
      userId: req.userId, prestigePoints: prestige_points, level
    })
    res.status(201).json({ message: "Score submitted" })
  } catch (err) {
    log.error("leaderboard.submit", "submit failed", { err, userId: req.userId })
    res.status(500).json({ error: "Failed to submit score" })
  }
}
