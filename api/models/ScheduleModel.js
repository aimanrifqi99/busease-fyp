// src/models/ScheduleModel.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

const ScheduleSchema = new Schema({
    name: { type: String, required: true },
    origin: { type: String, required: true },
    destination: { type: String, required: true },
    price: { type: Number, required: true },
    photos: { type: [String] },
    departureDate: { type: Date, required: true },
    departureTime: { type: String, required: true },
    arrivalTime: { type: String, required: true },
    duration: { type: String },
    stops: [{
        stopName: { type: String, required: true },
        arrivalTime: { type: String, required: true }
    }],
    amenities: { type: [String], default: [] },
    desc: { type: String, required: true },
    totalSeats: { type: Number, required: true },
    seatNumbers: [{
        number: Number,
        isBooked: { type: Boolean, default: false }
    }]
});

ScheduleSchema.pre('save', function(next) {
    // Pre-save hook to populate seatNumbers based on totalSeats if not provided
    if (!this.seatNumbers || this.seatNumbers.length === 0) {
        this.seatNumbers = Array.from({ length: this.totalSeats }, (_, index) => ({
            number: index + 1,
            isBooked: false
        }));
    }

    // Calculate duration based on departureTime and arrivalTime
    const convertTo24Hour = (time) => {
        const [timePart, modifier] = time.split(' ');
        let [hours, minutes] = timePart.split(':').map(Number);
        if (modifier === 'PM' && hours !== 12) hours += 12;
        else if (modifier === 'AM' && hours === 12) hours = 0;
        return { hours, minutes };
    };

    const departureTime = convertTo24Hour(this.departureTime);
    const arrivalTime = convertTo24Hour(this.arrivalTime);
    let durationHours = arrivalTime.hours - departureTime.hours;
    let durationMinutes = arrivalTime.minutes - departureTime.minutes;

    if (durationMinutes < 0) {
        durationMinutes += 60;
        durationHours -= 1;
    }
    if (durationHours < 0) {
        durationHours += 24;
    }

    this.duration = `${durationHours}h ${durationMinutes}m`;
    next();
});

export default mongoose.model("Schedule", ScheduleSchema);
