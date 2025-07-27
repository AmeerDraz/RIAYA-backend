import jwt from "jsonwebtoken";
import doctorModel from "../models/doctorModel.js";
import bcrypt from "bcrypt";
import appointmentModel from "../models/appointmentModel.js";

// Change Doctor Availability
const changeAvailablity = async (req, res) => {
    try {
        const docId = req.docId;
        const docData = await doctorModel.findById(docId);
        await doctorModel.findByIdAndUpdate(docId, {
            available: !docData.available,
        });
        res.json({
            success: true,
            message: "Doctor's availability changed successfully",
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Doctor List
const doctorList = async (req, res) => {
    try {
        const doctors = await doctorModel
            .find({})
            .select(["-password", "-email"]);
        res.json({ success: true, doctors });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Doctor Login
const loginDoctor = async (req, res) => {
    try {
        const { email, password } = req.body;
        const doctor = await doctorModel.findOne({ email });
        if (!doctor) {
            return res.json({
                success: false,
                message: "Invalid email or password",
            });
        }
        const isMatch = await bcrypt.compare(password, doctor.password);
        if (isMatch) {
            const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET);
            res.json({ success: true, token });
        } else {
            res.json({ success: false, message: "Invalid email or password" });
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get Doctor's Appointments
const appointmentDoctor = async (req, res) => {
    try {
        const docId = req.docId;
        const appointments = await appointmentModel.find({ docId });
        res.json({ success: true, appointments });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Complete Appointment
const appointmentComplete = async (req, res) => {
    try {
        const docId = req.docId;
        const { appointmentId } = req.body;
        const appointmentData = await appointmentModel.findById(appointmentId);
        if (appointmentData && appointmentData.docId == docId) {
            await appointmentModel.findByIdAndUpdate(appointmentId, {
                isCompleted: true,
            });
            return res.json({
                success: true,
                message: "Appointment completed",
            });
        } else {
            return res.json({ success: false, message: "Mark failed" });
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Cancel Appointment
const appointmentCancel = async (req, res) => {
    try {
        const docId = req.docId;
        const { appointmentId } = req.body;
        const appointmentData = await appointmentModel.findById(appointmentId);
        if (appointmentData && appointmentData.docId == docId) {
            await appointmentModel.findByIdAndUpdate(appointmentId, {
                cancelled: true,
            });
            return res.json({
                success: true,
                message: "Appointment cancelled",
            });
        } else {
            return res.json({ success: false, message: "Cancel failed" });
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Doctor Dashboard Data
const getDashData = async (req, res) => {
    try {
        const docId = req.docId;
        const appointments = await appointmentModel.find({ docId });

        let earnings = 0;
        let patients = [];

        appointments.forEach((item) => {
            if (item.isCompleted || item.payment) earnings += item.amount;
            if (!patients.includes(item.userId)) patients.push(item.userId);
        });

        const dashData = {
            earnings,
            appointments: appointments.length,
            patients: patients.length,
            latestAppointments: appointments.reverse().slice(0, 5),
        };

        res.json({ success: true, dashData });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get Doctor Profile
const doctorProfile = async (req, res) => {
    try {
        const docId = req.docId;
        const profileData = await doctorModel
            .findById(docId)
            .select("-password");
        res.json({ success: true, profileData });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Update Doctor Profile
const updateDoctorProfile = async (req, res) => {
    try {
        const docId = req.docId;
        const { name, experience, speciality, degree, about, fees, address, available } = req.body;
        
        console.log('=== Update Doctor Profile Debug ===');
        console.log('Doctor ID:', docId);
        console.log('Request Body:', req.body);
        console.log('Name:', name);
        console.log('Experience:', experience);
        console.log('Speciality:', speciality);
        console.log('Degree:', degree);
        console.log('About:', about);
        console.log('Fees:', fees);
        console.log('Address:', address);
        console.log('Available:', available);
        
        // Validate required fields
        if (!name || !experience || !speciality || !degree || fees === undefined || address === undefined || available === undefined) {
            console.log('Validation failed: Missing required fields');
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields: name, experience, speciality, degree, about, fees, address, available",
            });
        }
        
        // Validate experience is a positive number
        const experienceNum = parseInt(experience);
        if (isNaN(experienceNum) || experienceNum < 0 || experienceNum > 50) {
            console.log('Validation failed: Invalid experience value');
            return res.status(400).json({
                success: false,
                message: "Experience must be a valid number between 0 and 50 years",
            });
        }
        
        // Check if doctor exists before update
        const existingDoctor = await doctorModel.findById(docId);
        if (!existingDoctor) {
            console.log('Doctor not found in database');
            return res.status(404).json({
                success: false,
                message: "Doctor not found.",
            });
        }
        
        console.log('Existing doctor found:', existingDoctor._id);
        console.log('Current profile data:', {
            name: existingDoctor.name,
            experience: existingDoctor.experience,
            speciality: existingDoctor.speciality,
            degree: existingDoctor.degree,
            about: existingDoctor.about,
            fees: existingDoctor.fees,
            address: existingDoctor.address,
            available: existingDoctor.available
        });
        
        const updatedDoctor = await doctorModel.findByIdAndUpdate(docId, {
            name,
            experience: experienceNum,
            speciality,
            degree,
            about,
            fees,
            address,
            available,
        }, { new: true });
        
        console.log('Update successful');
        console.log('Updated doctor data:', {
            name: updatedDoctor.name,
            experience: updatedDoctor.experience,
            speciality: updatedDoctor.speciality,
            degree: updatedDoctor.degree,
            about: updatedDoctor.about,
            fees: updatedDoctor.fees,
            address: updatedDoctor.address,
            available: updatedDoctor.available
        });
        
        res.json({ success: true, message: "Profile updated successfully" });
    } catch (error) {
        console.error('Error in updateDoctorProfile:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update Working Hours and Slot Duration
const updateSlotsSettings = async (req, res) => {
    try {
        const docId = req.docId;
        const { workingHours, slotDuration } = req.body;

        console.log('=== Update Slots Settings Debug ===');
        console.log('Doctor ID:', docId);
        console.log('Request Body:', req.body);
        console.log('Working Hours:', workingHours);
        console.log('Slot Duration:', slotDuration);

        if (!workingHours || !slotDuration) {
            console.log('Validation failed: Missing required fields');
            return res.status(400).json({
                success: false,
                message: "Please fill in all required fields.",
            });
        }

        // Validate working hours structure
        if (typeof workingHours !== 'object' || workingHours === null) {
            console.log('Validation failed: Invalid working hours format');
            return res.status(400).json({
                success: false,
                message: "Invalid working hours format.",
            });
        }

        // Validate slot duration
        if (!Number.isInteger(slotDuration) || slotDuration < 15 || slotDuration > 120) {
            console.log('Validation failed: Invalid slot duration');
            return res.status(400).json({
                success: false,
                message: "Slot duration must be between 15 and 120 minutes.",
            });
        }

        // Validate each day's working hours
        const validDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        for (const [day, times] of Object.entries(workingHours)) {
            if (!validDays.includes(day)) {
                console.log(`Validation failed: Invalid day ${day}`);
                return res.status(400).json({
                    success: false,
                    message: `Invalid day: ${day}`,
                });
            }

            if (!times.from || !times.to) {
                console.log(`Validation failed: Missing times for ${day}`);
                return res.status(400).json({
                    success: false,
                    message: `Missing start or end time for ${day}`,
                });
            }

            // Validate time format (HH:MM)
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(times.from) || !timeRegex.test(times.to)) {
                console.log(`Validation failed: Invalid time format for ${day}`);
                return res.status(400).json({
                    success: false,
                    message: `Invalid time format for ${day}`,
                });
            }

            // Validate that end time is after start time
            const startTime = new Date(`2000-01-01T${times.from}`);
            const endTime = new Date(`2000-01-01T${times.to}`);
            if (endTime <= startTime) {
                console.log(`Validation failed: End time <= start time for ${day}`);
                return res.status(400).json({
                    success: false,
                    message: `End time must be after start time for ${day}`,
                });
            }
        }

        console.log('All validations passed, updating database...');

        // Check if doctor exists before update
        const existingDoctor = await doctorModel.findById(docId);
        if (!existingDoctor) {
            console.log('Doctor not found in database');
            return res.status(404).json({
                success: false,
                message: "Doctor not found.",
            });
        }

        console.log('Existing doctor found:', existingDoctor._id);
        console.log('Current working hours:', existingDoctor.workingHours);
        console.log('Current slot duration:', existingDoctor.slotDuration);

        // Clean up any unwanted fields that might be mixed with workingHours
        // Remove any date-based keys that shouldn't be in workingHours
        const cleanedWorkingHours = {};
        Object.entries(workingHours).forEach(([key, value]) => {
            // Only keep valid day keys
            if (['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].includes(key)) {
                cleanedWorkingHours[key] = {
                    from: value.from,
                    to: value.to,
                    enabled: value.enabled !== undefined ? value.enabled : true // Default to enabled if not specified
                };
            }
        });

        console.log('Cleaned working hours:', cleanedWorkingHours);

        // Use findOneAndUpdate with upsert: false to ensure we only update existing documents
        const updatedDoctor = await doctorModel.findOneAndUpdate(
            { _id: docId },
            { 
                $set: {
                    workingHours: cleanedWorkingHours,
                    slotDuration: slotDuration
                }
            },
            { 
                new: true, 
                runValidators: true,
                upsert: false
            }
        );

        if (!updatedDoctor) {
            console.log('Update failed: Doctor not found after update');
            return res.status(404).json({
                success: false,
                message: "Doctor not found.",
            });
        }

        console.log('Update successful');
        console.log('Updated working hours:', updatedDoctor.workingHours);
        console.log('Updated slot duration:', updatedDoctor.slotDuration);

        res.status(200).json({
            success: true,
            message: "Working hours and slot duration updated successfully.",
            data: {
                workingHours: updatedDoctor.workingHours,
                slotDuration: updatedDoctor.slotDuration
            }
        });
    } catch (error) {
        console.error('Error in updateSlotsSettings:', error);
        res.status(500).json({
            success: false,
            message: "Server error.",
        });
    }
};

const getAvailableSlots = async (req, res) => {
    try {
        const docId = req.docId;

        const doctor = await doctorModel.findById(docId);

        if (!doctor) {
            return res
                .status(404)
                .json({ success: false, message: "Doctor not found" });
        }

        const { workingHours, slotDuration } = doctor;

        if (!workingHours || !slotDuration) {
            return res
                .status(400)
                .json({
                    success: false,
                    message: "Working hours or slot duration not set",
                });
        }

        console.log('=== Get Available Slots Debug ===');
        console.log('Doctor ID:', docId);
        console.log('Working Hours:', workingHours);
        console.log('Slot Duration:', slotDuration);

        // Convert time string to minutes
        const toMinutes = (timeStr) => {
            const [hours, minutes] = timeStr.split(":").map(Number);
            return hours * 60 + minutes;
        };

        // Convert minutes to time string
        const toTimeString = (minutes) => {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
        };

        // Get current date and generate slots for next 7 days
        const today = new Date();
        const slots = [];

        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(today);
            currentDate.setDate(today.getDate() + i);
            
            const dayOfWeek = currentDate.getDay();
            const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
            const dayKey = dayNames[dayOfWeek];
            
            const daySchedule = workingHours[dayKey];
            
            if (!daySchedule || (daySchedule.enabled !== undefined && !daySchedule.enabled)) {
                slots.push([]);
                continue;
            }

            const startMinutes = toMinutes(daySchedule.from);
            const endMinutes = toMinutes(daySchedule.to);
            
            const daySlots = [];
            
            // Generate slots for this day
            for (let time = startMinutes; time + slotDuration <= endMinutes; time += slotDuration) {
                const slotTime = toTimeString(time);
                
                // Check if this slot is booked
                const day = currentDate.getDate();
                const month = currentDate.getMonth() + 1;
                const year = currentDate.getFullYear();
                const slotDate = `${day}_${month}_${year}`;
                
                const isSlotBooked = doctor.slots_booked && 
                    doctor.slots_booked[slotDate] && 
                    doctor.slots_booked[slotDate].includes(slotTime);
                
                if (!isSlotBooked) {
                    daySlots.push({
                        time: slotTime,
                        date: new Date(currentDate),
                        dayName: dayKey
                    });
                }
            }
            
            // For today, filter out past slots
            if (i === 0) {
                const now = new Date();
                const currentTime = now.getHours() * 60 + now.getMinutes();
                daySlots = daySlots.filter(slot => {
                    const slotMinutes = toMinutes(slot.time);
                    return slotMinutes > currentTime + 30; // 30 minutes buffer
                });
            }
            
            slots.push(daySlots);
        }

        console.log('Generated slots:', slots.map((day, i) => `${i}: ${day.length} slots`));

        // res.json({ 
        //     success: true, 
        //     slots,
        //     workingHours,
        //     slotDuration
        // });
        
        res.json({ 
    success: true, 
    slots,
    workingHours,
    slotDuration,
    doctorInfo: {
        name: doctor.name,
        degree: doctor.degree,
        speciality: doctor.speciality,
        experience: doctor.experience,
        fees: doctor.fees,
        image: doctor.image,
        available: doctor.available,
        about: doctor.about,
        address: doctor.address //  هذا السطر يرسل العنوان
    }
});

        
    } catch (error) {
        console.error('Error in getAvailableSlots:', error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Test endpoint to check database connection and doctor data
const testDoctorData = async (req, res) => {
    try {
        const docId = req.docId;
        console.log('Testing doctor data for ID:', docId);
        
        const doctor = await doctorModel.findById(docId);
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found",
            });
        }

        console.log('Doctor found:', {
            id: doctor._id,
            name: doctor.name,
            workingHours: doctor.workingHours,
            slotDuration: doctor.slotDuration
        });

        res.json({
            success: true,
            message: "Doctor data retrieved successfully",
            data: {
                id: doctor._id,
                name: doctor.name,
                workingHours: doctor.workingHours,
                slotDuration: doctor.slotDuration
            }
        });
    } catch (error) {
        console.error('Error in testDoctorData:', error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// Reset working hours to clean state
const resetWorkingHours = async (req, res) => {
    try {
        const docId = req.docId;
        console.log('Resetting working hours for doctor ID:', docId);
        
        const cleanWorkingHours = {
            SUN: { from: "09:00", to: "17:00", enabled: true },
            MON: { from: "09:00", to: "17:00", enabled: true },
            TUE: { from: "09:00", to: "17:00", enabled: true },
            WED: { from: "09:00", to: "17:00", enabled: true },
            THU: { from: "09:00", to: "17:00", enabled: true },
            FRI: { from: "09:00", to: "17:00", enabled: true },
            SAT: { from: "09:00", to: "17:00", enabled: true }
        };

        const updatedDoctor = await doctorModel.findOneAndUpdate(
            { _id: docId },
            { 
                $set: {
                    workingHours: cleanWorkingHours,
                    slotDuration: 30
                }
            },
            { 
                new: true, 
                runValidators: true
            }
        );

        if (!updatedDoctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found",
            });
        }

        console.log('Working hours reset successfully');
        res.json({
            success: true,
            message: "Working hours reset successfully",
            data: {
                workingHours: updatedDoctor.workingHours,
                slotDuration: updatedDoctor.slotDuration
            }
        });
    } catch (error) {
        console.error('Error in resetWorkingHours:', error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// Export Controllers
export {
    changeAvailablity,
    doctorList,
    loginDoctor,
    appointmentDoctor,
    appointmentComplete,
    appointmentCancel,
    getDashData,
    doctorProfile,
    updateDoctorProfile,
    updateSlotsSettings,
    getAvailableSlots,
    testDoctorData,
    resetWorkingHours,
};
