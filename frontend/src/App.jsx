import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Activity, Cpu, HardDrive, Zap, Radio, Terminal, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

// 1. Dynamic API / WebSocket Host Determination
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://pi-voc-system.onrender.com';

// Establish socket connection to live cloud gateway
const socket = io(BACKEND_URL, {
  transports: ['websocket', 'polling'],
});

export default function App() {
  const [telemetry, setTelemetry] = useState([]);
  const [latestNode, setLatestNode] = useState(null);
  const [isConnected, setIsConnected] = useState(socket.connected);

  // Helper function: Normalizes telemetry fields across backend/emulator schema variations
  const normalizePacket = (packet) => {
    if (!packet) return null;

    // Check string or boolean representation of GPIO pin state
    const isHigh = 
      packet.gpioState === 'HIGH' || 
      packet.gpioState === true || 
      packet.gpioState === 1 || 
      packet.gpioState === '1';

    return {
      ...packet,
      deviceId: packet.deviceId || 'RISCV_NODE_01',
      frequency: Number(packet.piFrequency ?? packet.frequencyHz ?? packet.frequency ?? 0),
      cpuUsage: Number(packet.cgroupCpu ?? packet.cgroupCpuUsage ?? packet.cpuUsage ?? 0),
      gpioState: isHigh ? 'HIGH' : 'LOW',
      rawGpio: isHigh,
      timestamp: packet.timestamp || new Date().toISOString(),
    };
  };

  useEffect(() => {
    // 2. Fetch initial historical telemetry on mount
    fetch(`${BACKEND_URL}/api/telemetry/history`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const normalizedHistory = data.map(normalizePacket);
          setTelemetry(normalizedHistory);
          setLatestNode(normalizedHistory[0]);
        }
      })
      .catch((err) => console.error('[REST Error] Telemetry history fetch failed:', err));

    // 3. Socket event listener bindings
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    // Ingest real-time packets matching server.js `io.emit('telemetry-update')`
    const onTelemetryUpdate = (rawPacket) => {
      const packet = normalizePacket(rawPacket);
      setLatestNode(packet);
      // Maintain a rolling buffer of 30 recent telemetry frames
      setTelemetry((prev) => [packet, ...prev.slice(0, 29)]);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('telemetry-update', onTelemetryUpdate);
    socket.on('telemetry:stream', onTelemetryUpdate); // Fallback alias

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('telemetry-update', onTelemetryUpdate);
      socket.off('telemetry:stream', onTelemetryUpdate);
    };
  }, []);

  // 4. Bi-Directional Hardware Interrupt Dispatcher
  const triggerHardwareOverride = (actionType) => {
    const payload = {
      action: actionType, // 'FORCE_HIGH' | 'FORCE_LOW'
      targetDevice: 'RISCV_NODE_01',
      timestamp: new Date().toISOString(),
    };

    // Emit to both socket channels matching server routing logic
    socket.emit('hardware-override', payload);
    socket.emit('hardware:control', payload);
  };

  // Recharts timeline formatting (chronological left-to-right sorting)
  const chartData = [...telemetry].reverse().map((pt) => ({
    ...pt,
    timeLabel: pt.timestamp ? new Date(pt.timestamp).toLocaleTimeString() : '--:--:--',
  }));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      {/* Dynamic Header */}
      <header className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
            <Radio className="animate-pulse" /> PI-VOC OPERATIONAL CONTROL CENTER
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-Time Cyber-Physical Telemetry Ingestion Node
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full">
          <span className={`h-3 w-3 rounded-full ${isConnected ? 'bg-emerald-500 animate-ping' : 'bg-red-500'}`} />
          <span className="text-xs font-semibold">{isConnected ? 'GATEWAY CONNECTED' : 'DISCONNECTED'}</span>
        </div>
      </header>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center text-slate-400 gap-2 mb-2 text-xs font-semibold uppercase tracking-wider">
            <Activity className="w-4 h-4 text-emerald-400" /> Active Target
          </div>
          <p className="text-xl font-bold text-white">{latestNode?.deviceId || 'SEARCHING...'}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center text-slate-400 gap-2 mb-2 text-xs font-semibold uppercase tracking-wider">
            <Zap className="w-4 h-4 text-amber-400" /> GPIO Frequency
          </div>
          <p className="text-xl font-bold text-amber-400">
            {latestNode ? `${latestNode.frequency.toFixed(4)} Hz` : '--'}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center text-slate-400 gap-2 mb-2 text-xs font-semibold uppercase tracking-wider">
            <Cpu className="w-4 h-4 text-blue-400" /> Cgroup CPU Usage
          </div>
          <p className="text-xl font-bold text-blue-400">
            {latestNode ? `${latestNode.cpuUsage.toFixed(2)}%` : '--'}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center text-slate-400 gap-2 mb-2 text-xs font-semibold uppercase tracking-wider">
            <HardDrive className="w-4 h-4 text-purple-400" /> Hard Pin State
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${
              latestNode?.gpioState === 'HIGH'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500'
                : 'bg-red-500/20 text-red-400 border border-red-500'
            }`}
          >
            {latestNode ? `${latestNode.gpioState} (${latestNode.rawGpio ? 1 : 0})` : '--'}
          </span>
        </div>
      </div>

      {/* Real-time Telemetry Frequency Signal Graph */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl mb-6">
        <h2 className="text-md font-bold text-slate-200 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-amber-400" /> Live Pi-Frequency Signal Graph (Hz)
        </h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="timeLabel" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} domain={['dataMin - 10', 'dataMax + 10']} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                itemStyle={{ color: '#fbbf24' }}
              />
              <Line
                type="monotone"
                dataKey="frequency"
                stroke="#fbbf24"
                strokeWidth={2}
                dot={{ fill: '#fbbf24', r: 3 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hardware Overrides & Telemetry Log Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hardware Command Panel */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col justify-between">
          <div>
            <h2 className="text-md font-bold text-white flex items-center gap-2 mb-4">
              <Terminal className="w-5 h-5 text-indigo-400" /> Hardware Overrides
            </h2>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Transmits high-priority execution interrupts down to connected RISC-V nodes over WebSocket channel.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => triggerHardwareOverride('FORCE_HIGH')}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-lg transition-all shadow-lg shadow-emerald-900/40 active:scale-95 cursor-pointer"
            >
              FORCE GPIO HIGH (1)
            </button>
            <button
              onClick={() => triggerHardwareOverride('FORCE_LOW')}
              className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm rounded-lg transition-all shadow-lg shadow-rose-900/40 active:scale-95 cursor-pointer"
            >
              FORCE GPIO LOW (0)
            </button>
          </div>
        </div>

        {/* Real-time Telemetry Packet Table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <h2 className="text-md font-bold text-white mb-4">Live Telemetry Packet Log</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="p-2">Timestamp</th>
                  <th className="p-2">Device ID</th>
                  <th className="p-2">Frequency</th>
                  <th className="p-2">CPU</th>
                  <th className="p-2">GPIO State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {telemetry.map((packet, idx) => (
                  <tr key={packet._id || idx} className="hover:bg-slate-800/40 transition">
                    <td className="p-2 text-slate-400">
                      {packet.timestamp ? new Date(packet.timestamp).toLocaleTimeString() : '--'}
                    </td>
                    <td className="p-2 text-slate-200 font-semibold">{packet.deviceId}</td>
                    <td className="p-2 text-amber-400 font-mono">{packet.frequency.toFixed(4)} Hz</td>
                    <td className="p-2 text-blue-400 font-mono">{packet.cpuUsage.toFixed(2)}%</td>
                    <td className="p-2">
                      <span
                        className={
                          packet.gpioState === 'HIGH' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'
                        }
                      >
                        {packet.gpioState}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}