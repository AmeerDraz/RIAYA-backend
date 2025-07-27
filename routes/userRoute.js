import express from "express";
import {
    registerUser,
    loginUser,
    getProfile,
    updateProfile,
    bookAppointment,
    listAppointment,
    cancelAppointment,
    getDoctorAvailableSlots,
    testDoctors,
    paymentStripe,
    confirmPayment,
    forgotPassword,
    resetPassword,
} from "../controllers/userController.js";

import {
    addTestimonial,
    getTestimonials,
    updateTestimonial, 
} from "../controllers/testimonialController.js";

import authUser from "../middlewares/authUser.js";
import upload from "../middlewares/multer.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/doctor/:docId/available-slots", getDoctorAvailableSlots);
userRouter.get("/get-profile", authUser, getProfile);
userRouter.post(
    "/update-profile",
    upload.single("image"),
    authUser,
    updateProfile
);
userRouter.post("/book-Appointment", authUser, bookAppointment);
userRouter.get("/appointments", authUser, listAppointment);
userRouter.delete("/cancel-appointment", authUser, cancelAppointment);
userRouter.post("/payment-stripe", authUser, paymentStripe);
userRouter.post("/confirm-payment", authUser, confirmPayment);

userRouter.get("/test-doctors", testDoctors);

// ⭐ التقييمات
userRouter.post("/testimonial/add", authUser, addTestimonial);
userRouter.get("/testimonial/list", getTestimonials);
userRouter.put("/testimonial/update/:id", authUser, updateTestimonial); // 

/************************** */

userRouter.post("/forgot-password", forgotPassword);
userRouter.post("/reset-password/:token", resetPassword);

export default userRouter;
