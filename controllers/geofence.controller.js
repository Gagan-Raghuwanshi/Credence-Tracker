import Geofence from "../models/geofence.model.js";

export const getGeofences = async (req, res) => {
    try {
        // Get page and limit from query parameters, with default values
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        // Calculate the starting index for the documents
        const skip = (page - 1) * limit;

        const role = req.user.role;

        // Fetch the drivers with pagination
        let geofences;

        if (role === 'superadmin') {
            geofences = await Geofence.find()
                .skip(skip)
                .limit(limit);
        } else if (role === 'user') {
            geofences = await Geofence.find({ createdBy: req.user.id })
                .skip(skip)
                .limit(limit);
        } else {
            return res.status(403).json({ message: 'Forbidden: Invalid role' });
        }
        geofences = geofences.reverse();
        const totalGeofences = role === 'superadmin'
            ? await Geofence.countDocuments()
            : await Geofence.countDocuments({ createdBy: req.user.id });


        // If no data found
        if (!geofences || geofences.length === 0) {
            return res.status(404).json({ message: "No geofencing data found" });
        }

        // Restructure the response to have deviceId on top with nested geofencing data
        const response = {
            geofences: geofences.map((data) => ({
                _id: data._id,
                name: data.name,
                area: data.area,
                isCrossed: data.isCrossed,
                createdBy: data.createdBy,
                type: data.type,
                geofenceCode: data.geofenceCode,
                transitTime: data.transitTime,
                assignType: data.assignType,
                vehicleIds: data.vehicleIds,
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
        const {
            name,
            type,
            geofenceCode,
            transitTime,
            assignType,
            vehicleIds,
            area
        } = req.body;

        const createdBy = req.user.id;

        // Validation
        if (!name || !type || !assignType) {
            return res.status(400).json({ message: 'Name, Type, and Assign Type are required.' });
        }

        if (assignType === 'vehicle' && (!vehicleIds || vehicleIds.length === 0)) {
            return res.status(400).json({ message: 'Please select at least one vehicle.' });
        }

        // Create the geofence object
        const geofence = new Geofence({
            name,
            type,
            geofenceCode,
            transitTime,
            area,
            assignType,
            vehicleIds,
            createdBy,
        });

        // Save the geofence to the database
        await geofence.save();

        return res.status(201).json({
            message: 'Geofence created successfully',
            geofence
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
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
        const {
            name,
            type,
            geofenceCode,
            transitTime,
            assignType,
            vehicleIds,
            area
        } = req.body;

        // Find the geofence by ID
        const geofence = await Geofence.findById(id);

        if (!geofence) {
            return res.status(404).json({ message: 'Geofence not found' });
        }

        if (assignType === 'vehicle' && (!vehicleIds || vehicleIds.length === 0)) {
            return res.status(400).json({ message: 'Please select at least one vehicle.' });
        }

        // Update the geofence fields
        geofence.name = name || geofence.name;
        geofence.type = type || geofence.type;
        geofence.geofenceCode = geofenceCode || geofence.geofenceCode;
        geofence.transitTime = transitTime || geofence.transitTime;
        geofence.assignType = assignType || geofence.assignType;
        geofence.vehicleIds = vehicleIds || geofence.vehicleIds;
        geofence.area = area || geofence.area;

        // Save the updated geofence
        await geofence.save();

        return res.status(200).json({
            message: 'Geofence updated successfully',
            geofence
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};
