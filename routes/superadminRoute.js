// routes/authRoutes.js
import express from 'express';
import { registersuperAdmin, updatesuperAdmin } from '../controllers/superadminControlller.js';
const router = express.Router();

router.post('/register', registersuperAdmin);

router.put('/:id', updatesuperAdmin);

export default router;
