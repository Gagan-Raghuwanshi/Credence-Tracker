// import { Group } from "../models/group.model.js";
//import { Geofence } from "../models/geofence.js";
import jwt from "jsonwebtoken";
import { Device } from "../models/device.model.js";
import { Devicelist } from "../models/devicelist.model.js";
import { ShareDevice } from "../models/shareDevice.model.js";
import { User } from "../models/usermodel.js";
import { SuperAdmin } from "../models/superadminModel.js";
import { VehicleChange } from "../models/vehicleLogReports.model.js";
import mongoose from 'mongoose';
const { ObjectId } = mongoose.Types;
import axios from "axios";
import { Group } from "../models/group.model.js";

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
  let user;


  try {


    if (req.user.role === 'superadmin') {
      user = await SuperAdmin.findById({ _id: createdBy });
    } else {
      user = await User.findById({ _id: createdBy });
      if (user.entriesCount >= user.dataLimit) {
        return res
          .status(403)
          .json({ message: "Data limit reached. You cannot add more entries." });
      }
    }

    const findUniqueId = await Device.findOne({ uniqueId });
    // const findbygivenId = await Devicelist.findOne({ uniqueId });


    if (!findUniqueId) {


      const url = "http://104.251.212.84/api/devices";
      const username = "hbtrack";
      const password = "123456@";
      let deviceListArray;

      try {
        const response = await axios.get(url, { auth: { username: username, password: password }, });
        const data = response.data;
        deviceListArray = data
      } catch (error) {
        console.error("There was a problem with the fetch operation:", error.message);
        return res.json({ message: "Internal server error... please try again... " })
      }

      const findbygivenId = deviceListArray.find(device => device.uniqueId === uniqueId);

      console.log("findbygivenId", findbygivenId)



      const device = new Device({
        name,
        uniqueId,
        deviceId: findbygivenId.id,
        lastUpdate: findbygivenId.lastUpdate,
        positionId: findbygivenId.positionId,
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

      });

      await device.save();

      user.entriesCount += 1;
      await user.save();

      return res
        .status(201)
        .json({ message: "Device added successfully", device });
    } else {
      res.status(409).json({ message: "IMEI Number Is Already Exist" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error adding device please try again...", error });
  }
};

export const getDevices = async (req, res) => {
  const role = req.user.role;
  const userId = req.user.id;

  console.log("pavan id", userId);

  try {
    const { search, page = 1, limit = Number.MAX_SAFE_INTEGER } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const startIndex = (pageNumber - 1) * limitNumber;

    let filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { uniqueId: { $regex: search, $options: "i" } },
        { sim: { $regex: search, $options: "i" } },
        { model: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } }
      ];
    }

    if (role === "superadmin") {
      console.log("Superadmin access: All devices");
    } else {
      filter.$and = [
        {
          $or: [
            { createdBy: userId },
            { users: userId }
          ]
        },
        filter.$or
      ];
    }

    const totalDevices = await Device.countDocuments(filter);

    const devices = await Device.find(filter)
      .skip(startIndex)
      .limit(limitNumber)
      .populate("Driver", "name")
      .populate("groups", "name")
      .populate("users", "username")
      .populate("geofences", "name");

    res.status(200).json({
      totalDevices,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalDevices / limitNumber),
      devices,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching devices",
      error: error.message,
    });
  }
};




export const updateDeviceById = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const updatedDevice = await Device.findOneAndUpdate({ _id: id }, updates, {
      new: true,
      runValidators: true,
    });
    if (!updatedDevice) {
      return res.status(404).json({ message: "Device not found" });
    }

    const {
      name,
      uniqueId,
      deviceId,
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
      newName, newSimno, newImei, previousSubscriptionStartDate, ignNotConnectedChange, ignWirePositive, added, newTimezone,
    } = updates

    console.log("pavan data is coming", name, newName, newSimno, newImei, previousSubscriptionStartDate, ignNotConnectedChange, ignWirePositive, added, newTimezone);

    const createdBy = req.user.id;
    const vehiclelogData = new VehicleChange({
      name,
      oldImei: uniqueId,
      deviceId,
      oldSimno: sim,
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
      changedBy: createdBy,
      newName, newSimno, newImei, previousSubscriptionStartDate, ignNotConnectedChange, ignWirePositive, added, newTimezone,
    });

    await vehiclelogData.save();

    res.status(200).json(updatedDevice);


  } catch (error) {
    res.status(500).json({
      message: "Error updating Device",
      error: error.message,
    });
  }
};

