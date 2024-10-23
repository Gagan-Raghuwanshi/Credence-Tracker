import { Devicelist } from "../models/devicelist.model.js";
import axios from "axios";

export const fetchdevicedata = async () => {
  // const url = "http://104.251.212.84/api/devices";
  const url = "http://63.142.251.13:8082/devices";
  const username = "hbtrack";
  const password = "123456@";

  // Create the base64 encoded string for Basic Authentication

  try {
    const response = await axios.get(url, { auth: { username: username, password: password }, });
    const data = response.data;
    //     console.log("data from  device list ")
    for (const devicelistdata of data) {

      const { id, uniqueId, positionId, status, lastUpdate } = devicelistdata

      // console.log("count", id,uniqueId,positionId,status,lastUpdate)
      // const newData = new Devicelist({ deviceId:id,uniqueId,positionId,status,lastUpdate });
      // await newData.save(); 
    }
  } catch (error) {
    console.error("There was a problem with the fetch operation:", error.message);
  }
};

