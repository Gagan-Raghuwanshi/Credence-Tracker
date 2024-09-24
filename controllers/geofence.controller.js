import Geofence from "../models/geofence.model.js";

export const getAllGeofences = async (req, res) => {
    try {
        // Get page and limit from query parameters, with default values
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        // Calculate the starting index for the documents
        const skip = (page - 1) * limit;

        // Get total number of geofences for pagination info
        const totalGeofences = await Geofence.countDocuments({});

        // Fetch the geofencing data with pagination
        const geofenceData = await Geofence.find({})
            .skip(skip)
            .limit(limit);

        // If no data found
        if (!geofenceData || geofenceData.length === 0) {
            return res.status(404).json({ message: "No geofencing data found" });
        }

        // Restructure the response to have deviceId on top with nested geofencing data
        const response = {
            geofences: geofenceData.map((data) => ({
                _id: data._id,
                name: data.name,
                area: data.area,
                isCrossed: data.isCrossed,
            })),
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalGeofences / limit),
                totalGeofences,
            },
        };

        // Send the response with pagination info
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

export const getGeofenceById = async (req, res) => {
    try {
        const deviceId = req.body;
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

export const addGeofence = async (req, res) => {
    try {
        const { name, area, deviceId, createdBy } = req.body;
        if (!name || !area || !deviceId) {
            return res.status(400).json({ error: "Name, area, and device ID are required" });
        }
        const newGeofence = new Geofence({
            name,
            area,
            deviceId,
            createdBy
        });
        const savedGeofence = await newGeofence.save();
        res.status(201).json({ message: "Geofence created successfully", geofence: savedGeofence });
    } catch (error) {
        console.error("Error creating geofencing area:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const deleteGeofence = async (req, res) => {
    try {
        const { id } = req.params;

        // Find and delete the geofencing area by ID
        const deletedGeofence = await Geofence.findByIdAndDelete(id);

        if (!deletedGeofence) {
            return res.status(404).json({ error: "Geofence not found" });
        }

        res.status(200).json({ message: "Geofence deleted successfully" });
    } catch (error) {
        console.error("Error deleting geofence:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const updateGeofence = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, area, deviceId, createdBy } = req.body;

        const updatedGeofence = await Geofence.findByIdAndUpdate(id, { name, area, deviceId, createdBy }, { new: true });

        if (!updatedGeofence) {
            return res.status(404).json({ error: "Geofence not found" });
        }

        res.status(200).json({ message: "Geofence updated successfully", geofence: updatedGeofence });
    } catch (error) {
        console.error("Error updating geofence:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}
