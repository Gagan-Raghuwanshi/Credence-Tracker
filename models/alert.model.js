import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
    deviceId: {
        type: Number,
        required: true,
        index: true, // For faster querying
    },
    type: {
        type: String,
        required: true,
        enum: [
            "statusOnline",
            "statusOffline",
            "statusUnknown",
            "deviceActive",
            "deviceInactive",
            "deviceMoving",
            "deviceStopped",
            "speedLimitExceeded",
            "ignitionOn",
            "ignitionOff",
            "fuelDrop",
            "fuelIncrease",
            "geofenceEntered",
            "geofenceExited",
            "alarm",
            "maintenanceRequired"
        ],
    },
    data: {
        type: String,
    },
    message: {
        type: String,
    },
    eventTime: {
        type: Date,
        required: true,
        default: Date.now, // Set the default to the current date
    },
    positionId: {
        type: Number,
        default: 0, // Default value if not provided
    },
    geofenceId: {
        type: Number,
        default: 0, // Default value if not provided
    },
    maintenanceId: {
        type: Number,
        default: 0, // Default value if not provided
    },
    attributes: {
        type: Object, // Optional additional attributes for flexibility
        default: {},
    }
}, {
    timestamps: true, // Automatically create createdAt and updatedAt fields
});

// Create an index on deviceId and eventTime for efficient querying
alertSchema.index({ deviceId: 1, eventTime: 1 });

const Alert = mongoose.model('Alert', alertSchema);

export default Alert;
