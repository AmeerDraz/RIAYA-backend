import validator from "validator";
import bcrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";
import doctorModel from "../models/doctorModel.js";
import jwt from "jsonwebtoken";
import appointmentModel from "../models/appointmentModel.js";
import { userModel } from "../models/userModel.js";

// API for adding doctor
const addDoctor = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            speciality,
            degree,
            experience,
            about,
            available,
            fees,
            address,
        } = req.body;
        const imageFile = req.file;

        // Validation for missing fields
        if (
            !name ||
            !email ||
            !password ||
            !speciality ||
            !degree ||
            !experience ||
            !about ||
            available === undefined ||
            !fees ||
            !address
        ) {
            return res.json({ success: false, message: "Missing Details" });
        }

        // Validate email format
        if (!validator.isEmail(email)) {
            return res.json({
                success: false,
                message: "Please enter a valid email",
            });
        }

        // Validate password strength
        if (password.length < 8) {
            return res.json({
                success: false,
                message: "Please enter a strong password (min 8 characters)",
            });
        }

        // Upload image to Cloudinary
        const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
            resource_type: "image",
        });
        const imageUrl = imageUpload.secure_url;

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Parse address JSON
        const parsedAddress = JSON.parse(address);

        // Create doctor data
        const doctorData = {
            name,
            email,
            image: imageUrl,
            password: hashedPassword,
            speciality,
            degree,
            experience,
            about,
            available: available === "true" || available === true, // To handle both boolean and string "true"
            fees,
            address: parsedAddress,
            date: Date.now(),
        };

        const newDoctor = new doctorModel(doctorData);
        await newDoctor.save();

        res.json({ success: true, message: "Doctor Added Successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API for admin login
const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (
            email === process.env.ADMIN_EMAIL &&
            password === process.env.ADMIN_PASSWORD
        ) {
            const token = jwt.sign(email + password, process.env.JWT_SECRET);
            res.json({ success: true, token });
        } else {
            res.json({ success: false, message: "Invalid Email or Password" });
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to get all doctors
const allDoctor = async (req, res) => {
    try {
        const doctor = await doctorModel.find({}).select("-password");
        res.json({ success: true, doctor });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to get all appointments
const appointmentsAdmin = async (req, res) => {
    try {
        const appointments = await appointmentModel.find({});
        res.json({ success: true, appointments });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to cancel appointment
const cancelAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        const appointmentData = await appointmentModel.findById(appointmentId);

        await appointmentModel.findByIdAndUpdate(appointmentId, {
            cancelled: true,
        });

        const { docId, slotData, slotTime } = appointmentData;
        const doctorDate = await doctorModel.findById(docId);
        let slots_booked = doctorDate.slots_booked;

        slots_booked[slotData] = slots_booked[slotData].filter(
            (e) => e !== slotTime
        );

        await doctorModel.findByIdAndUpdate(docId, { slots_booked });

        res.json({ success: true, message: "Appointment cancelled" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API for Admin Dashboard Data
const adminDashboard = async (req, res) => {
    try {
        const doctors = await doctorModel.find({});
        const users = await userModel.find({});
        const appointments = await appointmentModel.find({});

        const dashData = {
            doctors: doctors.length,
            appointments: appointments.length,
            patients: users.length,
            latestAppointments: appointments.reverse().slice(0, 5),
        };

        res.json({ success: true, dashData });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};
// API لتغيير حالة التوافر للطبيب
const changeAvailapility = async (req, res) => {
    try {
        // تأكد من وجود docId في الجسم
        const { docId } = req.body;

        // تحقق من وجود الطبيب
        const doctor = await doctorModel.findById(docId);
        if (!doctor) {
            return res
                .status(404)
                .json({ success: false, message: "Doctor not found" });
        }

        // تغيير التوافر
        doctor.available = !doctor.available; // عكس حالة التوافر (إذا كان متاحًا يصبح غير متاح والعكس)
        await doctor.save();

        // إرسال استجابة ناجحة
        res.json({
            success: true,
            message: `Doctor availability updated to ${doctor.available ? "Available" : "Not Available"}`,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Get single doctor by ID
const getDoctorById = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const doctor = await doctorModel.findById(doctorId).select("-password");

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found",
            });
        }

        res.json({
            success: true,
            doctor,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update doctor profile
const updateDoctorProfile = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const updateData = req.body;

        // Remove sensitive fields that shouldn't be updated
        const { password, email, image, ...safeUpdateData } = updateData;

        const updatedDoctor = await doctorModel.findByIdAndUpdate(
            doctorId,
            safeUpdateData,
            { new: true, runValidators: true }
        );

        if (!updatedDoctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found",
            });
        }

        res.json({
            success: true,
            message: "Doctor profile updated successfully",
            doctor: updatedDoctor,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get doctor working hours
const getDoctorWorkingHours = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const doctor = await doctorModel.findById(doctorId);

        if (!doctor) {
            return res.json({ success: false, message: "Doctor not found" });
        }

        res.json({
            success: true,
            workingHours: doctor.workingHours || {},
            slotDuration: doctor.slotDuration || 30,
            doctorName: doctor.name,
        });
    } catch (error) {
        console.error("Error getting doctor working hours:", error);
        res.json({ success: false, message: error.message });
    }
};

// Update doctor working hours
const updateDoctorWorkingHours = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { workingHours, slotDuration } = req.body;

        const doctor = await doctorModel.findById(doctorId);
        if (!doctor) {
            return res.json({ success: false, message: "Doctor not found" });
        }

        await doctorModel.findByIdAndUpdate(doctorId, {
            workingHours,
            slotDuration,
        });

        res.json({
            success: true,
            message: "Working hours updated successfully",
        });
    } catch (error) {
        console.error("Error updating doctor working hours:", error);
        res.json({ success: false, message: error.message });
    }
};

export {
    addDoctor,
    loginAdmin,
    allDoctor,
    appointmentsAdmin,
    cancelAppointment,
    adminDashboard,
    changeAvailapility,
    getDoctorById,
    updateDoctorProfile,
    getDoctorWorkingHours,
    updateDoctorWorkingHours,
};
