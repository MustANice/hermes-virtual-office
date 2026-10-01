const { chromium } = require('/root/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');
const fs = require('fs');

async function testAllModes() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--enable-webgl']
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    console.log('Testing http://127.0.0.1:3333 ...');
    await page.goto('http://127.0.0.1:3333', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const client = await page.context().newCDPSession(page);

    // 1. Capture 3D Live
    const { data: d3d } = await client.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('/root/projects/hermes-virtual-office/screenshot-mode-3d.png', Buffer.from(d3d, 'base64'));
    console.log('SUCCESS: screenshot-mode-3d.png');

    // 2. Click 2K Master Render button
    const masterBtn = page.locator('button:has-text("2K Master")').first();
    if (await masterBtn.count() > 0) {
      await masterBtn.click();
      await page.waitForTimeout(2000);
      const { data: dMaster } = await client.send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync('/root/projects/hermes-virtual-office/screenshot-mode-master.png', Buffer.from(dMaster, 'base64'));
      console.log('SUCCESS: screenshot-mode-master.png');
    }

    // 3. Click 2D button
    const btn2d = page.locator('button:has-text("2D")').first();
    if (await btn2d.count() > 0) {
      await btn2d.click();
      await page.waitForTimeout(1500);
      const { data: d2d } = await client.send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync('/root/projects/hermes-virtual-office/screenshot-mode-2d.png', Buffer.from(d2d, 'base64'));
      console.log('SUCCESS: screenshot-mode-2d.png');
    }
  } finally {
    await browser.close();
  }
}

testAllModes().catch(console.error);
