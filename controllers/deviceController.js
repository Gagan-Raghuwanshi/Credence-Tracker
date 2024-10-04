// import { Group } from "../models/group.model.js";
//import { Geofence } from "../models/geofence.js";
import { Device } from '../models/device.model.js';
import { Devicelist } from '../models/devicelist.model.js';
import { User } from '../models/usermodel.js';
import cache from "../utils/cache.js";

//  add a device
export const addDevice = async (req, res) => {
  const {
    name,
    uniqueId,
    sim,
    groups,   
    users,
    Driver,  
    geofences,
    speed,
    average,
    model,
    category,
    installationdate,
    expirationdate,
    extenddate,
  } = req.body;
  const createdBy = req.user.id;
          console.log(createdBy);
          
  try {

    const user = await User.findById({_id :createdBy});

    if (user.entriesCount >= user.dataLimit) {
      return res.status(403).json({ message: "Data limit reached. You cannot add more entries." });
    }

        const findUniqueId = await Device.findOne({uniqueId})
        const findbygivenId  = await Devicelist.findOne({uniqueId})
        // console.log("findbygivenId",findbygivenId)

        if(!findUniqueId) {

    const device = new Device({
      name,
    uniqueId,
    deviceId:findbygivenId.deviceId,
    lastUpdate:findbygivenId.lastUpdate,
    positionId:findbygivenId.positionId,
    sim,
    groups,   
    users,
    Driver,  
    geofences,
    speed,
    average,
    model,
    category,
    installationdate,
    expirationdate,
    extenddate,
    createdBy,
    // positionId:findbygivenId.positionId,
    // status:findbygivenId.status,
    // lastUpdate:findbygivenId.lastUpdate,
    });

    await device.save();

    user.entriesCount += 1;    
      await user.save();

    return res.status(201).json({ message: 'Device added successfully', device });

}
else{
  res.status(409).json({ message: "IMEI Number Is Already Exist" });
}
  } catch (error) {
    console.log(error);
    
    return res.status(500).json({ message: 'Error adding device', error });
  }
};

export const getDevices = async (req, res) => {
  const role = req.user.role;
  const userId = req.user.id;

  try {
    const { search, page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const startIndex = (pageNumber - 1) * limitNumber;

    let filter = {};

    if (search) {
      filter.devicename = { $regex: search, $options: 'i' };
    }

    if (role === 'superadmin') {
      console.log('Superadmin access: All devices');
    } else {
      filter.createdBy = userId;
      console.log(`Restricted access for role ${role}: Only devices created by user ${userId}`);
    }

    const totalDevices = await Device.countDocuments(filter);

    const devices = await Device.find(filter)
      .skip(startIndex)
      .limit(limitNumber)
      .populate('Driver', 'name')
      .populate('groups', 'name')
      .populate('users', 'username');

    res.status(200).json({
      totalDevices,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalDevices / limitNumber),
      devices,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching devices',
      error: error.message,
    });
  }
};


export const updateDeviceById = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  try {
    const updatedDevice = await Device.findOneAndUpdate(
      { _id:id },
      updates,
      { new: true, runValidators: true }
    );
    if (!updatedDevice) {
      return res.status(404).json({ message: 'Device not found' });
    }
    res.status(200).json(updatedDevice);
  } catch (error) {
    res.status(500).json({
      message: 'Error updating Device',
      error: error.message,
    });
  }
};


export const deleteDeviceById = async (req, res) => {
  const { id } = req.params;
  const createdBy = req.user.id;

  try {
    const user = await User.findById({_id :createdBy});
    const deletedDevice = await Device.findOneAndDelete({ _id:id });
    if (!deletedDevice) {
      return res.status(404).json({ message: 'Device not found' });
    }
    user.entriesCount -= 1;    
   const check = await user.save();

    res.status(200).json({
      message: 'Device deleted successfully',
      device: deletedDevice,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error deleting Device',
      error: error.message,
    });
  }
};


export const getDeviceByGroup = async (req, res) => {
  try {
      const { groupId } = req.params;

      console.log(groupId);
      

      const devices = await Device.find({
        groups: { $in: [groupId] }
    }).select('name deviceId'); 

      if (!devices || devices.length === 0) {
          return res.status(404).json({
              success: false,
              message: `No devices found for the groupId: ${groupId}`,
          });
      }

      res.status(200).json({
          success: true,
          message: `Devices found for groupId: ${groupId}`,
          data: devices,
      });
  } catch (error) {
      console.error('Error fetching devices by groupId:', error);
      res.status(500).json({
          success: false,
          message: 'Server error fetching devices by groupId',
          error: error.message,
      });
  }
};

