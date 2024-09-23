import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema({
  devicename: { type: String, required: true },
  imei: { type: String, required: true, unique: true },
  sim: { type: String, required: true },
  groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }], 
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], 
  geofences: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Geofence' }],
  speed: { type: Number },
  average: { type: Number },
  model: { type: String },
  category: { type: String },
  installationdate: { type: String},
  expirationdate: { type: String },
  extenddate: { type: String },
});

const Device = mongoose.model('Device', deviceSchema);
export  {Device};
