const { chromium } = require('/root/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('console', msg => console.log('LOG [' + msg.type() + ']:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message, err.stack));

  await page.goto('http://127.0.0.1:3333');
  await page.waitForTimeout(3000);

  const title = await page.title();
  console.log('PAGE TITLE:', title);

  const renderStats = await page.evaluate(() => {
    return {
      canvas: !!document.querySelector('canvas'),
      header: document.querySelector('header')?.innerText,
      errors: window.__errors || []
    };
  });
  console.log('RENDER STATS:', renderStats);

  await browser.close();
}

main().catch(err => {
  console.error('SCRIPT ERROR:', err);
  process.exit(1);
});
