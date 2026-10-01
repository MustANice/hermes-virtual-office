const { chromium } = require('/root/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');
const fs = require('fs');

async function captureFast() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--enable-webgl']
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    console.log('Navigating to http://127.0.0.1:3333 ...');
    await page.goto('http://127.0.0.1:3333', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const client = await page.context().newCDPSession(page);

    // 1. Full campus screenshot
    const { data: data1 } = await client.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('/root/projects/hermes-virtual-office/screenshot-latest-redesign-campus.png', Buffer.from(data1, 'base64'));
    console.log('SUCCESS: screenshot-latest-redesign-campus.png written via CDP!');

    // 2. Click Executive Suite tab
    const execBtn = page.locator('button:has-text("Executive Suite")').first();
    if (await execBtn.count() > 0) {
      await execBtn.click();
      await page.waitForTimeout(2000);
      const { data: dataExec } = await client.send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync('/root/projects/hermes-virtual-office/screenshot-latest-redesign-executive.png', Buffer.from(dataExec, 'base64'));
      console.log('SUCCESS: screenshot-latest-redesign-executive.png written via CDP!');
    }
  } finally {
    await browser.close();
  }
}

captureFast().catch(console.error);
