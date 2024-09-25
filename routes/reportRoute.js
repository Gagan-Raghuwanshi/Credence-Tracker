const express = require('express');
const router = express.Router();
const {
  getReports,
  getReportById,
  addReport,
  updateReport,
  deleteReport
} = require('../controllers/reportController');

// Fetch all reports
router.get('/reports', getReports);

// Fetch a single report by ID
router.get('/reports/:id', getReportById);

// Add a new report
router.post('/reports', addReport);

// Update an existing report by ID
router.put('/reports/:id', updateReport);

// Delete a report by ID
router.delete('/reports/:id', deleteReport);

module.exports = router;
