import fetch from "node-fetch";
import { History } from "../models/history.model.js";

export const fetchGPSdata = async () => {
  const url = "http://104.251.212.84/api/positions";
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
    // console.log("data from GPS device ",data)
    for (const gpsdata of data) {
      const {speed,longitude,latitude,course,deviceId } = gpsdata
      const { ignition,distance,totalDistance} = gpsdata.attributes
    //   console.log("count", speed,longitude,latitude,course,deviceId,ignition,distance,totalDistance)
      
      // const newData = new History({ speed, longitude,latitude,course,deviceId,ignition,distance,totalDistance });
      // await newData.save(); 
    }
  } catch (error) {
    console.error("There was a problem with the fetch operation:", error.message);
  }
};
