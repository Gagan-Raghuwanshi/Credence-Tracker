import mongoose from "mongoose";

const historyschema = new mongoose.Schema({
  speed: {
    type: Number,
  },
  ignition: {
    type: Boolean,
  },
  longitude: {
    type: Number,
    required: true,
  },
  latitude: {
    type: Number,
    required: true,
  },
  course: {
    type: Number,
  },
  deviceId: {
    type: Number,
  },
  deviceTime: {
    type: Date,
  },
  distance: {
    type: Number,
  },
  totalDistance: {
    type: Number,
  },
  state: {
    type: String,
  },
  satellite: {
    type: String,
  },
},
{ timestamps: true }

);

export const History = mongoose.model("History", historyschema);
