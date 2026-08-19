import FacultyAvailability from '../models/FacultyAvailability.js';
import Appointment from '../models/Appointment.js';

export const getAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const availabilities = await FacultyAvailability.find({ facultyId: id });
    res.json(availabilities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createAvailability = async (req, res) => {
  try {
    if (req.user.role !== 'faculty') return res.status(403).json({ message: 'Only faculty can set availability.' });
    
    const { dayOfWeek, startTime, endTime, timezone } = req.body;
    
    const availability = await FacultyAvailability.create({
      facultyId: req.user._id,
      dayOfWeek,
      startTime,
      endTime,
      timezone
    });
    
    res.status(201).json(availability);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAvailability = async (req, res) => {
  try {
    if (req.user.role !== 'faculty') return res.status(403).json({ message: 'Only faculty can update availability.' });
    
    const availability = await FacultyAvailability.findOneAndUpdate(
      { _id: req.params.id, facultyId: req.user._id },
      req.body,
      { new: true }
    );
    
    if (!availability) return res.status(404).json({ message: 'Availability not found or unauthorized.' });
    
    res.json(availability);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAvailability = async (req, res) => {
  try {
    if (req.user.role !== 'faculty') return res.status(403).json({ message: 'Only faculty can delete availability.' });
    
    const availability = await FacultyAvailability.findOneAndDelete({ _id: req.params.id, facultyId: req.user._id });
    
    if (!availability) return res.status(404).json({ message: 'Availability not found or unauthorized.' });
    
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAvailableSlots = async (req, res) => {
  try {
    const { id } = req.params; // facultyId
    const { date } = req.query; // YYYY-MM-DD
    
    if (!date) return res.status(400).json({ message: 'Date query parameter required.' });
    
    const targetDate = new Date(date);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const targetDayName = dayNames[targetDate.getUTCDay()];
    
    // Get general availability for that day of week
    const availabilities = await FacultyAvailability.find({ 
      facultyId: id,
      dayOfWeek: targetDayName,
      isActive: true
    });
    
    // Get already booked appointments for that date
    const bookedAppointments = await Appointment.find({
      facultyId: id,
      date: targetDate,
      status: { $nin: ['cancelled', 'completed', 'no_show'] }
    });
    
    // Basic logic: generate slots based on availabilities and filter out booked ones.
    // Assuming 30 min slots for simplicity, or just return the availabilities and let frontend pick.
    // For now, we will return the availabilities and the booked slots, frontend can construct the UI.
    
    res.json({
      availabilities,
      bookedAppointments: bookedAppointments.map(a => ({ startTime: a.startTime, endTime: a.endTime }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
