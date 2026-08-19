import Note from '../models/Note.js';
import Ticket from '../models/Ticket.js';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import Message from '../models/Message.js';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';

// Setup file upload configuration
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  fileFilter(req, file, cb) {
    if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  }
});

export const uploadNote = [
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Please upload a PDF file' });
      }
      const fileUrl = `http://localhost:5000/uploads/${req.file.filename}`;
      const note = await Note.create({
        title: req.body.title || 'Untitled Note',
        subject: req.body.subject || 'General',
        description: req.body.description || '',
        fileUrl,
        uploadedBy: req.user._id
      });
      const populated = await note.populate('uploadedBy', 'name');
      res.status(201).json(populated);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
];

export const getNotes = async (req, res) => {
  try {
    const notes = await Note.find().populate('uploadedBy', 'name').sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createTicket = async (req, res) => {
  try {
    const ticket = await Ticket.create({
      ...req.body,
      studentId: req.user._id
    });
    const populated = await ticket.populate('studentId facultyId', 'name');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTickets = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'student') query.studentId = req.user._id;
    if (req.user.role === 'faculty') query.facultyId = req.user._id;
    const tickets = await Ticket.find(query)
      .populate('studentId facultyId', 'name')
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTicketStatus = async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    ).populate('studentId facultyId', 'name');
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createAppointment = async (req, res) => {
  try {
    const appt = await Appointment.create({
      ...req.body,
      studentId: req.user._id
    });
    const populated = await appt.populate('studentId facultyId', 'name');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAppointments = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'student') query.studentId = req.user._id;
    if (req.user.role === 'faculty') query.facultyId = req.user._id;
    const appts = await Appointment.find(query)
      .populate('studentId facultyId', 'name')
      .sort({ createdAt: -1 });
    res.json(appts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const appt = await Appointment.findById(req.params.id);
    if (!appt) return res.status(404).json({ message: 'Appointment not found' });

    // Auto-generate Jitsi link on confirmation
    if (status === 'confirmed' && !appt.link) {
      const roomName = `CampusPortal-${crypto.randomBytes(4).toString('hex')}`;
      appt.link = `https://meet.jit.si/${roomName}`;
    }

    appt.status = status;
    await appt.save();
    const populated = await appt.populate('studentId facultyId', 'name');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const messages = await Message.find({
      $or: [
        { senderId: req.user._id, receiverId: userId },
        { senderId: userId, receiverId: req.user._id }
      ]
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    const role = req.query.role;
    const query = role ? { role } : {};
    const users = await User.find(query).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTickets = await Ticket.countDocuments();
    const resolvedTickets = await Ticket.countDocuments({ status: 'resolved' });
    const pendingAppts = await Appointment.countDocuments({ status: 'pending' });

    res.json({
      totalUsers,
      totalTickets,
      resolvedTickets,
      pendingAppts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
