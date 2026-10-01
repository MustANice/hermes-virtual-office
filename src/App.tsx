import React from 'react';
import { useOfficeStore } from './store/useOfficeStore';
import { RobloxCanvas } from './components/RobloxCanvas';
import { OfficeCanvas } from './components/OfficeCanvas';
import { MasterRenderView } from './components/MasterRenderView';
import { TopDashboard } from './components/TopDashboard';
import { AgentDrawer } from './components/AgentDrawer';
import { AgentRoster } from './components/AgentRoster';

export const App: React.FC = () => {
  const { viewMode } = useOfficeStore();

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0A0D14] text-[#F3F4F6] font-sans">
      {/* 3D Roblox or 2D Classic Canvas Engine or 2K Master Architectural Render */}
      {viewMode === 'roblox' && <RobloxCanvas />}
      {viewMode === '2d' && <OfficeCanvas />}
      {viewMode === 'master' && <MasterRenderView />}

      {/* Top Floating Dashboard & Room Navigation */}
      <TopDashboard />

      {/* Bottom Agent Roster Quick-Dock */}
      <AgentRoster />

      {/* Slide-over Agent Detail Inspector */}
      <AgentDrawer />

      {/* Hint on bottom-right (shown only in interactive modes) */}
      {viewMode !== 'master' && (
        <div className="absolute bottom-3 right-4 z-10 hidden md:flex items-center gap-2 text-[10px] text-gray-500 font-mono bg-[#11141A]/80 px-2.5 py-1 rounded-lg border border-[#1E232E]/60 pointer-events-none">
          <span>
            {viewMode === 'roblox' && '🎮 Left-drag: Orbit • Right-drag: Pan • Scroll: Zoom'}
            {viewMode === '2d' && '🗺️ Drag: Pan • Scroll: Zoom'}
          </span>
        </div>
      )}
    </div>
  );
};

export default App;
