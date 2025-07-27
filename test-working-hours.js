// Test script for working hours functionality
import mongoose from 'mongoose';
import doctorModel from './models/doctorModel.js';

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/riaya');
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Test working hours update
const testWorkingHoursUpdate = async () => {
    try {
        // Find a doctor (you'll need to replace this with an actual doctor ID)
        const doctor = await doctorModel.findOne();
        
        if (!doctor) {
            console.log('No doctor found in database');
            return;
        }

        console.log('Testing with doctor:', doctor.name);
        console.log('Current working hours:', doctor.workingHours);

        // Test data
        const testWorkingHours = {
            SUN: { from: "09:00", to: "17:00" },
            MON: { from: "09:00", to: "17:00" },
            TUE: { from: "09:00", to: "17:00" },
            WED: { from: "09:00", to: "17:00" },
            THU: { from: "09:00", to: "17:00" },
            FRI: { from: "09:00", to: "17:00" },
            SAT: { from: "09:00", to: "17:00" }
        };

        // Update working hours
        const updatedDoctor = await doctorModel.findOneAndUpdate(
            { _id: doctor._id },
            { 
                $set: {
                    workingHours: testWorkingHours,
                    slotDuration: 30
                }
            },
            { 
                new: true, 
                runValidators: true
            }
        );

        console.log('Updated doctor working hours:', updatedDoctor.workingHours);
        console.log('Updated slot duration:', updatedDoctor.slotDuration);

        // Verify the update
        const verifyDoctor = await doctorModel.findById(doctor._id);
        console.log('Verification - working hours:', verifyDoctor.workingHours);
        console.log('Verification - slot duration:', verifyDoctor.slotDuration);

    } catch (error) {
        console.error('Test failed:', error);
    }
};

// Run the test
const runTest = async () => {
    await connectDB();
    await testWorkingHoursUpdate();
    process.exit(0);
};

runTest(); 