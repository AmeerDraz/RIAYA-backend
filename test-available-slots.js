import mongoose from 'mongoose';
import 'dotenv/config';
import doctorModel from './models/doctorModel.js';

const testAvailableSlots = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/riaya');
        console.log('Connected to MongoDB');

        // Find a doctor
        const doctor = await doctorModel.findOne({});
        
        if (!doctor) {
            console.log('No doctors found in database');
            return;
        }

        console.log('Testing with doctor:', doctor.name);
        console.log('Working Hours:', JSON.stringify(doctor.workingHours, null, 2));
        console.log('Slot Duration:', doctor.slotDuration);

        // Simulate the getAvailableSlots logic
        const { workingHours, slotDuration } = doctor;

        if (!workingHours || Object.keys(workingHours).length === 0) {
            console.log('No working hours set');
            return;
        }

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
            
            console.log(`Day ${i}: ${dayKey}, Schedule:`, daySchedule);
            
            if (!daySchedule || (daySchedule.enabled !== undefined && !daySchedule.enabled)) {
                console.log(`Day ${i}: No schedule or disabled`);
                slots.push([]);
                continue;
            }

            const startMinutes = toMinutes(daySchedule.from);
            const endMinutes = toMinutes(daySchedule.to);
            
            let daySlots = [];
            
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
            
            console.log(`Day ${i}: Generated ${daySlots.length} slots`);
            slots.push(daySlots);
        }

        console.log('Final slots summary:');
        slots.forEach((day, i) => {
            console.log(`Day ${i}: ${day.length} slots`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error testing available slots:', error);
        process.exit(1);
    }
};

testAvailableSlots(); 