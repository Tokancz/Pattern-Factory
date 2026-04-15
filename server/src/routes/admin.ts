import { Router } from "express"
import { verifyToken, requireAdmin } from "../middleware/auth.js"
import { listUsers, getUser, patchUserSave, patchUser } from "../controllers/adminController.js"

const router = Router()

router.use(verifyToken, requireAdmin)

router.get  ("/users",          listUsers)
router.get  ("/users/:id",      getUser)
router.patch("/users/:id",      patchUser)
router.patch("/users/:id/save", patchUserSave)

export default router
