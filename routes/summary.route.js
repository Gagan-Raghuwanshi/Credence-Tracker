import express from 'express';
const router = express.Router();
import {getSummaryOfDevice } from '../controllers/summary.controller.js';
router.get('/', getSummaryOfDevice);


export default router;
