import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import authRoutes from './routes/authRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import guidanceRoutes from './routes/guidanceRoutes.js';
import facultyRoutes from './routes/facultyRoutes.js';
import { protect } from './middleware/auth.js';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import Ticket from './models/Ticket.js';

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
  process.exit(1);
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(uploadsDir));
app.set('io', io);

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('FATAL ERROR: MONGO_URI is not defined in environment variables.');
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch((err) => {
    console.error('FATAL ERROR: MongoDB Connection Failed:', err.message);
    process.exit(1);
  });

app.use('/api/auth', authRoutes);
app.use('/api/guidance-requests', protect, guidanceRoutes);
app.use('/api/faculty', protect, facultyRoutes);
app.use('/api', protect, resourceRoutes);

// Root health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Socket.io Real-Time Chat Engine
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return next(new Error('User not found'));

    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Invalid socket authentication'));
  }
});

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id} (User: ${socket.user._id})`);

  socket.on('joinRoom', () => {
    // Only trust the server-verified user ID and role
    const userId = socket.user._id.toString();
    const role = socket.user.role;
    
    socket.join(`user:${userId}`);
    if (role === 'faculty') {
      socket.join(`faculty:${userId}`);
    } else if (role === 'admin') {
      socket.join('role:admin');
    }
    console.log(`User ${userId} joined their rooms`);
  });

  socket.on('joinTicket', async (ticketId) => {
    try {
      const ticket = await Ticket.findById(ticketId);
      if (!ticket) return;

      const userIdStr = socket.user._id.toString();
      const isAdmin = socket.user.role === 'admin';
      const isStudent = ticket.studentId.toString() === userIdStr;
      const isFaculty = ticket.facultyId && ticket.facultyId.toString() === userIdStr;

      if (isAdmin || isStudent || isFaculty) {
        socket.join(`ticket:${ticketId}`);
        console.log(`User ${userIdStr} joined ticket:${ticketId}`);
      } else {
        console.warn(`Unauthorized joinTicket attempt for ticket:${ticketId} by user:${userIdStr}`);
      }
    } catch (err) {
      console.error('Socket joinTicket error:', err);
    }
  });

  socket.on('sendMessage', async (data) => {
    try {
      const senderId = socket.user._id.toString();
      const Message = (await import('./models/Message.js')).default;
      
      const newMsg = await Message.create({
        senderId, // Trust server identity, not client
        receiverId: data.receiverId,
        text: data.text
      });
      
      io.to(`user:${data.receiverId}`).emit('receiveMessage', newMsg);
      io.to(`user:${senderId}`).emit('receiveMessage', newMsg);
    } catch (err) {
      console.error('Socket message error:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Campus Server running on port ${PORT}`));
