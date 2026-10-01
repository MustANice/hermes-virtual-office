import React from 'react';
import { useOfficeStore } from '../store/useOfficeStore';

export const AgentRoster: React.FC = () => {
  const { officeData, selectedAgentId, focusAgent } = useOfficeStore();

  if (!officeData) return null;

  const agents = Object.values(officeData.agents);

  return (
    <div className="absolute bottom-3 left-4 right-4 z-20 pointer-events-none flex justify-center">
      <div className="bg-[#11141A]/90 backdrop-blur-md border border-[#1E232E] rounded-xl px-2 py-1.5 shadow-2xl flex items-center gap-1.5 overflow-x-auto max-w-full pointer-events-auto scrollbar-none">
        {agents.map((ag) => {
          const isSelected = selectedAgentId === ag.id;
          let statusDotColor = 'bg-gray-500';
          if (ag.status === 'working') statusDotColor = 'bg-emerald-400 animate-pulse';
          if (ag.status === 'tool_call') statusDotColor = 'bg-cyan-400 animate-pulse';
          if (ag.status === 'meeting') statusDotColor = 'bg-purple-400';
          if (ag.status === 'error') statusDotColor = 'bg-rose-500 animate-ping';

          return (
            <button
              key={ag.id}
              onClick={() => focusAgent(ag.id)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all border text-left ${
                isSelected 
                  ? 'bg-blue-600/20 border-blue-500 text-white shadow-md' 
                  : 'bg-[#161B24]/80 border-[#1E232E] text-gray-300 hover:bg-[#1E2533] hover:text-white'
              }`}
            >
              <div 
                className="w-6 h-6 rounded flex items-center justify-center text-xs border"
                style={{ backgroundColor: `${ag.color}20`, borderColor: `${ag.color}50` }}
              >
                {ag.avatarChar}
              </div>
              <div className="flex flex-col pr-1">
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${statusDotColor}`} />
                  <span className="text-[11px] font-bold font-mono uppercase">{ag.name}</span>
                </div>
                <span className="text-[9px] text-gray-400 line-clamp-1 max-w-[80px]">
                  {ag.status === 'tool_call' ? `⚡ ${ag.activeTool?.name || 'tool'}` : ag.status}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
