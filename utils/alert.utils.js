import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import axios from 'axios';
import moment from 'moment'; 
import {Notification} from '../models/notification.model.js';
import Alert from '../models/alert.model.js';

const app = express();


let deviceStatus = {};

const checkDeviceStatus = (deviceData) => {
    const { deviceId, attributes: { ignition, speed }, latitude, longitude } = deviceData;

        const speedLimit = 60;

    if (!deviceStatus[deviceId]) {
        deviceStatus[deviceId] = { ignition, speed };
        return;
    }

    if (deviceStatus[deviceId].ignition !== ignition) {
        const alert = createAlert(deviceData, 'Ignition');
        sendAlert(alert);
    }

    if (speed < 5 && deviceStatus[deviceId].speed >= 5) {
        const alert = createAlert(deviceData, 'Idle');
        sendAlert(alert);
    } else if (speed > speedLimit && deviceStatus[deviceId].speed <= speedLimit) {
        const alert = createAlert(deviceData, 'Overspeed');
        sendAlert(alert);
    }

    deviceStatus[deviceId].ignition = ignition;
    deviceStatus[deviceId].speed = speed;
};

const createAlert = (deviceData, type) => {
    const { attributes: { ignition, speed }, latitude, longitude } = deviceData;
    const ignitionStatus = ignition ? 'ignitionOn' : 'ignitionOff';
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
        type: type === 'Ignition' ? ignitionStatus : type,
        deviceId: deviceData.deviceId,
        added: formattedDate,
        location: [longitude, latitude],
        address: deviceData.address,
        message,
    };
};


const sendAlert = async (alert) => {

    console.log('Alert sent:', alert);
    const savedAlert = await new Alert(alert).save();
    await savedAlert.save();
};

 export const AlertFetching =   async () => {
    try {
        const { data: devicesData } = await axios.get('http://104.251.212.84/api/positions', {
            auth: {
                username: 'hbtrack',
                password: '123456@'
            }
        });

        devicesData.forEach((deviceData) => checkDeviceStatus(deviceData));
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}
