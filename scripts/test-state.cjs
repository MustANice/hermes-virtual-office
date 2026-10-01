const { chromium } = require('/root/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:3333', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const state = await page.evaluate(() => {
    return {
      text: document.querySelector('header')?.innerText,
      hasRoster: !!document.querySelector('.bottom-3 button'),
      rosterText: document.querySelector('.bottom-3')?.innerText
    };
  });

  console.log('State:', state);
  await browser.close();
})();
