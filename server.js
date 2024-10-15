// import necessary modules
import express from "express";
import { createServer } from "http";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import DBconnection from "./database/db.js"; 
import superadminRoutes from './routes/superadminRoute.js';
import userRoutes from './routes/userRoute.js';
import authRoutes from './routes/authRoute.js';
import GroupRoute from './routes/group.route.js'
import deviceRoute from "./routes/deviceRoute.js"
import driverRoute from './routes/driver.route.js';
import { setupSocket } from "./socket/socket.js";
import { fetchGPSdata } from "./utils/fetchGPSdata.js";
import geofenceRoute from "./routes/geofence.route.js";
import modelRoute from "./routes/modelRoute.js"
import reportRoute from "./routes/reportRoute.js"
import categoryRoute from "./routes/category.route.js"
import historyRoute from "./routes/deviceHistory.route.js";
import alertRoute from "./routes/alert.route.js"
import notificationRoute from "./routes/notification.route.js"
import { fetchdevicedata } from "./utils/devicelistfunction.js";
import { AlertFetching } from "./utils/alert.utils.js";
dotenv.config();

const app = express();
const server = createServer(app);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());


 

app.get("/", (req, res) => {
    return res.status(200).json({
        message: "hello"
    });
});


// Use routes
app.use('/superadmin', superadminRoutes);
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use("/group", GroupRoute);
app.use("/driver", driverRoute);
app.use("/device", deviceRoute);
app.use("/model", modelRoute);
app.use("/category", categoryRoute)
app.use("/geofence", geofenceRoute)
app.use("/history", historyRoute)
app.use("/reports", reportRoute)
app.use("/alerts", alertRoute)
app.use("/notifications", notificationRoute)


// setInterval(() => {
fetchGPSdata();
// }, 10000);

// setInterval(() => {
fetchdevicedata()
// }, 10000);



const io = setupSocket(server);



// setInterval(() => {
//     AlertFetching(io)
//     }, 10000);



// import './utils/notification.utils.js';
// Start server and connect to database
const PORT = process.env.PORT || 3000;
server.listen(PORT, async () => {
    try {
        await DBconnection();
        console.log(`Server is listening on port ${PORT}`);
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
});


