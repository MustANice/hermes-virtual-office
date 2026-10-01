import { OfficeMap } from './src/engine/OfficeMap.ts';

class InstrumentedCanvasContext {
  constructor() {
    this.stackDepth = 0;
    this.maxStackDepth = 0;
    this.saveCount = 0;
    this.restoreCount = 0;
    this.drawCallCount = 0;
    this.clipCount = 0;
    this.nonFiniteErrors = [];
    this.stateErrors = [];

    // State properties
    this.fillStyle = '#000000';
    this.strokeStyle = '#000000';
    this.lineWidth = 1;
    this.font = '10px sans-serif';
    this.shadowColor = 'transparent';
    this.shadowBlur = 0;
    this.shadowOffsetY = 0;
    this.shadowOffsetX = 0;
  }

  _checkNumbers(methodName, args) {
    for (let i = 0; i < args.length; i++) {
      const val = args[i];
      if (typeof val === 'number' && !Number.isFinite(val)) {
        const err = `Non-finite coordinate in ${methodName} arg #${i}: ${val}`;
        this.nonFiniteErrors.push(err);
        throw new Error(err);
      }
    }
  }

  save() {
    this.stackDepth++;
    this.saveCount++;
    if (this.stackDepth > this.maxStackDepth) {
      this.maxStackDepth = this.stackDepth;
    }
  }

  restore() {
    if (this.stackDepth <= 0) {
      const err = `Unbalanced restore() called when stackDepth is ${this.stackDepth}`;
      this.stateErrors.push(err);
      throw new Error(err);
    }
    this.stackDepth--;
    this.restoreCount++;
  }

  beginPath() {
    this.drawCallCount++;
  }

  closePath() {
    this.drawCallCount++;
  }

  moveTo(x, y) {
    this._checkNumbers('moveTo', [x, y]);
    this.drawCallCount++;
  }

  lineTo(x, y) {
    this._checkNumbers('lineTo', [x, y]);
    this.drawCallCount++;
  }

  quadraticCurveTo(cpx, cpy, x, y) {
    this._checkNumbers('quadraticCurveTo', [cpx, cpy, x, y]);
    this.drawCallCount++;
  }

  bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) {
    this._checkNumbers('bezierCurveTo', [cp1x, cp1y, cp2x, cp2y, x, y]);
    this.drawCallCount++;
  }

  arc(x, y, radius, startAngle, endAngle, counterclockwise) {
    this._checkNumbers('arc', [x, y, radius, startAngle, endAngle]);
    this.drawCallCount++;
  }

  ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise) {
    this._checkNumbers('ellipse', [x, y, radiusX, radiusY, rotation, startAngle, endAngle]);
    this.drawCallCount++;
  }

  fillRect(x, y, w, h) {
    this._checkNumbers('fillRect', [x, y, w, h]);
    this.drawCallCount++;
  }

  strokeRect(x, y, w, h) {
    this._checkNumbers('strokeRect', [x, y, w, h]);
    this.drawCallCount++;
  }

  clearRect(x, y, w, h) {
    this._checkNumbers('clearRect', [x, y, w, h]);
    this.drawCallCount++;
  }

  fill() {
    this.drawCallCount++;
  }

  stroke() {
    this.drawCallCount++;
  }

  clip() {
    if (this.stackDepth <= 0) {
      this.stateErrors.push('clip() called outside of save/restore pair');
    }
    this.clipCount++;
  }

  translate(x, y) {
    this._checkNumbers('translate', [x, y]);
  }

  rotate(angle) {
    this._checkNumbers('rotate', [angle]);
  }

  scale(x, y) {
    this._checkNumbers('scale', [x, y]);
  }

  measureText(text) {
    return { width: (text || '').length * 5.5 };
  }

  fillText(text, x, y, maxWidth) {
    const coords = [x, y];
    if (maxWidth !== undefined) coords.push(maxWidth);
    this._checkNumbers('fillText', coords);
    this.drawCallCount++;
  }

  createLinearGradient(x0, y0, x1, y1) {
    this._checkNumbers('createLinearGradient', [x0, y0, x1, y1]);
    return {
      addColorStop: (offset, color) => {}
    };
  }

  createRadialGradient(x0, y0, r0, x1, y1, r1) {
    this._checkNumbers('createRadialGradient', [x0, y0, r0, x1, y1, r1]);
    return {
      addColorStop: (offset, color) => {}
    };
  }
}

