import axios from "axios";
import Alert from "../models/alert.model.js";

 const getAlertReport = async (req, res) => {
    try {
        const username = 'hbtrack';
        const password = '123456@';
        let devices = [];
        let positions = [];
        const previousState = {}; // Store previous state of devices
        const speedLimit = 60; // Speed limit threshold

        // Encode credentials for Basic Auth
        const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');
        const authHeaders = { Authorization: `Basic ${basicAuth}` };

        // API endpoints
        const devicesApiUrl = 'http://104.251.212.84/api/devices';
        const positionsApiUrl = 'http://104.251.212.84/api/positions';

        // Fetch data from both APIs
        async function fetchDevicesAndPositions() {
            try {
                const devicesResponse = await axios.get(devicesApiUrl, { headers: authHeaders });
                const positionsResponse = await axios.get(positionsApiUrl, { headers: authHeaders });

                devices = devicesResponse.data;
                positions = positionsResponse.data;
            } catch (error) {
                console.error('Error fetching data:', error.message);
            }
        }

        // Function to check alert types and generate alerts
        function checkAlertTypes(device, position, deviceState, prevState) {
            const alerts = [];

            // Helper to create alert object
            function createAlert(type) {
                return {
                    id: Date.now(), // Use timestamp as unique ID or another unique value
                    attributes: {},
                    deviceId: device.id,
                    type,
                    eventTime: new Date().toISOString(),
                    positionId: position.id || 0,
                    geofenceId: position.geofenceIds ? position.geofenceIds[0] || 0 : 0,
                    maintenanceId: 0
                };
            }

            // // Check for changes in status
            // if (deviceState.status !== prevState.status) {
            //     if (deviceState.status === "online") alerts.push(createAlert("deviceOnline"));
            //     if (deviceState.status === "offline") alerts.push(createAlert("deviceOffline"));
            // }

            // // Check if the validity of data has changed
            // if (deviceState.valid !== prevState.valid) {
            //     if (deviceState.valid === false) alerts.push(createAlert("statusUnknown"));
            //     if (deviceState.valid === true) alerts.push(createAlert("deviceActive"));
            // }

            // // Check if the device has become inactive
            // if (deviceState.outdated !== prevState.outdated && deviceState.outdated) {
            //     alerts.push(createAlert("deviceInactive"));
            // }

            // // Movement and speed checks
            // if (deviceState.motion !== prevState.motion) {
            //     alerts.push(createAlert(deviceState.motion ? "deviceMoving" : "deviceStopped"));
            // }

            // if (deviceState.speed > speedLimit) {
            //     alerts.push(createAlert("speedLimitExceeded"));
            // }

            // Ignition status check
            if (deviceState.ignition !== prevState.ignition) {
                alerts.push(createAlert(deviceState.ignition ? "ignitionOn" : "ignitionOff"));
            }

            // // Fuel level changes
            // if (deviceState.fuelDecrease && !prevState.fuelDecrease) {
            //     alerts.push(createAlert("fuelDrop"));
            // }
            // if (deviceState.fuelIncrease && !prevState.fuelIncrease) {
            //     alerts.push(createAlert("fuelIncrease"));
            // }

            // // Geofence entry/exit detection
            // if (deviceState.geofence !== prevState.geofence) {
            //     alerts.push(createAlert(deviceState.geofence === "entered" ? "geofenceEntered" : "geofenceExited"));
            // }

            // // Alarm detection
            // if (deviceState.alarm && !prevState.alarm) {
            //     alerts.push(createAlert("alarm"));
            // }

            // // Odometer-based maintenance
            // if (deviceState.odometer !== prevState.odometer && deviceState.odometer > 100000) {
            //     alerts.push(createAlert("maintenanceRequired"));
            // }

            return alerts;
        }

        // Function to create notifications from alerts
        async function createNotification(alert) {
            const existingAlert = await Alert.findOne({
                deviceId: alert.deviceId,
                type: alert.type,
                // eventTime: alert.eventTime
            });
            // Avoid duplicate alerts
            if (!existingAlert) {
                const newAlert = new Alert(alert);
                await newAlert.save(); // Save the notification to the database
            }
        }

        // Function to handle sending notifications
        async function sendNotifications(alerts) {
            for (const alert of alerts) {
                console.log("Creating notification:", alert);
                await createNotification(alert);
            }
        }

        // Function to generate alerts from devices and positions
        function generateAlerts(devices, positions) {
            const allAlerts = [];

            devices.forEach(device => {
                const position = positions.find(pos => pos.deviceId === device.id);
                if (!position) return;

                const deviceState = {
                    status: device.status,
                    motion: position.attributes.motion,
                    ignition: position.attributes.ignition,
                    speed: position.speed,
                    valid: position.valid,
                    geofence: position.geofenceIds ? "entered" : "exited",
                    odometer: position.attributes.odometer,
                    fuelDecrease: position.attributes.fuelDecrease,
                    fuelIncrease: position.attributes.fuelIncrease,
                    alarm: position.attributes.alarm,
                    outdated: position.outdated,
                };

                // Fetch previous state of the device using its uniqueId
                const prevState = previousState[device.id] || {};
                console.log("prevState __________________", prevState);

                // Check for alerts
                const alerts = checkAlertTypes(device, position, deviceState, prevState);

                // If there are any alerts, add them to the allAlerts array
                if (alerts.length > 0) {
                    allAlerts.push(...alerts);
                }

                // Update previous state for future comparison
                previousState[device.uniqueId] = deviceState;

                // Optional: Log the current device state for debugging
                console.log(`Device ID: ${device.id}, State:`, deviceState);
            });

            return allAlerts;
        }

        // Fetch data and generate alerts
        await fetchDevicesAndPositions();
        const alerts = generateAlerts(devices, positions);

        // Send notifications for the generated alerts
        await sendNotifications(alerts);

        // Send the response with all alerts once
        res.status(200).json({
            message: "Alert report fetched successfully",
            success: true,
            data: alerts,
        });

    } catch (error) {
        console.error("Error in getAlertReport:", error);
        res.status(500).json({
            message: "Error fetching alert report",
            success: false,
            error: error.message,
        });
    }
};

getAlertReport();