import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import axios from 'axios';
import moment from 'moment';
import { Notification } from '../models/notification.model.js';
import Alert from '../models/alert.model.js';
import { Device } from '../models/device.model.js';

let deviceStatus = {};
let userSocketMap = {};
const stopLimit = 1;
let data = null; // Store alarm data
let alertsArray = [];
const inactiveThreshold = 24 * 60 * 60 * 1000; // 24 hours in milliseconds


const checkDeviceStatus = async (io, deviceData) => {
    const { deviceId, name, status, attributes: { ignition, alarm }, speed, latitude, longitude } = deviceData;


    if (!deviceStatus[deviceId]) {
        deviceStatus[deviceId] = { ignition, speed, status, lastActive: Date.now(), lastAlertType: null }; // Initialize lastAlertType
        return;
    }

    let { alertTypes, speedLimit } = await getAlertTypesForDevice(deviceId); // Get alert types for the specific device
    const alertTypeArray = alertTypes[0]; // Extract the single array from alertTypes
    speedLimit = Number(speedLimit);
    // console.log(alertTypeArray);
    // console.log(speedLimit);

    if (deviceStatus[deviceId].ignition !== ignition) {
        const alertType = ignition ? 'ignitionOn' : 'ignitionOff'; // Determine alert type based on ignition status
        if (alertTypeArray.includes(alertType)) {
            const alert = createAlert(deviceData, alertType); // Create alert for ignition change
            await sendAlert(io, alert); // Send the alert
            alertsArray.push(alert);
        }
    }

    if (speed > speedLimit && deviceStatus[deviceId].speed <= speedLimit && alertTypeArray.includes('speedLimitExceeded')) {
        const alert = createAlert(deviceData, 'speedLimitExceeded');
        await sendAlert(io, alert); // Send the alert
        alertsArray.push(alert);
    }

    if (deviceStatus[deviceId].status !== status) {
        if (alertTypeArray.includes(status)) {
            const alert = createAlert(deviceData, status === 'online' ? 'statusOnline' : status === 'offline' ? 'statusOffline' : 'statusUnknown');
            await sendAlert(io, alert);
            alertsArray.push(alert);
        }
    }

    if (alarm && deviceStatus[deviceId].alarm !== alarm) {
        data = alarm; // Store alarm data
        if (alertTypeArray.includes('alarm')) {
            const alarmAlert = createAlert(deviceData, 'alarm'); // Create alert for general alarm
            await sendAlert(io, alarmAlert); // Send the alert
            alertsArray.push(alarmAlert);
        }
        if (alarm === 'geofenceEnter' && alertTypeArray.includes('geofenceEntered')) {
            const geofenceEnteredAlert = createAlert(deviceData, 'geofenceEntered'); // Create alert for geofence entered
            await sendAlert(io, geofenceEnteredAlert); // Send the alert
            alertsArray.push(geofenceEnteredAlert);
        } else if (alarm === 'geofenceExit' && alertTypeArray.includes('geofenceExited')) {
            const geofenceExitedAlert = createAlert(deviceData, 'geofenceExited'); // Create alert for geofence exited
            await sendAlert(io, geofenceExitedAlert); // Send the alert
            alertsArray.push(geofenceExitedAlert);
        }
        data = null; // Reset data
    }

    // Check for device stopped status
    if (speed <= stopLimit && deviceStatus[deviceId].lastAlertType !== 'deviceStopped') {
        if (alertTypeArray.includes('deviceStopped')) {
            const alert = createAlert(deviceData, 'deviceStopped'); // Create alert for device stopped
            await sendAlert(io, alert); // Send the alert
            alertsArray.push(alert);
        }
        deviceStatus[deviceId].lastAlertType = 'deviceStopped'; // Update last alert type
    } else if (speed > stopLimit && deviceStatus[deviceId].lastAlertType !== 'deviceMoving') {
        if (alertTypeArray.includes('deviceMoving')) {
            const alert = createAlert(deviceData, 'deviceMoving'); // Create alert for device moving
            await sendAlert(io, alert); // Send the alert
            alertsArray.push(alert);
        }
        deviceStatus[deviceId].lastAlertType = 'deviceMoving'; // Update last alert type
    } else if (Date.now() - deviceStatus[deviceId].lastActive >= inactiveThreshold && deviceStatus[deviceId].lastAlertType !== 'deviceInactive') {
        if (alertTypeArray.includes('deviceInactive')) {
            const alert = createAlert(deviceData, 'deviceInactive'); // Create alert for device inactive
            await sendAlert(io, alert); // Send the alert
            alertsArray.push(alert);
        }
        deviceStatus[deviceId].lastAlertType = 'deviceInactive'; // Update last alert type
    }

    deviceStatus[deviceId].ignition = ignition;
    deviceStatus[deviceId].speed = speed;
    deviceStatus[deviceId].status = status;
    deviceStatus[deviceId].deviceSpeed = speed;
    deviceStatus[deviceId].alarm = alarm;
    deviceStatus[deviceId].lastActive = Date.now(); // Update last active time
};

