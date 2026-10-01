const { chromium } = require('/root/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--enable-webgl']
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.route('**/*', route => {
      if (route.request().url().includes('fonts.g')) route.abort();
      else route.continue();
    });

    console.log('Navigating to http://127.0.0.1:3333...');
    await page.goto('http://127.0.0.1:3333', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const buf = await page.screenshot({ timeout: 15000 });
    fs.writeFileSync('/root/projects/hermes-virtual-office/screenshot-latest-redesign-campus.png', buf);
    console.log('Campus screenshot saved: screenshot-latest-redesign-campus.png');

    // Click War Room tab to inspect central conference area
    const warTab = page.locator('button:has-text("War Room")').first();
    if (await warTab.count() > 0) {
      await warTab.click();
      await page.waitForTimeout(2000);
      const warBuf = await page.screenshot({ timeout: 15000 });
      fs.writeFileSync('/root/projects/hermes-virtual-office/screenshot-latest-warroom.png', warBuf);
      console.log('War Room screenshot saved: screenshot-latest-warroom.png');
    }
  } finally {
    await browser.close();
  }
})().catch(console.error);
