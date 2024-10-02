import express from 'express';
const router = express.Router();
import { getCombinedReport, getCustomReport, getSummaryReport, } from '../controllers/reportController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

router.get('/combined', authenticateToken, getCombinedReport);

router.get('/custom', authenticateToken, getCustomReport);

router.get('/summary', authenticateToken, getSummaryReport);

export default router;