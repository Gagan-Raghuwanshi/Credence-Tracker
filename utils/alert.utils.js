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
let deviceSpeed

const checkDeviceStatus = (deviceData) => {

    const { deviceId, status, attributes: { ignition, }, speed, latitude, longitude } = deviceData;

    const speedLimit = 60;

    if (!deviceStatus[deviceId]) {
        deviceStatus[deviceId] = { ignition, speed, status };
        return;
    }

    if (deviceStatus[deviceId].ignition !== ignition) {
        const alert = createAlert(deviceData, 'Ignition');
        sendAlert(alert);
    }

    if (speed > speedLimit && deviceStatus[deviceId].speed <= speedLimit) {
        const alert = createAlert(deviceData, 'speedLimitExceeded');
        sendAlert(alert);
    }

    if (deviceStatus[deviceId].status !== status) {
        const alert = createAlert(deviceData, status === 'online' ? 'statusOnline' : status === 'offline' ? 'statusOffline' : 'statusUnknown');
        sendAlert(alert);
    }

    if (speed <= stopLimit && deviceStatus[deviceId].deviceSpeed <= stopLimit) {
        const alert = createAlert(deviceData, 'deviceStopped');
        sendAlert(alert);
    } else if (speed > stopLimit && deviceStatus[deviceId].deviceSpeed > stopLimit) {
        const alert = createAlert(deviceData, 'deviceMoving');
        sendAlert(alert);
    }



    deviceStatus[deviceId].ignition = ignition;
    deviceStatus[deviceId].speed = speed;
    deviceStatus[deviceId].status = status;
    deviceStatus[deviceId].deviceSpeed = deviceSpeed;
};

const createAlert = (deviceData, type) => {
    const { attributes: { ignition, speed }, status, latitude, longitude } = deviceData;
    const ignitionStatus = ignition ? 'ignitionOn' : 'ignitionOff';
    const vehicleStatus = status === 'online' ? 'statusOnline' : status === 'offline' ? 'statusOffline' : 'statusUnknown';
    const deviceSpeed = speed <= stopLimit ? 'deviceStopped' : speed > stopLimit ? 'deviceMoving' : 'deviceInactive'
    const formattedDate = moment().format('DD/MM/YYYY HH:mm:ss');
    let message;
    if (type === 'Ignition') {
        message = `Vehicle ${deviceData.deviceId} has ${ignition ? 'started' : 'stopped'}!`;
    } else if (type === 'Idle') {
        message = `Vehicle ${deviceData.deviceId} is idle! Speed: ${speed} km/h`;
    } else if (type === 'Overspeed') {
        message = `Vehicle ${deviceData.deviceId} is overspeeding! Speed: ${speed} km/h`;
    } else if (type === "statusOnline" ? "statusOnline" : type === "statusOffline" ? "statusOffline" : "statusUnknown") {
        message = `Status of ${deviceData.deviceId} is ${status === 'online' ? 'online' : status === 'offline' ? 'offline' : 'unknown'}`;
    } else if (type === 'deviceMoving') {
        message = `Device ${deviceData.deviceId} is moving! Speed: ${speed} km/h`;
    } else if (type === 'deviceStopped') {
        message = `Device ${deviceData.deviceId} is stopped! Speed: ${speed} km/h`;
    }

    return {
        type: type === 'Ignition' ? ignitionStatus : type || vehicleStatus || deviceSpeed,
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

export const AlertFetching = async () => {
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
        })
        const deviceData = resdevice.data

        const deviceApiData = new Map(deviceData.map(item => [item.id, item]))

        PositionApiData.forEach(obj1 => {
            const match = deviceApiData.get(obj1.deviceId);
            if (match) {
                obj1.status = match.status;
            }
        });

        // console.log("position api data ",PositionApiData);

        PositionApiData.forEach((deviceData) => checkDeviceStatus(deviceData));


    } catch (error) {
        console.error('Error fetching data:', error);
    }
}
