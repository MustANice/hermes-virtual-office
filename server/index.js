import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HermesAdapter } from './hermesAdapter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, '..', 'dist');

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3333;
const adapter = new HermesAdapter();

// SSE client list
const sseClients = new Set();

// MIME types for static file serving
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. API: /api/status
  if (pathname === '/api/status') {
    try {
      const snapshot = adapter.getSnapshot();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(snapshot));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 2. API: /api/stream (SSE)
  if (pathname === '/api/stream' || pathname === '/api/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    if (res.flushHeaders) res.flushHeaders();

    // Send initial snapshot
    try {
      const initial = adapter.getSnapshot();
      res.write(`data: ${JSON.stringify(initial)}\n\n`);
    } catch (_) {}

    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
    res.on('error', () => {
      sseClients.delete(res);
    });
    return;
  }

  // 3. API: /api/agents
  if (pathname === '/api/agents') {
    try {
      const snapshot = adapter.getSnapshot();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(Object.values(snapshot.agents)));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 4. Serve Static SPA (dist/)
  let filePath = path.join(DIST_DIR, pathname === '/' ? 'index.html' : pathname);
  
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    // If dist not built yet, return informative placeholder
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <html>
        <body style="background:#0B0D11;color:#fff;font-family:sans-serif;padding:40px;">
          <h2>Hermes Virtual Office Backend is Running on Port ${PORT}</h2>
          <p>API Endpoint: <a style="color:#3B82F6" href="/api/status">/api/status</a></p>
          <p>SSE Stream: <a style="color:#3B82F6" href="/api/stream">/api/stream</a></p>
          <p>Please run <code>npm run build</code> to serve the frontend bundle.</p>
        </body>
      </html>
    `);
  }
});

// Broadcast snapshot to all connected SSE clients every 1.5 seconds
setInterval(() => {
  if (sseClients.size === 0) return;
  try {
    const snapshot = adapter.getSnapshot();
    const data = `data: ${JSON.stringify(snapshot)}\n\n`;
    for (const client of sseClients) {
      try {
        client.write(data);
      } catch (_) {
        sseClients.delete(client);
      }
    }
  } catch (err) {
    console.error('[SSE Broadcast Error]:', err.message);
  }
}, 1500);

// Keep-alive ping for Cloudflare Tunnel every 10 seconds
setInterval(() => {
  if (sseClients.size === 0) return;
  for (const client of sseClients) {
    try {
      client.write(': ping\n\n');
    } catch (_) {
      sseClients.delete(client);
    }
  }
}, 10000);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Virtual Office] Server listening on http://0.0.0.0:${PORT}`);
});
