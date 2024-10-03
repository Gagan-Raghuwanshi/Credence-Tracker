import { History } from "../models/history.model.js"
import moment from 'moment';


export const getStatusReport = async (req, res) => {
    try {
        const { deviceId, period, page = 1, limit = 20 } = req.body;

        let from;
        let to = new Date();

        switch (period) {
            case "Today":
                from = new Date();
                from.setHours(0, 0, 0, 0);
                break;
            case "Yesterday":
                from = new Date();
                from.setDate(from.getDate() - 1);
                from.setHours(0, 0, 0, 0);
                to.setHours(0, 0, 0, 0);
                break;
            case "This Week":
                from = new Date();
                from.setDate(from.getDate() - from.getDay());
                from.setHours(0, 0, 0, 0);
                break;
            case "Previous Week":
                from = new Date();
                const dayOfWeek = from.getDay();
                from.setDate(from.getDate() - dayOfWeek - 7);
                from.setHours(0, 0, 0, 0);
                to.setDate(from.getDate() + 6);
                to.setHours(23, 59, 59, 999);
                break;
            case "This Month":
                from = new Date();
                from.setDate(1);
                from.setHours(0, 0, 0, 0);
                break;
            case "Previous Month":
                from = new Date();
                from.setMonth(from.getMonth() - 1);
                from.setDate(1);
                from.setHours(0, 0, 0, 0);
                to = new Date(from.getFullYear(), from.getMonth() + 1, 0);
                to.setHours(23, 59, 59, 999);
                break;
            case "Custom":
                from = new Date(req.query.from);
                to = new Date(req.query.to);
                break;
            default:
                return res.status(400).json({
                    message: "Invalid period selection",
                    success: false
                });
        }

        const formattedFromDateStr = from.toISOString();
        const formattedToDateStr = to.toISOString();

        const historyData = await History.find({
            deviceId,
            deviceTime: {
                $gte: formattedFromDateStr,
                $lte: formattedToDateStr,
            },
        })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const typesOnly = [];
        let previousType = null;

        let totalDistance = 0;
        let totalSpeed = 0;
        let speedCount = 0;
        let maxSpeed = 0;
        let startTime = null;
        let totalDuration = 0;

        for (let i = 0; i < historyData.length; i++) {
            const item = historyData[i];
            const prevItem = historyData[i - 1];

            // Calculate distance
            if (i > 0 && item.attributes.totalDistance) {
                // Calculate distance only if there is a previous item
                totalDistance += item.attributes.totalDistance - (prevItem?.attributes?.totalDistance || 0);
            } else {
                totalDistance = 0; // Set to 0 for the first item
            }

            // Determine the status type
            let type;
            if (item.attributes.ignition) {
                if (item.speed > 60) {
                    type = "Overspeed";
                } else if (item.speed > 0) {
                    type = "Ignition On";
                } else {
                    type = "Idle";
                }
            } else {
                type = "Ignition Off";
            }

            // Add data only if the type has changed
            if (type !== previousType) {
                if (!startTime) {
                    startTime = item.deviceTime;
                } else {
                    const endTime = item.deviceTime;
                    // Calculate duration and prevent negative values
                    let duration = Math.floor((new Date(endTime) - new Date(startTime)) / 1000);
                    if (duration < 0) duration = 0; // Prevent negative time

                    totalDuration += duration;

                    // Calculate average speed
                    const averageSpeed = speedCount > 0 ? totalSpeed / speedCount : 0;

                    // Push report entry for the previous type
                    typesOnly.push({
                        ouid: item._id,
                        vehicleStatus: previousType || type,
                        time: formatDuration(duration),
                        distance: previousType === 'Ignition Off' ? 0 : totalDistance,
                        maxSpeed: maxSpeed,
                        averageSpeed: averageSpeed,
                        startLocation: `${prevItem?.latitude || 0}, ${prevItem?.longitude || 0}`,
                        endLocation: `${item.latitude || 0}, ${item.longitude || 0}`,
                        startAddress: prevItem?.address || null,
                        endAddress: item.address || null,
                        startDateTime: startTime,
                        endDateTime: endTime,
                        totalKm: item.attributes.totalDistance || 0,
                        duration: duration,
                        consumption: null,
                        initialFuelLevel: prevItem?.attributes?.fuel || null,
                        finalFuelLevel: item.attributes?.fuel || null,
                        kmpl: null,
                        driverInfos: null,
                    });

                    // Reset accumulators for the next type block
                    totalDistance = 0;
                    totalSpeed = 0;
                    speedCount = 0;
                    maxSpeed = 0;
                    startTime = item.deviceTime;
                }
            }

            // Update accumulators for the next iteration
            if (item.speed > 0) {
                totalSpeed += item.speed;
                speedCount++;
                maxSpeed = Math.max(maxSpeed, item.speed);
            }

            previousType = type; // Update previousType to the current type
        }

        // Final type entry for the last record
        if (previousType && startTime) {
            const lastItem = historyData[historyData.length - 1];
            const duration = Math.floor((new Date(lastItem.deviceTime) - new Date(startTime)) / 1000);
            const finalDuration = duration < 0 ? 0 : duration; // Prevent negative time

            const averageSpeed = speedCount > 0 ? totalSpeed / speedCount : 0;
            typesOnly.push({
                ouid: lastItem._id,
                vehicleStatus: previousType,
                time: formatDuration(finalDuration),
                distance: previousType === 'Ignition Off' ? 0 : totalDistance,
                maxSpeed: maxSpeed,
                averageSpeed: averageSpeed,
                startLocation: `${historyData[historyData.length - 2]?.latitude || 0}, ${historyData[historyData.length - 2]?.longitude || 0}`,
                endLocation: `${lastItem.latitude || 0}, ${lastItem.longitude || 0}`,
                startAddress: historyData[historyData.length - 2]?.address || null,
                endAddress: lastItem.address || null,
                startDateTime: startTime,
                endDateTime: lastItem.deviceTime,
                totalKm: lastItem.attributes.totalDistance || 0,
                duration: finalDuration,
                consumption: null,
                initialFuelLevel: historyData[historyData.length - 2]?.attributes.fuel || null,
                finalFuelLevel: lastItem.attributes.fuel || null,
                kmpl: null,
                driverInfos: null,
            });
        }

        function formatDuration(seconds) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            seconds = seconds % 60;
            return `${hours}H ${minutes}M ${seconds}S`;
        }

        const totalCount = typesOnly.length;

        res.status(200).json({
            message: "Status report fetched successfully",
            success: true,
            deviceId,
            data: typesOnly,
            pagination: {
                total: totalCount,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(totalCount / limit),
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Error fetching alert report",
            success: false,
            error: error.message,
        });
    }
};




