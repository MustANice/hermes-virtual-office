# Hermes Virtual AI Agent Office

Realtime 3D simulation, digital-twin workspace, and telemetry monitor for autonomous Hermes AI agent fleets.

Live Production: [https://office.dindustries.my.id/](https://office.dindustries.my.id/)

---

## Overview

Hermes Virtual Office is an interactive WebGL digital twin of an enterprise AI operations center. It provides real-time monitoring and physical simulation of 11 autonomous agents across 7 functional campus zones:

1. **Executive Suite:** Leadership office with curved oak executive desk and terminal monitors.
2. **A2A Coordination / Connect (Dev Lab):** Collaborative multi-monitor development pods.
3. **Research & Intel:** Threat intelligence and reasoning pipeline analytics.
4. **War Room / A2A:** Central strategic briefing room with a 10-seat racetrack walnut conference table and panoramic global network threat map.
5. **QA & Hardening:** Testing and regression verification benches with telemetry displays.
6. **Lounge & Operations:** Hospitality area with sofa, barista espresso station, and operations desk.
7. **SRE & Infrastructure:** Enterprise datacenter bay with 42U server rack arrays and raised access flooring.

---

## Key Features

- **3-in-1 Viewport Modes:**
  - `🎮 3D Live`: Interactive Three.js WebGL simulation with procedural humanoid avatars, organic respiration, 360° orbital camera, and touch gesture support (single-finger orbit, two-finger pinch-to-zoom, two-finger pan).
  - `🗺️ 2D Office`: High-density schematic 2D blueprint canvas.
  - `🏛️ 2K Master`: Photorealistic architectural visualization (2560 × 1440) with smooth interactive zoom and full-resolution asset delivery.
- **Physical Collision & Navigation Engine:**
  - Built-in `OfficePathfinder` with A* grid search, body radius clearance (35cm), and swept-circle line-of-sight smoothing.
  - Full boundary awareness: agents pass through real doorway portals without clipping through solid walls, glass balustrades, or furniture.
  - `ChairInteractionSystem`: Multi-stage atomic seating state machine (`RESERVE_SEAT -> WALK_TO_APPROACH -> ALIGN -> SIT_DOWN -> SEATED -> STAND_UP -> CLEAR_SEAT`).
  - Agent-to-agent local avoidance and personal space clearance.
- **Live Telemetry & SQLite WAL Synchronization:**
  - Native Node.js backend (`server/hermesAdapter.js`) streaming non-blocking SQLite updates via Server-Sent Events (`/api/stream`).
  - Instant turn-completion detection and real-time tool execution tracking.

---

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Three.js, Lucide Icons, Zustand
- **Backend:** Node.js native HTTP/SSE server, `node:sqlite` DatabaseSync (read-only WAL)
- **Deployment:** systemd user service (`hermes-virtual-office.service`), Cloudflare Tunnel ingress

---

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run type check and production build
npm run build

# Run automated movement & collision regression suite
node scripts/test_movement_and_collision.cjs
```
