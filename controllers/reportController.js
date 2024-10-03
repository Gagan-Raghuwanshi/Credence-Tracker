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
                from = req.query.from;
                to = req.query.to;
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
        let previousType = null; // Variable to track the previous type

        for (const item of historyData) {
            let type;
            console.log(item.attributes);
            // Determine the vehicle status based on conditions from the frontend
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

            // Only push to typesOnly if the type has changed
            if (type !== previousType) {
                const previousOdometer = typesOnly.length > 0 ? typesOnly[typesOnly.length - 1].totalKm : 0;
                const currentOdometer = item.attributes.odometer || 0;

                typesOnly.push({
                    ouid: item._id,
                    vehicleStatus: type,
                    time: typesOnly.length > 0 ? (new Date(item.deviceTime).getTime() - new Date(historyData[typesOnly.length - 1].deviceTime).getTime()) / 1000 : 0, // time in seconds
                    distance: currentOdometer - previousOdometer,
                    maxSpeed: Math.max(...historyData.map(h => h.speed || 0)),
                    averageSpeed: (item.speed + (typesOnly.length > 0 ? typesOnly[typesOnly.length - 1].averageSpeed || 0 : 0)) / 2 || 0,
                    startLocation: `${(typesOnly.length > 0 ? historyData[typesOnly.length - 1]?.latitude : item.latitude) || 0}, ${(typesOnly.length > 0 ? historyData[typesOnly.length - 1]?.longitude : item.longitude) || 0}`,
                    endLocation: `${item.latitude || 0}, ${item.longitude || 0}`,
                    startAddress: typesOnly.length > 0 ? historyData[typesOnly.length - 1]?.address || null : null,
                    endAddress: item.address || null,
                    sPoi: item.geofenceIds || null,
                    ePoi: item.ePoi || null,
                    startDateTime: typesOnly.length > 0 ? historyData[typesOnly.length - 1]?.deviceTime || item.deviceTime : item.deviceTime,
                    endDateTime: item.deviceTime || null,
                    totalKm: item.attributes.totalDistance || 0,
                    duration: null,
                    consumption: null,
                    initialFuelLevel: null,
                    finalFuelLevel: null,
                    kmpl: null,
                    driverInfos: null,
                });

                previousType = type; // Update previousType to the current type
            }
        }

        const totalCount = await History.countDocuments({
            deviceId,
            deviceTime: {
                $gte: formattedFromDateStr,
                $lte: formattedToDateStr,
            },
        });

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
            error: error.message
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
















































































































































































































































// export const getIdleReports = async (req, res) => {
//     try {
//         const { deviceId, period, page = 1, limit = 20 } = req.body;

//         let from;
//         let to = new Date();

//         switch (period) {
//             case "Today":
//                 from = new Date();
//                 from.setHours(0, 0, 0, 0);
//                 break;
//             case "Yesterday":
//                 from = new Date();
//                 from.setDate(from.getDate() - 1);
//                 from.setHours(0, 0, 0, 0);
//                 to.setHours(0, 0, 0, 0);
//                 break;
//             case "This Week":
//                 from = new Date();
//                 from.setDate(from.getDate() - from.getDay());
//                 from.setHours(0, 0, 0, 0);
//                 break;
//             case "Previous Week":
//                 from = new Date();
//                 const dayOfWeek = from.getDay();
//                 from.setDate(from.getDate() - dayOfWeek - 7);
//                 from.setHours(0, 0, 0, 0);
//                 to.setDate(from.getDate() + 6);
//                 to.setHours(23, 59, 59, 999);
//                 break;
//             case "This Month":
//                 from = new Date();
//                 from.setDate(1);
//                 from.setHours(0, 0, 0, 0);
//                 break;
//             case "Previous Month":
//                 from = new Date();
//                 from.setMonth(from.getMonth() - 1);
//                 from.setDate(1);
//                 from.setHours(0, 0, 0, 0);
//                 to = new Date(from.getFullYear(), from.getMonth() + 1, 0);
//                 to.setHours(23, 59, 59, 999);
//                 break;
//             case "Custom":
//                 from = req.query.from;
//                 to = req.query.to;
//                 break;
//             default:
//                 return res.status(400).json({
//                     message: "Invalid period selection",
//                     success: false
//                 });
//         }

