const { chromium } = require('/root/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');
const fs = require('fs');

async function captureCloseups() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--enable-webgl']
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto('http://127.0.0.1:3333', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const client = await page.context().newCDPSession(page);

    // 1. Click Executive Suite tab
    const execBtn = page.locator('button:has-text("Executive Suite")').first();
    if (await execBtn.count() > 0) {
      await execBtn.click();
      await page.waitForTimeout(1500);
      const { data: dExec } = await client.send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync('/root/projects/hermes-virtual-office/screenshot-3d-executive-focus.png', Buffer.from(dExec, 'base64'));
      console.log('SUCCESS: screenshot-3d-executive-focus.png');
    }

    // 2. Click Development Lab tab
    const devBtn = page.locator('button:has-text("Development Lab")').first();
    if (await devBtn.count() > 0) {
      await devBtn.click();
      await page.waitForTimeout(1500);
      const { data: dDev } = await client.send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync('/root/projects/hermes-virtual-office/screenshot-3d-devlab-focus.png', Buffer.from(dDev, 'base64'));
      console.log('SUCCESS: screenshot-3d-devlab-focus.png');
    }
  } finally {
    await browser.close();
  }
}

captureCloseups().catch(console.error);
