import mongoose from 'mongoose';
import doctorModel from './models/doctorModel.js';
import dotenv from 'dotenv';

dotenv.config();

const testAppointmentSlots = async () => {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
        await mongoose.connect(`${mongoUri}/Ryaa`);
        console.log('Connected to MongoDB');

        // Get all doctors
        const doctors = await doctorModel.find({});
        console.log(`Found ${doctors.length} doctors`);

        for (const doctor of doctors) {
            console.log(`\n=== Testing Doctor: ${doctor.name} ===`);
            console.log('Working Hours:', doctor.workingHours);
            console.log('Slot Duration:', doctor.slotDuration);
            
            if (!doctor.workingHours || Object.keys(doctor.workingHours).length === 0) {
                console.log('❌ No working hours set');
                continue;
            }

            // Test slot generation for today
            const today = new Date();
            const dayOfWeek = today.getDay();
            const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
            const dayKey = dayNames[dayOfWeek];
            
            const daySchedule = doctor.workingHours[dayKey];
            console.log(`Today (${dayKey}):`, daySchedule);
            
            if (daySchedule && daySchedule.enabled) {
                console.log(`✅ ${dayKey} is enabled: ${daySchedule.from} - ${daySchedule.to}`);
                
                // Calculate slots
                const toMinutes = (timeStr) => {
                    const [hours, minutes] = timeStr.split(":").map(Number);
                    return hours * 60 + minutes;
                };
                
                const toTimeString = (minutes) => {
                    const hours = Math.floor(minutes / 60);
                    const mins = minutes % 60;
                    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
                };
                
                const startMinutes = toMinutes(daySchedule.from);
                const endMinutes = toMinutes(daySchedule.to);
                const slotDuration = doctor.slotDuration || 30;
                
                let slots = [];
                for (let time = startMinutes; time + slotDuration <= endMinutes; time += slotDuration) {
                    const slotTime = toTimeString(time);
                    slots.push(slotTime);
                }
                
                console.log(`📅 Available slots for today: ${slots.length}`);
                console.log('Slots:', slots.slice(0, 5), slots.length > 5 ? '...' : '');
            } else {
                console.log(`❌ ${dayKey} is disabled or not set`);
            }
        }

    } catch (error) {
        console.error('Error testing appointment slots:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
};

testAppointmentSlots(); 