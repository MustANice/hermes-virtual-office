import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const HERMES_ROOT = '/root/.hermes';
const KANBAN_DB_PATH = path.join(HERMES_ROOT, 'kanban.db');

class OptimizedHermesAdapter {
  constructor() {
    this.kanbanDb = null;
    this.kanbanStmts = null;
    this.stateDbs = new Map();
    this.stateStmts = new Map();
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
        } catch (e) {
          this.kanbanDb = null;
          this.kanbanStmts = null;
        }
      }
    }
    return this.kanbanStmts;
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
        } catch (e) {
          return null;
        }
      } else {
        return null;
      }
    }
    return this.stateStmts.get(agentId) || null;
  }

  runTest(agentIds) {
    const kStmts = this.getKanban();
    if (kStmts) {
      kStmts.count.get();
      kStmts.active.all();
      kStmts.recent.all();
      kStmts.events.all();
    }
    for (const id of agentIds) {
      const s = this.getState(id);
      if (s) {
        const sRow = s.session.get();
        if (sRow && sRow.id) {
          s.message.get(sRow.id);
        }
      }
    }
  }

  close() {
    if (this.kanbanDb) {
      try { this.kanbanDb.close(); } catch (_) {}
    }
    for (const db of this.stateDbs.values()) {
      try { db.close(); } catch (_) {}
    }
    this.stateDbs.clear();
    this.stateStmts.clear();
  }
}

async function benchmark() {
  const agentIds = ['orion', 'forge', 'frame', 'aurora', 'radar', 'quant', 'prism', 'lens', 'sentinel', 'atlas', 'nexus'];
  const opt = new OptimizedHermesAdapter();
  opt.runTest(agentIds); // warm up

  const iterations = 50;
  const times = [];
  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now();
    opt.runTest(agentIds);
    const t1 = performance.now();
    times.push(t1 - t0);
  }

  opt.close();

  times.sort((a, b) => a - b);
  const avg = times.reduce((s, x) => s + x, 0) / iterations;
  const p50 = times[Math.floor(iterations * 0.5)];
  const p95 = times[Math.floor(iterations * 0.95)];
  const p99 = times[Math.floor(iterations * 0.99)];
  const min = times[0];
  const max = times[times.length - 1];

  console.log(`--- Optimized Adapter DB Benchmark (${iterations} runs) ---`);
  console.log(`Min: ${min.toFixed(2)} ms`);
  console.log(`Avg: ${avg.toFixed(2)} ms`);
  console.log(`P50: ${p50.toFixed(2)} ms`);
  console.log(`P95: ${p95.toFixed(2)} ms`);
  console.log(`P99: ${p99.toFixed(2)} ms`);
  console.log(`Max: ${max.toFixed(2)} ms`);
}

benchmark().catch(console.error);
