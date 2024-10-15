
import jwt from 'jsonwebtoken';
import { User } from '../models/usermodel.js';
import { SuperAdmin } from '../models/superadminModel.js';

export const authenticateToken = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token is required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Assign user properties based on their role
    let user;
    let sperr = false;
    user = await SuperAdmin.findById(decoded.id);
    if (user) {
      req.user = { id: decoded.id, role: 'superadmin', users: true }; 
      sperr = true;
    } else if(!user) {
      user = await User.findById(decoded.id);
      req.user = { id: user._id, role: 'user', users: user.users }; 
      sperr = true;
    }
      
    if(!sperr){
      return res.status(404).json({ message: 'User not found' });
    }
    next();
  } catch (error) {
    
    return res.status(403).json({ message: 'Invalid token' });
  }
};
