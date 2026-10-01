const { chromium } = require('/root/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');
const path = require('path');

const ARTIFACTS_DIR = '/root/projects/hermes-virtual-office/lens-artifacts';

async function inspectWaterCooler() {
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
  await page.waitForTimeout(1000);
  await page.click('button:has-text("2D Office")');
  await page.waitForTimeout(500);

  // Focus Lounge
  await page.click('button:has-text("Lounge")');
  await page.waitForTimeout(500);

  // Zoom in
  for (let i = 0; i < 5; i++) {
    await page.mouse.wheel(0, -300);
    await page.waitForTimeout(50);
  }
  await page.waitForTimeout(400);

  // Take a tight crop of the west wall of Lounge where water cooler and espresso bar are
  // Let's find where the lounge west wall is on screen
  // Lounge is x: 370..640, y: 440..605
  // When focused on lounge, camera centers around (540, 520)
  // Midpoint of screen is (720, 450)
  // So (382, 448) is to the top-left of center!
  // Let's take a 400x400 crop around (500, 300) on screen
  const cropPath = path.join(ARTIFACTS_DIR, 'tight-watercooler-espresso.png');
  await page.screenshot({
    path: cropPath,
    clip: { x: 350, y: 220, width: 450, height: 450 }
  });

  console.log('Saved tight crop to:', cropPath);
  await browser.close();
}

inspectWaterCooler().catch(console.error);
