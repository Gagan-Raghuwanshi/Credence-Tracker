import mongoose from 'mongoose';

const modelSchema = new mongoose.Schema({
modelName:{
       type:String
    }
});

const Model = mongoose.model('model', modelSchema);
export  { Model };
