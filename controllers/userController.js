import bcrypt from 'bcrypt';
import { User } from '../models/usermodel.js';
//import { Group } from "../models/group.js";
//import { Geofence } from "../models/geofence.js";
import { Device } from '../models/device.js';


export const createUser = async (req, res) => {
  console.log("User attempting to create a new user:", req.user);
  const { email, password, username, mobile, users, notification, devices, driver, groups, category, model, report, stop, trips } = req.body;

  // Check if the user has permission to create users
  const isAuthorized = req.user.superadmin || req.user.users;

  if (!isAuthorized) {
    return res.status(403).json({ message: 'You do not have permission to create users' });
  }

  try {
    // Check if a user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user with additional fields
    const user = new User({
      email,
      password: hashedPassword,
      username,
      mobile,
      createdBy: req.user.id, // Track who created the user
      notification: notification || false,
      devices: devices || false,
      driver: driver || false,
      groups: groups || false,
      category: category || false,
      model: model || false,
      users: users || false,
      report: report || false,
      stop: stop || false,
      trips: trips || false,
    });

    await user.save();

    return res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    return res.status(500).json({ message: 'Error creating user', error });
  }
};
export const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching users', error });
  }
};
// Get User by ID
export const getUserById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching user', error });
  }
};
// Update User
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { email, username, mobile } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.email = email || user.email;
    user.username = username || user.username;
    user.mobile = mobile || user.mobile;

    await user.save();
    return res.status(200).json({ message: 'User updated successfully', user });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating user', error });
  }
};
// Delete User
export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting user', error });
  }
};
//  add a device
export const addDevice = async (req, res) => {
  const {
    devicename,
    imei,
    sim,
    groups, // Array of groups
    users,
    geofences, // Now an array of geofences
    speed,
    average,
    model,
    category,
    installationdate,
    expirationdate,
    extenddate,
  } = req.body;

  try {
    // Check if users exist
    const userDocuments = await User.find({ _id: { $in: users } });
    if (userDocuments.length === 0) {
      return res.status(400).json({ message: 'Invalid users provided' });
    }

    // Check if all groups exist
    const groupDocuments = await Group.find({ _id: { $in: groups } });
    if (groupDocuments.length !== groups.length) {
      return res.status(400).json({ message: 'One or more invalid groups provided' });
    }

    // Check if all geofences exist
    const geofenceDocuments = await Geofence.find({ _id: { $in: geofences } });
    if (geofenceDocuments.length !== geofences.length) {
      return res.status(400).json({ message: 'One or more invalid geofences provided' });
    }

    // Create new device
    const device = new Device({
      devicename,
      imei,
      sim,
      groups, // Array of group IDs
      users,
      geofences, // Array of geofence IDs
      speed,
      average,
      model,
      category,
      installationdate,
      expirationdate,
      extenddate,
    });

    await device.save();

    return res.status(201).json({ message: 'Device added successfully', device });
  } catch (error) {
    return res.status(500).json({ message: 'Error adding device', error });
  }
};

