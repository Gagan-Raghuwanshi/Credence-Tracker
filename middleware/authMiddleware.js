
import jwt from 'jsonwebtoken';
import { User } from '../models/usermodel.js';

export const authenticateToken = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token is required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Assign user properties based on their role
    if (decoded.superadmin) {
      req.user = { id: decoded.id, role: 'superadmin', users: true }; // Superadmin can create users
    } else {
      const user = await User.findById(decoded.id);
      if (!user) return res.status(404).json({ message: 'User not found' });

      req.user = { id: user._id, role: 'user', users: user.users }; // Regular user with users permission
    }

    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

