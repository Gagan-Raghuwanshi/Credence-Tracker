import express from 'express';
import { addNotification, deleteNotification, getNotification, updateNotification } from '../controllers/notification.controller.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
const router = express.Router();




router.post('/',authenticateToken, addNotification);
router.get('/',authenticateToken, getNotification);
router.put('/:id',authenticateToken, updateNotification);
router.delete('/:id',authenticateToken, deleteNotification);

export default router;