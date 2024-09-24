import mongoose from "mongoose";

const geofenceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  area: {
    type: String,
    required: true,
  },
  isCrossed: {
    type: Boolean,
    default: false
  },
  deviceId: {
    type: String,
    required: true
  }, 
  createdBy: {
    type: String,
    required: true
  }
});

const Geofence = mongoose.model("Geofence", geofenceSchema);
export default Geofence;
