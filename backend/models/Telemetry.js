import mongoose from 'mongoose';

const TelemetrySchema = new mongoose.Schema({
  deviceId: { type: String, required: true },
  frequency: { type: Number, required: true },
  cpuUsage: { type: Number, required: true },
  gpioState: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const Telemetry = mongoose.model('Telemetry', TelemetrySchema);

export default Telemetry;