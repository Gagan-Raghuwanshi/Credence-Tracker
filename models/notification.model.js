import mongoose from 'mongoose';
const { Schema } = mongoose;
const NotificationSchema = new Schema({
type: [{
     type: String,
     required: true,
}],
channel: {
     type: String,
    
}, 
deviceId:{
     type:mongoose.Schema.Types.ObjectId,
     ref:"Device"
},
// AllDevices:{
//      type:Boolean,
//      default:false
// },
createdBy: {
     type: mongoose.Schema.Types.ObjectId, 
     ref: 'User',
},
createdAt: { type: Date, default: Date.now },
});
export const Notification =  mongoose.model('Notification', NotificationSchema);
