import express from 'express'
import { createGroup, updateGroup, deleteGroup, getGroups } from '../controllers/group.controller.js';
const router = express.Router();
import { authenticateToken} from "../middleware/authMiddleware.js"

router.post('/',authenticateToken, createGroup);
router.get('/', authenticateToken,getGroups);
router.put('/:id',authenticateToken, updateGroup);
router.delete('/:id',authenticateToken, deleteGroup);

export default router;
