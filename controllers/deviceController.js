import { Group } from "../models/group.model.js";
//import { Geofence } from "../models/geofence.js";
import { Device } from '../models/device.model.js';
import { User } from "../models/usermodel.js"

//  add a device
// export const addDevice = async (req, res) => {
  
//     const {
//       devicename,
//       imei,
//       sim,
//       groups, 
//       users,
//       geofences, 
//       speed,
//       average,
//       model,
//       category,
//       installationdate,
//       expirationdate,
//       extenddate,
//     } = req.body;
  

//     try {
//       // Check if users exist
//       const userDocuments = await User.find({ _id: { $in: users } });
//       if (userDocuments.length === 0) {
//         return res.status(400).json({ message: 'Invalid users provided' });
//       }
  
//       // Check if all groups exist
//       const groupDocuments = await Group.find({ _id: { $in: groups } });
//       if (groupDocuments.length !== groups.length) {
//         return res.status(400).json({ message: 'One or more invalid groups provided' });
//       }
      
  
//       // Check if all geofences exist
//       // const geofenceDocuments = await Geofence.find({ _id: { $in: geofences } });
//       // if (geofenceDocuments.length !== geofences.length) {
//       //   return res.status(400).json({ message: 'One or more invalid geofences provided' });
//       // }
  

//       // Create new device
//       const device = new Device({
//         devicename,
//         imei,
//         sim,
//         groups,
//         users,
//         geofences,
//         speed,
//         average,
//         model,
//         category,
//         installationdate,
//         expirationdate,
//         extenddate,
//       });
  
//       await device.save();
  
//       return res.status(201).json({ message: 'Device added successfully', device });
//     } catch (error) {
//       return res.status(500).json({ message: 'Error adding device', error });
//     }
// };
export const addDevice = async (req, res) => {
  const {
    devicename,
    imei,
    sim,
    groups,   // Can be a single group ID or an array of group IDs
    users,    // Can be a single user ID or an array of user IDs
    geofences,
    speed,
    average,
    model,
    category,
    installationdate,
    expirationdate,
    extenddate,
  } = req.body;

  try {
    // Normalize users and groups to arrays if they are not already
    const userIds = Array.isArray(users) ? users : [users];
    const groupIds = Array.isArray(groups) ? groups : [groups];

    // Check if users exist
    const userDocuments = await User.find({ _id: { $in: userIds } });
    if (userDocuments.length !== userIds.length) {
      return res.status(400).json({ message: 'One or more invalid users provided' });
    }

    // Check if groups exist
    const groupDocuments = await Group.find({ _id: { $in: groupIds } });
    if (groupDocuments.length !== groupIds.length) {
      return res.status(400).json({ message: 'One or more invalid groups provided' });
    }

    // Create new device
    const device = new Device({
      devicename,
      imei,
      sim,
      groups: groupIds, // Store as an array of group IDs
      users: userIds,    // Store as an array of user IDs
      geofences,
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
