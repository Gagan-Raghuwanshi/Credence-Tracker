// routes/statisticsRoutes.js
import express from 'express'
import {getStatisticsByCondition} from '../controllers/statisticController.js'
const router = express.Router();

router.get('/', getStatisticsByCondition);

export default router