//         const formattedFromDateStr = from.toISOString();
//         const formattedToDateStr = to.toISOString();

//         const historyData = await History.find({
//             deviceId,
//             deviceTime: {
//                 $gte: formattedFromDateStr,
//                 $lte: formattedToDateStr,
//             },
//         })
//             .skip((page - 1) * limit)
//             .limit(parseInt(limit));

//         const typesOnly = [];
//         let previousType = null; 

//         for (const item of historyData) {
//             let type;                   
            
//             console.log("check",item);
            

//             console.log(item.attributes);

//             if (item.attributes.ignition) {
//                 if (item.speed > 60) {
//                     type = "Overspeed";
//                 } else if (item.speed > 0) {
//                     type = "Ignition On";
//                 } else {
//                     type = "Idle";
//                 }
//             } else {
//                 type = "Ignition Off";
//             }



//                 if (type !== previousType) {
//                     const previousOdometer = typesOnly.length > 0 ? typesOnly[typesOnly.length - 1].totalKm : 0;
//                     const currentOdometer = item.attributes.odometer || 0;
    
//                     if(  type === "Idle"||  type === "Ignition Off"){
//                         typesOnly.push({
//                             ouid: item._id,
//                             vehicleStatus: type,
//                             durationSeconds: typesOnly.length > 0 ? (new Date(item.deviceTime).getTime() - new Date(historyData[typesOnly.length - 1].deviceTime).getTime()) / 1000 : 0, // time in seconds
//                             distance: currentOdometer - previousOdometer,
//                             maxSpeed: Math.max(...historyData.map(h => h.speed || 0)),
//                             averageSpeed: (item.speed + (typesOnly.length > 0 ? typesOnly[typesOnly.length - 1].averageSpeed || 0 : 0)) / 2 || 0,
//                             startLocation: `${(typesOnly.length > 0 ? historyData[typesOnly.length - 1]?.latitude : item.latitude) || 0}, ${(typesOnly.length > 0 ? historyData[typesOnly.length - 1]?.longitude : item.longitude) || 0}`,
//                             endLocation: `${item.latitude || 0}, ${item.longitude || 0}`,
//                             startAddress: typesOnly.length > 0 ? historyData[typesOnly.length - 1]?.address || null : null,
//                             endAddress: item.address || null,
//                             sPoi: item.geofenceIds || null,
//                             ePoi: item.ePoi || null,
//                             arrivalTime: typesOnly.length > 0 ? historyData[typesOnly.length - 1]?.deviceTime || item.deviceTime : item.deviceTime,
//                             departureTime: item.deviceTime || null,
//                             totalKm: item.attributes.totalDistance || 0,
//                             duration: null,
//                             consumption: null,
//                             initialFuelLevel: null,
//                             finalFuelLevel: null,
//                             kmpl: null,
//                             driverInfos: null,
//                         });
//                     }
    
//                     previousType = type; 
    
//                 }

            
           
//         }

                


//         const totalCount = typesOnly.length
//         res.status(200).json({
//             message: "Status report fetched successfully",
//             success: true,
//             deviceId,
//             data: typesOnly,
//             pagination: {
//                 total: totalCount,
//                 page: parseInt(page),
//                 limit: parseInt(limit),
//                 totalPages: Math.ceil(totalCount / limit),
//             }
//         });
//     } catch (error) {
//         console.log(error);
//         res.status(500).json({
//             message: "Error fetching alert report",
//             success: false,
//             error: error.message
//         });
//     }
// };




