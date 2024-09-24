import express from "express";
import dotenv from "dotenv";
dotenv.config();
import { authenticateToken } from "../middleware/authMiddleware.js";
import { getAllGeofences, getGeofenceById, isCrossed, addGeofence, deleteGeofence, updateGeofence } from "../controllers/geofence.controller.js";

const router = express.Router();


router.post("/add-geofence", authenticateToken, addGeofence);

router.get("/get-all-geofences", authenticateToken, getAllGeofences);

router.get("/get-geofence-by-id", authenticateToken, getGeofenceById);

router.put("/isCrossed", authenticateToken, isCrossed);

router.put("/update-geofence/:id", authenticateToken, updateGeofence);

router.delete("/delete-geofence/:id", authenticateToken, deleteGeofence);

export default router;
