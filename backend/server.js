const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
require('dotenv').config();

const connectDB = require('./config/db');
const Telemetry = require('./models/Telemetry');

const PORT = process.env.PORT || 5000;

// Initialize Express App & HTTP Server
const app = express();
const server = http.createServer(app);

// Initialize Socket.io Server
const io = new Server(server, {
  cors: {
    origin: '*', // Adjust for production security as needed
    methods: ['GET', 'POST'],
  },
});

// Middleware Configuration
app.use(cors());
app.use(express.json());

// -------------------------------------------------------------
// WEBSOCKET HANDLERS (TELEMETRY & HARDWARE CONTROL)
// -------------------------------------------------------------
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  /**
   * Handle incoming telemetry packet from Edge Node / Emulator
   * Event: telemetry:ingest
   */
  socket.on('telemetry:ingest', async (payload) => {
    try {
      // 1. Save telemetry log to MongoDB
      const telemetryEntry = new Telemetry(payload);
      const savedEntry = await telemetryEntry.save();

      // 2. Broadcast updated entry to all connected clients (React Dashboard)
      io.emit('telemetry:stream', savedEntry);
    } catch (err) {
      console.error(`[Ingest Error] Failed to persist telemetry: ${err.message}`);
      socket.emit('telemetry:error', { message: 'Database persistence failure' });
    }
  });

  /**
   * Handle manual hardware control commands issued from Dashboard
   * Event: hardware:control
   */
  socket.on('hardware:control', (command) => {
    console.log(`[Hardware Control] Issuing command:`, command);

    // Relay hardware command down to connected edge nodes/emulators
    io.emit('hardware:execute', command);
  });

  /**
   * Client Disconnect Listener
   */
  socket.on('disconnect', (reason) => {
    console.log(`[Socket.io] Client disconnected (${socket.id}): ${reason}`);
  });
});

// -------------------------------------------------------------
// REST API ENDPOINTS
// -------------------------------------------------------------

// Health Check Endpoint
app.get('/api/status', (req, res) => {
  res.status(200).json({
    status: 'Online',
    system: 'Pi-VOC Gateway Operational',
    timestamp: new Date().toISOString(),
  });
});

// Fetch Recent Telemetry Logs for Initial Dashboard Load
app.get('/api/telemetry/history', async (req, res) => {
  try {
    const history = await Telemetry.find()
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

    res.status(200).json(history);
  } catch (err) {
    console.error(`[REST Error] Fetch history failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to retrieve telemetry history' });
  }
});

// -------------------------------------------------------------
// SERVER INITIALIZATION
// -------------------------------------------------------------
const startServer = async () => {
  try {
    // Ensure MongoDB is connected before starting the server
    await connectDB();

    server.listen(PORT, () => {
      console.log(`[Gateway] Server successfully running on port ${PORT}`);
    });
  } catch (err) {
    console.error(`[Fatal Startup Error] Unable to start server: ${err.message}`);
    process.exit(1);
  }
};

startServer();