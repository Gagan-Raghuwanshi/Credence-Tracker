// import { Group } from "../models/group.model.js";
//import { Geofence } from "../models/geofence.js";
import { Device } from '../models/device.model.js';
import { User } from "../models/usermodel.js"
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

  try {

        const findUniqueId = await Device.findOne({uniqueId})

        if(!findUniqueId) {

    const device = new Device({
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
    createdBy
    });

    await device.save();

    return res.status(201).json({ message: 'Device added successfully', device });

}
else{
  res.status(409).json({ message: "IMEI Number Is Already Exist" });
}
  } catch (error) {
    return res.status(500).json({ message: 'Error adding device', error });
  }
};


export const getDeviceById = async (req, res) => {
  const  id  = req.user.id;
  
  const { page = 1, limit = 10 } = req.query;
  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);
  const startIndex = (pageNumber - 1) * limitNumber;
  try {
    const devices = await Device.find({ createdBy: id }).sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limitNumber)
      .populate('Driver','name')
      .populate('groups','name')
      .populate('users','username');
    const totalDevices = await Device.countDocuments({ createdBy: id }).sort({ createdAt: -1 });
    if (devices.length === 0) {
      return res.status(404).json({ message: 'Device not found' });
    }

    
    const cacheKey = 'getDeviceById';
    const cachedDevice = cache.get(cacheKey);
    if (cachedDevice) {
      console.log('Cache hit');
      return res.status(200).json(cachedDevice);
    }
   

    res.status(200).json({
      totalDevices,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalDevices / limitNumber),
      devices,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching Device',
      error: error.message,
    });
  }
};


export const getAllDevice = async (req, res) => {

  const cacheKey = 'allDevices';

  const cachedDevices = cache.get(cacheKey);
  if (cachedDevices) {
    console.log('Cache hit');
    return res.status(200).json(cachedDevices);
  }

  try {
    const { search, page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const startIndex = (pageNumber - 1) * limitNumber;
    let filter = {};
    if (search) {
      filter = { devicename: { $regex: search, $options: 'i' } };
    }
    const totalDevices = await Device.countDocuments(filter);

    const device = await Device.find(filter)
      .skip(startIndex)
      .limit(limitNumber)
      .populate('Driver','name')
      .populate('groups','name')
      .populate('users','username')

    res.status(200).json({
      totalDevices,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalDevices / limitNumber),
      device,
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
  try {
    const deletedDevice = await Device.findOneAndDelete({ _id:id });
    if (!deletedDevice) {
      return res.status(404).json({ message: 'Device not found' });
    }
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


