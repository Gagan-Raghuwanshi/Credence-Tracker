
import {History} from "../models/history.model.js"

export const getDeviceReport = async (req, res) => {
  try {
      const { deviceId, from, to } = req.body;
      const formattedFromDateStr = from.replace(" ", "+");
      const formattedToDateStr = to.replace(" ", "+"); 
      const historyData = await History.find({ 
          deviceId, 
          deviceTime: {
            $gte: formattedFromDateStr, 
            $lte: formattedToDateStr, 
          },
      });


      const typesOnly = historyData.map(item => {
          let type = "";
          if (item.ignition && item.speed > 0) {
              type = "Ignition On";
          } else if (!item.ignition) {
              type = "Ignition Off";
          } else if (item.ignition && item.speed === 0) {
              type = "Device Stopped";
          }
          return { 
              type,
              fixTime: item.deviceTime
          };
      });
      res.status(200).json({
          message: "Device history report fetched successfully",
          success: true,
          deviceId,
          data: typesOnly
      });
  } catch (error) {
      res.status(500).json({
          message: "Error fetching device history report",
          success: false,
          error: error.message
      });
  }
};








