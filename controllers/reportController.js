
import {History} from "../models/history.model.js"




export const getDeviceReport = async (req, res) => {
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
              from = req.body.from; 
              to = req.body.to;
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

        //   // Device Moving (speed greater than 0)
        //   if (item.speed > 0) {
        //       type = "Device Moving";
        //   }

          return {
              type,
              fixTime: item.deviceTime,
              longitude: item.longitude,
              latitude: item.latitude,
              speed: item.speed
          };
      });

      res.status(200).json({
          message: "Report fetched successfully",
          success: true,
          deviceId,
          data: typesOnly
      });
  } catch (error) {
      console.log(error);
      res.status(500).json({
          message: "Error fetching reports",
          success: false,
          error: error.message
      });
  }
};




