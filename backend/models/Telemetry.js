const mongoose = require('mongoose');

const TelemetrySchema = new mongoose.Schema({
  deviceId: { type: String, required: true },
  frequencyHz: { type: Number, required: true },
  gpioState: { type: Boolean, required: true },
  cgroupCpuUsage: { type: Number, required: true },
  sequenceId: { type: Number, default: () => Date.now() }, // Auto-generate if missing
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Telemetry', TelemetrySchema);