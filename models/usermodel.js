import mongoose from 'mongoose';
// import { encrypt, decrypt } from  './cryptoUtils.js';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  custName: { type: String },
  email: { type: String, },
  password: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  mobile: { type: String },
  contactPerson: { type: String },
  groupsAssigned: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  address: { type: String, },
  status: { type: String, },
  added: { type: String, },
  inactiveDate: { type: String, },
  timezone: { type: String, },
  notification: { type: Boolean, default: false },
  devices: { type: Boolean, default: false },
  driver: { type: Boolean, default: false },
  groups: { type: Boolean, default: false },
  category: { type: Boolean, default: false },
  model: { type: Boolean, default: false },
  users: { type: Boolean, default: false },
  report: { type: Boolean, default: false },
  stop: { type: Boolean, default: false },
  travel: { type: Boolean, default: false },
  geofence: { type: Boolean, default: false },
  geofenceReport: { type: Boolean, default: false },
  maintenance: { type: Boolean, default: false },
  preferences: { type: Boolean, default: false },
  // status: { type: Boolean,default:false},
  distance: { type: Boolean, default: false },
  history: { type: Boolean, default: false },
  sensor: { type: Boolean, default: false },
  idle: { type: Boolean, default: false },
  alerts: { type: Boolean, default: false },
  vehicle: { type: Boolean, default: false },
  devicelimit: { type: Boolean, default: false },
  dataLimit: { type: Number, },
  entriesCount: { type: Number, default: 0 }
});

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);  // Await the hash
  }
  next();
});


// userSchema.pre('save', async function(next) {
//   if (this.isModified('password')) {
//     this.password = encrypt(this.password);
//   }
//   next();
// });

// userSchema.methods.comparePassword = function(candidatePassword) {
//   const decryptedPassword = decrypt(this.password);
//   return candidatePassword === decryptedPassword;
// };
const User = mongoose.models.User || mongoose.model('User', userSchema);

export { User };
