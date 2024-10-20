import bcrypt from 'bcrypt';
import { User } from '../models/usermodel.js';
import { SuperAdmin } from '../models/superadminModel.js';
// import { decrypt } from '../models/cryptoUtils.js';

export const createUser = async (req, res) => {
  console.log("User attempting to create a new user:", req.user);
  const { email, password, username,
    mobile, users, notification,
    devices, driver, groups,
    category, model, report,
    stop, travel, geofence,
    maintenance, preferences, status,
    distance, history, sensor,
    idle, alerts, vehicle, devicelimit, dataLimit,
    entriesCount, geofenceReport } = req.body;

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
      travel: travel || false,
      geofence: geofence || false,
      maintenance: maintenance || false,
      preferences: preferences || false,
      status: status || false,
      distance: distance || false,
      history: history || false,
      sensor: sensor || false,
      idle: idle || false,
      alerts: alerts || false,
      vehicle: vehicle || false,
      geofenceReport: geofenceReport || false,
      devicelimit: devicelimit || false,
      dataLimit,
      entriesCount
    });

    await user.save();

    return res.status(201).json({ message: "User created successfully", user });
  } catch (error) {
    console.log('error', error)
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
    travel, geofence, maintenance, preferences,
    status, distance, history,
    sensor, idle, alerts,
    vehicle, devicelimit, geofenceReport
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
    user.travel = travel !== undefined ? travel : user.travel;
    user.geofence = geofence !== undefined ? geofence : user.geofence;
    user.maintenance = maintenance !== undefined ? maintenance : user.maintenance;
    user.preferences = preferences !== undefined ? preferences : user.preferences;
    user.status = status !== undefined ? status : user.status;
    user.distance = distance !== undefined ? distance : user.distance;
    user.history = history !== undefined ? history : user.history;
    user.sensor = sensor !== undefined ? sensor : user.sensor;
    user.idle = idle !== undefined ? idle : user.idle;
    user.alerts = alerts !== undefined ? alerts : user.alerts;
    user.vehicle = vehicle !== undefined ? vehicle : user.vehicle;
    user.geofenceReport = geofenceReport !== undefined ? geofenceReport : user.geofenceReport;
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




// import code start from here

export const importUserData = async (req, res) => {
  try {
    const registrationData = req.body;

    if (!Array.isArray(registrationData) || registrationData.length === 0) {
      return res.status(400).json({ error: 'No registration data provided' });
    }

    const processedUsers = [];
    const failedEntries = [];

        console.log("pavan",processedUsers);
        

    const registrationPromises = registrationData.map(async (data) => {
      const {
        custName,
        username,
        email,
        password,
        mobile,
        contactPerson,
        address,
        status,
        timezone,
        inactiveDate
        
      } = data;

      const createdBy = "6713653b613cf2d2c532ed0e";
      // const createdBy = req.user.id;

      try {
        if (!username || !password) {
          throw new Error(`UserName and password are required  ${username || 'Unknown'}`);
        }
        
        let existingUser = await User.findOne({ username });
        if (existingUser) {
          throw new Error(`User already exists: ${username}`);
        }


          const newUser = new User({
           
                custName,
                username,
                email,
                password,
                mobile,
                contactPerson,
                address,
                status,
                inactiveDate,
                timezone,
                createdBy,
                
                notification:true,
                  devices: true,
                  driver: true,
                  groups: true,
                  category: true,
                  model: true,
                  users: true,
                  report: true,
                  stop: true,
                  travel: true,
                  geofence: true,
                  geofenceReport: true,
                  maintenance: true,
                  preferences: true,
                  distance: true,
                  history: true,
                  sensor: true,
                  idle: true,
                  alerts : true,
                  vehicle: true,
                 
          });
  
          const response = await newUser.save();
          processedUsers.push({ user: response.toObject() });
        

      } catch (error) {
        failedEntries.push({ error: error.message, data });
      }
    });

    await Promise.allSettled(registrationPromises);


    res.status(201).json({
      success: processedUsers,
      failed: failedEntries
      
    });

  } catch (error) {
    console.error('Error during User registration:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// export const importUserData = async (req, res) => {
//   try {
//     const registrationData = req.body;

//     if (!Array.isArray(registrationData) || registrationData.length === 0) {
//       return res.status(400).json({ error: 'No registration data provided' });
//     }

//     const processedUsers = [];
//     const failedEntries = [];

//         console.log("pavan",processedUsers);
        

//     const registrationPromises = registrationData.map(async (data) => {



//       const {
//         custName,
//         username,
//         email,
//         password,
//         mobile,
//         contactPerson,
//         address,
//         status,
//         timezone,
//         inactiveDate,
//         admin
        
//       } = data;

//       // const createdBy = "67124e99c5f3e28e3db35899";
//       // const createdBy = req.user.id;

//       try {
//         if (!username || !password) {
//           throw new Error(`UserName and password are required  ${username || 'Unknown'}`);
//         }
        
//         let existingUser = await User.findOne({ username });
//         if (existingUser) {
//           throw new Error(`User already exists: ${username}`);
//         }

//             const createdbyfind = await User.findOne({username:admin})

//             if(createdbyfind){

//               const newUser = new User({
               
//                     custName,
//                     username,
//                     email,
//                     password,
//                     mobile,
//                     contactPerson,
//                     address,
//                     status,
//                     inactiveDate,
//                     timezone,
//                     createdBy:createdbyfind._id,
    
//                     notification:true,
//                       devices: true,
//                       driver: true,
//                       groups: true,
//                       category: true,
//                       model: true,
//                       users: true,
//                       report: true,
//                       stop: true,
//                       travel: true,
//                       geofence: true,
//                       geofenceReport: true,
//                       maintenance: true,
//                       preferences: true,
//                       distance: true,
//                       history: true,
//                       sensor: true,
//                       idle: true,
//                       alerts : true,
//                       vehicle: true,
                     
//               });
      
//               const response = await newUser.save();
//               processedUsers.push({ user: response.toObject() });
            
//             }else{
//               throw new Error(`Admin not found for: ${username}`);

//             }


//       } catch (error) {
//         failedEntries.push({ error: error.message, data });
//       }
//     });

//     await Promise.allSettled(registrationPromises);


//     res.status(201).json({
//       success: processedUsers,
//       failed: failedEntries
      
//     });

//   } catch (error) {
//     console.error('Error during User registration:', error.message);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };
