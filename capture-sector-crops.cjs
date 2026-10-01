const { chromium } = require('/root/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');
const path = require('path');

const ARTIFACTS_DIR = '/root/projects/hermes-virtual-office/lens-artifacts';

async function captureSectorCrops() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });

  await page.goto('http://127.0.0.1:3333');
  await page.waitForTimeout(1500);

  // Switch to 2D
  await page.click('button:has-text("2D Office")');
  await page.waitForTimeout(600);

  const sectors = [
    { label: 'Manager Suite', file: 'crop-01-manager-suite.png' },
    { label: 'Dev Wing', file: 'crop-02-dev-wing.png' },
    { label: 'Research Lab', file: 'crop-03-research-lab.png' },
    { label: 'Conference', file: 'crop-04-conference.png' },
    { label: 'QA & Security', file: 'crop-05-qa-security.png' },
    { label: 'Lounge', file: 'crop-06-lounge.png' },
    { label: 'Servers', file: 'crop-07-servers.png' },
  ];

  for (const s of sectors) {
    await page.click(`button:has-text("${s.label}")`);
    await page.waitForTimeout(600);

    // Zoom in with wheel 5 times to max zoom 2.2
    for (let i = 0; i < 5; i++) {
      await page.mouse.wheel(0, -300);
      await page.waitForTimeout(50);
    }
    await page.waitForTimeout(400);

    // We take a center-focused crop of the canvas: 800x600 in the center of the 1440x900 viewport
    // (excluding header and footer dock so only the focused room is shown)
    const cropPath = path.join(ARTIFACTS_DIR, s.file);
    await page.screenshot({
      path: cropPath,
      clip: { x: 200, y: 120, width: 1040, height: 680 }
    });
    console.log(`[CROP SAVED] ${s.label} -> ${cropPath}`);
  }

  await browser.close();
}

captureSectorCrops().catch(console.error);
