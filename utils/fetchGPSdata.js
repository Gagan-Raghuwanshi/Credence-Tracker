import { History } from "../models/history.model.js";
import { Device } from "../models/device.model.js";
import axios from "axios";

export const fetchGPSdata = async () => {
  const url = "http://104.251.212.84/api/positions";
  const username = "hbtrack";
  const password = "123456@";

  try {
    // Make the fetch request
    console.log("Fetching data from GPS device...");
    const response = await axios.get(url, { auth: { username: username, password: password }, });
    const data = response.data;


    const savePromises = data.map(dataItem => {
      if (dataItem.attributes.distance >= 500) {
        dataItem.attributes.distance = 0;
      }
      const dataDoc = new History(dataItem);
      // return dataDoc.save();
    });

    await Promise.all(savePromises);

    // console.log("data from GPS device ",data)
    // for (const gpsdata of data) {

    //   const {speed,longitude,latitude,course,deviceId,deviceTime } = gpsdata
    //   const { ignition,distance,totalDistance,event} = gpsdata.attributes

    //   const device = await Device.findOne({deviceId:deviceId})
    //   let category = " "
    //   if (device) {
    //     category = device.category
    //   }
    // console.log("count", speed,longitude,latitude,course,deviceId,deviceTime,ignition,distance,totalDistance,category,event)
    // console.log("device",category)
    // const newData = new History({ speed, longitude,latitude,course,deviceId,category,deviceTime,ignition,distance,totalDistance,event });
    // await newData.save(); 
    // }
  } catch (error) {
    console.error("There was a problem with the fetch operation:", error.message);
  }
};
