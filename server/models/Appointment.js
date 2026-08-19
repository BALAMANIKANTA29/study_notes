import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true },
    time: { type: String, default: '10:00 AM' },
    agenda: { type: String, required: true },
    status: { type: String, enum: ['pending', 'confirmed', 'canceled'], default: 'pending' },
    link: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model('Appointment', appointmentSchema);
