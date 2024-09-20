// Import necessary modules
import mongoose from "mongoose";

// Define an asynchronous function to establish a database connection
const DBconnection = async () => {
    try {
        // Attempt to connect to MongoDB using the URI from environment variables
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB successfully");
    } catch (error) {
        // If connection fails, log the error and exit the process
        console.error("Error connecting to MongoDB:", error.message);
        process.exit(1);  // Exit with a failure code
    }
}

// Export the DBconnection function as the default export
export default DBconnection;