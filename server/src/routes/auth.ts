import { Router } from "express"
import { register, login, verifyEmail, getMe } from "../controllers/authController.js"
import { verifyToken } from "../middleware/auth.js"
import { validateBody } from "../middleware/validate.js"

const router = Router()

router.post("/register", validateBody(["username","email","password","factoryName"]), register)
router.post("/login",    validateBody(["email","password"]), login)
router.get ("/verify/:token", verifyEmail)
router.get ("/me", verifyToken, getMe)

export default router