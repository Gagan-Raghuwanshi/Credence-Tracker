import bcrypt from 'bcrypt';
import { SuperAdmin } from '../models/superadminModel.js';


// User registration for superadmin
export const registersuperAdmin = async (req, res) => {
  const { email, password, username } = req.body;

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create superadmin
  const superadmin = new SuperAdmin({ email, password: hashedPassword, username });
  await superadmin.save();

  return res.status(201).json({ message: 'Superadmin created successfully', superadmin });
};







