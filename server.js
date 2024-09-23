// import necessary modules
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import DBconnection from "./database/db.js"; // Database connection
import superadminRoutes from './routes/superadminRoute.js';
import userRoutes from './routes/userRoute.js';
import authRoutes from './routes/authRoute.js'; 
import GroupRoute from './routes/group.route.js'
import deviceRoute from "./routes/deviceRoute.js"
// Load environment variables
dotenv.config();

// Create Express server
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());

// Root route
app.get("/", (req, res) => {
    res.status(200).json({
        message: "Server is running",
        success: true
    });
});


// Use routes
app.use('/superadmin', superadminRoutes);
app.use('/auth', authRoutes); 
app.use('/user', userRoutes);  
app.use("/group",GroupRoute);
app.use("/device",deviceRoute)

// Start server and connect to database
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    try {
        await DBconnection();
        console.log(`Server is listening on port ${PORT}`);
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
});


