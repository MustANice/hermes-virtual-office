const { chromium } = require('/root/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = '/root/projects/hermes-virtual-office/lens-artifacts';
if (!fs.existsSync(ARTIFACTS_DIR)) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

(async () => {
  console.log('🏁 [LENS COMPREHENSIVE AUDIT] Starting full verification for Paket B...');

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--enable-webgl']
  });

  const viewports = [
    { name: 'desktop-1440', width: 1440, height: 900, isMobile: false },
    { name: 'tablet-1024', width: 768, height: 1024, isMobile: false },
    { name: 'mobile-390', width: 390, height: 844, isMobile: true, hasTouch: true },
  ];

  const results = {
    gate0: { consoleErrors: [], networkFailures: [] },
    viewports: {},
    fps: {},
  };

  for (const vp of viewports) {
    console.log(`\n📱 [VIEWPORT TEST] Testing ${vp.name} (${vp.width}x${vp.height})...`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile,
      hasTouch: vp.hasTouch,
    });
    const page = await context.newPage();

    page.on('console', msg => {
      if (msg.type() === 'error') results.gate0.consoleErrors.push(`[${vp.name}] ${msg.text()}`);
    });
    page.on('pageerror', err => {
      results.gate0.consoleErrors.push(`[${vp.name}] ${err.message}`);
    });
    page.on('response', resp => {
      if (resp.status() >= 400 && ['image', 'font', 'stylesheet', 'script'].includes(resp.request().resourceType())) {
        results.gate0.networkFailures.push(`[${vp.name}] ${resp.url()} (${resp.status()})`);
      }
    });

    await page.goto('http://127.0.0.1:3333', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await page.evaluate(async () => {
      if (document.fonts) await document.fonts.ready;
    });

    // Measure FPS & Frame Time
    const perf = await page.evaluate(() => {
      return new Promise(resolve => {
        const frameDeltas = [];
        let lastTime = performance.now();
        let frames = 0;
        const targetFrames = 40;
        const timeout = setTimeout(done, 2500);

        function done() {
          clearTimeout(timeout);
          frameDeltas.sort((a, b) => a - b);
          const avgDelta = frameDeltas.length ? (frameDeltas.reduce((a, b) => a + b, 0) / frameDeltas.length) : 16.6;
          const avgFps = 1000 / avgDelta;
          const low1Fps = frameDeltas.length ? 1000 / frameDeltas[Math.floor(frameDeltas.length * 0.99)] : avgFps;
          resolve({
            avgFps: Number(avgFps.toFixed(1)),
            low1Fps: Number(low1Fps.toFixed(1)),
            maxDelta: Number(Math.max(...(frameDeltas.length ? frameDeltas : [16.6])).toFixed(2)),
          });
        }

        function step(now) {
          const delta = now - lastTime;
          lastTime = now;
          if (frames > 2) frameDeltas.push(delta);
          frames++;
          if (frames < targetFrames) requestAnimationFrame(step);
          else done();
        }
        requestAnimationFrame(step);
      });
    });

    results.fps[vp.name] = perf;

    // Check DOM overflow / bleed
    const layout = await page.evaluate(() => {
      return {
        scrollBleed: document.documentElement.scrollWidth > window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        canvasMounted: !!document.querySelector('canvas'),
      };
    });
    results.viewports[vp.name] = layout;

    const screenshotPath = path.join(ARTIFACTS_DIR, `screenshot-${vp.name}.png`);
    await page.screenshot({ path: screenshotPath, timeout: 60000 });
    console.log(`  Screenshot saved: ${screenshotPath}`);
    console.log(`  FPS: ${perf.avgFps} (1% Low: ${perf.low1Fps} FPS, Max Frame: ${perf.maxDelta} ms)`);
    console.log(`  Horizontal Bleed: ${!layout.scrollBleed ? 'ZERO BLEED' : 'OVERFLOW'}`);

    if (vp.name === 'desktop-1440') {
      // Test clicking an agent (Orion) to inspect interactive capsule focus
      console.log('  🎯 Clicking agent in bottom dock...');
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const btn = btns.find(b => b.innerText && b.innerText.includes('ORION'));
        if (btn) btn.click();
      });
      await page.waitForTimeout(1000);
      const agentClickScreenshot = path.join(ARTIFACTS_DIR, 'screenshot-agent-clicked.png');
      await page.screenshot({ path: agentClickScreenshot, timeout: 60000 });
      console.log(`  Agent clicked screenshot saved: ${agentClickScreenshot}`);
    }

    if (vp.isMobile) {
      // Test mobile touch drag gesture on canvas
      console.log('  👆 Testing mobile touch gesture on canvas...');
      const canvas = page.locator('canvas');
      const box = await canvas.boundingBox();
      if (box) {
        const startX = box.x + box.width / 2;
        const startY = box.y + box.height / 2;
        await page.mouse.move(startX, startY);
        await page.mouse.down();
        await page.mouse.move(startX + 80, startY + 40, { steps: 5 });
        await page.mouse.up();
        await page.waitForTimeout(500);
        console.log('  Touch drag orbit simulation completed successfully.');
      }
    }

    await context.close();
  }

  await browser.close();

  console.log('\n================ FINAL AUDIT SUMMARY ================');
  console.log(`Gate 0 Console Errors : ${results.gate0.consoleErrors.length === 0 ? '✅ 0 Errors (PASS)' : `❌ ${results.gate0.consoleErrors.length} Errors`}`);
  console.log(`Gate 0 Asset Failures : ${results.gate0.networkFailures.length === 0 ? '✅ 0 Failures (PASS)' : `❌ ${results.gate0.networkFailures.length} Failures`}`);
  for (const [vp, f] of Object.entries(results.fps)) {
    console.log(`FPS [${vp}]         : ${f.avgFps >= 55 ? '✅' : '⚠️'} ${f.avgFps} FPS (1% Low: ${f.low1Fps} FPS)`);
  }
  for (const [vp, l] of Object.entries(results.viewports)) {
    console.log(`Layout [${vp}]      : ${!l.scrollBleed ? '✅ ZERO BLEED' : '❌ OVERFLOW'}`);
  }
  console.log('====================================================\n');

  const allPass = results.gate0.consoleErrors.length === 0 &&
                  results.gate0.networkFailures.length === 0 &&
                  Object.values(results.viewports).every(v => !v.scrollBleed && v.canvasMounted);
  process.exit(allPass ? 0 : 1);
})();
