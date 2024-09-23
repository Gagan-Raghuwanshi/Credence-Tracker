import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import axios from 'axios';
import moment from 'moment'; // For date formatting
import Notification from '../models/notification.model.js';

const app = express();
// const server = http.createServer(app);
// const io = new Server(server);

// Store the current status of each device by deviceId
let deviceStatus = {};

const checkDeviceStatus = (deviceData) => {
    const { deviceId, attributes: { ignition, speed }, latitude, longitude } = deviceData;

    // If device doesn't exist in memory, store its current state
    if (!deviceStatus[deviceId]) {
        deviceStatus[deviceId] = { ignition, speed };
        return;
    }

    // Check for ignition status change
    if (deviceStatus[deviceId].ignition !== ignition) {
        const notification = createNotification(deviceData, 'Ignition');
        sendNotification(notification);
    }

    // Check for speed conditions (idle or overspeed)
    if (speed < 5 && deviceStatus[deviceId].speed >= 5) {
        const notification = createNotification(deviceData, 'Idle');
        sendNotification(notification);
    } else if (speed > 80 && deviceStatus[deviceId].speed <= 80) {
        const notification = createNotification(deviceData, 'Overspeed');
        sendNotification(notification);
    }

    // Update the stored state
    deviceStatus[deviceId].ignition = ignition;
    deviceStatus[deviceId].speed = speed;
};

// Create notification function for different types
const createNotification = (deviceData, type) => {
    const { attributes: { ignition, speed }, latitude, longitude } = deviceData;
    const ignitionStatus = ignition ? 'Ignition On' : 'Ignition Off';
    const formattedDate = moment().format('DD/MM/YYYY HH:mm:ss');

    let message;
    if (type === 'Ignition') {
        message = `Vehicle ${deviceData.deviceId} has ${ignition ? 'started' : 'stopped'}!`;
    } else if (type === 'Idle') {
        message = `Vehicle ${deviceData.deviceId} is idle! Speed: ${speed} km/h`;
    } else if (type === 'Overspeed') {
        message = `Vehicle ${deviceData.deviceId} is overspeeding! Speed: ${speed} km/h`;
    }

    return {
        status: type === 'Ignition' ? ignitionStatus : type,
        vehicleName: deviceData.deviceId,
        added: formattedDate,
        location: [longitude, latitude],
        address: deviceData.address,
        message,
    };
};


// Function to send notification via WebSocket
const sendNotification = async (notification) => {
    // await io.emit('newNotification', notification);
    console.log('Notification sent:', notification);
    const savedNotification = await new Notification(notification).save();
    await savedNotification.save();
};

// Poll API for data every 10 seconds
setInterval(async () => {
    try {
        const { data: devicesData } = await axios.get('http://104.251.212.84/api/positions', {
            auth: {
                username: 'hbtrack',
                password: '123456@'
            }
        });

        // Iterate through the devices data and check ignition status
        devicesData.forEach((deviceData) => checkDeviceStatus(deviceData));
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}, 10000); // Poll every 10 seconds
