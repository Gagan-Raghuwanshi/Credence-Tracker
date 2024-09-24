import mongoose from "mongoose"

const { Schema } = mongoose;

const categorySchema = new Schema({

     categoryName: {
               type: String,
               required: true,
               unique: true
          },
     createdAt: { type: Date, default: Date.now },

})

export const Category =  mongoose.model('Category', categorySchema);