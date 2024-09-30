import express from "express";
import dotenv from "dotenv";
dotenv.config();
import { authenticateToken } from "../middleware/authMiddleware.js";
import { getGeofences, isCrossed, addGeofence, deleteGeofence, updateGeofence } from "../controllers/geofence.controller.js";

const router = express.Router();


router.post("/", authenticateToken, addGeofence);

router.get("/", authenticateToken, getGeofences);

// router.get("/:id", authenticateToken, getGeofenceById);

router.put("/isCrossed", authenticateToken, isCrossed);

router.put("/:id", authenticateToken, updateGeofence);

router.delete("/:id", authenticateToken, deleteGeofence);

export default router;
