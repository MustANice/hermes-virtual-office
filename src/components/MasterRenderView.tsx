import React, { useState } from 'react';

export const MasterRenderView: React.FC = () => {
  const [zoom, setZoom] = useState(1);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-[#0B0E14] overflow-hidden select-none">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-radial from-[#151D2A] via-[#0B0E14] to-[#07090D] opacity-60 pointer-events-none" />

      {/* Main High-Res 2K Architectural Visualization Render */}
      <div 
        className="relative transition-transform duration-300 ease-out flex items-center justify-center max-w-[94vw] max-h-[82vh]"
        style={{ transform: `scale(${zoom})` }}
      >
        <img
          src="/architectural-masterpiece.png"
          alt="Hermes Virtual Office - 2K Master Architectural Visualization"
          className="w-full h-full object-contain rounded-xl shadow-2xl border border-[#232B3B]/60"
        />
      </div>

      {/* Floating Control Toolbar (Floated comfortably above bottom agent dock) */}
      <div className="absolute bottom-20 md:bottom-24 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-[#111622]/95 backdrop-blur-md px-4 py-2 rounded-xl border border-[#222B3D] shadow-2xl">
        <span className="text-xs font-mono font-bold text-gray-300 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          2K Master Architectural Visualization (2560 × 1440)
        </span>
        <div className="w-[1px] h-4 bg-gray-700" />
        <button
          onClick={() => setZoom(prev => Math.max(0.8, prev - 0.2))}
          className="p-1 hover:bg-[#1E2738] rounded text-gray-300 hover:text-white transition-colors text-xs font-mono px-2"
          title="Zoom Out"
        >
          -
        </button>
        <span className="text-xs font-mono text-cyan-400 min-w-[40px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom(prev => Math.min(2.5, prev + 0.2))}
          className="p-1 hover:bg-[#1E2738] rounded text-gray-300 hover:text-white transition-colors text-xs font-mono px-2"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={() => setZoom(1)}
          className="p-1 hover:bg-[#1E2738] rounded text-gray-400 hover:text-white transition-colors text-[10px] font-mono px-1.5"
          title="Reset Zoom"
        >
          Reset
        </button>
        <div className="w-[1px] h-4 bg-gray-700" />
        <a
          href="/architectural-masterpiece.png"
          target="_blank"
          rel="noreferrer"
          className="text-xs font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1 underline underline-offset-2"
        >
          ↗ Open Ultra-HD
        </a>
      </div>
    </div>
  );
};
