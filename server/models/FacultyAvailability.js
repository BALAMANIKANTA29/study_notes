import mongoose from 'mongoose';

const facultyAvailabilitySchema = new mongoose.Schema(
  {
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    dayOfWeek: { type: String, required: true }, // e.g., 'Monday', 'Tuesday'
    startTime: { type: String, required: true }, // e.g., '10:00 AM'
    endTime: { type: String, required: true }, // e.g., '12:00 PM'
    isActive: { type: Boolean, default: true },
    timezone: { type: String, default: 'UTC' }
  },
  { timestamps: true }
);

export default mongoose.model('FacultyAvailability', facultyAvailabilitySchema);
