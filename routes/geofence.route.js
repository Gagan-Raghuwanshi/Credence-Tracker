import express from "express";
import Geofencing from "../models/geofence.model.js";
import dotenv from "dotenv";
dotenv.config();
import { authenticateToken } from "../middleware/authMiddleware.js";
import { getGeofence, isCrossed } from "../controllers/geofence.controller.js";

const router = express.Router();

// GET route to retrieve geofencing data by deviceId
router.get("/get-geofence", authenticateToken, getGeofence);

router.put("/isCrossed", authenticateToken, isCrossed);


export default router;
