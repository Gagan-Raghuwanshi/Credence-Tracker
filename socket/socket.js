// sockets/socket.js
import { Server } from "socket.io";
import axios from "axios";
import { AlertFetching } from "../utils/alert.utils.js";
import { ShareDevice } from "../models/shareDevice.model.js";
import jwt from "jsonwebtoken";
import { onUserConnect, onUserDisconnect } from "../utils/alert.utils.js";

export const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",                             // ["http://localhost:5173", "http://localhost:3000"],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("A new user connected", socket.id);
    let singleDeviceInterval, allDeviceInterval;

    // Get userId(objectId) when the user connects
    socket.on('registerUser', (userId) => {
      onUserConnect(socket, userId);
    });

    socket.on("disconnect", (reason) => {
      console.log(`User ${socket.id} disconnected. Reason: ${reason}`);
      onUserDisconnect(socket);  // For removing user from userSocketMap in the alerts
      // Clear intervals to stop data emission after disconnect
      clearInterval(singleDeviceInterval);
      clearInterval(allDeviceInterval);
    });

    /* ================= Live Tracking Start ================= */
    socket.on("credentials", (credentials) => {
      const userr = credentials.username            //"hbtrack";
      const pass = credentials.password            //"123456@";
      let deviceListData = "";
      let targetDeviceId = null;
      // console.log("credentials", userr, pass);

      /* ------------------- single device data start ------------------- */
      socket.on("deviceId", (deviceId) => {
        targetDeviceId = deviceId;
        console.log("data type", typeof deviceId, deviceId);

        // fetch single device data instant for first time
        if (targetDeviceId != null) {
          let devicelist = null;
          let devicelistFromAPI = {
            category: "",
            status: "",
            lastUpdate: "",
            name: "",
          };
          (async function () {
            const url = "http://104.251.212.84/api/devices";
            const username = userr;
            const password = pass;

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

          // in this setinterval i am emiting event
          (async function () {
            const url = "http://104.251.212.84/api/positions";
            const username = userr;
            const password = pass;

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
                socket.emit("single device data", dataForSocket);
                console.log("single device data");
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
        }

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
              const username = userr;
              const password = pass;

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
              const username = userr;
              const password = pass;

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
                    attributes: device.attributes,
                    category: devicelistFromAPI.category,
                    status: devicelistFromAPI.status,
                    lastUpdate: devicelistFromAPI.lastUpdate,
                    name: devicelistFromAPI.name,
                    uniqueId: devicelistFromAPI.uniqueId,
                    // ignition: device.attributes.ignition,
                    // distance: device.attributes.distance,
                    // totalDistance: device.attributes.totalDistance,
                    // event: device.attributes.event,
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
      });
      /* ------------------- single device data end ------------------- */

      /* ------------------- all device data start ------------------- */
      // fetch all device data instant for first time
      setTimeout(() => {
        (async function () {
          const url = "http://104.251.212.84/api/devices";
          const username = userr               //credentials.username;
          const password = pass               //credentials.password;

          try {
            const response = await axios.get(url, {
              auth: { username: username, password: password },
            });
            deviceListData = response.data;
            // console.log("AAAAAAAAAAAAA",deviceListData)

            // console.log('API response data:', devicelist);
          } catch (error) {
            console.error("Error fetching data from API:", error);
          }
        })();

        setTimeout(() => {
          (async function () {
            const url = "http://104.251.212.84/api/positions";
            const username = userr;
            const password = pass;

            try {
              const response = await axios.get(url, {
                auth: { username: username, password: password },
              });
              const data = response.data;
              // console.log("data from GPS device ",data)
              const deviceListDataMap = new Map(
                deviceListData.map((item) => [item.id, item])
              );

              const mergedData = data.map((obj1) => {
                if (obj1.attributes.distance > 500) {
                  obj1.attributes.distance = 200;
                }
                const match = deviceListDataMap.get(obj1.deviceId);
                return {
                  speed: obj1.speed,
                  longitude: obj1.longitude,
                  latitude: obj1.latitude,
                  course: obj1.course,
                  deviceId: obj1.deviceId,
                  deviceTime: obj1.deviceTime,
                  attributes: obj1.attributes,
                  category: match ? match.category : null,
                  status: match ? match.status : null,
                  lastUpdate: match ? match.lastUpdate : null,
                  name: match ? match.name : null,
                  uniqueId: match ? match.uniqueId : null,
                  // ignition: obj1.attributes.ignition,
                  // distance: obj1.attributes.distance,
                  // totalDistance: obj1.attributes.totalDistance,
                  // event: obj1.attributes.event,
                };
              });

              // console.log("device",mergedData)
              // console.log("All device data", mergedData);
              socket.emit("all device data", mergedData);
              console.log("all device data initial function");
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
          const username = userr;
          const password = pass;

          try {
            const response = await axios.get(url, {
              auth: { username: username, password: password },
            });
            deviceListData = response.data;
            // console.log("AAAAAAAAAAAAA",deviceListData)

            // console.log('API response data:', devicelist);
          } catch (error) {
            console.error("Error fetching data from API:", error);
          }
        })();

        (async function () {
          const url = "http://104.251.212.84/api/positions";
          const username = userr;
          const password = pass;

          try {
            const response = await axios.get(url, {
              auth: { username: username, password: password },
            });
            const data = response.data;
            // console.log("data from GPS device ",data)
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
                attributes: obj1.attributes,
                category: match ? match.category : null,
                status: match ? match.status : null,
                lastUpdate: match ? match.lastUpdate : null,
                name: match ? match.name : null,
                uniqueId: match ? match.uniqueId : null,
                // ignition: obj1.attributes.ignition,
                // distance: obj1.attributes.distance,
                // totalDistance: obj1.attributes.totalDistance,
                // event: obj1.attributes.event,
              };
            });

            // console.log("device",mergedData)
            // console.log("All device data", mergedData);
            socket.emit("all device data", mergedData);
            console.log("all device data");
          } catch (error) {
            console.error(
              "There was a problem with the fetch operation:",
              error.message
            );
          }
        })();
      }, 10000);
      /* ------------------- all device data end ------------------- */
    });
    /* ================= Live Tracking End ================= */

    /* ================= Share Device To Other Person Start ================= */
    socket.on("shared device token", async (token) => {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded) {
          const deviceId = decoded.deviceId;
          const existingDevice = await ShareDevice.findOne({ deviceId });
          const decryptedPassword = existingDevice.decryptPassword();

          // this function will start immediately as user connect with this socket
          if (existingDevice) {
            // this is for devices start
            let devicelist,
              devicelistFromAPI = {
                category: "",
                status: "",
                lastUpdate: "",
                name: "",
              };

            (async function () {
              const url = "http://104.251.212.84/api/devices";
              const username = existingDevice.username;
              const password = decryptedPassword;

              try {
                const response = await axios.get(url, {
                  auth: { username: username, password: password },
                });
                devicelist = response.data;
                devicelistFromAPI = devicelist.find(
                  (device) => device.id == deviceId
                );
                // console.log('API response data:', devicelist);
              } catch (error) {
                console.error("Error fetching data from API:", error);
              }
            })();

            // console.log("deviceId", typeof existingDevice, existingDevice)

            // this is for devices end
            (async function () {
              const url = "http://104.251.212.84/api/positions";
              const username = existingDevice.username;
              const password = decryptedPassword;

              try {
                const response = await axios.get(url, {
                  auth: { username: username, password: password },
                });
                const data = response.data;
                // console.log("data from GPS device ",data)
                // console.log("BBBBBBBBBBB")

                const device = data.find(
                  (device) => device.deviceId == deviceId
                );
                // console.log("device",device)
                if (device) {
                  const dataForSocket = {
                    speed: device.speed,
                    course: device.course,
                    deviceId: device.deviceId,
                    latitude: device.latitude,
                    longitude: device.longitude,
                    deviceTime: device.deviceTime,
                    attributes: device.attributes,
                    name: devicelistFromAPI.name,
                    status: devicelistFromAPI.status,
                    uniqueId: devicelistFromAPI.uniqueId,
                    category: devicelistFromAPI.category,
                    lastUpdate: devicelistFromAPI.lastUpdate,
                    // event: device.attributes.event,
                    // distance: device.attributes.distance,
                    // ignition: device.attributes.ignition,
                    // totalDistance: device.attributes.totalDistance,
                  };
                  socket.emit("shared device data", dataForSocket);
                  console.log("shared device data");
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
          }

          singleDeviceInterval = setInterval(() => {
            if (existingDevice) {
              // this is for devices start
              let devicelist,
                devicelistFromAPI = {
                  category: "",
                  status: "",
                  lastUpdate: "",
                  name: "",
                };

              (async function () {
                const url = "http://104.251.212.84/api/devices";
                const username = existingDevice.username;
                const password = decryptedPassword;

                try {
                  const response = await axios.get(url, {
                    auth: { username: username, password: password },
                  });
                  devicelist = response.data;
                  devicelistFromAPI = devicelist.find(
                    (device) => device.id == deviceId
                  );
                  // console.log('API response data:', devicelist);
                } catch (error) {
                  console.error("Error fetching data from API:", error);
                }
              })();

              // console.log("deviceId", typeof existingDevice, existingDevice)

              // this is for devices end
              (async function () {
                const url = "http://104.251.212.84/api/positions";
                const username = existingDevice.username;
                const password = decryptedPassword;

                try {
                  const response = await axios.get(url, {
                    auth: { username: username, password: password },
                  });
                  const data = response.data;
                  // console.log("data from GPS device ",data)
                  // console.log("BBBBBBBBBBB")

                  const device = data.find(
                    (device) => device.deviceId == deviceId
                  );
                  // console.log("device",device)
                  if (device) {
                    const dataForSocket = {
                      speed: device.speed,
                      course: device.course,
                      deviceId: device.deviceId,
                      latitude: device.latitude,
                      longitude: device.longitude,
                      deviceTime: device.deviceTime,
                      attributes: device.attributes,
                      name: devicelistFromAPI.name,
                      status: devicelistFromAPI.status,
                      uniqueId: devicelistFromAPI.uniqueId,
                      category: devicelistFromAPI.category,
                      lastUpdate: devicelistFromAPI.lastUpdate,
                      // event: device.attributes.event,
                      // distance: device.attributes.distance,
                      // ignition: device.attributes.ignition,
                      // totalDistance: device.attributes.totalDistance,
                    };
                    socket.emit("shared device data", dataForSocket);
                    console.log("shared device data");
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
            }
          }, 10000);
        }
      } catch (error) {
        console.error(
          "Invalid token or error during verification:",
          error.message
        );
        socket.emit("error", { message: "Invalid token" }); // Inform the client of the invalid token
      }
    });
    /* ================= Share Device To Other Person End ================= */
  });

  return io;
};
