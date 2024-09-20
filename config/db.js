import mongoose from "mongoose";
import dotenv from "dotenv"

dotenv.config()


const DBconnection = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("connected to mongoDB")
    } catch (error) {
        console.log(error)
    }
}
export default DBconnection;