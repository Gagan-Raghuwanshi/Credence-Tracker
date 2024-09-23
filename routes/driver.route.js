import express from 'express';
import { getDrivers, registerDriver, updateDriver, deleteDriver } from '../controllers/driver.controller.js';
const router = express.Router();

// GET Drivers
router.get('/get-drivers', getDrivers);

// Register Driver
router.post('/register-driver', registerDriver);

// Update Driver

router.put('/update-driver/:id', updateDriver);

// Delete Driver
router.delete('/delete-driver/:id', deleteDriver);

export default router;
