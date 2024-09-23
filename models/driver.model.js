import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    identifier: {
        type: String,
        required: true,
        unique: true,
    },
    attributes: [{
        attribute: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ['String', 'Number', 'Boolean'],
        },
    }],
});

const Driver = mongoose.model('Driver', driverSchema);

export { Driver };
