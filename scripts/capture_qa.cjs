const { chromium } = require('/root/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');
const fs = require('fs');

async function captureQACloseUp() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--enable-webgl']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:3333', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  // Click QA & Hardening tab to focus camera directly on QA room and its Telemetry board
  const qaTab = page.locator('button:has-text("QA & Hardening")');
  await qaTab.click();
  await page.waitForTimeout(2500);

  const buf = await page.screenshot();
  fs.writeFileSync('/root/projects/hermes-virtual-office/screenshot-qa-fixed.png', buf);
  console.log("QA CLOSE-UP SHOT SAVED!");

  await browser.close();
}

captureQACloseUp().catch(console.error);
