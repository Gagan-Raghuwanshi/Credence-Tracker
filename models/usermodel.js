import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  username: { type: String, required: true },
  mobile: { type: String},
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  notification: { type: Boolean,default:false},
  devices: { type: Boolean ,default:false},
  driver: { type: Boolean,default:false},
  groups: { type: Boolean,default:false},
  category: { type: Boolean ,default:false},
  model: { type: Boolean ,default:false},
  users: { type: Boolean,default:false},
  report: { type: Boolean,default:false},
  stop: { type: Boolean ,default:false},
  trips: { type: Boolean,default:false}
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

export { User };
