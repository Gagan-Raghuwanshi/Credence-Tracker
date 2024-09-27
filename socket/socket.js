// sockets/socket.js
import { Server } from "socket.io";
import axios from "axios";

export const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("A new user connected", socket.id);
    let targetDeviceId = 2636;
    socket.emit("user", `welcome back ${socket.id}`);
    socket.on("deviceId", (deviceId) => {
      targetDeviceId = deviceId;
    });

    // this is for devices start
    let devicelist = null;
    let devicelistFromAPI = {
      category: "",
      status: "",
      lastUpdate: "",
      name: "",
    };
    setInterval(() => {
      (async function () {
        const url = "http://104.251.212.84/api/devices";
        const username = "hbtrack";
        const password = "123456@";

        try {
          const response = await axios.get(url, {
            auth: { username: username, password: password },
          });
          devicelist = response.data;
          devicelistFromAPI = devicelist.find(
            (device) => device.id === targetDeviceId
          );

          // console.log('API response data:'/, devicelist);
        } catch (error) {
          console.error("Error fetching data from API:", error);
        }
      })();
    }, 30000);
    // this is for devices end

    // in this setinterval i emiting event 
    setInterval(() => {
      (async function () {
        const url = "http://104.251.212.84/api/positions";
        const username = "hbtrack";
        const password = "123456@";

        try {
          const response = await axios.get(url, {
            auth: { username: username, password: password },
          });
          const data = response.data;
          // console.log("data from GPS device ",data)
          // console.log("BBBBBBBBBBB")

          const device = data.find(
            (device) => device.deviceId === targetDeviceId
          );
          if (device) {
            const dataForSocket = {
              speed: device.speed,
              longitude: device.longitude,
              latitude: device.latitude,
              course: device.course,
              deviceId: device.deviceId,
              deviceTime: device.deviceTime,
              ignition: device.attributes.ignition,
              distance: device.attributes.distance,
              totalDistance: device.attributes.totalDistance,
              event: device.attributes.event,
              category: devicelistFromAPI.category,
              status: devicelistFromAPI.status,
              lastUpdate: devicelistFromAPI.lastUpdate,
              name: devicelistFromAPI.name,
            };
            // console.log("device",dataForSocket)
            socket.emit("all data", dataForSocket);
            // console.log("SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS")
          }
        } catch (error) {
          console.error(
            "There was a problem with the fetch operation:",
            error.message
          );
        }
      })();
    }, 2000);
  });

  return io;
};
