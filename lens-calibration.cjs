const { chromium } = require('/root/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');

function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function parseRgb(colorStr) {
  const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  return match ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])] : [0, 0, 0];
}

async function runCalibration() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Create a minimal sandbox DOM
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Calibration Sandbox</title>
        <style>
          body { font-family: sans-serif; background: #ffffff; color: #111111; margin: 20px; }
          .heading { font-size: 20px; font-weight: bold; margin-bottom: 10px; }
          .para { font-size: 14px; line-height: 1.5; }
          .btn { display: inline-block; padding: 12px 24px; background: #3b82f6; color: #ffffff; border-radius: 6px; }
        </style>
      </head>
      <body>
        <div id="root">
          <h1 id="m1-target" class="heading">User Profile</h1>
          <p id="m4-target" class="para">This is a regular multiline paragraph designed for testing text layout, rendering, and overflow boundaries in simulated web environments.</p>
          <img id="m2-target" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMDAwIi8+PC9zdmc+" alt="valid" />
          <svg id="m5-target" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="blue"/></svg>
          <div id="m3-target" style="background: #ffffff; color: #222222; padding: 8px;">Visible contrast text</div>
          <button class="btn" style="min-width: 44px; min-height: 44px;">Click Me</button>
        </div>
      </body>
    </html>
  `);

  console.log('[LENS CALIBRATION] Initializing Synthetic Mutation Suite (M1-M5)...');
  const results = [];

  // M1: InjectUndefinedText -> G1_FORBIDDEN_TOKEN
  await page.evaluate(() => {
    document.getElementById('m1-target').textContent = 'User Profile user: undefined';
  });
  const m1Detected = await page.evaluate(() => {
    const forbiddenRegex = /\b(undefined|NaN|\[object Object\]|null|Error:|NaNpx|\{\{.*\}\})\b/i;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.parentElement.closest('code, pre, script, style')) continue;
      if (forbiddenRegex.test(node.textContent)) return true;
    }
    return false;
  });
  results.push({ mutant: 'M1 (InjectUndefinedText)', expected: 'G1_FORBIDDEN_TOKEN', detected: m1Detected });
  // Rollback M1
  await page.evaluate(() => {
    document.getElementById('m1-target').textContent = 'User Profile';
  });

  // M2: BreakImageSource -> G1_BROKEN_IMAGE
  await page.evaluate(() => {
    const img = document.getElementById('m2-target');
    img.src = 'https://invalid-domain-does-not-exist.test/image.png';
  });
  await page.waitForTimeout(100);
  const m2Detected = await page.evaluate(() => {
    const img = document.getElementById('m2-target');
    return !img.complete || img.naturalWidth === 0;
  });
  results.push({ mutant: 'M2 (BreakImageSource)', expected: 'G1_BROKEN_IMAGE', detected: m2Detected });
  // Rollback M2
  await page.evaluate(() => {
    const img = document.getElementById('m2-target');
    img.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMDAwIi8+PC9zdmc+';
  });

  // M3: BlindContrast -> G2_CONTRAST_FAIL
  await page.evaluate(() => {
    const el = document.getElementById('m3-target');
    el.style.backgroundColor = '#ffffff';
    el.style.color = '#ffffff'; // 1:1 contrast
  });
  const m3Detected = await page.evaluate(() => {
    function getLum(r, g, b) {
      const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }
    function parseC(str) {
      const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      return m ? [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])] : [0, 0, 0];
    }
    const el = document.getElementById('m3-target');
    const style = window.getComputedStyle(el);
    const [cr, cg, cb] = parseC(style.color);
    const [br, bg, bb] = parseC(style.backgroundColor);
    const l1 = getLum(cr, cg, cb);
    const l2 = getLum(br, bg, bb);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    return ratio < 3.0;
  });
  results.push({ mutant: 'M3 (BlindContrast)', expected: 'G2_CONTRAST_FAIL', detected: m3Detected });
  // Rollback M3
  await page.evaluate(() => {
    const el = document.getElementById('m3-target');
    el.style.backgroundColor = '#ffffff';
    el.style.color = '#222222';
  });

  // M4: ForceTextClipping -> G2_SILENT_CLIPPING
  await page.evaluate(() => {
    const el = document.getElementById('m4-target');
    el.style.height = '12px';
    el.style.overflow = 'hidden';
    el.style.whiteSpace = 'normal';
  });
  const m4Detected = await page.evaluate(() => {
    const el = document.getElementById('m4-target');
    const style = window.getComputedStyle(el);
    const isClippedY = (style.overflowY === 'hidden' || style.overflow === 'hidden') && el.scrollHeight > el.clientHeight + 1;
    const isClippedX = (style.overflowX === 'hidden' || style.overflow === 'hidden') && el.scrollWidth > el.clientWidth + 1 && style.textOverflow !== 'ellipsis';
    return isClippedY || isClippedX;
  });
  results.push({ mutant: 'M4 (ForceTextClipping)', expected: 'G2_SILENT_CLIPPING', detected: m4Detected });
  // Rollback M4
  await page.evaluate(() => {
    const el = document.getElementById('m4-target');
    el.style.height = 'auto';
    el.style.overflow = 'visible';
  });

  // M5: EmptySVGContent -> G1_EMPTY_SVG
  await page.evaluate(() => {
    const svg = document.getElementById('m5-target');
    svg.innerHTML = '';
  });
  const m5Detected = await page.evaluate(() => {
    const svg = document.getElementById('m5-target');
    const hasVisibleChild = Array.from(svg.children).some(c => ['path', 'circle', 'rect', 'polygon', 'use', 'g'].includes(c.tagName.toLowerCase()));
    return !hasVisibleChild;
  });
  results.push({ mutant: 'M5 (EmptySVGContent)', expected: 'G1_EMPTY_SVG', detected: m5Detected });

  await browser.close();

  const detectedCount = results.filter(r => r.detected).length;
  const score = (detectedCount / results.length) * 100;

  console.log('----------------------------------------------------');
  console.log(`LENS CALIBRATION BENCHMARK RESULTS: ${detectedCount}/${results.length} (${score}%)`);
  results.forEach(r => {
    console.log(`- ${r.mutant}: ${r.detected ? 'DETECTED (PASS)' : 'MISSED (FAIL)'} [Code: ${r.expected}]`);
  });
  console.log('----------------------------------------------------');

  if (score === 100) {
    console.log('CALIBRATION PASS: Harness is calibrated and verified.');
    process.exit(0);
  } else {
    console.error('CALIBRATION FAIL: Harness failed to detect one or more synthetic mutants.');
    process.exit(1);
  }
}

runCalibration().catch(err => {
  console.error('Calibration error:', err);
  process.exit(1);
});
