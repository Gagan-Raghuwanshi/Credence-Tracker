// import necessary modules
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import DBconnection from "./config/db.js";

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
