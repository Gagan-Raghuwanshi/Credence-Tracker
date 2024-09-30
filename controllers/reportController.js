import { History } from "../models/history.model.js"
import moment from 'moment';


export const getDeviceReport = async (req, res) => {
    try {
        const { deviceId, period } = req.body;

        let from;
        let to = new Date(); // Default to current date for 'to'

        // Define 'from' and 'to' based on the selected period
        switch (period) {
            case "Today":
                from = new Date();
                from.setHours(0, 0, 0, 0); // Start of today
                break;
            case "Yesterday":
                from = new Date();
                from.setDate(from.getDate() - 1); // Yesterday's date
                from.setHours(0, 0, 0, 0); // Start of yesterday
                to.setHours(0, 0, 0, 0); // End of yesterday
                break;
            case "This Week":
                from = new Date();
                from.setDate(from.getDate() - from.getDay()); // Set to start of the week (Sunday)
                from.setHours(0, 0, 0, 0);
                break;
            case "Previous Week":
                from = new Date();
                const dayOfWeek = from.getDay();
                from.setDate(from.getDate() - dayOfWeek - 7); // Start of the previous week
                from.setHours(0, 0, 0, 0);
                to.setDate(from.getDate() + 6); // End of the previous week
                to.setHours(23, 59, 59, 999);
                break;
            case "This Month":
                from = new Date();
                from.setDate(1); // Start of the month
                from.setHours(0, 0, 0, 0);
                break;
            case "Previous Month":
                from = new Date();
                from.setMonth(from.getMonth() - 1); // Previous month
                from.setDate(1); // Start of the previous month
                from.setHours(0, 0, 0, 0);
                to = new Date(from.getFullYear(), from.getMonth() + 1, 0); // End of the previous month
                to.setHours(23, 59, 59, 999);
                break;
            case "Custom":
                from = req.body.from; // For custom, you should pass the dates from the request
                to = req.body.to;
                break;
            default:
                return res.status(400).json({
                    message: "Invalid period selection",
                    success: false
                });
        }

        const formattedFromDateStr = from.toISOString(); // '2024-09-24T00:41:17.000+00:00'
        const formattedToDateStr = to.toISOString(); // '2024-09-24T00:41:17.000+00:00'

        const historyData = await History.find({
            deviceId,
            deviceTime: {
                $gte: formattedFromDateStr,
                $lte: formattedToDateStr,
            },
        });

        const typesOnly = historyData.map(item => {
            let type = "";

            // Ignition On/Off
            if (item.ignition) {
                type = "Ignition On";
            } else if (!item.ignition) {
                type = "Ignition Off";
            } else if (!item.ignition && item.speed === 0) {
                type = "Device Stopped";
            }

            // Device Moving (speed greater than 0)
            if (item.speed > 0) {
                type = "Device Moving";
            }

            return {
                type,
                fixTime: item.deviceTime
            };
        });

        res.status(200).json({
            message: "Alert report fetched successfully",
            success: true,
            deviceId,
            data: typesOnly
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Error fetching alert report",
            success: false,
            error: error.message
        });
    }
};

export const getCustomReport = async (req, res) => {
    try {
        const { deviceId, period } = req.body;
        let from;
        let to = new Date(); // Default to current date for 'to'

        // Define 'from' and 'to' based on the selected period
        switch (period) {
            case "Today":
                from = new Date();
                from.setHours(0, 0, 0, 0); // Start of today
                break;
            case "Yesterday":
                from = new Date();
                from.setDate(from.getDate() - 1); // Yesterday's date
                from.setHours(0, 0, 0, 0); // Start of yesterday
                to.setHours(0, 0, 0, 0); // End of yesterday
                break;
            case "This Week":
                from = new Date();
                from.setDate(from.getDate() - from.getDay()); // Set to start of the week (Sunday)
                from.setHours(0, 0, 0, 0);
                break;
            case "Previous Week":
                from = new Date();
                const dayOfWeek = from.getDay();
                from.setDate(from.getDate() - dayOfWeek - 7); // Start of the previous week
                from.setHours(0, 0, 0, 0);
                to.setDate(from.getDate() + 6); // End of the previous week
                to.setHours(23, 59, 59, 999);
                break;
            case "This Month":
                from = new Date();
                from.setDate(1); // Start of the month
                from.setHours(0, 0, 0, 0);
                break;
            case "Previous Month":
                from = new Date();
                from.setMonth(from.getMonth() - 1); // Previous month
                from.setDate(1); // Start of the previous month
                from.setHours(0, 0, 0, 0);
                to = new Date(from.getFullYear(), from.getMonth() + 1, 0); // End of the previous month
                to.setHours(23, 59, 59, 999);
                break;
            case "Custom":
                from = req.body.from; // For custom, you should pass the dates from the request
                to = req.body.to;
                break;
            default:
                return res.status(400).json({
                    message: "Invalid period selection",
                    success: false
                });
        }

        const formattedFromDateStr = from.toISOString(); // '2024-09-24T00:41:17.000+00:00'
        const formattedToDateStr = to.toISOString(); // '2024-09-24T00:41:17.000+00:00'

        const historyData = await History.find({
            deviceId,
            deviceTime: {
                $gte: formattedFromDateStr,
                $lte: formattedToDateStr,
            },
        });

        if (!deviceId) {
            return res.status(400).json({
                message: "Device ID is required",
                success: false
            });
        }

        if (!historyData.length) {
            return res.status(404).json({
                message: `No ${period}'s history found for the given device IDs`,
                success: false
            });
        }

        res.status(200).json({
            message: "Device report fetched successfully",
            success: true,
            deviceId,
            data: historyData
        });
    } catch (error) {
        console.error("Error fetching device report:", error);
        res.status(500).json({
            message: "Error fetching device report",
            success: false,
            error: error.message
        });
    }
};

