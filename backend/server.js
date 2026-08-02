import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import Telemetry from './models/Telemetry.js';
import { initPostgres } from './config/postgres.js';
import { enqueueTelemetry } from './redisQueue.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Initialize Databases
connectDB();       // MongoDB Time-Series Persistence
initPostgres();    // PostgreSQL Relational Hardware Mapping

// REST Endpoint: Historical Telemetry
app.get('/api/telemetry/history', async (req, res) => {
  try {
    const history = await Telemetry.find().sort({ timestamp: -1 }).limit(30);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch telemetry history' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Pi-VOC Gateway Running' });
});

// WebSocket Protocol Engine
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  // Ingest high-frequency telemetry stream from hardware/emulator node
  socket.on('telemetry-stream', async (packet) => {
    try {
      // 1. Enqueue to Redis for async worker execution (High-throughput requirement)
      await enqueueTelemetry(packet);

      // 2. Persist packet to MongoDB Time-Series collection
      const doc = new Telemetry(packet);
      await doc.save();

      // 3. Broadcast to all connected operational dashboards
      io.emit('telemetry-update', packet);
    } catch (err) {
      console.error('[Ingestion Error]', err.message);
    }
  });

  // Bi-directional hardware override interrupts sent from Dashboard
  socket.on('hardware-override', (command) => {
    console.log(`[EXECUTION INTERRUPT] Dispatching override to hardware node:`, command);
    // Forward command down to connected edge nodes
    io.emit('node-command', command);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`[Gateway Server] Running on port ${PORT}`);
});