import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';

const dbPath = '/root/.hermes/kanban.db';
const db = new DatabaseSync(dbPath, { readOnly: true });

const stmt = db.prepare("SELECT count(*) as count FROM tasks WHERE status = 'done'");
const row1 = stmt.get();
console.log('Initial count:', row1.count);

// Prepared statement works and connection stays open.
const stmt2 = db.prepare("SELECT id, status, completed_at FROM tasks WHERE status = 'done' ORDER BY completed_at DESC LIMIT 5");
console.log('Latest 5 done tasks:', stmt2.all().map(r => r.id));

db.close();
console.log('Closed successfully');
