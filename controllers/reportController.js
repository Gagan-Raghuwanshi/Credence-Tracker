import { Report } from '../models/report.model.js';




exports.getReports = async (req, res) => {
  const { devices, groups, startDate, endDate } = req.body;
  const deviceArray = devices ? devices : [];
  const groupArray = groups ? groups : [];

  try {
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






