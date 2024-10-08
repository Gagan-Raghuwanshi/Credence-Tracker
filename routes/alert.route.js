import express from "express"
const router = express.Router()
import { getAlertsByDeviceIds } from "../controllers/alert.controller.js"
import { authenticateToken } from "../middleware/authMiddleware.js"

router.get("/", authenticateToken, getAlertsByDeviceIds)

export default router