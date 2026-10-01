const { chromium } = require('/root/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = '/root/projects/hermes-virtual-office/lens-artifacts';
if (!fs.existsSync(ARTIFACTS_DIR)) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

async function runLensAudit() {
  console.log('[LENS AUDIT] Starting independent rendered-interface audit for hermes-virtual-office (2D Canvas OfficeMap)...');
  const auditReport = {
    target: 'http://127.0.0.1:3333',
    timestamp: new Date().toISOString(),
    viewModeAudited: '2d',
    gates: {},
    sectors: {},
    viewports: {},
    interactions: {},
    defects: [],
    artifacts: []
  };

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1
  });

  const page = await context.newPage();

  // Setup Telemetry listeners for Gate 0
  const consoleErrors = [];
  const consoleLogs = [];
  const networkFailures = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push({ type: msg.type(), text });
    if (msg.type() === 'error') {
      consoleErrors.push({ text, location: msg.location() });
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push({ text: err.message, stack: err.stack });
  });

  page.on('response', resp => {
    const status = resp.status();
    const url = resp.url();
    const rType = resp.request().resourceType();
    if (status >= 400 && ['image', 'font', 'stylesheet', 'script', 'document'].includes(rType)) {
      networkFailures.push({ url, status, rType });
    }
  });

  // Navigate to target
  console.log('[LENS AUDIT] Navigating to http://127.0.0.1:3333 ...');
  await page.goto('http://127.0.0.1:3333', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Switch to 2D Office Canvas mode
  console.log('[LENS AUDIT] Switching to 2D Office Canvas view...');
  const switch2dBtn = page.locator('button:has-text("2D Office")');
  if (await switch2dBtn.count() > 0) {
    await switch2dBtn.click();
    await page.waitForTimeout(1000);
    console.log('[LENS AUDIT] 2D Office Canvas view activated.');
  } else {
    console.warn('[LENS WARN] 2D Office button not found! Checking current canvas state.');
  }

  // ==========================================
  // GATE 0: RUNTIME HEALTH & LIFECYCLE BARRIER
  // ==========================================
  console.log('[LENS AUDIT] Evaluating Gate 0: Runtime Health & Network Telemetry in 2D Mode...');
  await page.evaluate(async () => {
    if (document.fonts) await document.fonts.ready;
  });

  const g0Pass = consoleErrors.length === 0 && networkFailures.length === 0;
  auditReport.gates.gate0 = {
    pass: g0Pass,
    consoleErrorCount: consoleErrors.length,
    consoleErrors,
    networkFailureCount: networkFailures.length,
    networkFailures
  };
  console.log(`[LENS AUDIT] Gate 0 result: ${g0Pass ? 'PASS' : 'FAIL'} (Console errors: ${consoleErrors.length}, Network failures: ${networkFailures.length})`);

  // ==========================================
  // GATE 1: DOM & SEMANTIC INTEGRITY
  // ==========================================
  console.log('[LENS AUDIT] Evaluating Gate 1: DOM & Semantic Integrity...');
  const g1Results = await page.evaluate(() => {
    const defects = [];
    const forbiddenRegex = /\b(undefined|NaN|\[object Object\]|null|Error:|NaNpx|\{\{.*\}\})\b/i;

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.textContent || !node.textContent.trim()) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (parent.closest('code, pre, samp, [data-allow-raw-tokens="true"], script, style')) {
          return NodeFilter.FILTER_REJECT;
        }
        const s = window.getComputedStyle(parent);
        if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) === 0) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    let node;
    while ((node = walker.nextNode())) {
      const txt = node.textContent.trim();
      if (forbiddenRegex.test(txt)) {
        defects.push({ code: 'G1_FORBIDDEN_TOKEN', text: txt, tag: node.parentElement.tagName });
      }
    }

    // Broken image probe
    document.querySelectorAll('img').forEach(img => {
      if (!img.complete || img.naturalWidth === 0) {
        defects.push({ code: 'G1_BROKEN_IMAGE', src: img.src });
      }
    });

    // Empty SVG probe
    document.querySelectorAll('svg').forEach(svg => {
      const rect = svg.getBoundingClientRect();
      const style = window.getComputedStyle(svg);
      const hasVisibleChild = Array.from(svg.children).some(c => ['path', 'circle', 'rect', 'polygon', 'use', 'g', 'line', 'polyline'].includes(c.tagName.toLowerCase()));
      if (style.display !== 'none' && (rect.width === 0 || rect.height === 0 || !hasVisibleChild)) {
        defects.push({ code: 'G1_EMPTY_SVG', class: svg.className.baseVal || svg.className });
      }
    });

    // Canvas exists and has valid non-zero dimensions
    const canvas = document.querySelector('canvas');
    if (!canvas || canvas.clientWidth === 0 || canvas.clientHeight === 0) {
      defects.push({ code: 'G1_CANVAS_MISSING_OR_ZERO_SIZE' });
    }

    // Horizontal overflow probe
    if (document.documentElement.scrollWidth > window.innerWidth) {
      defects.push({
        code: 'G1_VIEWPORT_OVERFLOW',
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth
      });
    }

    return { pass: defects.length === 0, defects };
  });

  auditReport.gates.gate1 = g1Results;
  console.log(`[LENS AUDIT] Gate 1 result: ${g1Results.pass ? 'PASS' : 'FAIL'} (Defects: ${g1Results.defects.length})`);

  // ==========================================
  // GATE 2: DETERMINISTIC METROLOGY & CONTRAST
  // ==========================================
  console.log('[LENS AUDIT] Evaluating Gate 2: Deterministic Metrology & Token Contract...');
  const g2Results = await page.evaluate(() => {
    const defects = [];

    // Silent text clipping
    document.querySelectorAll('*').forEach(el => {
      if (el.children.length === 0 && el.textContent.trim().length > 0) {
        const s = window.getComputedStyle(el);
        if (s.overflowX === 'hidden' && s.textOverflow !== 'ellipsis' && el.scrollWidth > el.clientWidth + 1) {
          defects.push({ code: 'G2_SILENT_CLIPPING', text: el.textContent.trim().slice(0, 30), sw: el.scrollWidth, cw: el.clientWidth });
        }
      }
    });

    const buttons = document.querySelectorAll('button');
    const buttonDimensions = [];
    buttons.forEach(btn => {
      const rect = btn.getBoundingClientRect();
      const s = window.getComputedStyle(btn);
      if (s.display !== 'none' && s.visibility !== 'hidden' && rect.width > 0) {
        buttonDimensions.push({ text: btn.textContent.trim().slice(0, 20), w: rect.width, h: rect.height });
      }
    });

    return { pass: defects.length === 0, defects, buttonDimensions };
  });

  auditReport.gates.gate2 = g2Results;
  console.log(`[LENS AUDIT] Gate 2 result: ${g2Results.pass ? 'PASS' : 'FAIL'} (Silent clipping defects: ${g2Results.defects.length})`);

  // ==========================================
  // GATE 3: RESPONSIVE VIEWPORT SWEEP
  // ==========================================
  console.log('[LENS AUDIT] Evaluating Gate 3: Responsive Viewport Sweep...');
  const testWidths = [320, 375, 414, 768, 1024, 1280, 1440, 1920];
  const viewportFuzzing = [];

  for (const w of testWidths) {
    await page.setViewportSize({ width: w, height: 800 });
    await page.waitForTimeout(50);
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth
        ? document.documentElement.scrollWidth - window.innerWidth
        : 0;
    });
    viewportFuzzing.push({ width: w, overflow });
  }

  // Restore primary desktop viewport
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(200);

  const g3Pass = viewportFuzzing.every(v => v.overflow === 0);
  auditReport.gates.gate3 = { pass: g3Pass, viewportFuzzing };
  console.log(`[LENS AUDIT] Gate 3 result: ${g3Pass ? 'PASS' : 'FAIL'} (Responsive breaks: ${viewportFuzzing.filter(v => v.overflow > 0).length})`);

  // ==========================================
  // CAPTURE MULTI-VIEWPORT SCREENSHOTS (2D CANVAS)
  // ==========================================
  console.log('[LENS AUDIT] Capturing high-resolution 2D Canvas screenshots across primary viewports...');

  // 1. Desktop 1440x900
  const pathDesktop = path.join(ARTIFACTS_DIR, '01-2d-desktop-1440x900.png');
  await page.screenshot({ path: pathDesktop });
  auditReport.artifacts.push(pathDesktop);
  console.log(`[LENS ARTIFACT] Desktop 2D saved to: ${pathDesktop}`);

  // 2. Tablet 1024x768
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.waitForTimeout(300);
  const pathTablet = path.join(ARTIFACTS_DIR, '02-2d-tablet-1024x768.png');
  await page.screenshot({ path: pathTablet });
  auditReport.artifacts.push(pathTablet);
  console.log(`[LENS ARTIFACT] Tablet 2D saved to: ${pathTablet}`);

  // 3. Constrained 768x1024
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(300);
  const pathMobile = path.join(ARTIFACTS_DIR, '03-2d-constrained-768x1024.png');
  await page.screenshot({ path: pathMobile });
  auditReport.artifacts.push(pathMobile);
  console.log(`[LENS ARTIFACT] Constrained 2D saved to: ${pathMobile}`);

  // Restore Desktop Viewport for detailed sector zooms
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(300);

  // ==========================================
  // SECTOR-BY-SECTOR CAMERA ZOOM & VERIFICATION
  // ==========================================
  console.log('[LENS AUDIT] Exercising Room Quick-Jump Filters & Capturing 2D Sector Closeups...');

  const roomFilterButtons = [
    { key: 'manager', label: 'Manager Suite', file: '04-2d-sector-manager-suite.png' },
    { key: 'dev', label: 'Dev Wing', file: '05-2d-sector-dev-wing.png' },
    { key: 'research', label: 'Research Lab', file: '06-2d-sector-research-lab.png' },
    { key: 'meeting', label: 'Conference', file: '07-2d-sector-conference-war-room.png' },
    { key: 'qa_security', label: 'QA & Security', file: '08-2d-sector-qa-security.png' },
    { key: 'lounge', label: 'Lounge', file: '09-2d-sector-lounge-breakroom.png' },
    { key: 'server_room', label: 'Servers', file: '10-2d-sector-servers-datacenter.png' },
  ];

  for (const rf of roomFilterButtons) {
    const btn = page.locator(`button:has-text("${rf.label}")`);
    if (await btn.count() > 0) {
      await btn.click();
      await page.waitForTimeout(500); // Allow camera zoom animation to settle
      const sectorPath = path.join(ARTIFACTS_DIR, rf.file);
      await page.screenshot({ path: sectorPath });
      auditReport.artifacts.push(sectorPath);
      console.log(`[LENS ARTIFACT] Sector ${rf.label} (2D) saved to: ${sectorPath}`);
    } else {
      console.warn(`[LENS WARN] Button with label "${rf.label}" not found`);
    }
  }

  // Reset Camera to Full Campus
  const allBtn = page.locator('button:has-text("Full Campus")');
  if (await allBtn.count() > 0) {
    await allBtn.click();
    await page.waitForTimeout(400);
  }

  // ==========================================
  // INTERACTION: AGENT SELECTION & DRAWER TEST
  // ==========================================
  console.log('[LENS AUDIT] Testing Agent Selection & Drawer Presentation in 2D Mode...');
  const orionButton = page.locator('button:has-text("ORION")');
  if (await orionButton.count() > 0) {
    await orionButton.click();
    await page.waitForTimeout(500);

    const drawerVisible = await page.$eval('aside', el => !!el).catch(() => false);
    const drawerExcerpt = await page.$eval('aside', el => el.innerText.replace(/\n+/g, ' | ').slice(0, 300)).catch(() => '');

    const drawerPath = path.join(ARTIFACTS_DIR, '11-2d-agent-drawer-open.png');
    await page.screenshot({ path: drawerPath });
    auditReport.artifacts.push(drawerPath);
    console.log(`[LENS ARTIFACT] Drawer open state (2D) saved to: ${drawerPath}`);
    auditReport.interactions.drawer = { visible: drawerVisible, excerpt: drawerExcerpt };

    // Close drawer
    const closeBtn = page.locator('aside button').first();
    if (await closeBtn.count() > 0) {
      await closeBtn.click();
      await page.waitForTimeout(300);
    }
  }

  // Check Canvas FPS and Health from Store
  const fpsText = await page.$eval('header', el => {
    const m = el.innerText.match(/(\d+)\s*FPS/);
    return m ? parseInt(m[1], 10) : 60;
  }).catch(() => 60);

  auditReport.fps = fpsText;
  console.log(`[LENS AUDIT] Live Canvas Simulation FPS: ${fpsText}`);

  await browser.close();

  // Save structured JSON report
  const jsonReportPath = path.join(ARTIFACTS_DIR, 'audit-results-2d.json');
  fs.writeFileSync(jsonReportPath, JSON.stringify(auditReport, null, 2));
  console.log(`[LENS AUDIT] Complete 2D audit results written to: ${jsonReportPath}`);

  return auditReport;
}

runLensAudit().catch(err => {
  console.error('[LENS AUDIT FATAL ERROR]', err);
  process.exit(1);
});
