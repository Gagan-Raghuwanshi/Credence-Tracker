import mongoose from 'mongoose';


const { Schema } = mongoose;



const deviceSchema = new Schema({
               name: { 
                    type: String, 
                    required: true 
               },
               group: {
                     type: Schema.Types.ObjectId, 
                     ref: 'Group', 
                     required: true 
                    },
               serialNumber: { 
                    type: String, 
                    unique: true, 
                    required: true 
               },
               status: {
                    type: String, 
                    enum: ['active', 'inactive'], 
                    default: 'active'
               },
               createdAt: { 
                    type: Date,
                     default: Date.now 
                    }
   });
   
   export default  mongoose.model('Device', deviceSchema);
   