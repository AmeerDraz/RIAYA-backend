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
            html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link is valid for 1 hour.</p>`,
        });
        s;
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
        if (
            !name ||
            typeof name !== "string" ||
            name.trim() === "" ||
            !phone ||
            typeof phone !== "string" ||
            !/^\+?[0-9]{7,15}$/.test(phone) ||
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
