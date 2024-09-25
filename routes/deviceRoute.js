// routes/userRoutes.js
import express from 'express';
const router = express.Router()
import {addDevice, deleteDeviceById, getAllDevice, getDeviceById, updateDeviceById} from '../controllers/deviceController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

router.post('/',authenticateToken, addDevice);
router.get('/:id',authenticateToken, getDeviceById);
router.get('/',authenticateToken, getAllDevice);
router.put('/:id',authenticateToken, updateDeviceById);
router.delete('/:id',authenticateToken, deleteDeviceById);

export default router;