const { chromium } = require('/root/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  page.on('response', resp => {
    console.log(`[Response] ${resp.status()} ${resp.url()}`);
  });
  await page.goto('http://127.0.0.1:3333', { waitUntil: 'networkidle' });
  await browser.close();
})();
