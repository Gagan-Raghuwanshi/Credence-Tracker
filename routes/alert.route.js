import express from "express"
const router = express.Router()
import { getAlertReport } from "../controllers/alert.controller.js"
import { authenticateToken } from "../middleware/authMiddleware.js"

router.get("/", authenticateToken, getAlertReport)

export default router