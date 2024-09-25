const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reportSchema = new Schema({
  Devices: {
    type: [String], 
    required: true,
  },
  Details: {
    type: String,
    required: true,
  },
  Periods: {
    type: [String], 
    required: true,
  },
  FromDate: {
    type: String,
    required: true,
  },
  ToDate: {
    type: String, 
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
