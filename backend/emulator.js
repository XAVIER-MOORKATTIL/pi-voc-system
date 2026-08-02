// backend/emulator.js
const { io } = require('socket.io-client');

const socket = io('http://localhost:5000');
const TARGET_NODE = 'RISCV_NODE_01';

console.log('========================================');
console.log(`[Edge Node Simulation] Connecting to Gateway...`);
console.log(`[Target ID]: ${TARGET_NODE}`);
console.log('========================================');

let step = 0;

socket.on('connect', () => {
  console.log('[Edge Node Simulation] Connected to Gateway!');
});

// Calculate dynamic non-repeating Pi frequency
function calculatePiFrequency(step) {
  let piApprox = 0.0;
  for (let i = 0; i < step + 10; i++) {
    piApprox += (Math.pow(-1, i) / (2 * i + 1));
  }
  piApprox *= 4.0;
  return (3.14159 * (100 + (step % 20))) + piApprox;
}

setInterval(() => {
  step++;
  const currentFreq = calculatePiFrequency(step);
  const gpioState = (step % 2 === 0);
  const cpuUsage = (5 + Math.random() * 15).toFixed(2);

  const payload = {
    deviceId: TARGET_NODE,
    frequencyHz: parseFloat(currentFreq.toFixed(4)),
    gpioState: gpioState,
    cgroupCpuUsage: parseFloat(cpuUsage),
    sequenceId: step,
    timestamp: new Date().toISOString()
  };

  // EMIT TELEMETRY TO GATEWAY SERVER
  socket.emit('telemetry:push', payload);

  console.log(`[TX -> Gateway] Step ${step} | GPIO:${gpioState ? 'HIGH (1)' : 'LOW (0)'} | Freq: ${payload.frequencyHz} Hz | CPU: ${payload.cgroupCpuUsage}%`);
}, 1500);

// Listen for hardware override commands back from Dashboard
socket.on('hardware:override', (command) => {
  console.log('⚡ [INTERRUPT RECEIVED FROM CONTROL CENTER]:', command);
});