import express from 'express'
import { createGroup,getAllGroups,getGroupById,updateGroup,deleteGroup  } from '../controllers/group.controller.js';
import { canAccessGroup} from '../middleware/group.middleware.js';




const router = express.Router();



router.post('/groups/createGroup', createGroup);
router.get('/groups/createdBy/:id' ,getGroupById);
router.get('/allgroups' ,getAllGroups);
router.put('/updateGroup/:id' ,updateGroup);
router.delete('/group/:id', deleteGroup);

export default router;