export const getCustomReport = async (req, res) => {
    try {
        const { deviceId, period, page = 1, limit = 20 } = req.query; // Added pagination parameters
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
                from = req.query.from; // For custom, you should pass the dates from the request
                to = req.query.to;
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
        })
            .skip((page - 1) * limit) // Pagination: skip documents
            .limit(parseInt(limit)); // Pagination: limit documents

        const totalCount = await History.countDocuments({
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
            message: "Custom report fetched successfully",
            success: true,
            deviceId,
            data: historyData,
            pagination: {
                total: totalCount,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(totalCount / limit),
            }
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
        const { period } = req.query; // Removed pagination parameters
        const deviceIds = req.query.deviceIds.split(',').map(Number);
        console.log(deviceIds)
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
                from = req.query.from; // For custom, you should pass the dates from the request
                to = req.query.to;
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

            let totalDistance = 0;
            let totalSpeed = 0;
            let maxSpeed = 0;
            let totalFuel = 0;

            for (let i = 1; i < sortedHistory.length; i++) { // Start from 1 to skip the first iteration
                const curr = sortedHistory[i];
                const prev = sortedHistory[i - 1];

                // Update max speed
                maxSpeed = Math.max(maxSpeed, curr.speed || 0);

                // Accumulate speed for average calculation
                totalSpeed += curr.speed || 0;

                // Calculate fuel consumption
                totalFuel += calculateFuelConsumption(prev, curr);

                // Calculate odometer difference
                const odometerDiff = (lastRecord?.attributes.odometer || 0) - (firstRecord?.attributes.odometer || 0);

                // If odometer data is available and valid, use it for distance calculation
                if (odometerDiff > 0) {
                    totalDistance = odometerDiff;
                }
            }

            return {
                deviceId: deviceId,
                deviceName: firstRecord.deviceName,
                distance: totalDistance,
                averageSpeed: totalSpeed / (sortedHistory.length - 1),
                maxSpeed: maxSpeed,
                spentFuel: totalFuel,
                startOdometer: firstRecord?.attributes.odometer || 0,
                endOdometer: lastRecord?.attributes.odometer || 0,
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
            data: summaryData,
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

export const distanceReport = async (req, res) => {
    try {
        const { deviceIds, startDate, endDate } = req.body;
        console.log("data", req.body)
        const distanceData = await History.find({
            deviceId: { $in: deviceIds },
            deviceTime: {
                $gte: startDate,
                $lte: endDate,
            },
        })

        function calculateTotalDistanceByDeviceId(distanceData) {
            const grouped = {};
            distanceData.forEach(item => {
                if (!grouped[item.deviceId]) {
                    grouped[item.deviceId] = 0;
                }
                grouped[item.deviceId] += item.attributes.distance;
            });

            return grouped;
        }

        const totalDistances = calculateTotalDistanceByDeviceId(distanceData);

        res.json({
            message: "Distance report generated successfully",
            data: totalDistances
        })

    } catch (error) {
        console.error("Error fetching distance report:", error);
        res.status(500).json({
            message: "An error occurred while fetching the distance report. Please try again later.",
            success: false,
            error: error.message,
        });
    }
};
