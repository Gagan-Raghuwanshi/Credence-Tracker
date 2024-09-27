
import {History} from "../models/history.model.js"
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

    if (!deviceId) {
      return res.status(400).json({
        message: "Device ID is required",
        success: false
      });
    }

    const historyData = await History.find({ deviceId });

    if (!historyData.length) {
      return res.status(404).json({
        message: "No history data found for the given device ID",
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
