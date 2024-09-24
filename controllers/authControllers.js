import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/usermodel.js';
import { SuperAdmin } from '../models/superadminModel.js';

export const loginUser = async (req, res) => {
  const { username, password } = req.body;

  let user = null;
  let isSuperadmin = false;

  try {
    // First check in the User model
    user = await User.findOne({ username });
    
    if (!user) {
      // If not found, check SuperAdmin model
      user = await SuperAdmin.findOne({ username });
      if (user) {
        isSuperadmin = true;
      } else {
        return res.status(404).json({ message: 'User not found' });
      }
    }

    // Check if the password matches
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Define additional fields for regular users
    const userPermissions = {
      notifications: true,
      devices: true,
      driver: true,
      groups: false,
      category: false,
      model: true,
      report: false,
      stop: true,
      trips: false
    };

    // Generate JWT with user details and additional fields
    const token = jwt.sign(
      {
        id: user._id,
        users: isSuperadmin ? true : user.users,
        superadmin: isSuperadmin,
        ...(!isSuperadmin ? userPermissions : {}) // Include permissions for regular users
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // Optional: Add token expiration time
    );

    return res.status(200).json({
      message: 'Login successful',
      token,
      username: user.username,
      isSuperadmin,
      users: isSuperadmin ? true : user.users,// Include permissions in response for regular users
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
    
  }
};
