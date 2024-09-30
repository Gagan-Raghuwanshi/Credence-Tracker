
import {History} from "../models/history.model.js"


export const getSummaryOfDevice = async (req, res) => {
    try {
        const { deviceId, period } = req.body;
  
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
                from = new Date(req.body.from); 
                to = new Date(req.body.to);
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
        });
        if (!historyData || historyData.length === 0) {
            return res.status(404).json({
                message: "No data found for the specified period",
                success: false,
            });
        }
  
        // Calculate total distance and average speed
        let totalSpeed = 0;
        let totalDistance = 0;
  
        // Function to calculate distance between two coordinates using the Haversine formula
        const haversineDistance = (lat1, lon1, lat2, lon2) => {
            const toRadians = (degrees) => degrees * (Math.PI / 180);
            const R = 6371; // Radius of the Earth in kilometers
  
            const dLat = toRadians(lat2 - lat1);
            const dLon = toRadians(lon2 - lon1);
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
            return R * c; // Distance in kilometers
        };
  
        for (let i = 0; i < historyData.length; i++) {
            const current = historyData[i];
            totalSpeed += current.speed;
  
            // Calculate distance between consecutive points
            if (i > 0) {
                const previous = historyData[i - 1];
                const distance = haversineDistance(
                    previous.latitude,
                    previous.longitude,
                    current.latitude,
                    current.longitude
                );
                totalDistance += distance;
            }
        }
  
        const averageSpeed = totalSpeed / historyData.length;
  
        res.status(200).json({
            message: "Summary fetched successfully",
            success: true,
            deviceId,
            summary: {
                averageSpeed,
                totalDistance,
            },
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Error fetching summary",
            success: false,
            error: error.message,
        });
    }
};
  




