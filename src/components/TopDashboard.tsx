import React from 'react';
import { useOfficeStore, ROOM_COORDINATES } from '../store/useOfficeStore';
import { 
  Building2, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  Coffee, 
  RotateCcw, 
  FastForward,
  Wifi,
  WifiOff
} from 'lucide-react';

export const TopDashboard: React.FC = () => {
  const { 
    officeData, 
    activeRoomFilter, 
    setActiveRoomFilter, 
    viewMode,
    setViewMode,
    simSpeed, 
    setSimSpeed, 
    resetCamera, 
    isConnected, 
    fps 
  } = useOfficeStore();

  const stats = officeData?.stats || {
    totalAgents: 11,
    activeWorking: 0,
    idle: 11,
    inMeeting: 0,
    error: 0,
    completedTasksCount: 0,
    timestamp: Date.now() / 1000,
  };

  return (
    <header className="absolute top-3 left-4 right-4 z-20 flex flex-col gap-2 pointer-events-none">
      {/* Top Main Bar */}
      <div className="bg-[#11141A]/90 backdrop-blur-md border border-[#1E232E] rounded-xl px-4 py-2.5 shadow-2xl flex items-center justify-between pointer-events-auto">
        {/* Brand & Connection Status */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs tracking-wider uppercase text-white font-mono">
                HERMES VIRTUAL OFFICE
              </span>
              <div className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-mono ${
                isConnected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                {isConnected ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
                <span>{isConnected ? 'LIVE SSE' : 'OFFLINE'}</span>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 font-sans">
              Autonomous Fleet Simulation & Realtime Monitor
            </p>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="hidden lg:flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[#161B24] border border-[#222938]">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <div className="flex flex-col">
              <span className="text-[9px] text-gray-400 uppercase font-mono">Total</span>
              <span className="text-xs font-bold font-mono text-white">{stats.totalAgents}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[#161B24] border border-[#222938]">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[9px] text-emerald-400 uppercase font-mono">Working</span>
              <span className="text-xs font-bold font-mono text-emerald-300">{stats.activeWorking}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[#161B24] border border-[#222938]">
            <Users className="w-3.5 h-3.5 text-purple-400" />
            <div className="flex flex-col">
              <span className="text-[9px] text-purple-400 uppercase font-mono">Meeting</span>
              <span className="text-xs font-bold font-mono text-purple-300">{stats.inMeeting}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[#161B24] border border-[#222938]">
            <Coffee className="w-3.5 h-3.5 text-amber-400" />
            <div className="flex flex-col">
              <span className="text-[9px] text-amber-400 uppercase font-mono">Idle</span>
              <span className="text-xs font-bold font-mono text-amber-300">{stats.idle}</span>
            </div>
          </div>

          {stats.error > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <div className="flex flex-col">
                <span className="text-[9px] text-rose-400 uppercase font-mono">Blocked</span>
                <span className="text-xs font-bold font-mono text-rose-300">{stats.error}</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[#161B24] border border-[#222938]">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            <div className="flex flex-col">
              <span className="text-[9px] text-gray-400 uppercase font-mono">Completed</span>
              <span className="text-xs font-bold font-mono text-cyan-300">{stats.completedTasksCount}</span>
            </div>
          </div>
        </div>

        {/* View & Simulation Controls */}
        <div className="flex items-center gap-2">
          {/* 3D Roblox vs 2D vs Master Render Switcher */}
          <div className="flex items-center bg-[#161B24] border border-[#222938] rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('roblox')}
              className={`px-2 py-1 text-xs font-mono rounded font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'roblox'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>🎮 3D Live</span>
            </button>
            <button
              onClick={() => setViewMode('2d')}
              className={`px-2 py-1 text-xs font-mono rounded font-semibold flex items-center gap-1 transition-all ${
                viewMode === '2d'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>🗺️ 2D</span>
            </button>
            <button
              onClick={() => setViewMode('master')}
              className={`px-2 py-1 text-xs font-mono rounded font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'master'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Photorealistic 2K Master Architectural Visualization"
            >
              <span>🏛️ 2K Master</span>
            </button>
          </div>

          {/* Speed Multiplier */}
          <div className="flex items-center bg-[#161B24] border border-[#222938] rounded-lg p-0.5">
            {[1, 2, 4].map((spd) => (
              <button
                key={spd}
                onClick={() => setSimSpeed(spd)}
                className={`px-2 py-1 text-[10px] font-mono rounded font-medium transition-colors ${
                  simSpeed === spd ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
                title={`Simulation Speed ${spd}x`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Debug Collision & Nav Overlay Toggle */}
          <button
            onClick={() => {
              if (typeof window !== 'undefined' && (window as any).__TOGGLE_OFFICE_DEBUG__) {
                (window as any).__TOGGLE_OFFICE_DEBUG__();
              }
            }}
            className="p-1.5 text-gray-400 hover:text-cyan-400 bg-[#161B24] border border-[#222938] rounded-lg hover:bg-[#1E232E] transition-colors"
            title="Toggle Collision & Path Debug Overlay"
          >
            <span className="text-[10px] font-mono font-bold">🛠️</span>
          </button>

          {/* Reset Camera */}
          <button
            onClick={resetCamera}
            className="p-1.5 text-gray-400 hover:text-white bg-[#161B24] border border-[#222938] rounded-lg hover:bg-[#1E232E] transition-colors"
            title="Reset Camera View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* FPS Badge */}
          <span className="text-[10px] font-mono text-gray-500 px-1.5 py-0.5">
            {fps} FPS
          </span>
        </div>
      </div>

      {/* Room Quick-Jump Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 px-1 pointer-events-auto scrollbar-none max-w-full">
        {Object.entries(ROOM_COORDINATES).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setActiveRoomFilter(key)}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all shrink-0 border shadow-sm ${
              activeRoomFilter === key
                ? 'bg-blue-600 text-white border-blue-400 font-semibold shadow-md'
                : 'bg-[#11141A]/90 border-[#1E232E] text-gray-300 hover:text-white hover:bg-[#1E2533]'
            }`}
          >
            {config.label}
          </button>
        ))}
      </div>
    </header>
  );
};
