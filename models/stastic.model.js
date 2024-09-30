import mongoose  from 'mongoose';
const statisticsSchema = new mongoose.Schema({
    captureTime: { type: Date, required: true },
    activeUsers: { type: Number, required: true },
    activeDevices: { type: Number, required: true },
    messagesStored: { type: Number, required: true },
    requests: { type: Number, required: true },
    messagesReceived: { type: Number, required: true },
    mail: { type: Number, default: 0 },
    sms: { type: Number, default: 0 },
    geocoderRequests: { type: Number, required: true },
    geolocationRequests: { type: Number, default: 0 }
});

export const  Statistics =  mongoose.model('Statistics', statisticsSchema);