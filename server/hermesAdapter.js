import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const HERMES_ROOT = '/root/.hermes';
const KANBAN_DB_PATH = path.join(HERMES_ROOT, 'kanban.db');

export const AGENT_CONFIGS = {
  orion: {
    id: 'orion',
    name: 'ORION',
    role: 'Chief of Staff & Orchestrator',
    color: '#3B82F6', // Blue
    avatarChar: '👑',
    homeRoom: 'manager',
    homeDesk: { x: 190, y: 150, facing: 'down' },
  },
  forge: {
    id: 'forge',
    name: 'FORGE',
    role: 'Backend, APIs & Systems',
    color: '#F97316', // Orange
    avatarChar: '⚙️',
    homeRoom: 'dev',
    homeDesk: { x: 430, y: 140, facing: 'down' },
  },
  frame: {
    id: 'frame',
    name: 'FRAME',
    role: 'Frontend & Browser UI',
    color: '#06B6D4', // Cyan
    avatarChar: '🎨',
    homeRoom: 'dev',
    homeDesk: { x: 550, y: 140, facing: 'down' },
  },
  aurora: {
    id: 'aurora',
    name: 'AURORA',
    role: 'Product & UX Art Direction',
    color: '#EC4899', // Pink
    avatarChar: '✨',
    homeRoom: 'dev',
    homeDesk: { x: 490, y: 210, facing: 'up' },
  },
  radar: {
    id: 'radar',
    name: 'RADAR',
    role: 'Research & Source Intel',
    color: '#10B981', // Emerald
    avatarChar: '📡',
    homeRoom: 'research',
    homeDesk: { x: 770, y: 140, facing: 'down' },
  },
  quant: {
    id: 'quant',
    name: 'QUANT',
    role: 'Quantitative & Trading',
    color: '#84CC16', // Lime
    avatarChar: '📊',
    homeRoom: 'research',
    homeDesk: { x: 890, y: 140, facing: 'down' },
  },
  prism: {
    id: 'prism',
    name: 'PRISM',
    role: 'Functional QA & Metrology',
    color: '#A855F7', // Purple
    avatarChar: '🔬',
    homeRoom: 'qa_security',
    homeDesk: { x: 180, y: 440, facing: 'right' },
  },
  lens: {
    id: 'lens',
    name: 'LENS',
    role: 'Visual QA & Inspection',
    color: '#6366F1', // Indigo
    avatarChar: '👁️',
    homeRoom: 'qa_security',
    homeDesk: { x: 280, y: 440, facing: 'left' },
  },
  sentinel: {
    id: 'sentinel',
    name: 'SENTINEL',
    role: 'Security & Threat Review',
    color: '#EF4444', // Red
    avatarChar: '🛡️',
    homeRoom: 'qa_security',
    homeDesk: { x: 230, y: 530, facing: 'up' },
  },
  atlas: {
    id: 'atlas',
    name: 'ATLAS',
    role: 'Infrastructure & SRE',
    color: '#EAB308', // Yellow
    avatarChar: '🌐',
    homeRoom: 'server_room',
    homeDesk: { x: 850, y: 470, facing: 'left' },
  },
  nexus: {
    id: 'nexus',
    name: 'NEXUS',
    role: 'Operations & Runbooks',
    color: '#14B8A6', // Teal
    avatarChar: '📋',
    homeRoom: 'lounge',
    homeDesk: { x: 540, y: 520, facing: 'down' },
  },
};

// Meeting Room coordinates for discussions
export const MEETING_SEATS = [
  { x: 460, y: 340 },
  { x: 500, y: 340 },
  { x: 540, y: 340 },
  { x: 460, y: 380 },
  { x: 500, y: 380 },
  { x: 540, y: 380 },
];

// Lounge chill locations for idle agents
export const LOUNGE_SEATS = [
  { x: 450, y: 480 },
  { x: 480, y: 480 },
  { x: 600, y: 480 },
  { x: 630, y: 480 },
  { x: 460, y: 550 },
  { x: 620, y: 550 },
];

export class HermesAdapter {
  constructor() {
    this.lastAuditCheck = 0;
    this.recentAudits = [];
    this.kanbanDb = null;
    this.kanbanStmts = null;
    this.stateDbs = new Map();
    this.stateStmts = new Map();
    this.readRecentA2AAudits();
  }

