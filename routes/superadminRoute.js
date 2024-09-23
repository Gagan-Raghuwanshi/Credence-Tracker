// routes/authRoutes.js
import express from 'express';
import { registersuperAdmin} from '../controllers/superadminControlller.js';
const router = express.Router();

router.post('/register', registersuperAdmin);


export default router;
