
import express from "express";
import {
    addDoctor,
    allDoctor,
    appointmentsAdmin,
    loginAdmin,
    adminDashboard,
    cancelAppointment,
    getDoctorById,
    updateDoctorProfile,
    updateDoctorWorkingHours,
    getDoctorWorkingHours,
} from "../controllers/adminController.js";
import upload from "../middlewares/multer.js";
import authAdmin from "../middlewares/authAdmin.js";
import { changeAvailablity } from "../controllers/doctorController.js";

const adminRouter = express.Router();

// Authentication
adminRouter.post("/login", loginAdmin);

// Dashboard
adminRouter.get("/dashboard", authAdmin, adminDashboard);

// Doctor management
adminRouter.post("/add-doctor", authAdmin, upload.single("image"), addDoctor);
adminRouter.get("/all-doctors", authAdmin, allDoctor);
adminRouter.get("/doctor/:doctorId", authAdmin, getDoctorById);
adminRouter.put("/update-doctor/:doctorId", authAdmin, updateDoctorProfile);

// Working hours management
adminRouter.get(
    "/doctor/:doctorId/working-hours",
    authAdmin,
    getDoctorWorkingHours
);
adminRouter.put(
    "/doctor/:doctorId/working-hours",
    authAdmin,
    updateDoctorWorkingHours
);


// Availability management
adminRouter.post("/change-availability", authAdmin, changeAvailablity);

// Appointment management
adminRouter.get("/appointments", authAdmin, appointmentsAdmin);
adminRouter.post("/cancel-appointment", authAdmin, cancelAppointment);

export default adminRouter;
