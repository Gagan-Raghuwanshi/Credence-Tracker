const express = require('express');
const router = express.Router();
const {getReports} = require('../controllers/reportController');

router.get('/reports', getReports);


module.exports = router;
