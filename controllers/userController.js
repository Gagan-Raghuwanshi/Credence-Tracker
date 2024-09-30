import bcrypt from 'bcrypt';
import { User } from '../models/usermodel.js';
// import { decrypt } from '../models/cryptoUtils.js';

export const createUser = async (req, res) => {
  console.log("User attempting to create a new user:", req.user);
  const { email, password, username,
          mobile, users, notification,
          devices, driver,groups,
          category, model, report,
          stop, trips, geofence,
          maintenance,preferences,combinedReports,
          customReports,history,schedulereports,
          statistics,alerts ,summary,customCharts,devicelimit } = req.body;

  // Check if the user has permission to create users
  const isAuthorized = req.user.superadmin || req.user.users;

  if (!isAuthorized) {
    return res
      .status(403)
      .json({ message: "You do not have permission to create users" });
  }

  try {
    // Check if a user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    // Create new user with additional fields
    const user = new User({
      email,
      password,
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
      geofence: geofence || false,
      maintenance:maintenance || false,
      preferences:preferences||false,
      combinedReports:combinedReports||false,
      customReports:customReports||false,
      history:history||false,
      schedulereports:schedulereports||false,
      statistics:statistics||false,
      alerts:alerts||false ,
      summary:summary||false,
      customCharts : customCharts || false,
      devicelimit:devicelimit || false
    });

    await user.save();

    return res.status(201).json({ message: "User created successfully", user });
  } catch (error) {
    console.log('error',error)
    return res.status(500).json({ message: 'Error creating user', error });
  }
};
export const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const role = req.user.role;

    console.log('role:', role);
    let users;

    if (role === 'superadmin') {
      users = await User.find()
        .select('-password')
        .populate('createdBy', 'username _id')
        .skip(skip)
        .limit(limit);
    } else if (role === 'user') {
      users = await User.find({ createdBy: req.user.id })
        .select('-password')
        .populate('createdBy', 'username _id')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    } else {
      return res.status(403).json({ message: 'Forbidden: Invalid role' });
    }
    users = users.reverse();
    const totalUsers = role === 'superadmin'
      ? await User.countDocuments()
      : await User.countDocuments({ createdBy: req.user.id });

    const totalPages = Math.ceil(totalUsers / limit);

    return res.status(200).json({
      users,
      totalUsers,
      totalPages,
      currentPage: page,
      pageSize: limit,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching users', error });
  }
};
// export const getUsers = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const skip = (page - 1) * limit;
//     const role = req.user.role;

//     console.log('role:', role);
//     let users;

//     if (role === 'superadmin') {
//       // If role is superadmin, fetch all users
//       users = await User.find()
//         .populate('createdBy', 'username _id')
//         .sort({ createdAt: -1 }) // Sort in descending order
//         .skip(skip)
//         .limit(limit);
//     } else if (role === 'user') {
//       // If role is user, fetch only the users created by them
//       users = await User.find({ createdBy: req.user.id })
//         .populate('createdBy', 'username _id')
//         .sort({ createdAt: -1 }) // Sort in descending order
//         .skip(skip)
//         .limit(limit);
//     } else {
//       return res.status(403).json({ message: 'Forbidden: Invalid role' });
//     }

//     // Decrypt the password for each user and include it in the response
//     const usersWithDecryptedPassword = users.map(user => {
//       const decryptedPassword = decrypt(user.password);
//       return {
//         ...user.toObject(),
//         password: decryptedPassword // Include the decrypted password
//       };
//     });

//     // Count total users based on the role
//     const totalUsers = role === 'superadmin'
//       ? await User.countDocuments()
//       : await User.countDocuments({ createdBy: req.user.id });

//     const totalPages = Math.ceil(totalUsers / limit);

//     return res.status(200).json({
//       users: usersWithDecryptedPassword,
//       totalUsers,
//       totalPages,
//       currentPage: page,
//       pageSize: limit,
//     });
//   } catch (error) {
//     return res.status(500).json({ message: 'Error fetching users', error });
//   }
// };

export const getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching user", error });
  }
};
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const {
    email, password, username, mobile,
    notification, devices, driver, groups,
    category, model, users, report, stop,
    trips, geofence, maintenance, preferences,
    combinedReports, customReports, history,
    schedulereports, statistics, alerts,
    summary, customCharts,devicelimit
  } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update fields if provided in the request, otherwise keep the existing values
    user.email = email || user.email;
    user.password = password || user.password;
    user.username = username || user.username;
    user.mobile = mobile || user.mobile;
    user.notification = notification !== undefined ? notification : user.notification;
    user.devices = devices !== undefined ? devices : user.devices;
    user.driver = driver !== undefined ? driver : user.driver;
    user.groups = groups !== undefined ? groups : user.groups;
    user.category = category !== undefined ? category : user.category;
    user.model = model !== undefined ? model : user.model;
    user.users = users !== undefined ? users : user.users;
    user.report = report !== undefined ? report : user.report;
    user.stop = stop !== undefined ? stop : user.stop;
    user.trips = trips !== undefined ? trips : user.trips;
    user.geofence = geofence !== undefined ? geofence : user.geofence;
    user.maintenance = maintenance !== undefined ? maintenance : user.maintenance;
    user.preferences = preferences !== undefined ? preferences : user.preferences;
    user.combinedReports = combinedReports !== undefined ? combinedReports : user.combinedReports;
    user.customReports = customReports !== undefined ? customReports : user.customReports;
    user.history = history !== undefined ? history : user.history;
    user.schedulereports = schedulereports !== undefined ? schedulereports : user.schedulereports;
    user.statistics = statistics !== undefined ? statistics : user.statistics;
    user.alerts = alerts !== undefined ? alerts : user.alerts;
    user.summary = summary !== undefined ? summary : user.summary;
    user.customCharts = customCharts !== undefined ? customCharts : user.customCharts;
    user.devicelimit = devicelimit !== undefined ? devicelimit : user.devicelimit;
    await user.save();

    return res.status(200).json({ message: 'User updated successfully', user });
  } catch (error) {
    console.log('Error updating user:', error);
    return res.status(500).json({ message: 'Error updating user', error });
  }
};
export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting user", error });
  }
};
