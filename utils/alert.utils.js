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
let deviceSpeed; 
let data = null; 
let alertsArray = [];


const checkDeviceStatus = (io,deviceData) => {
    const { deviceId, status, attributes: { ignition, alarm }, speed, latitude, longitude } = deviceData;

    const speedLimit = 60; 

    if (!deviceStatus[deviceId]) {
        deviceStatus[deviceId] = { ignition, speed, status };
        return;
    }

    if (deviceStatus[deviceId].ignition !== ignition) {
        const alert = createAlert(deviceData, 'Ignition'); // Create alert for ignition change
        sendAlert(io,alert); // Send the alert
        alertsArray.push(alert);

    }

    if (speed > speedLimit && deviceStatus[deviceId].speed !== speedLimit) {
        const alert = createAlert(deviceData, 'speedLimitExceeded'); // Create alert for speed limit exceeded
        sendAlert(io,alert); // Send the alert
        alertsArray.push(alert);

    }

    if (deviceStatus[deviceId].status !== status) {
        const alert = createAlert(deviceData, status === 'online' ? 'statusOnline' : status === 'offline' ? 'statusOffline' : 'statusUnknown');
        sendAlert(io,alert); 
        alertsArray.push(alert);

    }

    if (alarm && deviceStatus[deviceId].alarm !== alarm) {
        data = alarm; // Store alarm data
        const alert = createAlert(deviceData, 'alarm'); // Create alert for alarm
        sendAlert(io,alert); // Send the alert
        data = null; // Reset data
        alertsArray.push(alert);

    }

    // Check for device stopped status
    // if (speed <= stopLimit && deviceStatus[deviceId].deviceSpeed !== stopLimit) {
    //     const alert = createAlert(deviceData, 'deviceStopped'); // Create alert for device stopped
    //     sendAlert(alert); // Send the alert
    // } else if (speed > stopLimit && deviceStatus[deviceId].deviceSpeed !== stopLimit) {
    //     const alert = createAlert(deviceData, 'deviceMoving'); // Create alert for device moving
    //     sendAlert(alert); // Send the alert
    // }

    deviceStatus[deviceId].ignition = ignition;
    deviceStatus[deviceId].speed = speed;
    deviceStatus[deviceId].status = status;
    deviceStatus[deviceId].deviceSpeed = deviceSpeed;
    deviceStatus[deviceId].alarm = alarm;
    deviceStatus[deviceId].stopLimit = stopLimit;
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
    } else if (type === 'alarm') {
        message = `Alarm for ${deviceData.deviceId} is ${alarm}!`;
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


const sendAlert = async (io,alert) => {
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

        PositionApiData.forEach((deviceData) => checkDeviceStatus(io,deviceData));

        io.emit("Alerts",alertsArray);
        alertsArray = [];

                console.log("pavan check");
                

    } catch (error) {
        console.error('Error fetching data:', error); 
    }
}
