import { Router } from "express"
import { rateLimit } from "express-rate-limit"
import { register, login, verifyEmail, getMe } from "../controllers/authController.js"
import { verifyToken } from "../middleware/auth.js"
import {
  validateBody, isEmail, isPassword, isUsername, isFactoryName
} from "../middleware/validate.js"

const router = Router()

// Auth endpoints get a tighter limiter than the global 100/15min — brute
// forcing /login or /register with 100 tries per IP every 15 minutes is
// still meaningful, so 10/15min per IP is the more useful ceiling.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  ipv6Subnet: 56,
  message: { error: "Too many auth attempts, try again later" }
})

router.post("/register", authLimiter, validateBody({
  username:    isUsername,
  email:       isEmail,
  password:    isPassword,
  factoryName: isFactoryName
}), register)

router.post("/login", authLimiter, validateBody({
  email:    isEmail,
  password: isPassword
}), login)

router.get ("/verify/:token", verifyEmail)
router.get ("/me", verifyToken, getMe)

export default router
