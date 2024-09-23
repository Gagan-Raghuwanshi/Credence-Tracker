import express from 'express';
import { getDrivers, registerDriver, updateDriver, deleteDriver } from '../controllers/driver.controller.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
const router = express.Router();

// GET Drivers
router.get('/get-drivers', authenticateToken, getDrivers);

// Register Driver
router.post('/register-driver', authenticateToken, registerDriver);

// Update Driver

router.put('/update-driver/:id', authenticateToken, updateDriver);

// Delete Driver
router.delete('/delete-driver/:id', authenticateToken, deleteDriver);

export default router;