export const deleteDeviceById = async (req, res) => {
  const { id } = req.params;
  const createdBy = req.user.id;
  let user;
  try {
    if (req.user.role === 'superadmin') {
      user = await SuperAdmin.findById({ _id: createdBy });
    } else {
      user = await User.findById({ _id: createdBy });
    }
    const deletedDevice = await Device.findOneAndDelete({ _id: id });
    if (!deletedDevice) {
      return res.status(404).json({ message: "Device not found" });
    }
    user.entriesCount -= 1;
    const check = await user.save();

    res.status(200).json({
      message: "Device deleted successfully",
      device: deletedDevice,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting Device",
      error: error.message,
    });
  }
};

export const getDeviceByGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    console.log(groupId);

    const devices = await Device.find({
      groups: { $in: [groupId] },
    }).select("name deviceId");

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
    console.error("Error fetching devices by groupId:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching devices by groupId",
      error: error.message,
    });
  }
};

export const createShareDevice = async (req, res) => {
  try {
    const { username, password, deviceId, expiration } = req.body;

    // console.log(username, password, deviceId, expiration);

    // Check if device with the same deviceId already exists
    const existingDevice = await ShareDevice.findOne({ deviceId });
    // const decryptedPassword = existingDevice.decryptPassword(); // Decrypt the password    
    if (existingDevice) {

      const expirationTimestamp = Math.floor(new Date(existingDevice.expiration).getTime() / 1000);
      // console.log(existingDevice,decryptedPassword)

      const token = jwt.sign(
        {
          deviceId: existingDevice.deviceId,
          expiration: existingDevice.expiration,
        },
        process.env.JWT_SECRET,
        { expiresIn: expirationTimestamp - Math.floor(Date.now() / 1000) }
      );
      // console.log(token)

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log(decoded)

      return res.status(409).json({
        message: "Device with this ID already exists. See your URL.",
        success: true,
        url: `http://104.251.212.84?token=${token}`
      });
    }

    const createDeviceForShare = await ShareDevice.create({
      username,
      password,
      deviceId,
      expiration: new Date(expiration)
    });
    // console.log(createDeviceForShare)

    const expirationTimestamp = Math.floor(new Date(createDeviceForShare.expiration).getTime() / 1000);

    const token = jwt.sign(
      {
        deviceId: createDeviceForShare.deviceId,
        expiration: createDeviceForShare.expiration,
      },
      process.env.JWT_SECRET,
      { expiresIn: expirationTimestamp - Math.floor(Date.now() / 1000) }
    );
    // console.log(token)

    res.status(201).json({
      message: "Device successfully created. See your URL.",
      success: true,
      url: `http://104.251.212.84?token=${token}`
    });

  } catch (error) {
    console.error("Error:", error.message);
    // Return error response
    res.status(500).json({
      message: "Server error. Please try again later.",
      success: false,
      error: error.message
    });
  }
};





// code for import data


// export const importDeviceData = async (req, res) => {
//   try {
//     const registrationData = req.body;

//     if (!Array.isArray(registrationData) || registrationData.length === 0) {
//       return res.status(400).json({ error: 'No registration data provided' });
//     }

//     const processedDevice = [];

//     const registrationPromises = registrationData.map(async (data) => {
//       const {
//         name,
//         uniqueId,
//         sim,
//         model,
//         category,
//         lastUpdate,
//         vStatus,
//         dStatus,
//         added,
//         subStart,
//         expirationdate,
//         inactiveDate,
//         modifiedDate,

//       } = data;

//       if (!name || !uniqueId ) {
//         throw new Error(`Device name, unique ID are required.`);
//       }

//       let device = await Device.findOne({ name });

//       if (!device) {

//         device = new Device({

