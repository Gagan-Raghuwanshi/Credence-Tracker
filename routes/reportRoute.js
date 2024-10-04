import express from 'express';
const router = express.Router();
import { getStatusReport, getCustomReport, getSummaryReport, distanceReport, getGeofenceReport, } from '../controllers/reportController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

router.get('/status', authenticateToken, getStatusReport);

router.get('/custom', authenticateToken, getCustomReport);

router.get('/summary', authenticateToken, getSummaryReport);

router.post('/distance', distanceReport);

router.get('/geofence', getGeofenceReport);


export default router;