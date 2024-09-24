import express from 'express';
import { getAllDrivers, getDriversById, registerDriver, updateDriver, deleteDriver } from '../controllers/driver.controller.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
const router = express.Router();

// GET Drivers
router.get('/get-all-drivers', authenticateToken, getAllDrivers);

// GET Drivers by id
router.get('/get-drivers-by-id', authenticateToken, getDriversById);

// Register Driver
router.post('/register-driver', authenticateToken, registerDriver);

// Update Driver

router.put('/update-driver/:id', authenticateToken, updateDriver);

// Delete Driver
router.delete('/delete-driver/:id', authenticateToken, deleteDriver);

export default router;
