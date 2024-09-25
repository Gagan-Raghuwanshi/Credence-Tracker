import mongoose from 'mongoose';

const geofenceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true }, // e.g., 'Airport', 'School', etc.
  geofenceCode: { type: String, required: false }, // Optional field
  transitTime: { type: Number, required: false }, // Optional field, number of days
  area: { type: Object, required: true }, // Holds geospatial data (coordinates, etc.)
  assignType: { type: String, required: true, enum: ['all vehicles', 'vehicle'] },
  vehicleIds: [{ type: String }], // Only required when assignType is 'vehicle'
  createdBy: { type: String, required: true }
},
  { timestamps: true },
);

const Geofence = mongoose.model('Geofence', geofenceSchema);

export default Geofence;
