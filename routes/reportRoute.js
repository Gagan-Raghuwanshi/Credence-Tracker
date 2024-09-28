import express from 'express';
const router = express.Router();
import {getDeviceReport, getCustomReport, getSummaryReport, } from '../controllers/reportController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

router.get('/combined', authenticateToken, getDeviceReport);

router.get('/custom',authenticateToken, getCustomReport);

router.get('/summary',authenticateToken, getSummaryReport);

// router.get('/summary',authenticateToken, getSummaryOfDevice);

export default router;