import Ticket from '../models/Ticket.js';
import Note from '../models/Note.js';
import Appointment from '../models/Appointment.js';
import mongoose from 'mongoose';
import crypto from 'crypto';

const getIo = (req) => req.app.get('io');

const emitSocketEvent = (req, eventName, ticket, additionalRooms = []) => {
  const io = getIo(req);
  if (!io) return;
  const rooms = [
    `user:${ticket.studentId._id || ticket.studentId}`,
    `faculty:${ticket.facultyId._id || ticket.facultyId}`,
    `ticket:${ticket._id}`,
    'role:admin',
    ...additionalRooms
  ];
  rooms.forEach(room => io.to(room).emit(eventName, ticket));
};

export const createGuidanceRequest = async (req, res) => {
  try {
    const { noteId, title, description, priority, requestedDate, requestedTime } = req.body;
    
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can create guidance requests.' });
    }

    const note = await Note.findById(noteId);
    if (!note) return res.status(404).json({ message: 'Note not found.' });

    const ticket = await Ticket.create({
      studentId: req.user._id,
      facultyId: note.uploadedBy,
      noteId,
      title,
      description,
      priority: priority || 'medium',
      status: 'assigned', // Automatically assigned to the note's author
      requestedDate,
      requestedTime
    });

    const populated = await Ticket.findById(ticket._id).populate('studentId facultyId noteId', 'name title');
    emitSocketEvent(req, 'ticket:created', populated);
    emitSocketEvent(req, 'ticket:assigned', populated);

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getGuidanceRequests = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'student') query.studentId = req.user._id;
    if (req.user.role === 'faculty') query.facultyId = req.user._id;
    
    const tickets = await Ticket.find(query)
      .populate('studentId facultyId noteId', 'name title')
      .populate('appointmentId')
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getGuidanceRequestById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('studentId facultyId noteId', 'name title')
      .populate('appointmentId');
      
    if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });
    
    // Authorization
    if (req.user.role === 'student' && ticket.studentId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    if (req.user.role === 'faculty' && ticket.facultyId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const acceptRequest = async (req, res) => {
  try {
    if (req.user.role !== 'faculty') return res.status(403).json({ message: 'Only faculty can accept.' });
    
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });
    
    if (ticket.facultyId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized. Not your ticket.' });
    }
    
    if (ticket.status !== 'assigned') {
      return res.status(400).json({ message: `Cannot accept ticket in status ${ticket.status}` });
    }
    
    ticket.status = 'accepted';
    await ticket.save();
    
    const populated = await Ticket.findById(ticket._id).populate('studentId facultyId noteId', 'name title');
    emitSocketEvent(req, 'ticket:accepted', populated);
    
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const rejectRequest = async (req, res) => {
  try {
    if (req.user.role !== 'faculty') return res.status(403).json({ message: 'Only faculty can reject.' });
    
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });
    
    if (ticket.facultyId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized. Not your ticket.' });
    }
    
    if (ticket.status !== 'assigned') {
      return res.status(400).json({ message: `Cannot reject ticket in status ${ticket.status}` });
    }
    
    ticket.status = 'rejected';
    await ticket.save();
    
    const populated = await Ticket.findById(ticket._id).populate('studentId facultyId noteId', 'name title');
    emitSocketEvent(req, 'ticket:rejected', populated);
    
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const scheduleRequest = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (req.user.role !== 'faculty') return res.status(403).json({ message: 'Only faculty can schedule.' });
    
    const { date, startTime, endTime, agenda } = req.body;
    
    const ticket = await Ticket.findById(req.params.id).session(session);
    if (!ticket) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Ticket not found.' });
    }
    
    if (ticket.facultyId.toString() !== req.user._id.toString()) {
      await session.abortTransaction();
      return res.status(403).json({ message: 'Unauthorized. Not your ticket.' });
    }
    
    if (ticket.status !== 'accepted') {
      await session.abortTransaction();
      return res.status(400).json({ message: `Cannot schedule ticket in status ${ticket.status}` });
    }
    
    if (startTime >= endTime) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'endTime must be greater than startTime' });
    }

    // Check double booking - Strict Overlap Check
    const targetDate = new Date(date);
    targetDate.setUTCHours(0,0,0,0); // Normalize date

    const conflict = await Appointment.findOne({
      facultyId: req.user._id,
      date: targetDate,
      status: { $nin: ['cancelled', 'completed', 'no_show'] },
      $and: [
        { startTime: { $lt: endTime } },
        { endTime: { $gt: startTime } }
      ]
    }).session(session);
    
    if (conflict) {
      await session.abortTransaction();
      return res.status(409).json({ message: 'This faculty member is already booked for this time slot (Overlap conflict).' });
    }

    const roomName = `CampusPortal-${crypto.randomBytes(4).toString('hex')}`;
    const meetingLink = `https://meet.jit.si/${roomName}`;

    const apptResult = await Appointment.create([{
      ticketId: ticket._id,
      studentId: ticket.studentId,
      facultyId: req.user._id,
      date: targetDate,
      startTime,
      endTime,
      agenda: agenda || ticket.title,
      status: 'confirmed',
      meetingLink
    }], { session });
    const appt = apptResult[0];
    
    ticket.status = 'scheduled';
    ticket.appointmentId = appt._id;
    await ticket.save({ session });
    
    await session.commitTransaction();
    session.endSession();

    const populated = await Ticket.findById(ticket._id)
      .populate('studentId facultyId noteId', 'name title')
      .populate('appointmentId');
      
    emitSocketEvent(req, 'ticket:scheduled', populated);
    
    const io = getIo(req);
    if (io) {
      io.to(`user:${ticket.studentId}`).to(`faculty:${ticket.facultyId}`).emit('appointment:created', appt);
    }

    res.json(populated);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: error.message });
  }
};

