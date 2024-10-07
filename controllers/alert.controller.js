import axios from "axios";
import Alert from "../models/alert.model.js";

export const getAlertsByDeviceIds = async (req, res) => {
    const deviceIds = req.query.deviceIds ? req.query.deviceIds.split(',') : []; // Expecting deviceIds to be sent as a comma-separated string in the query parameters
    const alertTypes = req.query.types ? req.query.types.split(',') : []; // Expecting multiple alert types to be sent as a comma-separated string in the query parameters
    const page = parseInt(req.query.page) || 1; // Get the page number from query parameters, default to 1
    const limit = parseInt(req.query.limit) || 10; // Get the limit from query parameters, default to 10
    const skip = (page - 1) * limit; // Calculate the number of documents to skip

    if (!deviceIds || !Array.isArray(deviceIds)) {
        return res.status(400).json({ message: 'Invalid input. Please provide an array of deviceIds.' });
    }

    try {
        const query = { deviceId: { $in: deviceIds } };
        if (alertTypes.length > 0) {
            query.type = { $in: alertTypes }; // Filter alerts based on multiple types if provided
        }
        const alerts = await Alert.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit); // Fetch alerts with pagination
        const totalAlerts = await Alert.countDocuments(query); // Get total number of alerts for pagination
        const totalPages = Math.ceil(totalAlerts / limit); // Calculate total pages

        return res.status(200).json({
            totalAlerts,
            totalPages,
            currentPage: page,
            alerts
        });
    } catch (error) {
        console.error('Error fetching alerts:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}