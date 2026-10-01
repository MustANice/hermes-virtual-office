export type AgentStatus = 'idle' | 'walking' | 'working' | 'tool_call' | 'meeting' | 'error';

export interface AgentTask {
  id: string;
  title: string;
  status: string;
  startedAt?: number;
  duration?: number;
  priority?: number;
  blockKind?: string | null;
  lastFailure?: string | null;
  assignee?: string;
  workspaceKind?: string;
}

export interface AgentToolCall {
  name: string;
  timestamp: number;
  snippet?: string;
}

export interface AgentMetrics {
  pid: number | null;
  model: string;
  messageCount: number;
  toolCallCount: number;
  uptimeSeconds: number;
  activeAgentsCount?: number;
}

export interface AgentRecentTask {
  id: string;
  title: string;
  status: string;
  completedAt?: number;
  summary?: string;
}

export interface AgentState {
  id: string;
  name: string;
  role: string;
  color: string;
  avatarChar: string;
  homeRoom: string;
  homeDesk: { x: number; y: number; facing: 'up' | 'down' | 'left' | 'right' };
  status: AgentStatus;
  currentRoom: string;
  currentTask: AgentTask | null;
  activeTool: AgentToolCall | null;
  lastActivity: string;
  lastSeenAt: number;
  meetingWith?: string[];
  metrics: AgentMetrics;
  recentTasks: AgentRecentTask[];
}

export interface OfficeStats {
  totalAgents: number;
  activeWorking: number;
  idle: number;
  inMeeting: number;
  error: number;
  completedTasksCount: number;
  timestamp: number;
}

export interface OfficeUpdatePayload {
  stats: OfficeStats;
  agents: Record<string, AgentState>;
  recentEvents: Array<{
    id: number;
    kind: string;
    agentId?: string;
    text: string;
    timestamp: number;
  }>;
}
