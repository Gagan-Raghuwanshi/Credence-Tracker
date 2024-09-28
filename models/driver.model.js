import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    phone: {
        type: Number,
        
        required: true,
    },
    email: {
        type: String,
    },
    device: {
        type: Number,
    },
    licenseNumber: {
        type: String,
    },
    aadharNumber: {
        type: String,
    },
    address: {
        type: String,
    },
    attributes: [{
        attribute: {
            type: String,
        },
        type: {
            type: String,
            enum: ['String', 'Number', 'Boolean'],
        },
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
});

const Driver = mongoose.model('Driver', driverSchema);

export { Driver };
