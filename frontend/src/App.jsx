import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Activity, Cpu, HardDrive, Zap, Radio, Terminal, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

// Establish connection to backend Gateway
const socket = io('http://localhost:5000', {
  transports: ['websocket', 'polling']
});

export default function App() {
  const [telemetry, setTelemetry] = useState([]);
  const [latestNode, setLatestNode] = useState(null);
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    // 1. Fetch historical telemetry on mount
    fetch('http://localhost:5000/api/telemetry/history')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setTelemetry(data.reverse()); // Chronological order for Recharts
          setLatestNode(data[data.length - 1]);
        }
      })
      .catch((err) => console.error('[REST Error] History fetch failed:', err));

    // 2. Gateway socket connection listeners
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    // 3. Real-time stream ingestion matching server.js `io.emit('telemetry:stream')`
    const onTelemetryStream = (packet) => {
      setLatestNode(packet);
      setTelemetry((prev) => [...prev.slice(-19), packet]); // Keep rolling window of last 20 frames
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('telemetry:stream', onTelemetryStream);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('telemetry:stream', onTelemetryStream);
    };
  }, []);

  // Dispatch manual hardware overrides down to edge target
  const triggerHardwareOverride = (state) => {
    socket.emit('hardware:control', {
      action: 'PIN_OVERRIDE',
      pinState: state,
      targetDevice: 'RISCV_NODE_01',
      timestamp: new Date().toISOString(),
    });
  };

  // Process timeline data for Recharts X-Axis
  const formattedChartData = telemetry.map((pt) => ({
    ...pt,
    timeLabel: pt.timestamp ? new Date(pt.timestamp).toLocaleTimeString() : '--:--:--',
  }));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      {/* Header */}
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

      {/* Metric Cards Grid */}
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
          <p className="text-xl font-bold text-amber-400">{latestNode ? `${latestNode.frequencyHz} Hz` : '--'}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center text-slate-400 gap-2 mb-2 text-xs font-semibold uppercase tracking-wider">
            <Cpu className="w-4 h-4 text-blue-400" /> Cgroup CPU Usage
          </div>
          <p className="text-xl font-bold text-blue-400">{latestNode ? `${latestNode.cgroupCpuUsage}%` : '--'}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center text-slate-400 gap-2 mb-2 text-xs font-semibold uppercase tracking-wider">
            <HardDrive className="w-4 h-4 text-purple-400" /> Hard Pin State
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${latestNode?.gpioState ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500' : 'bg-red-500/20 text-red-400 border border-red-500'}`}>
            {latestNode ? (latestNode.gpioState ? 'HIGH (1)' : 'LOW (0)') : '--'}
          </span>
        </div>
      </div>

      {/* Real-time Frequency Chart */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl mb-6">
        <h2 className="text-md font-bold text-slate-200 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-amber-400" /> Live Pi-Frequency Signal Graph (Hz)
        </h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="timeLabel" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} domain={['dataMin - 10', 'dataMax + 10']} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                itemStyle={{ color: '#fbbf24' }}
              />
              <Line 
                type="monotone" 
                dataKey="frequencyHz" 
                stroke="#fbbf24" 
                strokeWidth={2} 
                dot={{ fill: '#fbbf24', r: 3 }} 
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Command & Control + Live Packet Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hardware Controls */}
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
              onClick={() => triggerHardwareOverride(true)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-lg transition-all shadow-lg shadow-emerald-900/40 active:scale-95 cursor-pointer"
            >
              FORCE GPIO HIGH (1)
            </button>
            <button
              onClick={() => triggerHardwareOverride(false)}
              className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm rounded-lg transition-all shadow-lg shadow-rose-900/40 active:scale-95 cursor-pointer"
            >
              FORCE GPIO LOW (0)
            </button>
          </div>
        </div>

        {/* Live Packet Table */}
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
                {[...telemetry].reverse().map((packet, idx) => (
                  <tr key={packet._id || idx} className="hover:bg-slate-800/40 transition">
                    <td className="p-2 text-slate-400">{packet.timestamp ? new Date(packet.timestamp).toLocaleTimeString() : '--'}</td>
                    <td className="p-2 text-slate-200 font-semibold">{packet.deviceId}</td>
                    <td className="p-2 text-amber-400 font-mono">{packet.frequencyHz} Hz</td>
                    <td className="p-2 text-blue-400 font-mono">{packet.cgroupCpuUsage}%</td>
                    <td className="p-2">
                      <span className={packet.gpioState ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {packet.gpioState ? 'HIGH' : 'LOW'}
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