  getKanban() {
    if (!this.kanbanDb) {
      if (fs.existsSync(KANBAN_DB_PATH)) {
        try {
          this.kanbanDb = new DatabaseSync(KANBAN_DB_PATH, { readOnly: true });
          this.kanbanStmts = {
            count: this.kanbanDb.prepare("SELECT count(*) as count FROM tasks WHERE status = 'done'"),
            active: this.kanbanDb.prepare(
              "SELECT id, title, assignee, status, started_at, priority, block_kind, last_failure_error FROM tasks WHERE status IN ('running', 'blocked', 'ready') ORDER BY CASE status WHEN 'running' THEN 1 WHEN 'blocked' THEN 2 WHEN 'ready' THEN 3 ELSE 4 END ASC"
            ),
            recent: this.kanbanDb.prepare(
              "SELECT id, title, assignee, status, completed_at, result FROM tasks WHERE status = 'done' ORDER BY completed_at DESC LIMIT 30"
            ),
            events: this.kanbanDb.prepare(
              "SELECT id, task_id, kind, payload, created_at FROM task_events ORDER BY id DESC LIMIT 10"
            ),
          };
        } catch (err) {
          console.error('[HermesAdapter] Error opening Kanban DB:', err);
          this.kanbanDb = null;
          this.kanbanStmts = null;
        }
      }
    }
    return this.kanbanStmts;
  }

  resetKanban() {
    if (this.kanbanDb) {
      try { this.kanbanDb.close(); } catch (_) {}
      this.kanbanDb = null;
      this.kanbanStmts = null;
    }
  }

  getState(agentId) {
    if (!this.stateDbs.has(agentId)) {
      const stateDbPath = path.join(HERMES_ROOT, 'profiles', agentId, 'state.db');
      if (fs.existsSync(stateDbPath)) {
        try {
          const db = new DatabaseSync(stateDbPath, { readOnly: true });
          this.stateDbs.set(agentId, db);
          this.stateStmts.set(agentId, {
            session: db.prepare(
              "SELECT id, model, message_count, tool_call_count, started_at, last_activity_at, last_activity_description FROM sessions ORDER BY COALESCE(last_activity_at, started_at) DESC LIMIT 1"
            ),
            message: db.prepare(
              "SELECT role, tool_name, tool_calls, timestamp, substr(content, 1, 120) as snippet FROM messages WHERE session_id = ? ORDER BY id DESC LIMIT 1"
            ),
          });
        } catch (err) {
          return null;
        }
      } else {
        return null;
      }
    }
    return this.stateStmts.get(agentId) || null;
  }

  resetState(agentId) {
    const db = this.stateDbs.get(agentId);
    if (db) {
      try { db.close(); } catch (_) {}
      this.stateDbs.delete(agentId);
      this.stateStmts.delete(agentId);
    }
  }

  close() {
    this.resetKanban();
    for (const id of Array.from(this.stateDbs.keys())) {
      this.resetState(id);
    }
  }

  readRecentA2AAudits() {
    try {
      const now = Date.now() / 1000;
      this.recentAudits = [];
      for (const agentId of Object.keys(AGENT_CONFIGS)) {
        const auditPath = path.join(HERMES_ROOT, 'profiles', agentId, 'a2a_audit.jsonl');
        if (fs.existsSync(auditPath)) {
          const stats = fs.statSync(auditPath);
          if (stats.size > 0) {
            const readSize = Math.min(stats.size, 8192);
            const buffer = Buffer.alloc(readSize);
            const fd = fs.openSync(auditPath, 'r');
            fs.readSync(fd, buffer, 0, readSize, stats.size - readSize);
            fs.closeSync(fd);

            const lines = buffer.toString('utf-8').trim().split('\n');
            for (const line of lines) {
              if (!line.trim()) continue;
              try {
                const record = JSON.parse(line);
                if (record.ts && (now - record.ts) < 180) { // within last 3 minutes
                  this.recentAudits.push({
                    ts: record.ts,
                    caller: agentId,
                    peer: record.peer || '',
                    task_id: record.task_id,
                  });
                }
              } catch (_) {}
            }
          }
        }
      }
      this.lastAuditCheck = now;
    } catch (err) {
      console.error('[HermesAdapter] Error reading A2A audits:', err);
    }
  }

