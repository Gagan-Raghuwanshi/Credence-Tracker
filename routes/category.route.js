import express from 'express'
import { createCategory, deleteCategory, getAllCategory, updateCategory } from '../controllers/category.controller.js';
const router = express.Router();
import { authenticateToken} from "../middleware/authMiddleware.js"

router.post('/', createCategory);
router.get('/',authenticateToken,getAllCategory);
router.put('/:id',authenticateToken, updateCategory);
router.delete('/:id',authenticateToken, deleteCategory);

export default router;
