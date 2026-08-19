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
import { protect } from './middleware/auth.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(uploadsDir));
app.set('io', io);

// Database Connection with Fallback handling
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus-portal';
mongoose
  .connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch((err) => {
    console.warn('MongoDB Connection Warning:', err.message);
    console.warn('Operating in fallback mode or check local MongoDB instance.');
  });

app.use('/api/auth', authRoutes);
app.use('/api', protect, resourceRoutes);

// Root health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Socket.io Real-Time Chat Engine
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('joinRoom', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  socket.on('sendMessage', async (data) => {
    try {
      const Message = (await import('./models/Message.js')).default;
      const newMsg = await Message.create(data);
      io.to(data.receiverId).emit('receiveMessage', newMsg);
      io.to(data.senderId).emit('receiveMessage', newMsg);
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