export const getSummaryReport = async (req, res) => {
    try {
        const { deviceIds, period } = req.body;
        let from;
        let to = new Date(); // Default to current date for 'to'

        // Define 'from' and 'to' based on the selected period
        switch (period) {
            case "Today":
                from = new Date();
                from.setHours(0, 0, 0, 0); // Start of today
                break;
            case "Yesterday":
                from = new Date();
                from.setDate(from.getDate() - 1); // Yesterday's date
                from.setHours(0, 0, 0, 0); // Start of yesterday
                to.setHours(0, 0, 0, 0); // End of yesterday
                break;
            case "This Week":
                from = new Date();
                from.setDate(from.getDate() - from.getDay()); // Set to start of the week (Sunday)
                from.setHours(0, 0, 0, 0);
                break;
            case "Previous Week":
                from = new Date();
                const dayOfWeek = from.getDay();
                from.setDate(from.getDate() - dayOfWeek - 7); // Start of the previous week
                from.setHours(0, 0, 0, 0);
                to.setDate(from.getDate() + 6); // End of the previous week
                to.setHours(23, 59, 59, 999);
                break;
            case "This Month":
                from = new Date();
                from.setDate(1); // Start of the month
                from.setHours(0, 0, 0, 0);
                break;
            case "Previous Month":
                from = new Date();
                from.setMonth(from.getMonth() - 1); // Previous month
                from.setDate(1); // Start of the previous month
                from.setHours(0, 0, 0, 0);
                to = new Date(from.getFullYear(), from.getMonth() + 1, 0); // End of the previous month
                to.setHours(23, 59, 59, 999);
                break;
            case "Custom":
                from = req.body.from; // For custom, you should pass the dates from the request
                to = req.body.to;
                break;
            default:
                return res.status(400).json({
                    message: "Invalid period selection",
                    success: false
                });
        }

        const formattedFromDateStr = from.toISOString(); // '2024-09-24T00:41:17.000+00:00'
        const formattedToDateStr = to.toISOString(); // '2024-09-24T00:41:17.000+00:00'

        const historyData = await History.find({
            deviceId: { $in: deviceIds },
            deviceTime: {
                $gte: formattedFromDateStr,
                $lte: formattedToDateStr,
            },
        });

        if (!deviceIds || !deviceIds.length) {
            return res.status(400).json({
                message: "Device IDs are required",
                success: false
            });
        }

        if (!historyData.length) {
            return res.status(404).json({
                message: `No ${period}'s history found for the given device IDs`,
                success: false
            });
        }

        const summaryData = deviceIds.map(deviceId => {
            const deviceHistory = historyData.filter(item => item.deviceId === deviceId);

            if (deviceHistory.length === 0) {
                return {
                    deviceId: deviceId,
                    deviceName: null,
                    distance: 0,
                    averageSpeed: 0,
                    maxSpeed: 0,
                    spentFuel: 0,
                    startOdometer: 0,
                    endOdometer: 0,
                    startTime: null,
                    endTime: null,
                };
            }

            const sortedHistory = deviceHistory.sort((a, b) => new Date(a.deviceTime) - new Date(b.deviceTime));
            const firstRecord = sortedHistory[0];
            const lastRecord = sortedHistory[sortedHistory.length - 1];

            // console.log(firstRecord?.attributes);

            let totalDistance = 0;
            let totalSpeed = 0;
            let maxSpeed = 0;
            let totalFuel = 0;

            sortedHistory.forEach((curr, i) => {
                if (i === 0) return; // Skip the first iteration as there is no previous record
                const prev = sortedHistory[i - 1];
                // console.log(curr.attributes);

                // Calculate distance between consecutive points
                totalDistance += (curr.distance || 0);
                // console.log(sortedHistory[i].attributes.distance);
                // Update max speed
                maxSpeed = Math.max(maxSpeed, curr.speed || 0);

                // Accumulate speed for average calculation
                totalSpeed += curr.speed || 0;

                // Calculate fuel consumption
                totalFuel += calculateFuelConsumption(prev, curr);

                // Calculate odometer difference
                const odometerDiff = (curr.odometer || 0) - (prev.odometer || 0);

                // If odometer data is available and valid, use it for distance calculation
                if (odometerDiff > 0) {
                    totalDistance = odometerDiff;
                }
            });

            return {
                deviceId: deviceId,
                deviceName: firstRecord.deviceName,
                distance: totalDistance,
                averageSpeed: totalSpeed / (sortedHistory.length - 1),
                maxSpeed: maxSpeed,
                spentFuel: totalFuel,
                startOdometer: firstRecord.odometer || 0,
                endOdometer: lastRecord.odometer || 0,
                startTime: firstRecord.deviceTime,
                endTime: lastRecord.deviceTime,
            };
        });

        // Helper function to calculate fuel consumption between two points
        function calculateFuelConsumption(prevRecord, currRecord) {
            const fuelConsumed = prevRecord.fuel || 0;
            return fuelConsumed;
        }

        res.status(200).json({
            message: "Summary report fetched successfully",
            success: true,
            data: summaryData
        });
    } catch (error) {
        console.error("Error fetching summary report:", error);
        res.status(500).json({
            message: "Error fetching summary report",
            success: false,
            error: error.message
        });
    }
};