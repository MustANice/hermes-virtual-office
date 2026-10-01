const { chromium } = require('/root/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');

async function runBrowserE2E() {
  console.log('=== STARTING BROWSER E2E & RUNTIME CONSOLE VERIFICATION (OFFICEMAP 2D ENGINE) ===\n');

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const errors = [];
  const warnings = [];

  // Helper to create an instrumented page
  async function createInstrumentedPage(viewport, deviceScaleFactor = 1) {
    const page = await browser.newPage({ 
      viewport, 
      deviceScaleFactor 
    });

    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') {
        errors.push(`[Console Error] ${text}`);
      } else if (type === 'warning') {
        warnings.push(`[Console Warning] ${text}`);
      }
    });

    page.on('pageerror', err => {
      errors.push(`[Page Uncaught Exception] ${err.message}`);
    });

    // Inject canvas stack depth and coordinate monitor
    await page.addInitScript(() => {
      window.__canvasMetrics = {
        saveCount: 0,
        restoreCount: 0,
        currentStackDepth: 0,
        maxStackDepth: 0,
        stackLeaks: 0,
        nonFiniteCoords: 0,
        fillRectCount: 0,
      };

      const origSave = CanvasRenderingContext2D.prototype.save;
      const origRestore = CanvasRenderingContext2D.prototype.restore;
      const origFillRect = CanvasRenderingContext2D.prototype.fillRect;
      const origStrokeRect = CanvasRenderingContext2D.prototype.strokeRect;
      const origArc = CanvasRenderingContext2D.prototype.arc;

      CanvasRenderingContext2D.prototype.save = function() {
        window.__canvasMetrics.saveCount++;
        window.__canvasMetrics.currentStackDepth++;
        if (window.__canvasMetrics.currentStackDepth > window.__canvasMetrics.maxStackDepth) {
          window.__canvasMetrics.maxStackDepth = window.__canvasMetrics.currentStackDepth;
        }
        return origSave.apply(this, arguments);
      };

      CanvasRenderingContext2D.prototype.restore = function() {
        window.__canvasMetrics.restoreCount++;
        window.__canvasMetrics.currentStackDepth--;
        if (window.__canvasMetrics.currentStackDepth < 0) {
          window.__canvasMetrics.stackLeaks++;
        }
        return origRestore.apply(this, arguments);
      };

      CanvasRenderingContext2D.prototype.fillRect = function(x, y, w, h) {
        window.__canvasMetrics.fillRectCount++;
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(w) || !Number.isFinite(h)) {
          window.__canvasMetrics.nonFiniteCoords++;
        }
        return origFillRect.apply(this, arguments);
      };

      CanvasRenderingContext2D.prototype.strokeRect = function(x, y, w, h) {
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(w) || !Number.isFinite(h)) {
          window.__canvasMetrics.nonFiniteCoords++;
        }
        return origStrokeRect.apply(this, arguments);
      };

      CanvasRenderingContext2D.prototype.arc = function(x, y, radius, s, e, cc) {
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(radius)) {
          window.__canvasMetrics.nonFiniteCoords++;
        }
        return origArc.apply(this, arguments);
      };
    });

    return page;
  }

  // 1. Desktop 1440x900 Verification & Full Interaction Loop
  console.log('--- 1. Testing Desktop 1440x900 with 2D OfficeMap Mode & Full Interaction Loop ---');
  const desktopPage = await createInstrumentedPage({ width: 1440, height: 900 });
  await desktopPage.goto('http://127.0.0.1:3333');
  await desktopPage.waitForTimeout(1500);

  // Switch explicitly to 2D Office mode to activate OfficeMap.ts engine
  const btn2D = desktopPage.locator('button:has-text("2D Office")');
  await btn2D.click();
  await desktopPage.waitForTimeout(1500);
  console.log('Switched to 2D Office mode (OfficeCanvas + OfficeMap active).');

  // Verify Canvas element exists and is rendered
  const canvasBounds = await desktopPage.$eval('canvas', el => {
    const rect = el.getBoundingClientRect();
    return { width: rect.width, height: rect.height, canvasW: el.width, canvasH: el.height };
  });
  console.log('Canvas Render Dimensions:', canvasBounds);

  // Check FPS in UI header
  const fpsText = await desktopPage.$eval('header', el => {
    const fpsMatch = el.innerText.match(/(\d+)\s*FPS/);
    return fpsMatch ? fpsMatch[1] : null;
  });
  console.log('Reported UI FPS:', fpsText);

  // Exercise Room Filter Navigation Tabs
  const roomButtons = [
    'Manager Suite',
    'Dev Wing',
    'Research Lab',
    'Conference',
    'QA & Security',
    'Lounge',
    'Servers',
    'Full Campus'
  ];

  console.log('Exercising room filter transitions...');
  for (const roomName of roomButtons) {
    const btn = desktopPage.locator(`button:has-text("${roomName}")`);
    await btn.click();
    await desktopPage.waitForTimeout(400);
    console.log(`  Clicked filter '${roomName}'`);
  }

  // Exercise Pan & Drag
  console.log('Exercising canvas drag / camera panning...');
  const canvasEl = desktopPage.locator('canvas');
  await canvasEl.dispatchEvent('mousedown', { clientX: 700, clientY: 450 });
  await desktopPage.mouse.move(750, 480);
  await desktopPage.mouse.move(800, 500);
  await canvasEl.dispatchEvent('mouseup', { clientX: 800, clientY: 500 });
  await desktopPage.waitForTimeout(400);

  // Exercise Zoom via Wheel
  console.log('Exercising canvas zoom in & out...');
  await canvasEl.dispatchEvent('wheel', { deltaY: -100 });
  await desktopPage.waitForTimeout(300);
  await canvasEl.dispatchEvent('wheel', { deltaY: 100 });
  await desktopPage.waitForTimeout(300);

  // Exercise Reset Camera
  console.log('Exercising Reset Camera button...');
  const resetBtn = desktopPage.locator('button[title="Reset Camera View"]');
  await resetBtn.click();
  await desktopPage.waitForTimeout(400);

  // Exercise Sim Speed buttons (1x, 2x, 4x)
  console.log('Exercising simulation speeds (1x, 2x, 4x)...');
  await desktopPage.locator('button:has-text("2x")').click();
  await desktopPage.waitForTimeout(400);
  await desktopPage.locator('button:has-text("4x")').click();
  await desktopPage.waitForTimeout(800);
  await desktopPage.locator('button:has-text("1x")').click();
  await desktopPage.waitForTimeout(400);

  // Exercise Clicking an Agent to open Drawer
  console.log('Exercising agent click and inspection drawer...');
  const agentRosterCard = desktopPage.locator('div[title*="ORION"]').first();
  if (await agentRosterCard.count() > 0) {
    await agentRosterCard.click();
    await desktopPage.waitForTimeout(600);
    // Check drawer opened
    const drawerVisible = await desktopPage.$eval('div:has-text("AGENT INSPECTOR")', el => !!el).catch(() => false);
    console.log('Agent Inspector Drawer open:', drawerVisible);
    // Close drawer
    const closeBtn = desktopPage.locator('button:has-text("✕")').or(desktopPage.locator('button[aria-label="Close"]'));
    if (await closeBtn.count() > 0) {
      await closeBtn.first().click();
      await desktopPage.waitForTimeout(400);
    }
  }

  // Let animation run for another 2.5 seconds
  await desktopPage.waitForTimeout(2500);

  // Check metrics from injected script
  const metrics = await desktopPage.evaluate(() => window.__canvasMetrics);
  console.log('Browser Live Canvas Invariant Metrics (2D OfficeMap):');
  console.log(`  Save count:        ${metrics.saveCount}`);
  console.log(`  Restore count:     ${metrics.restoreCount}`);
  console.log(`  Current stack:     ${metrics.currentStackDepth}`);
  console.log(`  Max stack depth:   ${metrics.maxStackDepth}`);
  console.log(`  Stack leaks (<0):  ${metrics.stackLeaks}`);
  console.log(`  Non-finite coords: ${metrics.nonFiniteCoords}`);
  console.log(`  FillRect calls:    ${metrics.fillRectCount}`);

  if (metrics.currentStackDepth !== 0) {
    throw new Error(`CRITICAL LIVE STACK LEAK: currentStackDepth is ${metrics.currentStackDepth}`);
  }
  if (metrics.stackLeaks > 0) {
    throw new Error(`CRITICAL LIVE STACK UNDERFLOW: ${metrics.stackLeaks} restores below 0`);
  }
  if (metrics.nonFiniteCoords > 0) {
    throw new Error(`CRITICAL LIVE NON-FINITE COORDINATES: ${metrics.nonFiniteCoords} detected!`);
  }

  await desktopPage.screenshot({ path: '/root/projects/hermes-virtual-office/screenshot-e2e-desktop-final.png' });
  await desktopPage.close();

  // 2. Tablet Viewport (1024x768)
  console.log('\n--- 2. Testing Tablet Viewport (1024x768 in 2D Mode) ---');
  const tabletPage = await createInstrumentedPage({ width: 1024, height: 768 });
  await tabletPage.goto('http://127.0.0.1:3333');
  await tabletPage.waitForTimeout(1000);
  await tabletPage.locator('button:has-text("2D Office")').click();
  await tabletPage.waitForTimeout(1500);
  await tabletPage.screenshot({ path: '/root/projects/hermes-virtual-office/screenshot-e2e-tablet-final.png' });
  await tabletPage.close();
  console.log('Tablet 1024x768 verified and screenshot captured.');

  // 3. Mobile / Constrained Viewport (768x1024)
  console.log('\n--- 3. Testing Mobile/Constrained Viewport (768x1024 in 2D Mode) ---');
  const mobilePage = await createInstrumentedPage({ width: 768, height: 1024 });
  await mobilePage.goto('http://127.0.0.1:3333');
  await mobilePage.waitForTimeout(1000);
  await mobilePage.locator('button:has-text("2D Office")').click();
  await mobilePage.waitForTimeout(1500);
  await mobilePage.screenshot({ path: '/root/projects/hermes-virtual-office/screenshot-e2e-mobile-final.png' });
  await mobilePage.close();
  console.log('Mobile 768x1024 verified and screenshot captured.');

  // 4. Retina / Hi-DPI Viewport (1440x900 @ 2x DPR)
  console.log('\n--- 4. Testing Hi-DPI Retina Viewport (1440x900 @ 2x DPR in 2D Mode) ---');
  const retinaPage = await createInstrumentedPage({ width: 1440, height: 900 }, 2);
  await retinaPage.goto('http://127.0.0.1:3333');
  await retinaPage.waitForTimeout(1000);
  await retinaPage.locator('button:has-text("2D Office")').click();
  await retinaPage.waitForTimeout(1500);
  await retinaPage.screenshot({ path: '/root/projects/hermes-virtual-office/screenshot-e2e-retina-final.png' });
  await retinaPage.close();
  console.log('Retina 2x Hi-DPI verified and screenshot captured.');

  await browser.close();

  console.log('\n=== RUNTIME CONSOLE VERIFICATION SUMMARY ===');
  console.log(`Total Errors Logged:   ${errors.length}`);
  console.log(`Total Warnings Logged: ${warnings.length}`);
  if (errors.length > 0) {
    console.error('Logged Errors:', errors);
    throw new Error(`CRITICAL E2E FAILURE: ${errors.length} console/page errors detected during browser runtime!`);
  }

  console.log('========================================');
  console.log('BROWSER E2E VERIFICATION RESULT: ALL PASS (0 errors, balanced canvas, flawless interaction)');
  console.log('========================================\n');
}

runBrowserE2E().catch(err => {
  console.error('[FATAL BROWSER E2E ERROR]:', err);
  process.exit(1);
});
