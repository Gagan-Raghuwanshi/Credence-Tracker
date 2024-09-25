import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema({
  devicename: { 
              type: String, 
              required: true 
            },
  uniqueId: { 
                type: String, 
                required: true, 
                unique: true 
              },
  sim:  { 
              type: String 
  },
  speed: {
              type: Number 
   },
   average:{
              type:Number
   },
   Driver:{
          type: mongoose.Schema.Types.ObjectId, 
          ref: 'Driver'   
         },
  groups: [{ 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Group' 
          }], 
  users: [{ 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User' 
  }], 
  geofences: [{ 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Geofence' 
  }],
  models: {
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Model' 
    },
  categories: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Category' 
  },
  installationdate: { 
            type: String
          },
  expirationdate: { 
            type: String 
  },
  extenddate: { 
            type: String 
  },
  createdBy: {
          type: mongoose.Schema.Types.ObjectId, 
          ref: 'User',
          require:true
},

});

const Device = mongoose.model('Device', deviceSchema);
export  {Device};
