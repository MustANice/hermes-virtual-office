import { HermesAdapter } from '../server/hermesAdapter.js';

async function run() {
  const adapter = new HermesAdapter();
  console.log('Warming up...');
  adapter.getSnapshot();

  const iterations = 50;
  const times = [];

  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now();
    adapter.getSnapshot();
    const t1 = performance.now();
    times.push(t1 - t0);
  }

  times.sort((a, b) => a - b);
  const avg = times.reduce((s, x) => s + x, 0) / iterations;
  const p50 = times[Math.floor(iterations * 0.5)];
  const p95 = times[Math.floor(iterations * 0.95)];
  const p99 = times[Math.floor(iterations * 0.99)];
  const min = times[0];
  const max = times[times.length - 1];

  console.log(`--- HermesAdapter getSnapshot() Benchmark (${iterations} runs) ---`);
  console.log(`Min: ${min.toFixed(2)} ms`);
  console.log(`Avg: ${avg.toFixed(2)} ms`);
  console.log(`P50: ${p50.toFixed(2)} ms`);
  console.log(`P95: ${p95.toFixed(2)} ms`);
  console.log(`P99: ${p99.toFixed(2)} ms`);
  console.log(`Max: ${max.toFixed(2)} ms`);
}

run().catch(console.error);
