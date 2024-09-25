import { Group } from "../models/group.model.js";
//import { Geofence } from "../models/geofence.js";
import { Device } from '../models/device.model.js';
import { User } from "../models/usermodel.js"

//  add a device
export const addDevice = async (req, res) => {
  const {
    devicename,
    uniqueId,
    sim,
    groupId,   
    userId,
    DriverId,  
    geofencesId,
    speed,
    average,
    modelId,
    categoryId,
    installationdate,
    expirationdate,
    extenddate,
  } = req.body;

  try {

        const findUniqueId = await Device.findOne({uniqueId})

        if(!findUniqueId) {

    const device = new Device({
      devicename,
    uniqueId,
    sim,
    groups:groupId,   
    users:userId,
    Driver:DriverId,  
    geofences:geofencesId,
    speed,
    average,
    models:modelId,
    categories:categoryId,
    installationdate,
    expirationdate,
    extenddate,
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


