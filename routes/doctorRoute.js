
import express from "express";
import {
    appointmentCancel,
    appointmentComplete,
    appointmentDoctor,
    getDashData,
    doctorList,
    doctorProfile,
    loginDoctor,
    updateDoctorProfile,
    updateSlotsSettings,
    getAvailableSlots,
    testDoctorData,
    resetWorkingHours,
} from "../controllers/doctorController.js";
import authDoctor from "../middlewares/authDoctor.js";

const doctorRouter = express.Router();

doctorRouter.get("/list", doctorList);
doctorRouter.post("/login", loginDoctor);
doctorRouter.get("/appointments", authDoctor, appointmentDoctor);
doctorRouter.post("/complete-appointment", authDoctor, appointmentComplete);
doctorRouter.post("/cancel-appointment", authDoctor, appointmentCancel);
doctorRouter.get("/dashboard", authDoctor, getDashData);
doctorRouter.get("/profile", authDoctor, doctorProfile);
doctorRouter.post("/update-profile", authDoctor, updateDoctorProfile);
doctorRouter.post("/update-slots-settings", authDoctor, updateSlotsSettings);

doctorRouter.get("/available-slots/:docId", authDoctor, getAvailableSlots);
doctorRouter.get("/test-data", authDoctor, testDoctorData);
doctorRouter.post("/reset-working-hours", authDoctor, resetWorkingHours);
export default doctorRouter;
