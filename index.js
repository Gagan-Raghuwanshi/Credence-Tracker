import express from "express";
import dotenv from "dotenv"
import cookieParser from "cookie-parser"
import cors from "cors"
import DBconnection from "./config/db.js";


// .env configration
dotenv.config()


// Express server is creating 
const app = express();

// middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(cors());

// API's will appear here



app.get("/", (req, res) => {
    res.status(201).json({
        message: "comming from backend, server has started",
        success: true
    })
})

app.listen(process.env.PORT, async () => {
    // DB function call
    DBconnection();
    console.log(`Server is Listen at port ${process.env.PORT} `)
})


