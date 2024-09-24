import express from 'express';
const router = express.Router();
import {createModel ,getModel ,updateModel,deleteModel} from '../controllers/modelController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';


router.post('/', authenticateToken, createModel );
router.get('/', authenticateToken, getModel);
router.put('/:id', authenticateToken, updateModel);
router.delete('/:id', authenticateToken, deleteModel);


export default router;