// export const getIdleReports = async (req, res) => {
//     try {
//         const { deviceIds, period, page = 1, limit = 20 } = req.body;

//         let from;
//         let to = new Date();

//         switch (period) {
//             case "Today":
//                 from = new Date();
//                 from.setHours(0, 0, 0, 0);
//                 break;
//             case "Yesterday":
//                 from = new Date();
//                 from.setDate(from.getDate() - 1);
//                 from.setHours(0, 0, 0, 0);
//                 to.setHours(0, 0, 0, 0);
//                 break;
//             case "This Week":
//                 from = new Date();
//                 from.setDate(from.getDate() - from.getDay());
//                 from.setHours(0, 0, 0, 0);
//                 break;
//             case "Previous Week":
//                 from = new Date();
//                 const dayOfWeek = from.getDay();
//                 from.setDate(from.getDate() - dayOfWeek - 7);
//                 from.setHours(0, 0, 0, 0);
//                 to.setDate(from.getDate() + 6);
//                 to.setHours(23, 59, 59, 999);
//                 break;
//             case "This Month":
//                 from = new Date();
//                 from.setDate(1);
//                 from.setHours(0, 0, 0, 0);
//                 break;
//             case "Previous Month":
//                 from = new Date();
//                 from.setMonth(from.getMonth() - 1);
//                 from.setDate(1);
//                 from.setHours(0, 0, 0, 0);
//                 to = new Date(from.getFullYear(), from.getMonth() + 1, 0);
//                 to.setHours(23, 59, 59, 999);
//                 break;
//             case "Custom":
//                 from = req.query.from;
//                 to = req.query.to;
//                 break;
//             default:
//                 return res.status(400).json({
//                     message: "Invalid period selection",
//                     success: false
//                 });
//         }

//         const formattedFromDateStr = from.toISOString();
//         const formattedToDateStr = to.toISOString();

//         // Use Promise.all to fetch data for all devices
//         const deviceReports = await Promise.all(
//             deviceIds.map(async (deviceId) => {
//                 const historyData = await History.find({
//                     deviceId,
//                     deviceTime: {
//                         $gte: formattedFromDateStr,
//                         $lte: formattedToDateStr,
//                     },
//                 })
//                     .skip((page - 1) * limit)
//                     .limit(parseInt(limit));

//                 const typesOnly = [];
//                 let previousType = null;

//                 for (const item of historyData) {
//                     let type;

//                     if (item.attributes.ignition) {
//                         if (item.speed > 60) {
//                             type = "Overspeed";
//                         } else if (item.speed > 0) {
//                             type = "Ignition On";
//                         } else {
//                             type = "Idle";
//                         }
//                     } else {
//                         type = "Ignition Off";
//                     }

//                     if (type !== previousType) {
//                         const previousOdometer = typesOnly.length > 0 ? typesOnly[typesOnly.length - 1].totalKm : 0;
//                         const currentOdometer = item.attributes.odometer || 0;

//                         if (type === "Idle" || type === "Ignition Off") {
//                             typesOnly.push({
//                                 ouid: item._id,
//                                 vehicleStatus: type,
//                                 durationSeconds: typesOnly.length > 0 ? (new Date(item.deviceTime).getTime() - new Date(historyData[typesOnly.length - 1].deviceTime).getTime()) / 1000 : 0,
//                                 distance: currentOdometer - previousOdometer,
//                                 maxSpeed: Math.max(...historyData.map(h => h.speed || 0)),
//                                 averageSpeed: (item.speed + (typesOnly.length > 0 ? typesOnly[typesOnly.length - 1].averageSpeed || 0 : 0)) / 2 || 0,
//                                 startLocation: `${(typesOnly.length > 0 ? historyData[typesOnly.length - 1]?.latitude : item.latitude) || 0}, ${(typesOnly.length > 0 ? historyData[typesOnly.length - 1]?.longitude : item.longitude) || 0}`,
//                                 endLocation: `${item.latitude || 0}, ${item.longitude || 0}`,
//                                 startAddress: typesOnly.length > 0 ? historyData[typesOnly.length - 1]?.address || null : null,
//                                 endAddress: item.address || null,
//                                 sPoi: item.geofenceIds || null,
//                                 ePoi: item.ePoi || null,
//                                 arrivalTime: typesOnly.length > 0 ? historyData[typesOnly.length - 1]?.deviceTime || item.deviceTime : item.deviceTime,
//                                 departureTime: item.deviceTime || null,
//                                 totalKm: item.attributes.totalDistance || 0,
//                                 duration: null,
//                                 consumption: null,
//                                 initialFuelLevel: null,
//                                 finalFuelLevel: null,
//                                 kmpl: null,
//                                 driverInfos: null,
//                             });
//                         }

