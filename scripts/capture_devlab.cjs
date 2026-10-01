const { chromium, devices } = require('/root/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');
const fs = require('fs');

async function captureDevLabCloseUp() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--enable-webgl']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:3333', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  // Click Development Lab tab to focus camera directly on FORGE's workstation
  const devTab = page.locator('button:has-text("Development Lab")');
  await devTab.click();
  await page.waitForTimeout(2000);

  const buf = await page.screenshot();
  fs.writeFileSync('/root/projects/hermes-virtual-office/screenshot-devlab-sitting-perfect.png', buf);
  console.log("DEV LAB CLOSE-UP SHOT SAVED!");

  await browser.close();
}

captureDevLabCloseUp().catch(console.error);