async function runDynamicVerification() {
  console.log('=== STARTING DYNAMIC CANVAS STATE & COORDINATE VERIFICATION ===\n');

  const map = new OfficeMap();
  const ctx = new InstrumentedCanvasContext();

  // Test 1: Single Frame Baseline State Balance
  console.log('--- Test 1: Baseline Single Frame State Balance ---');
  map.render(ctx, 'all');
  console.log(`Single Frame metrics: Saves=${ctx.saveCount}, Restores=${ctx.restoreCount}, DrawCalls=${ctx.drawCallCount}, Clips=${ctx.clipCount}, FinalStackDepth=${ctx.stackDepth}, MaxStackDepth=${ctx.maxStackDepth}`);
  if (ctx.stackDepth !== 0) {
    throw new Error(`CRITICAL FAIL: Canvas stack depth leaked! Final depth: ${ctx.stackDepth}`);
  }
  if (ctx.saveCount !== ctx.restoreCount) {
    throw new Error(`CRITICAL FAIL: save/restore mismatch! Saves: ${ctx.saveCount}, Restores: ${ctx.restoreCount}`);
  }
  console.log('[PASS] Test 1: Baseline frame balanced (0 stack depth delta).\n');

  // Test 2: Room Filter State Space Exploration
  console.log('--- Test 2: Room Filter State Space Exploration ---');
  const filtersToTest = [
    'all',
    'manager',
    'dev',
    'research',
    'meeting',
    'qa_security',
    'lounge',
    'server_room',
    '',
    'invalid_room_id',
    'unknown',
    undefined,
    null
  ];

  for (const filter of filtersToTest) {
    const prevDepth = ctx.stackDepth;
    const prevSaves = ctx.saveCount;
    const prevRestores = ctx.restoreCount;
    map.render(ctx, filter);
    const frameSaves = ctx.saveCount - prevSaves;
    const frameRestores = ctx.restoreCount - prevRestores;
    if (ctx.stackDepth !== prevDepth) {
      throw new Error(`CRITICAL FAIL: Leaked stack depth on filter '${filter}'! Depth: ${ctx.stackDepth}`);
    }
    console.log(`[PASS] Filter '${filter}': Balanced (${frameSaves} saves, ${frameRestores} restores, stackDepth=${ctx.stackDepth})`);
  }
  console.log('[PASS] Test 2: All 13 room filter states executed with perfect state balance.\n');

  // Test 3: Long-Horizon Continuous Animation Simulation (10,000 Frames)
  console.log('--- Test 3: Long-Horizon Animation Stress Test (10,000 continuous frames) ---');
  const frameDurations = [];
  const TOTAL_FRAMES = 10000;
  
  if (global.gc) global.gc();
  const startHeap = process.memoryUsage().heapUsed;
  const tStart = performance.now();

  for (let frame = 0; frame < TOTAL_FRAMES; frame++) {
    const fStart = performance.now();
    // Rotate through room filters to simulate user switching rooms while animating
    const filter = filtersToTest[frame % filtersToTest.length];
    map.render(ctx, filter);
    const fEnd = performance.now();
    frameDurations.push(fEnd - fStart);

    if (ctx.stackDepth !== 0) {
      throw new Error(`CRITICAL LEAK at frame ${frame}: stackDepth is ${ctx.stackDepth}`);
    }
  }

  const tEnd = performance.now();
  const endHeap = process.memoryUsage().heapUsed;
  const totalDuration = tEnd - tStart;

  frameDurations.sort((a, b) => a - b);
  const minTime = frameDurations[0];
  const maxTime = frameDurations[frameDurations.length - 1];
  const avgTime = totalDuration / TOTAL_FRAMES;
  const medianTime = frameDurations[Math.floor(TOTAL_FRAMES * 0.5)];
  const p95Time = frameDurations[Math.floor(TOTAL_FRAMES * 0.95)];
  const p99Time = frameDurations[Math.floor(TOTAL_FRAMES * 0.99)];

  console.log(`Rendered ${TOTAL_FRAMES} frames in ${totalDuration.toFixed(2)}ms`);
  console.log(`Frame Latency Stats:`);
  console.log(`  Min:    ${minTime.toFixed(4)} ms`);
  console.log(`  Median: ${medianTime.toFixed(4)} ms`);
  console.log(`  Avg:    ${avgTime.toFixed(4)} ms`);
  console.log(`  P95:    ${p95Time.toFixed(4)} ms`);
  console.log(`  P99:    ${p99Time.toFixed(4)} ms`);
  console.log(`  Max:    ${maxTime.toFixed(4)} ms`);
  console.log(`Total Draw Calls: ${ctx.drawCallCount}`);
  console.log(`Total Clip Invocations: ${ctx.clipCount}`);
  console.log(`Total Saves: ${ctx.saveCount} | Total Restores: ${ctx.restoreCount}`);
  console.log(`Non-finite Coordinate Errors: ${ctx.nonFiniteErrors.length}`);
  console.log(`State Invariant Errors: ${ctx.stateErrors.length}`);
  console.log(`Heap Delta: ${((endHeap - startHeap) / 1024 / 1024).toFixed(2)} MB`);

  if (ctx.nonFiniteErrors.length > 0) {
    throw new Error(`CRITICAL FAIL: Detected non-finite coordinates!`);
  }
  if (ctx.stateErrors.length > 0) {
    throw new Error(`CRITICAL FAIL: State errors detected!`);
  }
  if (avgTime > 16.6) {
    throw new Error(`PERFORMANCE FAIL: Average render time (${avgTime.toFixed(2)}ms) exceeds 60 FPS 16.6ms budget!`);
  }

  console.log(`[PASS] Test 3: 10,000 frames rendered with zero leaks, zero non-finite coordinates, and avg render time ${avgTime.toFixed(4)}ms (Budget: 16.6ms).\n`);

  console.log('========================================');
  console.log('DYNAMIC CANVAS VERIFICATION RESULT: ALL PASS');
  console.log('========================================\n');
}

runDynamicVerification().catch(err => {
  console.error('[FATAL DYNAMIC QA ERROR]:', err);
  process.exit(1);
});
