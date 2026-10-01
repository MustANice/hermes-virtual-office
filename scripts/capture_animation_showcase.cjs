const { chromium } = require('/root/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');
const fs = require('fs');

async function captureAnimationShowcase() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--enable-webgl']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:3333', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // Capture full campus
  const bufFull = await page.screenshot();
  fs.writeFileSync('/root/projects/hermes-virtual-office/screenshot-animation-campus.png', bufFull);
  console.log("CAMPUS ANIMATION SHOT SAVED!");

  // Click War Room tab to see the spinning dual gimbal rings and glowing core
  const warTab = page.locator('button:has-text("War Room")');
  await warTab.click();
  await page.waitForTimeout(2500);

  const bufWar = await page.screenshot();
  fs.writeFileSync('/root/projects/hermes-virtual-office/screenshot-animation-warroom.png', bufWar);
  console.log("WAR ROOM ANIMATION SHOT SAVED!");

  await browser.close();
}

captureAnimationShowcase().catch(console.error);
