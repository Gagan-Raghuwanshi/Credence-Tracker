import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema({
  devicename: { type: String, required: true },
  imei: { type: String, required: true, unique: true },
  sim: { type: String, required: true },
  groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }], // Array of group references
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Array of user references
  geofences: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Geofence' }], // Array of geofence references
  speed: { type: Number },
  average: { type: Number },
  model: { type: String },
  category: { type: String },
  installationdate: { type: Date },
  expirationdate: { type: Date },
  extenddate: { type: Date },
});

const Device = mongoose.model('Device', deviceSchema);
export  {Device};
