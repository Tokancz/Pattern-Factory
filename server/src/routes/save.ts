import { Router } from "express"
import { getSave, upsertSave, deleteSave } from "../controllers/saveController.js"
import { verifyToken } from "../middleware/auth.js"

const router = Router()

router.use(verifyToken) // all save routes require auth

router.get   ("/", getSave)
router.put   ("/", upsertSave)
router.delete("/", deleteSave)

export default router