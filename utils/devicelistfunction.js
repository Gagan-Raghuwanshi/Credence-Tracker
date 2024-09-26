import fetch from "node-fetch";
import { Devicelist } from "../models/devicelist.model.js";

export const fetchdevicedata = async () => {
  const url = "http://104.251.212.84/api/devices";
  const username = "hbtrack";
  const password = "123456@";

  // Create the base64 encoded string for Basic Authentication
  const headers = {
    Authorization:
      "Basic " + Buffer.from(`${username}:${password}`).toString("base64"),
  };

  try {
    // Make the fetch request
    const response = await fetch(url, {
      method: "GET",
      headers: headers,
    });

    if (!response.ok) {
      throw new Error("Network response was not ok: " + response.statusText);
    }

    const data = await response.json();
//     console.log("data from  device list ")
    for (const devicelistdata of data) {
      
      const {id,uniqueId,positionId,status,lastUpdate } = devicelistdata

     //  console.log("count", id,uniqueId,positionId,status,lastUpdate)
     //  const newData = new Devicelist({ deviceId:id,uniqueId,positionId,status,lastUpdate });
     //  await newData.save(); 
    }
  } catch (error) {
    console.error("There was a problem with the fetch operation:", error.message);
  }
};

 