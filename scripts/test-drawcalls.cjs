const { chromium } = require('/root/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:3333', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const check = await page.evaluate(() => {
    const r = window.__THREE_RENDERER__;
    if (!r) return null;
    r.info.reset();
    return new Promise(resolve => {
      requestAnimationFrame(() => {
        resolve({
          autoReset: r.info.autoReset,
          callsNextFrame: r.info.render.calls
        });
      });
    });
  });

  console.log('Result:', JSON.stringify(check));
  await browser.close();
})();