//           statusOfRegister: 'pending'
//         });

//         await device.save();
//       }

//       const newDevice = new Device({
//         name,
//         uniqueId,
//         sim,
//         model,
//         category,
//         lastUpdate,
//         vStatus,
//         dStatus,
//         added,
//         subStart,
//         expirationdate,
//         inactiveDate,
//         modifiedDate,
//       });

//       await newVehicle.save();

//       processedDevice.push({ device, device: newDevice });
//     });

//     await Promise.all(registrationPromises);

//     res.status(201).json({ registeredVehicles: processedDevice });
//   } catch (error) {
//     console.error('Error during registration:', error.message);
//     res.status(400).json({ error: error.message });
//   }
// };



export const importDeviceData = async (req, res) => {
  try {
    const registrationData = req.body;

    if (!Array.isArray(registrationData) || registrationData.length === 0) {
      return res.status(400).json({ error: 'No registration data provided' });
    }

    const processedDevices = [];
    const failedEntries = [];


    const url = "http://104.251.212.84/api/devices";
    const username = "hbtrack";
    const password = "123456@";
    let deviceListArray;

    try {
      const response = await axios.get(url, { auth: { username: username, password: password }, });
      const data = response.data;
      deviceListArray = data
    } catch (error) {
      console.error("There was a problem with the fetch operation:", error.message);
      return res.json({ message: "Internal server error... please try again... " })
    }



    const registrationPromises = registrationData.map(async (data) => {
      const {
        name,
        uniqueId,
        sim,
        model,
        category,
        lastUpdate,
        installationdate,
        subStart,
        expirationdate,
        inactiveDate,
        modifiedDate,
        createdBy
      } = data;


      try {
        if (!name || !uniqueId) {
          throw new Error(`Device name and unique ID are required for device: ${name || 'Unknown'}`);
        }

        let existingDevice = await Device.findOne({ uniqueId });
        if (existingDevice) {
          throw new Error(`Device with name already exists: ${uniqueId}`);
        }

        const findbygivenId = deviceListArray.find(device => device.uniqueId === uniqueId);

        // console.log("findbygivenId",findbygivenId)

        // const findbygivenId = await Devicelist.findOne({ uniqueId });        

        if (findbygivenId) {
          const usernameee = await User.findOne({ username: createdBy })

          const newDevice = new Device({
            name,
            uniqueId,
            sim,
            model,
            category,
            lastUpdate,
            installationdate,
            subStart,
            expirationdate,
            inactiveDate,
            modifiedDate,
            deviceId: findbygivenId.id,
            createdBy: usernameee._id

          });

          const response = await newDevice.save();
          processedDevices.push({ device: response.toObject() });
        } else {
          throw new Error("DeviceId cannot be null");
        }


      } catch (error) {
        failedEntries.push({ error: error.message, data });
      }
    });

    await Promise.allSettled(registrationPromises);

    res.status(201).json({
      success: processedDevices,
      failed: failedEntries
    });

  } catch (error) {
    console.error('Error during device registration:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

console.log();

// for super admin

// export const importDeviceData = async (req, res) => {
//   try {
//     const registrationData = req.body;

//     if (!Array.isArray(registrationData) || registrationData.length === 0) {
//       return res.status(400).json({ error: 'No registration data provided' });
//     }

//     const processedDevices = [];
//     const failedEntries = [];


//     const url = "http://104.251.212.84/api/devices";
//     const username = "hbtrack";
//     const password = "123456@";
//     let deviceListArray;

//     try {
//       const response = await axios.get(url, {auth: { username: username, password: password },});
//       const data = response.data;
//       deviceListArray = data
//     } catch (error) {
//       console.error("There was a problem with the fetch operation:", error.message);
//       return res.json({message:"Internal server error... please try again... "})
//     }



//     const registrationPromises = registrationData.map(async (data) => {
//       const {
//         name,
//         uniqueId,
//         sim,
//         model,
//         category,
//         lastUpdate,
//         installationdate,
//         subStart,
//         expirationdate,
//         inactiveDate,
//         modifiedDate,
//         createdBy
//       } = data;


//       try {
//         if (!name || !uniqueId) {
//           throw new Error(`Device name and unique ID are required for device: ${name || 'Unknown'}`);
//         }

//         let existingDevice = await Device.findOne({ uniqueId });
//         if (existingDevice) {
//           throw new Error(`Device with name already exists: ${uniqueId}`);
//         }

//         const findbygivenId = deviceListArray.find(device => device.uniqueId === uniqueId);

//         // console.log("findbygivenId",findbygivenId)

//         // const findbygivenId = await Devicelist.findOne({ uniqueId });        

//         if(findbygivenId){
//           const usernameee = await SuperAdmin.findOne({username:createdBy})

//           const newDevice = new Device({
//             name,
//             uniqueId,
//             sim,
//             model,
//             category,
//             lastUpdate,
//             installationdate,
//             subStart,
//             expirationdate,
//             inactiveDate,
//             modifiedDate,
//             deviceId:findbygivenId.id,
//             createdBy:usernameee._id

//           });

//           const response = await newDevice.save();
//           processedDevices.push({ device: response.toObject() });
//         }else{
//             throw new Error("DeviceId cannot be null");
//         }


//       } catch (error) {
//         failedEntries.push({ error: error.message, data });
//       }
//     });

//     await Promise.allSettled(registrationPromises);

//     res.status(201).json({
//       success: processedDevices,
//       failed: failedEntries
//     });

//   } catch (error) {
//     console.error('Error during device registration:', error.message);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };

// import  device update




// export const importDeviceUpdate = async (req, res) => {
//   try {
//     const registrationData = req.body;

//     if (!Array.isArray(registrationData) || registrationData.length === 0) {
//       return res.status(400).json({ error: 'No registration data provided' });
//     }

//     const processedDevices = [];
//     const failedEntries = [];






//     const registrationPromises = registrationData.map(async (data) => {
//       const {
//         name,
//         uniqueId,
//         // sim,
//         // model,
//         // category,
//         // lastUpdate,
//         // installationdate,
//         // subStart,
//         // expirationdate,
//         // inactiveDate,
//         // modifiedDate,
//         // createdBy
//       } = data;


//       try {
//         if (!name || !uniqueId) {
//           throw new Error(`Device name and unique ID are required for device: ${name || 'Unknown'}`);
//         }

//         let existingDevice = await Device.findOne({ uniqueId });

//         if (existingDevice) {
//           // Remove the element at index 0, if the array has any elements
//           if (existingDevice.groups.length > 0) {
//             existingDevice.groups.splice(0, 1); // Removes the first element (0th index)
//           }
//         const groupId = await Group.findOne({name}).select('_id')
//           // Insert the new groupId at the 0th index
//           existingDevice.groups.unshift(groupId);
        
//           // Save the updated device
//           await existingDevice.save();
//         }

//         // if (existingDevice) {
//         //   throw new Error(`Device with name already exists: ${uniqueId}`);
//         // }

//         // const findbygivenId = deviceListArray.find(device => device.uniqueId === uniqueId);

//         // console.log("findbygivenId",findbygivenId)

//         // const findbygivenId = await Devicelist.findOne({ uniqueId });        

//         // if(findbygivenId){
//         //   const usernameee = await User.findOne({username:createdBy})

//         //   const newDevice = new Device({
//         //     name,
//         //     uniqueId,
//         //     sim,
//         //     model,
//         //     category,
//         //     lastUpdate,
//         //     installationdate,
//         //     subStart,
//         //     expirationdate,
//         //     inactiveDate,
//         //     modifiedDate,
//         //     deviceId:findbygivenId.id,
//         //     createdBy:usernameee._id

//         //   });

//         //   const response = await newDevice.save();
//         //   processedDevices.push({ device: response.toObject() });
//         // }else{
//         //     throw new Error("DeviceId cannot be null");
//         // }


//       } catch (error) {
//         failedEntries.push({ error: error.message, data });
//       }
//     });

//     await Promise.allSettled(registrationPromises);

//     res.status(201).json({
//       success: processedDevices,
//       failed: failedEntries
//     });

//   } catch (error) {
//     console.error('Error during device registration:', error.message);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };