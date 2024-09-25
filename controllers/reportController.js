
import {Report } from '../models/report.model.js';

// Fetch reports based on the device group and devices from req.body
exports.getReports = async (req, res) => {
    const { devices, groups } = req.body;  
    const deviceArray = devices ? devices : [];
    const groupArray = groups ? groups : [];
  
    try {
      // Filter reports by devices and groups if specified
      let filter = {};
  
      if (deviceArray.length) {
        filter.Devices = { $in: deviceArray };
      }
  
      if (groupArray.length) {
        filter.Groups = { $in: groupArray };
      }
  
      const reports = await Report.find(filter);
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching reports', error });
    }
  };
  
  