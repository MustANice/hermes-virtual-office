import React from 'react';
import { useOfficeStore } from '../store/useOfficeStore';
import { 
  X, 
  Terminal, 
  Clock, 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  Cpu, 
  FileText,
  MessageSquare,
  Wrench,
  ExternalLink
} from 'lucide-react';

export const AgentDrawer: React.FC = () => {
  const { officeData, selectedAgentId, setSelectedAgentId, focusAgent } = useOfficeStore();

  if (!selectedAgentId || !officeData || !officeData.agents[selectedAgentId]) {
    return null;
  }

  const agent = officeData.agents[selectedAgentId];

  const getStatusBadge = () => {
    switch (agent.status) {
      case 'working':
        return <span className="px-2 py-0.5 text-xs rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-mono">● Working</span>;
      case 'tool_call':
        return <span className="px-2 py-0.5 text-xs rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1 font-mono">⚡ Tool Execution</span>;
      case 'meeting':
        return <span className="px-2 py-0.5 text-xs rounded bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center gap-1 font-mono">💬 Sync Meeting</span>;
      case 'error':
        return <span className="px-2 py-0.5 text-xs rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1 font-mono">⚠️ Blocked / Error</span>;
      default:
        return <span className="px-2 py-0.5 text-xs rounded bg-gray-500/10 text-gray-400 border border-gray-500/30 flex items-center gap-1 font-mono">○ Idle / Standby</span>;
    }
  };

  return (
    <aside className="absolute right-4 top-20 bottom-4 w-96 z-30 bg-[#11141A] border border-[#1E232E] rounded-xl shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[#1E232E] flex items-start justify-between bg-[#161B24]/50">
        <div className="flex items-center gap-3">
          <div 
            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-lg border"
            style={{ backgroundColor: `${agent.color}15`, borderColor: `${agent.color}40`, color: agent.color }}
          >
            {agent.avatarChar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white font-sans">{agent.name}</h2>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1E232E] text-gray-400">
                {agent.id}
              </span>
            </div>
            <p className="text-xs text-gray-400 line-clamp-1">{agent.role}</p>
          </div>
        </div>

        <button
          onClick={() => setSelectedAgentId(null)}
          className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#1E232E] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content Scroll */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans">
        {/* Status & Room */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-[#161B24] border border-[#1E232E]">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-gray-400 uppercase font-mono">Current Status</span>
            <div>{getStatusBadge()}</div>
          </div>
          <div className="flex flex-col gap-1 text-right">
            <span className="text-[10px] text-gray-400 uppercase font-mono">Zone</span>
            <span className="text-xs font-semibold text-gray-200 capitalize font-mono">
              {agent.currentRoom.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Live Activity Stream */}
        <div className="p-3 rounded-lg bg-[#161B24] border border-[#1E232E] space-y-1.5">
          <div className="flex items-center gap-1.5 text-gray-400">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[10px] uppercase font-mono font-medium">Live Activity</span>
          </div>
          <p className="text-xs text-gray-200 font-mono bg-[#0B0D11] p-2 rounded border border-[#1E232E]/60 break-words leading-relaxed">
            {agent.lastActivity || 'No active operation in progress'}
          </p>
        </div>

        {/* Active Tool / MCP Call */}
        {agent.activeTool && (
          <div className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-500/30 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-cyan-400">
                <Wrench className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase font-mono font-bold">Active Tool</span>
              </div>
              <span className="text-[10px] text-gray-400 font-mono">
                {new Date(agent.activeTool.timestamp * 1000).toLocaleTimeString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded font-mono font-semibold text-[11px]">
                {agent.activeTool.name}
              </span>
            </div>
            {agent.activeTool.snippet && (
              <p className="text-[11px] text-gray-300 font-mono bg-[#0B0D11]/80 p-2 rounded line-clamp-3">
                {agent.activeTool.snippet}
              </p>
            )}
          </div>
        )}

        {/* Current Task from Kanban */}
        {agent.currentTask ? (
          <div className="p-3 rounded-lg bg-[#161B24] border border-[#1E232E] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-400 uppercase font-mono font-medium flex items-center gap-1">
                <FileText className="w-3 h-3 text-emerald-400" /> Current Kanban Task
              </span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase ${
                agent.currentTask.status === 'blocked' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {agent.currentTask.status}
              </span>
            </div>
            <h3 className="text-xs font-semibold text-white leading-snug">
              {agent.currentTask.title}
            </h3>
            <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono pt-1 border-t border-[#1E232E]">
              <span>ID: {agent.currentTask.id}</span>
              {agent.currentTask.duration !== undefined && (
                <span>Duration: {agent.currentTask.duration}s</span>
              )}
            </div>

            {agent.currentTask.lastFailure && (
              <div className="p-2 rounded bg-rose-950/30 border border-rose-500/30 text-rose-300 text-[11px]">
                <div className="flex items-center gap-1 font-semibold text-rose-400 mb-0.5">
                  <AlertCircle className="w-3 h-3" /> Error Details
                </div>
                <p className="font-mono text-[10px] line-clamp-3">{agent.currentTask.lastFailure}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-[#161B24]/40 border border-[#1E232E] text-center text-gray-500">
            No active Kanban card assigned
          </div>
        )}

        {/* Telemetry & Metrics */}
        <div className="p-3 rounded-lg bg-[#161B24] border border-[#1E232E] space-y-2">
          <span className="text-[10px] text-gray-400 uppercase font-mono font-medium flex items-center gap-1">
            <Cpu className="w-3 h-3 text-purple-400" /> Engine Telemetry
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-[#0B0D11] p-2 rounded border border-[#1E232E]/60">
              <span className="text-[10px] text-gray-400 block font-mono">Model</span>
              <span className="font-mono text-gray-200 font-semibold">{agent.metrics.model}</span>
            </div>
            <div className="bg-[#0B0D11] p-2 rounded border border-[#1E232E]/60">
              <span className="text-[10px] text-gray-400 block font-mono">Message Turns</span>
              <span className="font-mono text-gray-200 font-semibold">{agent.metrics.messageCount}</span>
            </div>
            <div className="bg-[#0B0D11] p-2 rounded border border-[#1E232E]/60">
              <span className="text-[10px] text-gray-400 block font-mono">Tool Calls</span>
              <span className="font-mono text-gray-200 font-semibold">{agent.metrics.toolCallCount}</span>
            </div>
            <div className="bg-[#0B0D11] p-2 rounded border border-[#1E232E]/60">
              <span className="text-[10px] text-gray-400 block font-mono">Home Desk</span>
              <span className="font-mono text-gray-200 font-semibold">{agent.homeDesk.x}, {agent.homeDesk.y}</span>
            </div>
          </div>
        </div>

        {/* Recent Task History */}
        <div className="space-y-2">
          <span className="text-[10px] text-gray-400 uppercase font-mono font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-blue-400" /> Recent Completed Work ({agent.recentTasks.length})
          </span>
          <div className="space-y-1.5">
            {agent.recentTasks.map((task) => (
              <div 
                key={task.id}
                className="p-2.5 rounded-lg bg-[#161B24] border border-[#1E232E] hover:border-gray-600 transition-colors"
              >
                <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono mb-1">
                  <span>{task.id}</span>
                  {task.completedAt && (
                    <span>{new Date(task.completedAt * 1000).toLocaleDateString()}</span>
                  )}
                </div>
                <h4 className="text-xs text-gray-200 font-medium leading-snug">{task.title}</h4>
                {task.summary && (
                  <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 italic font-sans">
                    "{task.summary}"
                  </p>
                )}
              </div>
            ))}
            {agent.recentTasks.length === 0 && (
              <p className="text-[11px] text-gray-500 italic p-2">No completed tasks on record.</p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
