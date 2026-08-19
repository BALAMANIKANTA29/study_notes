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
    
    targetDate.setUTCHours(0,0,0,0);

    // Get already booked appointments for that date
    const bookedAppointments = await Appointment.find({
      facultyId: id,
      date: targetDate,
      status: { $nin: ['cancelled', 'completed', 'no_show'] }
    });
    
    const generateSlots = (startStr, endStr) => {
      const slots = [];
      const [startH, startM] = startStr.split(':').map(Number);
      const [endH, endM] = endStr.split(':').map(Number);
      
      let currentH = startH;
      let currentM = startM;
      
      while (currentH < endH || (currentH === endH && currentM < endM)) {
        const nextM = currentM + 30;
        const h = currentH + Math.floor(nextM / 60);
        const m = nextM % 60;
        
        if (h > endH || (h === endH && m > endM)) break;

        const formatTime = (hh, mm) => `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
        
        const slotStart = formatTime(currentH, currentM);
        const slotEnd = formatTime(h, m);
        slots.push({ startTime: slotStart, endTime: slotEnd });
        
        currentH = h;
        currentM = m;
      }
      return slots;
    };

    let allAvailableSlots = [];
    availabilities.forEach(av => {
      allAvailableSlots = allAvailableSlots.concat(generateSlots(av.startTime, av.endTime));
    });

    const isOverlap = (slotStart, slotEnd, bookedStart, bookedEnd) => {
      return (slotStart < bookedEnd && slotEnd > bookedStart);
    };

    const finalSlots = allAvailableSlots.filter(slot => {
      for (const appt of bookedAppointments) {
        if (isOverlap(slot.startTime, slot.endTime, appt.startTime, appt.endTime)) {
          return false;
        }
      }
      return true;
    });

    res.json(finalSlots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