const createAlert = (deviceData, type) => {
    const { attributes: { ignition, alarm }, speed, status, name, latitude, longitude } = deviceData; // Destructuring device data
    const ignitionStatus = ignition ? 'ignitionOn' : 'ignitionOff'; // Determine ignition status
    const vehicleStatus = status === 'online' ? 'statusOnline' : status === 'offline' ? 'statusOffline' : 'statusUnknown'; // Determine vehicle status
    const deviceSpeed = speed <= stopLimit ? 'deviceStopped' : speed > stopLimit ? 'deviceMoving' : 'deviceInactive'; // Determine device speed status
    const formattedDate = moment().format('DD/MM/YYYY HH:mm:ss'); // Format current date
    let message; // Variable to hold alert message

    // Create message based on alert type
    if (type === 'ignitionOn') {
        message = `Vehicle ${name} has started!`;
    } else if (type === 'ignitionOff') {
        message = `Vehicle ${name} has stopped!`;
    } else if (type === 'speedLimitExceeded') {
        message = `Vehicle ${name} is overspeeding! Speed: ${speed} km/h`;
    } else if (type === 'deviceMoving') {
        message = `Device ${name} is moving! Speed: ${speed} km/h`;
    } else if (type === 'deviceStopped') {
        message = `Device ${name} is stopped! Speed: ${speed} km/h`;
    } else if (type === 'deviceInactive') {
        message = `Device ${name} has been inactive for 24 hours!`;
    } else if (type === 'alarm') {
        message = `Alarm for ${name} is ${alarm}!`;
    } else if (type === 'geofenceEntered') {
        message = `Device ${name} has entered the geofence!`;
    } else if (type === 'geofenceExited') {
        message = `Device ${name} has exited the geofence!`;
    } else if (type === 'statusOnline') {
        message = `Status of ${name} is online.`;
    } else if (type === 'statusOffline') {
        message = `Status of ${name} is offline.`;
    } else if (type === 'statusUnknown') {
        message = `Status of ${name} is unknown.`;
    }

    // Return the alert object
    return {
        type: (type === 'ignitionOn' || type === 'ignitionOff') ? ignitionStatus : (type || vehicleStatus || deviceSpeed),
        deviceId: deviceData.deviceId,
        name: name,
        added: formattedDate,
        location: [longitude, latitude],
        data,
        message,
    };
};

// Call this when a user connects
export const onUserConnect = (socket, userId) => {
    userSocketMap[userId] = socket.id;
};

// Call this when a user disconnects
export const onUserDisconnect = (socket) => {
    for (const userId in userSocketMap) {
        if (userSocketMap[userId] === socket.id) {
            delete userSocketMap[userId];
            break;
        }
    }
};

const getUserSocketId = (userId) => {

    return userSocketMap[userId] || null;
};

const sendAlert = async (io, alert) => {
    // Save the alert to the database
    // await new Alert(alert).save();
    // Find the user who created the notification for this device
    const device = await Device.findOne({ deviceId: alert.deviceId });
    const notifications = await Notification.find({ deviceId: device._id }).populate('createdBy');

    notifications.forEach(notification => {
        if (notification.createdBy) {
            const userId = notification.createdBy._id;
            const userSocketId = getUserSocketId(userId);
            console.log(userId, userSocketId);
            if (userSocketId) {

                console.log(alert);
                io.to(userSocketId).emit('alert', alert);
            }
        }
    });
};

let selectedDeviceIds = [];

const addDeviceToSelectedIds = async () => {
    const notifications = await Notification.find().populate('deviceId');

    notifications.forEach(notification => {
        if (notification.deviceId.deviceId) {
            if (!selectedDeviceIds.includes(Number(notification.deviceId.deviceId))) {
                selectedDeviceIds.push(Number(notification.deviceId.deviceId));
            }
        } else {
            console.log(`Notification ${notification._id} has no devices or devices not populated.`);
        }
    });
}

const getAlertTypesForDevice = async (deviceId) => {
    const notifications = await Notification.find().populate('deviceId');
    // Filter notifications for the specific device and map alert types
    const alertTypes = notifications
        .filter((notification) => Number(notification.deviceId.deviceId) === deviceId)
        .map((notification) => notification.type);

    const device = await Device.findOne({ deviceId: deviceId }); // Query to find the device
    const speedLimit = device ? device.speed : null; // Get the speed if available

    return {
        alertTypes,
        speedLimit
    };
};

export const AlertFetching = async (io) => {
    try {
        const { data: PositionApiData } = await axios.get('http://63.142.251.13:8082/api/positions', {
            auth: {
                username: 'hbtrack',
                password: '123456@'
            }
        });
        const resdevice = await axios.get('http://63.142.251.13:8082/api/devices', {
            auth: {
                username: 'hbtrack',
                password: '123456@'
            }
        });
        const deviceData = resdevice.data;

        const deviceApiData = new Map(deviceData.map(item => [item.id, item]));

        await addDeviceToSelectedIds();


        const filteredDevices = PositionApiData.filter(obj => selectedDeviceIds.includes(obj.deviceId));

        filteredDevices.forEach(obj1 => {
            const match = deviceApiData.get(obj1.deviceId);
            if (match) {
                obj1.status = match.status;
                obj1.name = match.name;
            }
        });


        for (const deviceData of filteredDevices) {
            await checkDeviceStatus(io, deviceData);
        }

        io.emit("Alerts", alertsArray);
        console.log(alertsArray);
        alertsArray = [];
        console.log("pavan check\ngagan check\nyash check\nprachi check");
        console.log(userSocketMap);

        console.log('All Device IDs:', Array.from(selectedDeviceIds));

        selectedDeviceIds = [];
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}
