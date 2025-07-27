import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import adminRouter from "./routes/adminRoute.js";
import doctorRouter from "./routes/doctorRoute.js";
import userRouter from "./routes/userRoute.js";
import { stripeWebhook } from "./controllers/userController.js";

//app config
const app = express();
const port = process.env.PORT || 4000;
connectDB();
connectCloudinary();

// ✅ Stripe raw body middleware قبل أي middleware آخر
app.use(
    "/api/user/stripe/webhook",
    express.raw({ type: "application/json" }),
    stripeWebhook
);

//middlewares
app.use(express.json());
app.use(cors());

//api endpoints
app.use("/api/admin", adminRouter);
app.use("/api/doctor", doctorRouter);
app.use("/api/user", userRouter);

app.get("/", (req, res) => {
    res.send("API Workink");
});

app.listen(port, () => console.log("server started", port));

app.use("/api/doctor", doctorRouter);

