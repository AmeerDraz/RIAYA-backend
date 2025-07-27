import mongoose from 'mongoose';
import 'dotenv/config';
import doctorModel from './models/doctorModel.js';

const setupWorkingHours = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/riaya');
        console.log('Connected to MongoDB');

        // Default working hours structure
        const defaultWorkingHours = {
            SUN: { from: "09:00", to: "17:00", enabled: true },
            MON: { from: "09:00", to: "17:00", enabled: true },
            TUE: { from: "09:00", to: "17:00", enabled: true },
            WED: { from: "09:00", to: "17:00", enabled: true },
            THU: { from: "09:00", to: "17:00", enabled: true },
            FRI: { from: "09:00", to: "17:00", enabled: true },
            SAT: { from: "09:00", to: "17:00", enabled: true }
        };

        // Find all doctors
        const doctors = await doctorModel.find({});
        console.log(`Found ${doctors.length} doctors`);

        // Update each doctor with default working hours
        for (const doctor of doctors) {
            console.log(`Setting up working hours for Dr. ${doctor.name}`);
            
            await doctorModel.findByIdAndUpdate(
                doctor._id,
                {
                    $set: {
                        workingHours: defaultWorkingHours,
                        slotDuration: 30
                    }
                },
                { new: true }
            );
        }

        console.log('Working hours setup completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error setting up working hours:', error);
        process.exit(1);
    }
};

setupWorkingHours(); 