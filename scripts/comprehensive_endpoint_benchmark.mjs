import http from 'node:http';

const ENDPOINTS = [
  { name: 'Virtual Office /api/status (port 3333)', url: 'http://127.0.0.1:3333/api/status', expectedStatus: 200 },
  { name: 'Virtual Office /api/agents (port 3333)', url: 'http://127.0.0.1:3333/api/agents', expectedStatus: 200 },
  { name: 'Virtual Office Static / (port 3333)', url: 'http://127.0.0.1:3333/', expectedStatus: 200 },
  { name: 'CEBAN Auth Verify (port 5050)', url: 'http://127.0.0.1:5050/api/auth/verify', expectedStatus: 401 },
  { name: 'CEBAN Static Root (port 5050)', url: 'http://127.0.0.1:5050/', expectedStatus: 200 },
  { name: 'Porto Dimas Next.js (port 3005)', url: 'http://127.0.0.1:3005/', expectedStatus: 200 },
  { name: 'Kai Enzo Portfolio (port 4100)', url: 'http://127.0.0.1:4100/', expectedStatus: 200 },
];

function fetchOnce(url) {
  return new Promise((resolve, reject) => {
    const t0 = performance.now();
    const req = http.get(url, (res) => {
      res.on('data', () => {});
      res.on('end', () => {
        const t1 = performance.now();
        resolve({ statusCode: res.statusCode, duration: t1 - t0 });
      });
    });
    req.on('error', (err) => reject(err));
  });
}

async function benchmarkEndpoint(ep, runs = 50) {
  // Warm up
  try {
    await fetchOnce(ep.url);
  } catch (e) {
    return { name: ep.name, error: e.message };
  }

  const times = [];
  let successCount = 0;
  for (let i = 0; i < runs; i++) {
    try {
      const res = await fetchOnce(ep.url);
      if (res.statusCode === ep.expectedStatus) successCount++;
      times.push(res.duration);
    } catch (e) {
      times.push(999);
    }
  }

  times.sort((a, b) => a - b);
  const avg = times.reduce((s, x) => s + x, 0) / runs;
  const p50 = times[Math.floor(runs * 0.5)];
  const p95 = times[Math.floor(runs * 0.95)];
  const p99 = times[Math.floor(runs * 0.99)];
  const min = times[0];
  const max = times[times.length - 1];

  const target60fps = 16.67;
  const is60fpsCompliant = p95 < target60fps;

  return {
    name: ep.name,
    runs,
    successRate: `${((successCount / runs) * 100).toFixed(1)}%`,
    min: `${min.toFixed(2)}ms`,
    p50: `${p50.toFixed(2)}ms`,
    p95: `${p95.toFixed(2)}ms`,
    p99: `${p99.toFixed(2)}ms`,
    max: `${max.toFixed(2)}ms`,
    avg: `${avg.toFixed(2)}ms`,
    target60fps: `${target60fps}ms`,
    status60fps: is60fpsCompliant ? 'PASS (<=16.67ms)' : 'FAIL (>16.67ms)',
  };
}

async function main() {
  console.log('Starting Comprehensive Backend & Endpoint Performance Benchmark...\n');
  const results = [];
  for (const ep of ENDPOINTS) {
    const res = await benchmarkEndpoint(ep, 50);
    results.push(res);
  }
  console.table(results);
}

main().catch(console.error);
