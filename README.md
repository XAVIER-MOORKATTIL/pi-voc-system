# ⚡ Pi-VOC | Real-Time Cyber-Physical Telemetry & Control System

A high-performance, full-stack IoT telemetry ingestion gateway and monitoring dashboard built for real-time cyber-physical systems and RISC-V target devices.

---

## 🛠️ Tech Stack

* **Frontend:** React 18, Vite, Tailwind CSS v4, Socket.io-Client, Recharts, Lucide React
* **Backend & Gateway:** Node.js, Express, Socket.io (WebSockets), Mongoose
* **Database:** MongoDB
* **Target Emulator / Hardware Engine:** Node.js (Hardware Waveform & Signal Simulator)

---

## 🚀 Key Features

* **Real-Time Telemetry Streaming:** Live WebSocket visualization for pin states, GPIO frequency drift, and cgroup CPU loads without polling overhead.
* **Persistent Telemetry Logging:** Automatic MongoDB document persistence for all inbound telemetry packets and node health metrics.
* **Bi-Directional Command Overrides:** High-priority execution interrupts (`FORCE HIGH` / `FORCE LOW`) dispatched directly to edge hardware nodes.
* **Historical Backfill API:** Hydrates the dashboard with historical packet logs instantly upon initial launch.

---

## 📂 Project Structure

```text
pi-voc-system/
├── backend/
│   ├── config/          # Database configuration
│   ├── models/          # Telemetry Mongoose schema
│   ├── emulator.js      # Hardware signal emulator
│   ├── server.js        # Express & Socket.io Gateway
│   └── .env             # Environment configuration
├── frontend/
│   ├── src/
│   │   ├── App.jsx      # Control center dashboard UI
│   │   ├── index.css    # Tailwind CSS styling
│   │   └── main.jsx     # Vite React entry point
│   └── package.json
├── c_node/              # Native C execution engine
└── README.md\

# Project Pi-VOC: Bare-Metal Cyber-Physical Telemetry & Edge Execution Node

## 🏗️ Architecture & Stack Coverage
- **Frontend Dashboard:** React.js, WebSockets, TailwindCSS, Recharts (Deployed on Vercel)
- **Backend Gateway:** Node.js, Express.js, Socket.io (Deployed on Render)
- **Ingestion Queue:** Redis Pub/Sub & Async Worker Pipeline (`backend/queue.js`)
- **Persistence Layer:** MongoDB (Time-Series Telemetry) + Neon PostgreSQL via Prisma (Relational Device Mapping & Cryptographic Hashes)
- **Edge Security:** JWT authentication & Passport.js session guards (`backend/auth.js`)
- **Low-Level Hardware Core:** Bare-Metal Embedded C Daemon (`c_node/engine.c`) with Linux `sysfs` GPIO pin toggling & dynamic Cgroup quota mutation.

## 📁 Repository Structure

pi-voc-system/
├── backend/
│   ├── prisma/ schema.prisma (PostgreSQL Relational Schema)
│   ├── auth.js (Passport.js JWT Guard)
│   ├── queue.js (Redis Pub/Sub & Queue Worker)
│   ├── emulator.js (Node.js Edge Telemetry Streamer)
│   └── server.js (Socket.io & Gateway API)
├── frontend/ (React + Tailwind + WebSockets Dashboard)
└── c_node/
├── engine.c (Linux/RISC-V Bare-Metal Daemon with Cgroup & sysfs)
└── engine (Compiled Linux Executable Binary)

## 💻 Quick Start & Setup
# 1. Repository Setup
Bash
git clone [https://github.com/YOUR_USERNAME/pi-voc-system.git](https://github.com/YOUR_USERNAME/pi-voc-system.git)
cd pi-voc-system
# 2. Configure Environment Variables
Create a .env file in the backend/ directory:

Code snippet
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/pivoc
# 3. Run the System
Launch the services in three separate terminals:

## Terminal 1 — Backend Gateway Server
Bash
cd backend
npm install
node server.js
## Terminal 2 — Node Signal Emulator
Bash
cd backend
node emulator.js
## Terminal 3 — Frontend Operational Dashboard
Bash
cd frontend
npm install
npm run dev
Open your browser and navigate to http://localhost:5173 to access the dashboard.

## 🌐 Production Deployment Guide
Backend (Render / Railway)
Push the repository to GitHub.

Create a new Web Service on Render/Railway pointing to your repository.

Set Root Directory to backend.

Set Build Command to npm install and Start Command to node server.js.

Add environment variables (MONGO_URI and PORT).

## Frontend (Vercel / Netlify)
Import the repository into Vercel.

Set Root Directory to frontend.

Set Framework Preset to Vite.

## Deploy and connect your live backend URL in frontend/src/App.jsx.

## 📜 License
This project is open-source under the MIT License.