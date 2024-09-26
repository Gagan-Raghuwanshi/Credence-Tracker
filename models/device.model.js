import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema({
  name: { 
              type: String, 
              required: true 
            },
  uniqueId: [{ 
                type: String, 
                required: true, 
                unique: true 
              }],
  sim:  { 
              type: String,
              default:""
  },
  speed: {
              type: String,
              default:"" 
   },
   average:{
              type:String,
              default:""
   },
   Driver:{
          type: mongoose.Schema.Types.ObjectId, 
          ref: 'Driver',
          default:""
  
         },
  groups: [{ 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Group',
            default:""
          }], 
  users: [{ 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User',
            default:""
 
  }], 
  geofences: [{ 
            type:mongoose.Schema.Types.ObjectId,
            ref: 'Geofence',
            default:"" 
  }],
  model: {
            type:String,
            default:"" 
    },
  category: { 
            type: String, 
            default:""
  },
  installationdate: { 
            type: String,
            default:""
          },
  expirationdate: { 
            type: String,
            default:""
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
