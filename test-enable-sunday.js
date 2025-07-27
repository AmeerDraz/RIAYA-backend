import mongoose from 'mongoose';
import doctorModel from './models/doctorModel.js';
import dotenv from 'dotenv';

dotenv.config();

const enableSundayForTesting = async () => {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
        await mongoose.connect(`${mongoUri}/Ryaa`);
        console.log('Connected to MongoDB');

        // Get the first doctor
        const doctor = await doctorModel.findOne({});
        
        if (!doctor) {
            console.log('No doctors found');
            return;
        }

        console.log(`Enabling Sunday for Dr. ${doctor.name}`);

        // Update working hours to enable Sunday
        const updatedWorkingHours = {
            ...doctor.workingHours,
            SUN: { enabled: true, from: "09:00", to: "17:00" }
        };

        await doctorModel.findByIdAndUpdate(doctor._id, {
            workingHours: updatedWorkingHours
        });

        console.log('✅ Sunday enabled for testing!');
        console.log('You can now test appointment booking for today (Sunday)');

    } catch (error) {
        console.error('Error enabling Sunday:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

enableSundayForTesting(); 