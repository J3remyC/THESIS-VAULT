import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors"

import { connectDB } from "./db/connectDB.js";
import authRoutes from "./routes/auth.route.js"


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({origin: "http://localhost:5173", credentials: true}));

app.use(express.json()); // allows us to parse incoming requests
app.use(cookieParser());
app.use("/api/auth", authRoutes)

app.listen(PORT, () =>{
    connectDB();
    console.log("Server is running on port 3000")
})

//8gr22hMS809jfupt