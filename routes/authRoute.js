// routes/authRoutes.js
import express from 'express';
import { loginUser } from '../controllers/authControllers.js';  // Controller handling login

const router = express.Router();

// POST route for login
router.post('/login', loginUser);

export default router;
