// routes/userRoutes.js
import express from 'express';
import {createUser,getUsers ,getUserById,updateUser,deleteUser,addDevice} from '../controllers/userController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', authenticateToken, createUser);
router.get('/', authenticateToken, getUsers);
router.get('/:id', authenticateToken, getUserById);
router.put('/:id', authenticateToken, updateUser);
router.delete('/:id', authenticateToken, deleteUser);
router.post('/add-device', authenticateToken, addDevice);

export default router;