export const startSession = async (req, res) => {
  try {
    if (req.user.role !== 'faculty') return res.status(403).json({ message: 'Only faculty can start.' });
    
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });
    
    if (ticket.facultyId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized. Not your ticket.' });
    }
    
    if (ticket.status !== 'scheduled') {
      return res.status(400).json({ message: `Cannot start session for ticket in status ${ticket.status}` });
    }
    
    ticket.status = 'in_session';
    await ticket.save();
    
    if (ticket.appointmentId) {
      await Appointment.findByIdAndUpdate(ticket.appointmentId, { startedAt: new Date() });
    }
    
    const populated = await Ticket.findById(ticket._id)
      .populate('studentId facultyId noteId', 'name title')
      .populate('appointmentId');
      
    emitSocketEvent(req, 'ticket:started', populated);
    
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const completeRequest = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (req.user.role !== 'faculty') return res.status(403).json({ message: 'Only faculty can complete.' });
    
    const { resolution } = req.body;
    
    const ticket = await Ticket.findById(req.params.id).session(session);
    if (!ticket) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Ticket not found.' });
    }
    
    if (ticket.facultyId.toString() !== req.user._id.toString()) {
      await session.abortTransaction();
      return res.status(403).json({ message: 'Unauthorized. Not your ticket.' });
    }
    
    // STRICT STATE MACHINE: Must be 'in_session', cannot skip straight to 'done' from 'scheduled'
    if (ticket.status !== 'in_session') {
      await session.abortTransaction();
      return res.status(400).json({ message: `Cannot complete ticket. Must be in_session (current status: ${ticket.status})` });
    }
    
    ticket.status = 'done';
    ticket.resolution = resolution;
    ticket.resolvedBy = req.user._id;
    ticket.resolvedAt = new Date();
    await ticket.save({ session });
    
    if (ticket.appointmentId) {
      await Appointment.findByIdAndUpdate(ticket.appointmentId, { 
        status: 'completed',
        completedAt: new Date()
      }, { session });
    }
    
    await session.commitTransaction();
    session.endSession();

    const populated = await Ticket.findById(ticket._id)
      .populate('studentId facultyId noteId', 'name title')
      .populate('appointmentId');
      
    emitSocketEvent(req, 'ticket:completed', populated);
    
    res.json(populated);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: error.message });
  }
};

export const cancelRequest = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });
    
    if (req.user.role === 'student' && ticket.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    if (req.user.role === 'faculty') {
      return res.status(403).json({ message: 'Faculty cannot cancel, use reject instead.' });
    }
    
    if (ticket.status === 'done' || ticket.status === 'in_session' || ticket.status === 'rejected') {
      return res.status(400).json({ message: `Cannot cancel ticket in status ${ticket.status}` });
    }
    
    ticket.status = 'cancelled';
    await ticket.save();
    
    if (ticket.appointmentId) {
      await Appointment.findByIdAndUpdate(ticket.appointmentId, { 
        status: 'cancelled',
        cancelledAt: new Date()
      });
    }
    
    const populated = await Ticket.findById(ticket._id)
      .populate('studentId facultyId noteId', 'name title')
      .populate('appointmentId');
      
    emitSocketEvent(req, 'ticket:cancelled', populated);
    
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const reassignRequest = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Only admin can reassign.' });
    
    const { newFacultyId } = req.body;
    
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });
    
    ticket.facultyId = newFacultyId;
    ticket.status = 'assigned';
    if (ticket.appointmentId) {
      await Appointment.findByIdAndUpdate(ticket.appointmentId, { status: 'cancelled' });
      ticket.appointmentId = null;
    }
    
    await ticket.save();
    
    const populated = await Ticket.findById(ticket._id)
      .populate('studentId facultyId noteId', 'name title');
      
    emitSocketEvent(req, 'ticket:assigned', populated);
    
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
