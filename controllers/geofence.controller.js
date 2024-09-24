import express from "express";
import Geofence from "../models/geofence.model.js";

export const getGeofence = async (req, res) => {
    try {
        const deviceId = req.query.deviceId;
        const geofenceData = await Geofence.find({ deviceId });

        if (!geofenceData || geofenceData.length === 0) {
            return res
                .status(404)
                .json({ message: "No geofencing data found for this deviceId" });
        }

        // Restructure the response to have deviceId on top with nested geofencing data
        const response = {
            deviceId: deviceId,
            geofences: geofenceData.map((data) => ({
                _id: data._id,
                name: data.name,
                area: data.area,
                isCrossed: data.isCrossed,
            })),
        };

        res.json(response);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

export const isCrossed = async (req, res) => {
    try {
        const deviceId = req.query.deviceId;
        const { isCrossed } = req.body;

        if (!deviceId) {
            return res
                .status(400)
                .json({ message: "deviceId query parameter is required" });
        }

        if (typeof isCrossed !== "boolean") {
            return res
                .status(400)
                .json({ message: "isCrossed must be a boolean value" });
        }

        const updatedGeofence = await Geofence.findOneAndUpdate(
            { deviceId },
            { isCrossed },
            { new: true }
        );

        if (!updatedGeofence) {
            return res
                .status(404)
                .json({ message: "No geofencing data found for this deviceId" });
        }

        res.json({
            message: "isCrossed field updated successfully",
            data: updatedGeofence,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}
