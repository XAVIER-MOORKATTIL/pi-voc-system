import { io } from 'socket.io-client';

// Connect to local or cloud Render backend gateway
const BACKEND_URL = process.env.BACKEND_URL || 'https://pi-voc-system.onrender.com';
const socket = io(BACKEND_URL, {
  transports: ['websocket', 'polling'],
});

const DEVICE_ID = 'RISCV_NODE_01';
const pi_digits = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9, 3, 2, 3, 8, 4];

let step = 0;
let forcedState = null; // Holds bi-directional hardware override state

console.log('========================================');
console.log(`[Edge Node Simulation] Connecting to Gateway (${BACKEND_URL})...`);
console.log(`[Target ID]: ${DEVICE_ID}`);
console.log('========================================');

socket.on('connect', () => {
  console.log('[Socket] Connected to telemetry gateway!');
});

// Listen for hardware override commands from the dashboard
socket.on('node-command', (command) => {
  console.log('\n⚡ [OVERRIDE INTERRUPT RECEIVED FROM CLOUD]:', command);
  if (command.action === 'FORCE_HIGH') {
    forcedState = 'HIGH';
  } else if (command.action === 'FORCE_LOW') {
    forcedState = 'LOW';
  } else if (command.action === 'CLEAR') {
    forcedState = null;
  }
});

// High-frequency telemetry ingestion loop
setInterval(() => {
  step++;
  const digit = pi_digits[step % pi_digits.length];
  const frequency = Number((300 + digit * 12.3456).toFixed(4));
  const cpuUsage = Number((5 + Math.random() * 15).toFixed(2));
  
  // Use forced state if override active, otherwise toggle dynamically
  const gpioState = forcedState || (step % 2 === 0 ? 'HIGH' : 'LOW');

  const telemetryPacket = {
    deviceId: DEVICE_ID,
    frequency,
    cpuUsage,
    gpioState,
    timestamp: new Date(),
  };

  socket.emit('telemetry-stream', telemetryPacket);
  console.log(
    `[TX -> Gateway] Step ${step} | GPIO: ${gpioState} | Freq: ${frequency} Hz | CPU: ${cpuUsage}%${
      forcedState ? ' (FORCED OVERRIDE ACTIVE)' : ''
    }`
  );
}, 1000);