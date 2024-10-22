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


// update superadmin
export const updatesuperAdmin = async (req, res) => {
  const { id } = req.params;
  const { email, password, username } = req.body;

  // Create an update object with only the fields that are provided
  const updateFields = {};
  if (email) updateFields.email = email;
  if (password) updateFields.password = await bcrypt.hash(password, 10); // Hash the password
  if (username) updateFields.username = username;

  // Update superadmin
  const superadmin = await SuperAdmin.findByIdAndUpdate(
    id,
    updateFields,
    { new: true }
  );

  return res.status(200).json({ message: 'Superadmin updated successfully', superadmin });
};






