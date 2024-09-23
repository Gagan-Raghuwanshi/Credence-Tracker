import mongoose from 'mongoose';
const { Schema } = mongoose;

const NotificationSchema = new Schema({
    status: {
        type: String,
        required: true,
        enum: ['Ignition On', 'Idle', 'Ignition Off'], // Can add more status types if needed
    },
    vehicleName: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        default: 'Address not available',
    },
    added: {
        type: String,
        required: true,
    },
    location: {
        type: [Number], // Array with two numbers [longitude, latitude]
        required: true,
        validate: {
            validator: function (arr) {
                return arr.length === 2;
            },
            message: 'Location must have exactly two elements: [longitude, latitude]',
        }
    },
    message: {
        type: String,
        required: true,
    }
});

const Notification = mongoose.model('Notification', NotificationSchema);

export default Notification;
