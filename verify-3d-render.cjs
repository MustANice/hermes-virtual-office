const { chromium } = require('/root/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');
const fs = require('fs');
const path = require('path');

async function verify() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1
  });

  const consoleLogs = [];
  const errors = [];
  page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => errors.push(err.toString()));

  console.log('Navigating to http://127.0.0.1:3333...');
  await page.goto('http://127.0.0.1:3333', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  console.log('Page loaded. Checking for errors...');
  if (errors.length > 0) {
    console.error('Page errors found:', errors);
  } else {
    console.log('Zero page errors!');
  }

  // Check WebGL canvas
  const canvasExists = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    return !!c && c.width > 0 && c.height > 0;
  });
  console.log('Canvas exists and sized:', canvasExists);

  // Take screenshot
  const screenshotPath = path.join(__dirname, 'lens-artifacts', 'screenshot-3d-warm-cyber-atelier.png');
  await page.screenshot({ path: screenshotPath });
  console.log('Saved screenshot to:', screenshotPath);

  // Also focus War Room or orbit slightly
  await browser.close();
  console.log('Verification script completed successfully.');
}

verify().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