//                         previousType = type;
//                     }
//                 }

//                 return {
//                     deviceId,
//                     data: typesOnly,
//                     pagination: {
//                         total: typesOnly.length,
//                         page: parseInt(page),
//                         limit: parseInt(limit),
//                         totalPages: Math.ceil(typesOnly.length / limit),
//                     },
//                 };
//             })
//         );

//         res.status(200).json({
//             message: "Status report fetched successfully",
//             success: true,
//             data: deviceReports,
//         });
//     } catch (error) {
//         console.log(error);
//         res.status(500).json({
//             message: "Error fetching alert report",
//             success: false,
//             error: error.message,
//         });
//     }
// };




export const getIdleReports = async (req, res) => {
    try {
        const { deviceIds, period, page = 1, limit = 20 } = req.body;

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
                from = req.query.from;
                to = req.query.to;
                break;
            default:
                return res.status(400).json({
                    message: "Invalid period selection",
                    success: false
                });
        }

        const formattedFromDateStr = from.toISOString();
        const formattedToDateStr = to.toISOString();

        // Use Promise.all to fetch data for all devices
        const deviceReports = await Promise.all(
            deviceIds.map(async (deviceId) => {
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
                let totalDurationSeconds = 0;  // Initialize totalDurationSeconds for this device

                for (const item of historyData) {
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

                    if (type !== previousType) {
                        const previousOdometer = typesOnly.length > 0 ? typesOnly[typesOnly.length - 1].totalKm : 0;
                        const currentOdometer = item.attributes.odometer || 0;

                        if (type === "Idle" || type === "Ignition Off") {
                            const durationSeconds = typesOnly.length > 0
                                ? (new Date(item.deviceTime).getTime() - new Date(historyData[typesOnly.length - 1].deviceTime).getTime()) / 1000
                                : 0;

                            // Add durationSeconds to totalDurationSeconds
                            totalDurationSeconds += durationSeconds;

                            typesOnly.push({
                                ouid: item._id,
                                vehicleStatus: type,
                                durationSeconds: durationSeconds,  // Add this duration to the current object
                                // distance: currentOdometer - previousOdometer,
                                location: `${item.latitude || 0}, ${item.longitude || 0}`,
                                // startAddress: typesOnly.length > 0 ? historyData[typesOnly.length - 1]?.address || null : null,
                                address: item.address || null,
                                
                                arrivalTime: typesOnly.length > 0 ? historyData[typesOnly.length - 1]?.deviceTime || item.deviceTime : item.deviceTime,
                                departureTime: item.deviceTime || null,
                                
                            });
                        }

                        previousType = type;
                    }
                }

                return {
                    deviceId,
                    data: typesOnly,
                    totalDurationSeconds,  // Add the totalDurationSeconds for this device
                    pagination: {
                        total: typesOnly.length,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        totalPages: Math.ceil(typesOnly.length / limit),
                    },
                };
            })
        );

        res.status(200).json({
            message: "Status report fetched successfully",
            success: true,
            data: deviceReports,
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
