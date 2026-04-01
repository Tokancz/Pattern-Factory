import { Router } from "express"
import { getLeaderboard, getMyRank, submitScore } from "../controllers/leaderboardController.js"
import { verifyToken } from "../middleware/auth.js"

const router = Router()

router.get ("/",      getLeaderboard)           // public
router.get ("/me",    verifyToken, getMyRank)   // protected
router.post("/submit",verifyToken, submitScore) // protected

export default router