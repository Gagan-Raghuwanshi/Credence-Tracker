import express from 'express';
const router = express.Router();
import { getStatusReport, getCustomReport, getSummaryReport, getIdleReports, } from '../controllers/reportController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

router.get('/status', authenticateToken, getStatusReport);

router.get('/custom', authenticateToken, getCustomReport);

router.get('/summary', authenticateToken, getSummaryReport);


router.get('/idleSummary', authenticateToken, getIdleReports);

export default router;