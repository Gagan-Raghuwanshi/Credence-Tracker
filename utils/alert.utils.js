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
// const inactiveThreshold = 60 * 1000; // 1 minute

const checkDeviceStatus = (io, deviceData) => {
    const { deviceId, status, attributes: { ignition, alarm }, speed, latitude, longitude } = deviceData;

    const speedLimit = 60;

    if (!deviceStatus[deviceId]) {
        deviceStatus[deviceId] = { ignition, speed, status, lastActive: Date.now() };
        return;
    }

    if (deviceStatus[deviceId].ignition !== ignition) {
        const alert = createAlert(deviceData, 'Ignition'); // Create alert for ignition change
        sendAlert(io, alert); // Send the alert
        alertsArray.push(alert);
    }

    if (speed > speedLimit && deviceStatus[deviceId].speed !== speedLimit) {
        const alert = createAlert(deviceData, 'speedLimitExceeded'); // Create alert for speed limit exceeded
        sendAlert(io, alert); // Send the alert
        alertsArray.push(alert);
    }

    if (deviceStatus[deviceId].status !== status) {
        const alert = createAlert(deviceData, status === 'online' ? 'statusOnline' : status === 'offline' ? 'statusOffline' : 'statusUnknown');
        sendAlert(io, alert);
        alertsArray.push(alert);
    }

    if (alarm && deviceStatus[deviceId].alarm !== alarm) {
        data = alarm; // Store alarm data
        const alarmAlert = createAlert(deviceData, 'alarm'); // Create alert for general alarm
        sendAlert(io, alarmAlert); // Send the alert
        alertsArray.push(alarmAlert);
        if (alarm === 'geofenceEnter') {
            const geofenceEnteredAlert = createAlert(deviceData, 'geofenceEntered'); // Create alert for geofence entered
            sendAlert(io, geofenceEnteredAlert); // Send the alert
            alertsArray.push(geofenceEnteredAlert);
        } else if (alarm === 'geofenceExit') {
            const geofenceExitedAlert = createAlert(deviceData, 'geofenceExited'); // Create alert for geofence exited
            sendAlert(io, geofenceExitedAlert); // Send the alert
            alertsArray.push(geofenceExitedAlert);
        }
        data = null; // Reset data
    }

    // Check for device stopped status
    if (speed <= stopLimit && deviceStatus[deviceId].speed !== speed && deviceStatus[deviceId].lastAlertType !== 'deviceStopped') {
        const alert = createAlert(deviceData, 'deviceStopped'); // Create alert for device stopped
        sendAlert(io, alert); // Send the alert
        alertsArray.push(alert);
        deviceStatus[deviceId].lastAlertType = 'deviceStopped'; // Update last alert type
    } else if (speed > stopLimit && deviceStatus[deviceId].speed !== speed && deviceStatus[deviceId].lastAlertType !== 'deviceMoving') {
        const alert = createAlert(deviceData, 'deviceMoving'); // Create alert for device moving
        sendAlert(io, alert); // Send the alert
        alertsArray.push(alert);
        deviceStatus[deviceId].lastAlertType = 'deviceMoving'; // Update last alert type
    } else if (Date.now() - deviceStatus[deviceId].lastActive >= inactiveThreshold && deviceStatus[deviceId].lastAlertType !== 'deviceInactive') {
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
    // console.log('Alert sent:', alert); // Log the alert
    const savedAlert = await new Alert(alert).save();

    // await savedAlert.save(); 
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

        PositionApiData.forEach(obj1 => {
            const match = deviceApiData.get(obj1.deviceId);
            if (match) {
                obj1.status = match.status;
            }
        });

        PositionApiData.forEach((deviceData) => checkDeviceStatus(io, deviceData));

        io.emit("Alerts", alertsArray);
        alertsArray = [];

        console.log("pavan check\ngagan check\nyash check\nprachi check");
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}