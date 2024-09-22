// models/superAdminModel.js
import mongoose from 'mongoose';

const superAdminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  username: { type: String, required: true },
});

// Prevent overwriting the SuperAdmin model
const SuperAdmin = mongoose.models.SuperAdmin || mongoose.model('SuperAdmin', superAdminSchema);

export { SuperAdmin };
