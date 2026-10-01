const { chromium } = require('/root/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:3333', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  const fetchResult = await page.evaluate(async () => {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      return { ok: res.ok, status: res.status, agentsCount: Object.keys(data.agents).length };
    } catch (e) {
      return { error: e.message };
    }
  });

  console.log('Fetch result in browser:', fetchResult);
  await browser.close();
})();
