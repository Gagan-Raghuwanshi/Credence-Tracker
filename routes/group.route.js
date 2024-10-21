import express from 'express'
import { createGroup, updateGroup, deleteGroup, getGroups, importGroupData, getGroupByUserId } from '../controllers/group.controller.js';
const router = express.Router();
import { authenticateToken } from "../middleware/authMiddleware.js"

router.post('/', authenticateToken, createGroup);
router.post('/importgroup', importGroupData);
router.get('/', authenticateToken, getGroups);
router.put('/:id', authenticateToken, updateGroup);
router.delete('/:id', authenticateToken, deleteGroup);
router.get('/:id', authenticateToken, getGroupByUserId);

export default router;
