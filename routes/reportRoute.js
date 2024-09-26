import express from 'express';
const router = express.Router();
import {getDeviceReport } from '../controllers/reportController.js';
router.get('/', getDeviceReport);


export default router;
