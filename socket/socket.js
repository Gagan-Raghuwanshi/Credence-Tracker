// sockets/socket.js
import { Server } from "socket.io";
import axios from "axios";
import { AlertFetching } from "../utils/alert.utils.js";

export const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173", "http://localhost:3000"],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("A new user connected", socket.id);
    let targetDeviceId = null;
    let singleDeviceInterval, allDeviceInterval;

    socket.on("disconnect", (reason) => {
      console.log(`User ${socket.id} disconnected. Reason: ${reason}`);

      // Clear intervals to stop data emission after disconnect
      clearInterval(singleDeviceInterval);
      clearInterval(allDeviceInterval);
    });

    socket.on("deviceId", (deviceId) => {
      targetDeviceId = deviceId;
      console.log("data type", typeof deviceId, deviceId);
    });

            

    // setInterval(() => {
    //   // console.log("deviceId", typeof targetDeviceId, targetDeviceId)
    // }, 3000);

    // setInterval(() => {
    //   socket.emit("user", `welcome back ${socket.id}`);
    // }, 1000);

    // single device data
    singleDeviceInterval = setInterval(() => {
      if (targetDeviceId != null) {
        // this is for devices start
        let devicelist = null;
        let devicelistFromAPI = {
          category: "",
          status: "",
          lastUpdate: "",
          name: "",
        };
        // setInterval(() => {
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

            // console.log('API response data:', devicelist);
          } catch (error) {
            console.error("Error fetching data from API:", error);
          }
        })();
        // console.log("deviceId", typeof targetDeviceId, targetDeviceId)
        // }, 10000);
        // this is for devices end

        // in this setinterval i am emiting event
        // setInterval(() => {
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
            // console.log("device",device)
            if (device) {
              const dataForSocket = {
                speed: device.speed,
                longitude: device.longitude,
                latitude: device.latitude,
                course: device.course,
                deviceId: device.deviceId,
                deviceTime: device.deviceTime,
                // ignition: device.attributes.ignition,
                // distance: device.attributes.distance,
                // totalDistance: device.attributes.totalDistance,
                // event: device.attributes.event,
                attributes: device.attributes,
                category: devicelistFromAPI.category,
                status: devicelistFromAPI.status,
                lastUpdate: devicelistFromAPI.lastUpdate,
                name: devicelistFromAPI.name,
                uniqueId: devicelistFromAPI.uniqueId,
              };
              console.log("single device data");
              socket.emit("single device data", dataForSocket);
              // console.log(
              //   "SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS"
              // );
            }
          } catch (error) {
            console.error(
              "There was a problem with the fetch operation:",
              error.message
            );
          }
        })();
        // }, 10000);
      }
    }, 10000);

    // allDeviceInterval = setInterval(() => {

    // }, 10000);

    // all device data
    let deviceListData = "";

    // fetch data instant for first time 
    setTimeout(() => {
      (async function () {
        const url = "http://104.251.212.84/api/devices";
        const username = "hbtrack";
        const password = "123456@";

        try {
          const response = await axios.get(url, {
            auth: { username: username, password: password },
          });
          deviceListData = response.data;
          // console.log("AAAAAAAAAAAAA",deviceListData)

          // console.log('API response data:'/, devicelist);
        } catch (error) {
          console.error("Error fetching data from API:", error);
        }
      })();

      setTimeout(() => {
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
            const deviceListDataMap = new Map(
              deviceListData.map((item) => [item.id, item])
            );

            const mergedData = data.map((obj1) => {
              const match = deviceListDataMap.get(obj1.deviceId);
              return {
                speed: obj1.speed,
                longitude: obj1.longitude,
                latitude: obj1.latitude,
                course: obj1.course,
                deviceId: obj1.deviceId,
                deviceTime: obj1.deviceTime,
                // ignition: obj1.attributes.ignition,
                // distance: obj1.attributes.distance,
                // totalDistance: obj1.attributes.totalDistance,
                // event: obj1.attributes.event,
                attributes: obj1.attributes,
                category: match ? match.category : null,
                status: match ? match.status : null,
                lastUpdate: match ? match.lastUpdate : null,
                name: match ? match.name : null,
                uniqueId: match ? match.uniqueId : null,
              };
            });

            // console.log("device",mergedData)
            // console.log("All device data", mergedData);
            socket.emit("all device data", mergedData);
            // console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA  first");

          } catch (error) {
            console.error(
              "There was a problem with the fetch operation:",
              error.message
            );
          }
        })();
      }, 1000);

    }, 100);





    allDeviceInterval = setInterval(() => {
      (async function () {
        const url = "http://104.251.212.84/api/devices";
        const username = "hbtrack";
        const password = "123456@";

        try {
          const response = await axios.get(url, {
            auth: { username: username, password: password },
          });
          deviceListData = response.data;
          // console.log("AAAAAAAAAAAAA",deviceListData)

          // console.log('API response data:'/, devicelist);
        } catch (error) {
          console.error("Error fetching data from API:", error);
        }
      })();

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
          const deviceListDataMap = new Map(
            deviceListData.map((item) => [item.id, item])
          );

          const mergedData = data.map((obj1) => {
            const match = deviceListDataMap.get(obj1.deviceId);
            return {
              speed: obj1.speed,
              longitude: obj1.longitude,
              latitude: obj1.latitude,
              course: obj1.course,
              deviceId: obj1.deviceId,
              deviceTime: obj1.deviceTime,
              // ignition: obj1.attributes.ignition,
              // distance: obj1.attributes.distance,
              // totalDistance: obj1.attributes.totalDistance,
              // event: obj1.attributes.event,
              attributes: obj1.attributes,
              category: match ? match.category : null,
              status: match ? match.status : null,
              lastUpdate: match ? match.lastUpdate : null,
              name: match ? match.name : null,
              uniqueId: match ? match.uniqueId : null,
            };
          });

          // console.log("device",mergedData)
          // console.log("All device data", mergedData);
          socket.emit("all device data", mergedData);
          // console.log("Gagan Raghuwanshi");
        } catch (error) {
          console.error(
            "There was a problem with the fetch operation:",
            error.message
          );
        }
      })();
    }, 10000);
  });

  return io;
};
