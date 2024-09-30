import express from 'express';
import { getDrivers, registerDriver, updateDriver, deleteDriver } from '../controllers/driver.controller.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
const router = express.Router();

// GET Drivers
router.get('/', authenticateToken, getDrivers);

// Register Driver
router.post('/', authenticateToken, registerDriver);

// Update Driver

router.put('/:id', authenticateToken, updateDriver);

// Delete Driver
router.delete('/:id', authenticateToken, deleteDriver);

export default router;
