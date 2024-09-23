import express from 'express'
import { createGroup, getAllGroups, getGroupById, updateGroup, deleteGroup } from '../controllers/group.controller.js';
const router = express.Router();
import { authenticateToken} from "../middleware/authMiddleware.js"

router.post('/',authenticateToken, createGroup);
router.get('/:id',authenticateToken, getGroupById);
router.get('/', authenticateToken,getAllGroups);
router.put('/:id',authenticateToken, updateGroup);
router.delete('/:id',authenticateToken, deleteGroup);

export default router;
