import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import axios from 'axios';
import moment from 'moment';
import { Notification } from '../models/notification.model.js';
import Alert from '../models/alert.model.js';

const app = express();
let deviceStatus = {};
const stopLimit = 1;
let data = null;
let alertsArray = [];
const inactiveThreshold = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const checkDeviceStatus = async (io, deviceData) => {
    const { deviceId, status, attributes: { ignition, alarm }, speed, latitude, longitude } = deviceData;

    const speedLimit = 60;

    if (!deviceStatus[deviceId]) {
        deviceStatus[deviceId] = { ignition, speed, status, lastActive: Date.now() };
        return;
    }

    // Get alert types from the notification model
    const alertTypes = await getAlertTypesForDevice(deviceId);
    console.log('Alert Types:', alertTypes); // Log alert types

    if (Array.isArray(alertTypes) && alertTypes.includes('Ignition') && deviceStatus[deviceId].ignition !== ignition && selectedDeviceIds.includes(deviceId)) {
        const alert = createAlert(deviceData, 'Ignition'); // Create alert for ignition change
        sendAlert(io, alert); // Send the alert
        alertsArray.push(alert);
    }

    if (Array.isArray(alertTypes) && alertTypes.includes('speedLimitExceeded') && speed > speedLimit && deviceStatus[deviceId].speed !== speedLimit && selectedDeviceIds.includes(deviceId)) {
        const alert = createAlert(deviceData, 'speedLimitExceeded'); // Create alert for speed limit exceeded
        sendAlert(io, alert); // Send the alert
        alertsArray.push(alert);
    }

    if (Array.isArray(alertTypes) && alertTypes.includes('statusChange') && deviceStatus[deviceId].status !== status && selectedDeviceIds.includes(deviceId)) {
        const alert = createAlert(deviceData, status === 'online' ? 'statusOnline' : status === 'offline' ? 'statusOffline' : 'statusUnknown');
        sendAlert(io, alert);
        alertsArray.push(alert);
    }

    if (alarm && deviceStatus[deviceId].alarm !== alarm) {
        data = alarm; // Store alarm data
        if (Array.isArray(alertTypes) && alertTypes.includes('alarm') && selectedDeviceIds.includes(deviceId)) {
            const alarmAlert = createAlert(deviceData, 'alarm'); // Create alert for general alarm
            sendAlert(io, alarmAlert); // Send the alert
            alertsArray.push(alarmAlert);
        }
        if (alarm === 'geofenceEnter' && Array.isArray(alertTypes) && alertTypes.includes('geofenceEntered') && selectedDeviceIds.includes(deviceId)) {
            const geofenceEnteredAlert = createAlert(deviceData, 'geofenceEntered'); // Create alert for geofence entered
            sendAlert(io, geofenceEnteredAlert); // Send the alert
            alertsArray.push(geofenceEnteredAlert);
        } else if (alarm === 'geofenceExit' && Array.isArray(alertTypes) && alertTypes.includes('geofenceExited') && selectedDeviceIds.includes(deviceId)) {
            const geofenceExitedAlert = createAlert(deviceData, 'geofenceExited'); // Create alert for geofence exited
            sendAlert(io, geofenceExitedAlert); // Send the alert
            alertsArray.push(geofenceExitedAlert);
        }
        data = null; // Reset data
    }

    // Check for device stopped status
    if (Array.isArray(alertTypes) && alertTypes.includes('deviceStopped') && speed <= stopLimit && deviceStatus[deviceId].speed !== speed && deviceStatus[deviceId].lastAlertType !== 'deviceStopped' && selectedDeviceIds.includes(deviceId)) {
        const alert = createAlert(deviceData, 'deviceStopped'); // Create alert for device stopped
        sendAlert(io, alert); // Send the alert
        alertsArray.push(alert);
        deviceStatus[deviceId].lastAlertType = 'deviceStopped'; // Update last alert type
    } else if (Array.isArray(alertTypes) && alertTypes.includes('deviceMoving') && speed > stopLimit && deviceStatus[deviceId].speed !== speed && deviceStatus[deviceId].lastAlertType !== 'deviceMoving' && selectedDeviceIds.includes(deviceId)) {
        const alert = createAlert(deviceData, 'deviceMoving'); // Create alert for device moving
        sendAlert(io, alert); // Send the alert
        alertsArray.push(alert);
        deviceStatus[deviceId].lastAlertType = 'deviceMoving'; // Update last alert type
    } else if (Array.isArray(alertTypes) && alertTypes.includes('deviceInactive') && Date.now() - deviceStatus[deviceId].lastActive >= inactiveThreshold && deviceStatus[deviceId].lastAlertType !== 'deviceInactive' && selectedDeviceIds.includes(deviceId)) {
        const alert = createAlert(deviceData, 'deviceInactive'); // Create alert for device inactive
        sendAlert(io, alert); // Send the alert
        alertsArray.push(alert);
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
    const { attributes: { ignition, speed, alarm }, status, latitude, longitude } = deviceData; // Destructuring device data
    const ignitionStatus = ignition ? 'ignitionOn' : 'ignitionOff'; // Determine ignition status
    const vehicleStatus = status === 'online' ? 'statusOnline' : status === 'offline' ? 'statusOffline' : 'statusUnknown'; // Determine vehicle status
    const deviceSpeed = speed <= stopLimit ? 'deviceStopped' : speed > stopLimit ? 'deviceMoving' : 'deviceInactive'; // Determine device speed status
    const formattedDate = moment().format('DD/MM/YYYY HH:mm:ss'); // Format current date
    let message; // Variable to hold alert message

    // Create message based on alert type
    if (type === 'Ignition') {
        message = `Vehicle ${deviceData.deviceId} has ${ignition ? 'started' : 'stopped'}!`;
    } else if (type === 'speedLimitExceeded') {
        message = `Vehicle ${deviceData.deviceId} is overspeeding! Speed: ${speed} km/h`;
    } else if (type === 'deviceMoving') {
        message = `Device ${deviceData.deviceId} is moving! Speed: ${speed} km/h`;
    } else if (type === 'deviceStopped') {
        message = `Device ${deviceData.deviceId} is stopped! Speed: ${speed} km/h`;
    } else if (type === 'deviceInactive') {
        message = `Device ${deviceData.deviceId} has been inactive for 24 hours!`;
    } else if (type === 'alarm') {
        message = `Alarm for ${deviceData.deviceId} is ${alarm}!`;
    } else if (type === 'geofenceEntered') {
        message = `Device ${deviceData.deviceId} has entered the geofence!`;
    } else if (type === 'geofenceExited') {
        message = `Device ${deviceData.deviceId} has exited the geofence!`;
    } else if (type === "statusOnline" ? "statusOnline" : type === "statusOffline" ? "statusOffline" : "statusUnknown") {
        message = `Status of ${deviceData.deviceId} is ${status === 'online' ? 'online' : status === 'offline' ? 'offline' : 'unknown'}`;
    }

    // Return the alert object
    return {
        type: type === 'Ignition' ? ignitionStatus : type || vehicleStatus || deviceSpeed,
        deviceId: deviceData.deviceId,
        added: formattedDate,
        location: [longitude, latitude],
        data,
        message,
    };
};

const sendAlert = async (io, alert) => {
    const savedAlert = await new Alert(alert).save();
};

const selectedDeviceIds = []; // Replace with actual selected deviceIds

const addDeviceToSelectedIds = async () => {
    const notifications = await Notification.find().populate('deviceId');

    notifications.forEach(notification => {
        notification.Devices.forEach(device => {
            // console.log("Number of Notifications:", notifications, notifications.length);
            if (device.deviceId) { // Check if the device has a deviceId property
                if (!selectedDeviceIds.includes(Number(device.deviceId))) {
                    selectedDeviceIds.push(Number(device.deviceId));
                }
            } else {
                console.log(`Notification ${notification._id} has no devices or devices not populated.`);
            }
        });
    });
}

const getAlertTypesForDevice = async (deviceId) => {
    const notifications = await Notification.find({}).populate('Devices');
    console.log(notifications)
    const alertTypes = notifications.map(notification => notification.type);
    console.log('Fetched Alert Types for Device:', alertTypes); // Log fetched alert types
    return alertTypes;
};

export const AlertFetching = async (io) => {
    try {
        const { data: PositionApiData } = await axios.get('http://104.251.212.84/api/positions', {
            auth: {
                username: 'hbtrack',
                password: '123456@'
            }
        });
        const resdevice = await axios.get('http://104.251.212.84/api/devices', {
            auth: {
                username: 'hbtrack',
                password: '123456@'
            }
        });
        const deviceData = resdevice.data;

        const deviceApiData = new Map(deviceData.map(item => [item.id, item]));

        await addDeviceToSelectedIds();

        // Filter the PositionApiData for selected deviceIds
        const filteredDevices = PositionApiData.filter(obj => selectedDeviceIds.includes(obj.deviceId));

        filteredDevices.forEach(obj1 => {
            const match = deviceApiData.get(obj1.deviceId);
            if (match) {
                obj1.status = match.status;
            }
        });

        // Process the filtered device data
        filteredDevices.forEach((deviceData) => checkDeviceStatus(io, deviceData));

        io.emit("Alerts", alertsArray); // Send only relevant alerts
        alertsArray = []; // Reset the alertsArray after sending

        console.log("pavan check\ngagan check\nyash check\nprachi check");

        console.log('All Device IDs:', Array.from(selectedDeviceIds));

    } catch (error) {
        console.error('Error fetching data:', error);
    }
}
