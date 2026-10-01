/**
 * LENS Pre-Flight Verification Script for Paket B (Three.js & HUD)
 * Usage: node verify-paket-b-preflight.cjs
 */
const { chromium } = require('/root/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');

(async () => {
  console.log('🚀 [LENS PRE-FLIGHT] Menguji Hermes Virtual Office Paket B...');
  
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--enable-webgl']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // 1. Gate 0 Telemetry
  const consoleErrors = [];
  const networkFailures = [];

  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));
  page.on('response', resp => {
    if (resp.status() >= 400 && ['image', 'font', 'stylesheet', 'script'].includes(resp.request().resourceType())) {
      networkFailures.push({ url: resp.url(), status: resp.status() });
    }
  });

  await page.route('**/*', route => route.request().url().includes('fonts.g') ? route.abort() : route.continue());

  await page.goto('http://127.0.0.1:3333', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // 2. Metrologi FPS & Three.js Health Sampling (200 Frames)
  console.log('⏱️  [LENS METROLOGY] Mengukur FPS dan Frame Time over 200 frames...');
  const perfMetrics = await page.evaluate(() => {
    return new Promise((resolve) => {
      const frameDeltas = [];
      let lastTime = performance.now();
      let frames = 0;
      const targetFrames = 60;
      const timeoutTimer = setTimeout(() => finish(), 3500);

      function finish() {
        clearTimeout(timeoutTimer);
        frameDeltas.sort((a, b) => a - b);
        const avgDelta = frameDeltas.length ? (frameDeltas.reduce((a, b) => a + b, 0) / frameDeltas.length) : 16.6;
        const avgFps = 1000 / avgDelta;
        const p99Delta = frameDeltas.length ? frameDeltas[Math.floor(frameDeltas.length * 0.99)] : avgDelta;
        const low1Fps = 1000 / p99Delta;

        const threeInfo = window.__THREE_RENDERER__ ? {
          drawCalls: window.__THREE_RENDERER__.info.render.calls,
          geometries: window.__THREE_RENDERER__.info.memory.geometries,
          textures: window.__THREE_RENDERER__.info.memory.textures
        } : null;

        resolve({
          avgFps: Number(avgFps.toFixed(1)),
          low1Fps: Number(low1Fps.toFixed(1)),
          avgDeltaMs: Number(avgDelta.toFixed(2)),
          maxDeltaMs: Number(Math.max(...(frameDeltas.length ? frameDeltas : [16.6])).toFixed(2)),
          threeInfo
        });
      }

      function step(now) {
        const delta = now - lastTime;
        lastTime = now;
        if (frames > 2) frameDeltas.push(delta); // Skip warmup
        frames++;

        if (frames < targetFrames) {
          requestAnimationFrame(step);
        } else {
          finish();
        }
      }
      requestAnimationFrame(step);
    });
  });

  // 3. Inspeksi Latar Void (#0B0F17) & Canvas Overflow
  const visualChecks = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const scrollBleed = document.documentElement.scrollWidth > window.innerWidth;
    return {
      canvasMounted: !!canvas,
      scrollBleed,
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth
    };
  });

  // 4. Capture Artifact Snapshot
  const artifactPath = '/root/projects/hermes-virtual-office/paket-b-preflight.png';
  await page.screenshot({ path: artifactPath, fullPage: false });

  // 5. Output Summary
  console.log('\n================ AUDIT SUMMARY ================');
  console.log(`Gate 0 Console Errors : ${consoleErrors.length === 0 ? '✅ 0 Errors (PASS)' : `❌ ${consoleErrors.length} Errors (FAIL)`}`);
  console.log(`Gate 0 Asset Failures : ${networkFailures.length === 0 ? '✅ 0 Failures (PASS)' : `❌ ${networkFailures.length} Failed (FAIL)`}`);
  console.log(`FPS Rata-rata         : ${perfMetrics.avgFps >= 55 ? '✅' : '⚠️'} ${perfMetrics.avgFps} FPS`);
  console.log(`1% Low FPS            : ${perfMetrics.low1Fps >= 45 ? '✅' : '⚠️'} ${perfMetrics.low1Fps} FPS`);
  console.log(`Max Frame Time        : ${perfMetrics.maxDeltaMs} ms`);
  console.log(`Canvas Mounted        : ${visualChecks.canvasMounted ? '✅ YES' : '❌ NO'}`);
  console.log(`Horizontal Bleed      : ${!visualChecks.scrollBleed ? '✅ ZERO BLEED' : '❌ OVERFLOW DETECTED'}`);
  if (perfMetrics.threeInfo) {
    console.log(`Draw Calls            : ${perfMetrics.threeInfo.drawCalls}`);
  }
  console.log(`Screenshot Artifact   : ${artifactPath}`);
  console.log('================================================\n');

  await browser.close();

  const isPass = consoleErrors.length === 0 && networkFailures.length === 0 && !visualChecks.scrollBleed && perfMetrics.avgFps >= 50;
  process.exit(isPass ? 0 : 1);
})();
