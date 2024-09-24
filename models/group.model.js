import mongoose from 'mongoose';
import AutoIncrement from 'mongoose-sequence';
const { Schema } = mongoose;
const groupSchema = new Schema({
name: {
     type: String,
     required: true,
     unique: true
},
attributes: {
     type: Map,
     of: Schema.Types.Mixed,
     default: {}
}, 
createdBy: {
     type: mongoose.Schema.Types.ObjectId, ref: 'User',
     default: null
},
createdAt: { type: Date, default: Date.now },
});
groupSchema.plugin(AutoIncrement(mongoose), { inc_field: 'id' });
export const Group =  mongoose.model('Group', groupSchema);
