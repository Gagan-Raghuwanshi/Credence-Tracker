import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/usermodel.js';
import { SuperAdmin } from '../models/superadminModel.js';

export const loginUser = async (req, res) => {
  const { username, password } = req.body;
  let user = null;
  let isSuperadmin = false;
  try {
    user = await User.findOne({ username });
    if (!user) {
      user = await SuperAdmin.findOne({ username });
      if (user) {
        isSuperadmin = true;
      } else {
        return res.status(404).json({ message: 'User not found' });
      }
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }
    const token = jwt.sign(
      {
        id: user._id,
        users: isSuperadmin ? true : user.users,
        superadmin: isSuperadmin
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } 
    );
    return res.status(200).json({
      message: 'Login successful',
      token,
      username: user.username,
      isSuperadmin,
      users: isSuperadmin ? true : user.users,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

