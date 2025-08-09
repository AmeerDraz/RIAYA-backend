import validator from "validator";
import bcrypt from "bcrypt";
import { userModel, UserStatus } from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import Stripe from "stripe";
import crypto from "crypto";
import nodemailer from "nodemailer";

// تسجيل المستخدم
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.json({ success: false, message: "Missing Details" });
        }
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Enter a valid email" });
        }
        if (password.length < 8) {
            return res.json({ success: false, message: "Password too short" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new userModel({
            name,
            email,
            password: hashedPassword,
        });
        const user = await newUser.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        res.json({ success: true, token });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// تسجيل دخول المستخدم
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: "User does not exist" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
            res.json({ success: true, token });
        } else {
            res.json({ success: false, message: "Invalid email or password" });
        }
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// POST /forgot-password

const forgotPassword = async (req, res) => {
    console.log("start fnssssssssssssssssssssssss");
    const { email } = req.body;
    try {
        console.log("second");
        const user = await userModel.findOne({ email });
        // console.log("user:", user);

        if (!user) return res.status(404).json({ message: "Email not found" });
        const token = crypto.randomBytes(32).toString("hex");
        console.log("token:", token);

        const tokenExpiry = Date.now() + 3600000; // 1 hour

        user.resetToken = token;
        user.resetTokenExpiry = tokenExpiry;
        await user.save();
        console.log("user after save:");

        const resetLink = `${process.env.FRONTEND_BASE_URL}/reset-password?token=${token}`;

        // Send email
        const transporter = nodemailer.createTransport({
            service: "gmail",
            host: "smtp.gmail.com",
            // port: 587,
            // secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            // logger: true,
            // debug: true,
        });

        await transporter.sendMail({
            from: '"MyApp Support Team" <0d1cb88b49@emaily.pro>',
            to: user.email,
            subject: "Reset your password",
            html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #3CB9A0 0%, #2a9d8f 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
            position: relative;
        }
        
        .header {
            background: linear-gradient(135deg, #3CB9A0, #2a9d8f);
            padding: 40px 30px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: rotate 20s linear infinite;
        }
        
        @keyframes rotate {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .lock-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(10px);
            border: 2px solid rgba(255, 255, 255, 0.3);
            position: relative;
            z-index: 2;
        }
        
        .lock-icon svg {
            width: 40px;
            height: 40px;
            fill: white;
        }
        
        .header h1 {
            color: white;
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
            position: relative;
            z-index: 2;
        }
        
        .header p {
            color: rgba(255, 255, 255, 0.9);
            font-size: 16px;
            font-weight: 300;
            position: relative;
            z-index: 2;
        }
        
        .content {
            padding: 50px 40px;
            text-align: center;
        }
        
        .message {
            font-size: 18px;
            color: #555;
            margin-bottom: 30px;
            line-height: 1.8;
        }
        
        .reset-button {
            display: inline-block;
            background: linear-gradient(135deg, #3CB9A0, #2a9d8f);
            color: white;
            text-decoration: none;
            padding: 18px 40px;
            border-radius: 50px;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.3s ease;
            box-shadow: 0 10px 30px rgba(60, 185, 160, 0.4);
            position: relative;
            overflow: hidden;
        }
        
        .reset-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.5s ease;
        }
        
        .reset-button:hover::before {
            left: 100%;
        }
        
        .reset-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 15px 40px rgba(60, 185, 160, 0.6);
        }
        
        .security-notice {
            background: linear-gradient(135deg, #f0fffe, #e8fffe);
            border-left: 4px solid #3CB9A0;
            padding: 25px;
            margin: 40px 0;
            border-radius: 10px;
        }
        
        .security-notice h3 {
            color: #333;
            font-size: 18px;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .security-notice p {
            color: #666;
            font-size: 14px;
            line-height: 1.6;
        }
        
        .timer {
            background: linear-gradient(135deg, #ffeaa7, #fdcb6e);
            padding: 20px;
            border-radius: 15px;
            margin: 30px 0;
            text-align: center;
        }
        
        .timer h4 {
            color: #d63031;
            font-size: 16px;
            margin-bottom: 5px;
        }
        
        .timer p {
            color: #2d3436;
            font-size: 14px;
            font-weight: 500;
        }
        
        .footer {
            background: #f8f9fa;
            padding: 30px 40px;
            text-align: center;
            border-top: 1px solid #eee;
        }
        
        .footer p {
            color: #999;
            font-size: 14px;
            line-height: 1.6;
        }
        
        @media (max-width: 600px) {
            .email-container {
                margin: 10px;
                border-radius: 15px;
            }
            
            .content {
                padding: 30px 20px;
            }
            
            .header {
                padding: 30px 20px;
            }
            
            .header h1 {
                font-size: 24px;
            }
            
            .reset-button {
                padding: 15px 30px;
                font-size: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="lock-icon">
                <svg viewBox="0 0 24 24">
                    <path d="M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z"/>
                </svg>
            </div>
            <h1>Password Reset</h1>
            <p>Let's get you back into your account</p>
        </div>
        
        <div class="content">
            <div class="message">
                <p>We received a request to reset your password. No worries, it happens to the best of us! Click the button below to create a new password and regain access to your account.</p>
            </div>
            
            <a href="${resetLink}" class="reset-button">Reset My Password</a>
            
            <div class="timer">
                <h4>⏰ Time Sensitive</h4>
                <p>This link expires in <strong>1 hour</strong> for your security</p>
            </div>
            
            <div class="security-notice">
                <h3>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#3CB9A0">
                        <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,7.6 15.8,8.6C16.8,9.6 17.4,11 17.4,12.4C17.4,13.8 16.8,15.2 15.8,16.2C14.8,17.2 13.4,17.8 12,17.8C10.6,17.8 9.2,17.2 8.2,16.2C7.2,15.2 6.6,13.8 6.6,12.4C6.6,11 7.2,9.6 8.2,8.6C9.2,7.6 10.6,7 12,7M12,9C11.2,9 10.4,9.3 9.9,9.9C9.3,10.4 9,11.2 9,12C9,12.8 9.3,13.6 9.9,14.1C10.4,14.7 11.2,15 12,15C12.8,15 13.6,14.7 14.1,14.1C14.7,13.6 15,12.8 15,12C15,11.2 14.7,10.4 14.1,9.9C13.6,9.3 12.8,9 12,9Z"/>
                    </svg>
                    Security Notice
                </h3>
                <p>If you didn't request this password reset, please ignore this email. Your account remains secure and no changes have been made.</p>
            </div>
        </div>
        
        <div class="footer">
            <p>This email was sent from a secure, monitored mailbox. Please do not reply to this message.</p>
            <p>Need help? Contact our <a href="#">support team</a> or visit our <a href="#">help center</a>.</p>
        </div>
    </div>
</body>
</html>`,
        });
        res.json({ message: "Password reset link sent to your email" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// POST /reset-password/:token
const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    try {
        const user = await userModel.findOne({
            resetToken: token,
            resetTokenExpiry: { $gt: Date.now() },
        });

        if (!user)
            return res
                .status(400)
                .json({ message: "Invalid or expired token" });

        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();

        res.json({ message: "Password has been reset" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// الحصول على بيانات ملف المستخدم
const getProfile = async (req, res) => {
    try {
        const userId = req.userId;
        const userData = await userModel.findById(userId).select("-password");
        res.json({ success: true, userData });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// تحديث ملف المستخدم
const updateProfile = async (req, res) => {
    try {
        const userId = req.userId;
        const { name, phone, address, dob, gender } = req.body;
        const imageFile = req.file;

        var isValidData = false;
        const cleanedPhone = phone ? phone.replace(/[^0-9+]/g, "") : "";
        if (
            !name ||
            typeof name !== "string" ||
            name.trim() === "" ||
            !cleanedPhone ||
            typeof phone !== "string" ||
            !/^\+?[0-9]{7,15}$/.test(cleanedPhone) ||
            !address ||
            typeof address !== "string" ||
            address.trim() === "" ||
            !dob ||
            isNaN(Date.parse(dob)) ||
            !gender ||
            !["male", "female", "unselected"].includes(gender.toLowerCase())
        ) {
            // todo: nothing
        } else {
            isValidData = true;
        }
        console.log(req.body);
        console.log(isValidData);

        if (!name || !phone || !dob || !gender || !address) {
            return res.json({ success: false, message: "Missing data" });
        }

                    console.log("qmwe", phone);

        const updatedData = {
            name,
            phone,
            address: JSON.parse(address),
            dob,
            gender,
            status: isValidData ? UserStatus.ACTIVE : UserStatus.ONBORDING,
        };

        if (imageFile) {
            const imageUpload = await cloudinary.uploader.upload(
                imageFile.path,
                {
                    resource_type: "image",
                }
            );
            updatedData.image = imageUpload.secure_url;
        }

        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            updatedData,
            { new: true }
        );
        res.json({ success: true, message: "Profile updated", updatedUser });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// حجز موعد
const bookAppointment = async (req, res) => {
    try {
        const userId = req.userId; // من التوكن
        const { docId, slotDate, slotTime } = req.body;

        const docData = await doctorModel.findById(docId).select("-password");
        if (!docData || !docData.available) {
            return res.json({
                success: false,
                message: "Doctor not available",
            });
        }

        let slots_booked = docData.slots_booked || {};

        if (slots_booked[slotDate]) {
            if (slots_booked[slotDate].includes(slotTime)) {
                return res.json({
                    success: false,
                    message: "Slot not available",
                });
            } else {
                slots_booked[slotDate].push(slotTime);
            }
        } else {
            slots_booked[slotDate] = [slotTime];
        }

        const userData = await userModel.findById(userId).select("-password");

        if (userData.status !== UserStatus.ACTIVE) {
            return res.json({
                success: false,
                message:
                    "You are not allowed to book an appointment, please fill you profile data",
            });
        }

        delete docData.slots_booked;

        const appointmentData = {
            userId,
            docId,
            userData,
            docData,
            amount: docData.fees,
            slotTime,
            slotDate,
            date: Date.now(),
            payment: "Pending", // ← هام جداً
        };

        const newAppointment = new appointmentModel(appointmentData);
        await newAppointment.save();

        await doctorModel.findByIdAndUpdate(docId, { slots_booked });

        res.json({ success: true, message: "Appointment booked" });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// عرض جميع مواعيد المستخدم
const listAppointment = async (req, res) => {
    try {
        const userId = req.userId;
        const appointments = await appointmentModel.find({ userId });
        res.json({ success: true, appointments });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// إلغاء موعد
const cancelAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        const userId = req.userId;

        const appointmentData = await appointmentModel.findById(appointmentId);
        if (!appointmentData) {
            return res.json({
                success: false,
                message: "Appointment not found",
            });
        }
        if (appointmentData.userId.toString() !== userId) {
            return res.json({ success: false, message: "Unauthorized action" });
        }

        // Refund if payment is online (not cash)
        let refundResult = null;
        if (
            appointmentData.payment &&
            typeof appointmentData.payment === "string" &&
            appointmentData.payment.toLowerCase() === "online" &&
            appointmentData.stripeSessionId
        ) {
            try {
                // Retrieve the session to get the payment intent
                const session = await stripe.checkout.sessions.retrieve(
                    appointmentData.stripeSessionId
                );
                if (session && session.payment_intent) {
                    const refund = await stripe.refunds.create({
                        payment_intent: session.payment_intent,
                    });
                    refundResult = refund;
                }
            } catch (refundErr) {
                console.error("Stripe refund error:", refundErr);
                // Optionally, you can return an error here or continue
            }
        }

        await appointmentModel.findByIdAndUpdate(appointmentId, {
            cancelled: true,
        });

        const { docId, slotDate, slotTime } = appointmentData;
        const doctorData = await doctorModel.findById(docId);
        let slots_booked = doctorData.slots_booked;

        slots_booked[slotDate] = slots_booked[slotDate].filter(
            (e) => e !== slotTime
        );
        await doctorModel.findByIdAndUpdate(docId, { slots_booked });

        res.json({
            success: true,
            message:
                "Appointment cancelled" +
                (refundResult ? " and payment refunded" : ""),
            refund: refundResult || undefined,
        });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// Stripe***********************/

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const paymentStripe = async (req, res) => {
    try {
        const { appointmentId } = req.body;

        // جلب الموعد مع بيانات الطبيب
        const appointment = await appointmentModel
            .findById(appointmentId)
            .populate("docId");

        if (!appointment) {
            return res
                .status(404)
                .json({ success: false, message: "Appointment not found" });
        }

        if (appointment.payment === "Online") {
            return res
                .status(400)
                .json({ success: false, message: "Already paid" });
        }

        // Create Stripe session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            customer_email: appointment.userData.email,
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: `Appointment with Dr. ${appointment.docData.name}`,
                        },
                        unit_amount: Math.round(appointment.docData.fees * 100),
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${process.env.FRONTEND_BASE_URL}/payment-success?appointmentId=${appointment._id}`,
            cancel_url: `${process.env.FRONTEND_BASE_URL}/payment-failed`,
            metadata: {
                appointmentId: appointment._id.toString(),
                userId: req.userId?.toString(),
            },
        });

        // Save Stripe session and payment intent IDs to appointment
        await appointmentModel.findByIdAndUpdate(appointmentId, {
            stripeSessionId: session.id,
            stripePaymentIntentId: session.payment_intent || undefined,
        });

        res.json({ success: true, sessionUrl: session.url });
    } catch (error) {
        console.error("Stripe payment error:", error);
        console.error(error.stack);
        res.status(500).json({ success: false, message: error.message });
    }
};

const stripeWebhook = async (req, res) => {
    const sig = req.headers["stripe-signature"];
    try {
        const event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );

        if (event.type === "checkout.session.completed") {
            const session = event.data.object;

            const appointmentId = session.metadata.appointmentId;

            await appointmentModel.findByIdAndUpdate(appointmentId, {
                payment: "Online",
            });

            console.log("Payment successful for appointment:", appointmentId);
        }

        res.json({ received: true });
    } catch (err) {
        console.error("Stripe Webhook Error:", err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
    }
};

/********************************* */

const confirmPayment = async (req, res) => {
    const { appointmentId } = req.body;

    try {
        if (!appointmentId) {
            return res
                .status(400)
                .json({ success: false, message: "appointmentId is required" });
        }

        const updated = await appointmentModel.findByIdAndUpdate(
            appointmentId,
            { payment: "Online" },
            { new: true }
        );

        if (!updated) {
            return res
                .status(404)
                .json({ success: false, message: "Appointment not found" });
        }

        res.json({
            success: true,
            message: "Payment confirmed successfully",
            appointment: updated,
        });
    } catch (error) {
        console.error("Error confirming payment:", error);
        res.status(500).json({
            success: false,
            message: "Server error while confirming payment",
        });
    }
};

// Get available slots for a specific doctor (public endpoint)
const getDoctorAvailableSlots = async (req, res) => {
    try {
        const { docId } = req.params;

        const doctor = await doctorModel.findById(docId);

        if (!doctor) {
            return res
                .status(404)
                .json({ success: false, message: "Doctor not found" });
        }

        const { workingHours, slotDuration } = doctor;

        console.log("=== Get Doctor Available Slots Debug ===");
        console.log("Doctor ID:", docId);
        console.log("Doctor found:", !!doctor);
        console.log("Working Hours:", workingHours);
        console.log("Slot Duration:", slotDuration);
        console.log("Doctor data:", {
            name: doctor.name,
            speciality: doctor.speciality,
            image: doctor.image,
            about: doctor.about,
            address: doctor.address,
        });

        // If no working hours set, return basic info with empty slots
        if (!workingHours || Object.keys(workingHours).length === 0) {
            console.log("No working hours set for doctor");
            return res.json({
                success: true,
                slots: Array(7).fill([]),
                workingHours: {},
                slotDuration: 30,
                doctorInfo: {
                    _id: doctor._id,
                    name: doctor.name,
                    speciality: doctor.speciality,
                    degree: doctor.degree,
                    experience: doctor.experience,
                    fees: doctor.fees,
                    available: doctor.available,
                    image: doctor.image,
                    about: doctor.about,
                    address: doctor.address,
                },
            });
        }

        if (!slotDuration) {
            return res.status(400).json({
                success: false,
                message: "Slot duration not set",
            });
        }

        const toMinutes = (timeStr) => {
            const [hours, minutes] = timeStr.split(":").map(Number);
            return hours * 60 + minutes;
        };

        const toTimeString = (minutes) => {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return `${hours.toString().padStart(2, "0")}:${mins
                .toString()
                .padStart(2, "0")}`;
        };

        const today = new Date();
        const slots = [];

        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(today);
            currentDate.setDate(today.getDate() + i);

            const dayOfWeek = currentDate.getDay();
            const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
            const dayKey = dayNames[dayOfWeek];

            const daySchedule = workingHours[dayKey];

            if (
                !daySchedule ||
                (daySchedule.enabled !== undefined && !daySchedule.enabled)
            ) {
                slots.push([]);
                continue;
            }

            const startMinutes = toMinutes(daySchedule.from);
            const endMinutes = toMinutes(daySchedule.to);

            let daySlots = [];

            for (
                let time = startMinutes;
                time + slotDuration <= endMinutes;
                time += slotDuration
            ) {
                const slotTime = toTimeString(time);
                const day = currentDate.getDate();
                const month = currentDate.getMonth() + 1;
                const year = currentDate.getFullYear();
                const slotDate = `${day}_${month}_${year}`;

                const isSlotBooked =
                    doctor.slots_booked &&
                    doctor.slots_booked[slotDate] &&
                    doctor.slots_booked[slotDate].includes(slotTime);

                if (!isSlotBooked) {
                    daySlots.push({
                        time: slotTime,
                        date: new Date(currentDate),
                        dayName: dayKey,
                    });
                }
            }

            if (i === 0) {
                const now = new Date();
                const currentTime = now.getHours() * 60 + now.getMinutes();
                daySlots = daySlots.filter((slot) => {
                    const slotMinutes = toMinutes(slot.time);
                    return slotMinutes > currentTime + 30;
                });
            }

            slots.push(daySlots);
        }

        console.log(
            "Generated slots:",
            slots.map((day, i) => `${i}: ${day.length} slots`)
        );

        res.json({
            success: true,
            slots,
            workingHours,
            slotDuration,
            doctorInfo: {
                _id: doctor._id,
                name: doctor.name,
                speciality: doctor.speciality,
                degree: doctor.degree,
                experience: doctor.experience,
                fees: doctor.fees,
                available: doctor.available,
                image: doctor.image,
                about: doctor.about,
                address: doctor.address,
            },
        });
    } catch (error) {
        console.error("Error in getDoctorAvailableSlots:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Test endpoint to check all doctors and their working hours
const testDoctors = async (req, res) => {
    try {
        const doctors = await doctorModel.find({});

        const doctorsInfo = doctors.map((doctor) => ({
            _id: doctor._id,
            name: doctor.name,
            speciality: doctor.speciality,
            hasWorkingHours: !!(
                doctor.workingHours &&
                Object.keys(doctor.workingHours).length > 0
            ),
            hasSlotDuration: !!doctor.slotDuration,
            workingHours: doctor.workingHours,
            slotDuration: doctor.slotDuration,
            available: doctor.available,
        }));

        res.json({
            success: true,
            totalDoctors: doctors.length,
            doctors: doctorsInfo,
        });
    } catch (error) {
        console.error("Error in testDoctors:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export {
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
    stripeWebhook,
    confirmPayment,
    forgotPassword,
    resetPassword,
};
