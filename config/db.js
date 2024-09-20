// Import required modules
import mongoose from "mongoose";
import dotenv from "dotenv"

// Load environment variables from .env file
dotenv.config()

// Function to establish database connection
const DBconnection = async () => {
    try {
        // Attempt to connect to MongoDB using the URI from environment variables
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB successfully")
    } catch (error) {
        // Log any errors that occur during connection
        console.log("Error connecting to MongoDB:", error)
    }
}

// Export the DBconnection function for use in other modules
export default DBconnection;