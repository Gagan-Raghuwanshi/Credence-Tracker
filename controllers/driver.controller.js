import { Driver } from '../models/driver.model.js';

export const getDrivers = async (req, res) => {
    try {
        // Get page and limit from query parameters, with default values
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        // Calculate the starting index for the documents
        const skip = (page - 1) * limit;

        const role = req.user.role;

        // Fetch the drivers with pagination
        let drivers;

        if (role === 'superadmin') {
            drivers = await Driver.find()
                .skip(skip)
                .limit(limit);
        } else if (role === 'user') {
            drivers = await Driver.find({ createdBy: req.user.id })
                .skip(skip)
                .limit(limit);
        } else {
            return res.status(403).json({ message: 'Forbidden: Invalid role' });
        }
        drivers = drivers.reverse();
        const totalDrivers = role === 'superadmin'
            ? await Driver.countDocuments()
            : await Driver.countDocuments({ createdBy: req.user.id });


        // Send response with drivers and pagination info
        res.status(200).json({
            drivers,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalDrivers / limit),
                totalDrivers,
            },
        });
    } catch (error) {
        console.error('Error fetching drivers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export const registerDriver = async (req, res) => {
    try {
        const { name, phone, email, device, licenseNumber, aadharNumber, address, city, state, pincode } = req.body;
        const createdBy = req.user.id;
        const existingDriver = await Driver.findOne({ phone });
        if (!name || !phone) {
            return res.status(400).json({ error: 'Name and phone are required' });
        }
        if (existingDriver) {
            return res.status(400).json({ error: 'Driver with this phone number already exists' });
        }

        const newDriver = new Driver({ name, phone, email, device, licenseNumber, aadharNumber, address, city, state, pincode, createdBy });
        await newDriver.save();

        res.status(200).json({ message: 'Driver registered successfully', driver: newDriver });
    } catch (error) {
        console.error('Error registering driver:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export const updateDriver = async (req, res) => {
    try {
        const { id } = req.params;
        const { ...updateFields } = req.body;

        const driver = await Driver.findById(id);
        if (!driver) {
            return res.status(404).json({ error: 'Driver not found' });
        }

        Object.keys(updateFields).forEach((field) => {
            driver[field] = updateFields[field];
        });

        await driver.save();

        res.status(200).json({ message: 'Driver updated successfully', driver });
    } catch (error) {
        console.error('Error updating driver:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export const deleteDriver = async (req, res) => {
    try {
        const { id } = req.params;
        await Driver.findByIdAndDelete(id);
        res.status(200).json({ message: 'Driver deleted successfully' });
    } catch (error) {
        console.error('Error deleting driver:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
