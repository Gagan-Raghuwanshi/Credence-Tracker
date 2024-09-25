import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema({
  name: { 
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
              type: String 
   },
   average:{
              type:String
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
            type:String, 
  }],
  model: {
            type:String, 
    },
  category: { 
            type: String, 
  },
  installationdate: { 
            type: String
          },
  expirationdate: { 
            type: String 
  },
  extenddate: { 
            type: String,
            default:null
  },
  createdBy: {
          type: mongoose.Schema.Types.ObjectId, 
          ref: 'User',
          require:true
},

});

const Device = mongoose.model('Device', deviceSchema);
export  {Device};
