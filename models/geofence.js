import mongoose from 'mongoose';

const GeofenceSchema = new mongoose.Schema({
area:{
    type:String
},
name:{
    type:String
},
de

});

const Geofence = mongoose.model('Geofence', GeofenceSchema);
export  {Geofence};
