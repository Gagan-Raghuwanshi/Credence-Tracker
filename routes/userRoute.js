// routes/userRoutes.js
import express from 'express';
import {createUser,getUsers ,getUserById,updateUser,deleteUser, importUserData} from '../controllers/userController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', authenticateToken, createUser);
router.post('/import', importUserData);
router.get('/', authenticateToken, getUsers);
router.get('/:id', authenticateToken, getUserById);
router.put('/:id', authenticateToken, updateUser);
router.delete('/:id', authenticateToken, deleteUser);


export default router;
