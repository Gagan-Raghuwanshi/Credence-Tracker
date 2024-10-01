import express from 'express'; // Importing express for creating the server
import http from 'http'; // Importing http module for server functionalities
import { Server } from 'socket.io'; // Importing socket.io for real-time communication
import axios from 'axios'; // Importing axios for making HTTP requests
import moment from 'moment'; // Importing moment for date formatting
import { Notification } from '../models/notification.model.js'; // Importing Notification model
import Alert from '../models/alert.model.js'; // Importing Alert model

const app = express(); // Initializing express app

// Object to hold the status of devices
let deviceStatus = {};
const stopLimit = 1; // Speed limit to consider a device as stopped
let deviceSpeed; // Variable to hold device speed
let data = null; // Variable to hold additional data

// Function to check the status of a device
const checkDeviceStatus = (deviceData) => {
    // Destructuring device data
    const { deviceId, status, attributes: { ignition, alarm }, speed, latitude, longitude } = deviceData;

    const speedLimit = 60; // Speed limit for alerts

    // Initialize device status if not already present
    if (!deviceStatus[deviceId]) {
        deviceStatus[deviceId] = { ignition, speed, status };
        return;
    }

    // Check for ignition status change
    if (deviceStatus[deviceId].ignition !== ignition) {
        const alert = createAlert(deviceData, 'Ignition'); // Create alert for ignition change
        sendAlert(alert); // Send the alert
    }

    // Check for speed limit exceeded
    if (speed > speedLimit && deviceStatus[deviceId].speed !== speedLimit) {
        const alert = createAlert(deviceData, 'speedLimitExceeded'); // Create alert for speed limit exceeded
        sendAlert(alert); // Send the alert
    }

    // Check for status change
    if (deviceStatus[deviceId].status !== status) {
        const alert = createAlert(deviceData, status === 'online' ? 'statusOnline' : status === 'offline' ? 'statusOffline' : 'statusUnknown'); // Create alert for status change
        sendAlert(alert); // Send the alert
    }

    // Check for alarm status change
    if (alarm && deviceStatus[deviceId].alarm !== alarm) {
        data = alarm; // Store alarm data
        const alert = createAlert(deviceData, 'alarm'); // Create alert for alarm
        sendAlert(alert); // Send the alert
        data = null; // Reset data
    }

    // Check for device stopped status
    // if (speed <= stopLimit && deviceStatus[deviceId].deviceSpeed !== stopLimit) {
    //     const alert = createAlert(deviceData, 'deviceStopped'); // Create alert for device stopped
    //     sendAlert(alert); // Send the alert
    // } else if (speed > stopLimit && deviceStatus[deviceId].deviceSpeed !== stopLimit) {
    //     const alert = createAlert(deviceData, 'deviceMoving'); // Create alert for device moving
    //     sendAlert(alert); // Send the alert
    // }

    // Update previous state of the device
    deviceStatus[deviceId].ignition = ignition;
    deviceStatus[deviceId].speed = speed;
    deviceStatus[deviceId].status = status;
    deviceStatus[deviceId].deviceSpeed = deviceSpeed;
    deviceStatus[deviceId].alarm = alarm;
    deviceStatus[deviceId].stopLimit = stopLimit;
};

// Function to create an alert based on device data
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

// Function to send an alert
const sendAlert = async (alert) => {
    console.log('Alert sent:', alert); // Log the alert
    const savedAlert = await new Alert(alert).save(); // Save the alert to the database
    await savedAlert.save(); // Ensure the alert is saved
};

// Function to fetch alerts from the API
export const AlertFetching = async () => {
    try {
        // Fetch position data from the API
        const { data: PositionApiData } = await axios.get('http://104.251.212.84/api/positions', {
            auth: {
                username: 'hbtrack',
                password: '123456@'
            }
        });
        // Fetch device data from the API
        const resdevice = await axios.get('http://104.251.212.84/api/devices', {
            auth: {
                username: 'hbtrack',
                password: '123456@'
            }
        });
        const deviceData = resdevice.data; // Store device data

        // Create a map of device data for quick access
        const deviceApiData = new Map(deviceData.map(item => [item.id, item]));

        // Update position data with device status
        PositionApiData.forEach(obj1 => {
            const match = deviceApiData.get(obj1.deviceId);
            if (match) {
                obj1.status = match.status; // Update status if a match is found
            }
        });

        // Check the status of each device
        PositionApiData.forEach((deviceData) => checkDeviceStatus(deviceData));

    } catch (error) {
        console.error('Error fetching data:', error); // Log any errors
    }
}