  getSnapshot() {
    const nowSec = Date.now() / 1000;
    if (nowSec - this.lastAuditCheck > 5) {
      this.readRecentA2AAudits();
    }

    // 1. Read Kanban DB
    let totalCompletedTasks = 0;
    const activeTasksMap = {};
    const recentCompletedTasksMap = {};
    const recentEvents = [];

    try {
      const k = this.getKanban();
      if (k) {
        // Total completed
        const countRow = k.count.get();
        if (countRow) totalCompletedTasks = countRow.count;

        // Active tasks
        const activeRows = k.active.all();

        for (const row of activeRows) {
          const assigneeKey = row.assignee ? row.assignee.replace(/^@/, '').toLowerCase().trim() : '';
          if (assigneeKey && !activeTasksMap[assigneeKey]) {
            activeTasksMap[assigneeKey] = {
              id: row.id,
              title: row.title,
              status: row.status,
              startedAt: row.started_at,
              duration: row.started_at ? Math.max(0, Math.floor(nowSec - row.started_at)) : 0,
              priority: row.priority,
              blockKind: row.block_kind,
              lastFailure: row.last_failure_error,
              assignee: assigneeKey,
            };
          }
        }

        // Recent completed tasks (last 5 per assignee)
        const recentRows = k.recent.all();

        for (const r of recentRows) {
          if (!recentCompletedTasksMap[r.assignee]) recentCompletedTasksMap[r.assignee] = [];
          if (recentCompletedTasksMap[r.assignee].length < 5) {
            recentCompletedTasksMap[r.assignee].push({
              id: r.id,
              title: r.title,
              status: r.status,
              completedAt: r.completed_at,
              summary: r.result || '',
            });
          }
        }

        // Recent events
        const eventRows = k.events.all();

        for (const ev of eventRows) {
          let summary = `${ev.kind} on ${ev.task_id}`;
          try {
            const p = JSON.parse(ev.payload || '{}');
            if (p.summary) summary = p.summary;
            else if (p.error) summary = `Error: ${p.error}`;
          } catch (_) {}

          recentEvents.push({
            id: ev.id,
            kind: ev.kind,
            text: summary,
            timestamp: ev.created_at,
          });
        }
      }
    } catch (err) {
      console.error('[HermesAdapter] Kanban DB error:', err);
      this.resetKanban();
    }

    // 2. Build Agent States
    const agents = {};
    let activeWorkingCount = 0;
    let idleCount = 0;
    let inMeetingCount = 0;
    let errorCount = 0;

    for (const [id, config] of Object.entries(AGENT_CONFIGS)) {
      let sessionRow = null;
      let lastMessageRow = null;

      try {
        const s = this.getState(id);
        if (s) {
          sessionRow = s.session.get();

          if (sessionRow && sessionRow.id) {
            lastMessageRow = s.message.get(sessionRow.id);

            // Extract tool_name and command snippet from tool_calls if assistant initiated a call
            if (lastMessageRow && !lastMessageRow.tool_name && lastMessageRow.tool_calls) {
              try {
                const calls = JSON.parse(lastMessageRow.tool_calls);
                if (Array.isArray(calls) && calls.length > 0 && calls[0].function) {
                  lastMessageRow.tool_name = calls[0].function.name;
                  if (calls[0].function.arguments) {
                    try {
                      const args = JSON.parse(calls[0].function.arguments);
                      lastMessageRow.snippet = args.command || args.path || args.query || args.url || JSON.stringify(args).slice(0, 60);
                    } catch (_) {
                      lastMessageRow.snippet = String(calls[0].function.arguments).slice(0, 60);
                    }
                  }
                }
              } catch (_) {}
            }
          }
        }
      } catch (err) {
        this.resetState(id);
      }

      // Check current task from Kanban
      const currentTask = activeTasksMap[id] || null;

      // Determine meeting status via A2A
      let meetingWith = undefined;
      const recentMeeting = this.recentAudits.find(
        (a) => (a.caller === id || a.peer === id) && (nowSec - a.ts) < 90
      );
      if (recentMeeting) {
        const partner = recentMeeting.caller === id ? recentMeeting.peer : recentMeeting.caller;
        if (partner && AGENT_CONFIGS[partner]) {
          meetingWith = [partner];
        }
      }

      // Determine Status with 100% Truthful Liveness Detection
      let status = 'idle';
      let currentRoom = config.homeRoom;

      const hasActiveKanban = currentTask && currentTask.status === 'running';
      const isBlocked = currentTask && (currentTask.status === 'blocked' || !!currentTask.lastFailure);

      const lastActivityAt = sessionRow?.last_activity_at || sessionRow?.started_at || 0;
      const messageTime = lastMessageRow?.timestamp || 0;

      // Check if assistant turn is truly finished:
      // When assistant outputs a final message with NO tool_calls, the turn is 100% complete and idle!
      const isTurnCompleted = lastMessageRow && lastMessageRow.role === 'assistant' && (
        !lastMessageRow.tool_calls ||
        lastMessageRow.tool_calls === '[]' ||
        lastMessageRow.tool_calls === '' ||
        lastMessageRow.tool_calls === 'null'
      );

      // Check if a tool call is genuinely active right now (within last 25s):
      const hasActiveToolCall = !isTurnCompleted && (
        (lastMessageRow && lastMessageRow.role === 'assistant' && !!lastMessageRow.tool_calls && (nowSec - messageTime) < 25) ||
        (lastMessageRow && lastMessageRow.role === 'tool' && (nowSec - messageTime) < 15)
      );

      // Check if an LLM is actively streaming response right now (within last 12s):
      const isActivelyStreaming = !isTurnCompleted && (nowSec - lastActivityAt) < 12 && sessionRow?.last_activity_description && (
        sessionRow.last_activity_description.includes('streaming') ||
        sessionRow.last_activity_description.includes('receiving stream') ||
        sessionRow.last_activity_description.includes('starting API call')
      );

      if (isBlocked) {
        status = 'error';
        errorCount++;
      } else if (meetingWith && meetingWith.length > 0) {
        status = 'meeting';
        currentRoom = 'meeting';
        inMeetingCount++;
      } else if (hasActiveKanban) {
        if (hasActiveToolCall) {
          status = 'tool_call';
        } else {
          status = 'working';
        }
        activeWorkingCount++;
      } else if (hasActiveToolCall) {
        status = 'tool_call';
        activeWorkingCount++;
      } else if (isActivelyStreaming) {
        status = 'working';
        activeWorkingCount++;
      } else {
        // Absolutely IDLE! The turn has finished or there is no active work in flight!
        status = 'idle';
        idleCount++;
      }

      // Active tool detection: ONLY populate activeTool if status is actually 'tool_call'
      let activeTool = null;
      if (status === 'tool_call' && lastMessageRow && lastMessageRow.tool_name) {
        activeTool = {
          name: lastMessageRow.tool_name,
          timestamp: Math.floor(lastMessageRow.timestamp),
          snippet: lastMessageRow.snippet || '',
        };
      }

      agents[id] = {
        id,
        name: config.name,
        role: config.role,
        color: config.color,
        avatarChar: config.avatarChar,
        homeRoom: config.homeRoom,
        homeDesk: config.homeDesk,
        status,
        currentRoom,
        currentTask,
        activeTool,
        lastActivity: status === 'idle' ? 'Standby • Ready for dispatch' : (sessionRow?.last_activity_description || 'Processing'),
        lastSeenAt: Math.floor(lastActivityAt || nowSec),
        meetingWith,
        metrics: {
          pid: null,
          model: sessionRow?.model || 'gemini',
          messageCount: sessionRow?.message_count || 0,
          toolCallCount: sessionRow?.tool_call_count || 0,
          uptimeSeconds: 0,
        },
        recentTasks: recentCompletedTasksMap[id] || [],
      };
    }

    const stats = {
      totalAgents: Object.keys(AGENT_CONFIGS).length,
      activeWorking: activeWorkingCount,
      idle: idleCount,
      inMeeting: inMeetingCount,
      error: errorCount,
      completedTasksCount: totalCompletedTasks,
      timestamp: Math.floor(nowSec),
    };

    return {
      stats,
      agents,
      recentEvents,
    };
  }
}
