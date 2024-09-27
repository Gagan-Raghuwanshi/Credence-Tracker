import mongoose from 'mongoose';

const devicelistSchema = new mongoose.Schema({

     deviceId: {
          type: String,
          required: true,
          // unique: true
     },
     uniqueId: {
          type: String,
          required: true,
          // unique: true
     },
     positionId: {
          type: String,
          required: true,
          // unique: true
     },
     status: {
          type: String,
     },
     lastUpdate: {
          type: String,
     },


});

const Devicelist = mongoose.model('Devicelist', devicelistSchema);
export { Devicelist };
