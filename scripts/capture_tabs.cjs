const { chromium } = require('/root/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');
const fs = require('fs');

async function captureTabs() {
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

    // Full Campus
    const { data: d1 } = await client.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('/root/projects/hermes-virtual-office/screenshot-latest-redesign-campus.png', Buffer.from(d1, 'base64'));
    console.log('SUCCESS: campus written');

    // War Room
    const warBtn = page.locator('button:has-text("War Room")').first();
    if (await warBtn.count() > 0) {
      await warBtn.click();
      await page.waitForTimeout(1500);
      const { data: d2 } = await client.send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync('/root/projects/hermes-virtual-office/screenshot-latest-redesign-warroom.png', Buffer.from(d2, 'base64'));
      console.log('SUCCESS: warroom written');
    }
  } finally {
    await browser.close();
  }
}

captureTabs().catch(console.error);
