// routes/userRoutes.js
import express from 'express';
const router = express.Router()
import {addDevice} from '../controllers/deviceController.js';

router.post('/', addDevice);

export default router;