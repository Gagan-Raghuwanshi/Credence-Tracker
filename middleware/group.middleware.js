import Group from "../models/group.model.js"




export const  canAccessGroup = async (req, res, next) => {
     const { groupId } = req.params;
     const userId = req.user._id;
   
     // Find the group and check if the current user is assigned
     const group = await Group.findById(groupId).populate('createdBy');
     
     // Superadmin can access all groups
     if (req.user.role === 'superadmin') return next();
     
     // If the user created the group or belongs to it
     if (group.createdBy._id.equals(userId) || req.user.groups.includes(groupId)) {
       return next();
     } else {
       return res.status(403).json({ message: "Access denied" });
     }
   };
   
   