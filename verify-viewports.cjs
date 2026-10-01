const { chromium } = require('/root/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');

async function testViewports() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const viewports = [
    { name: 'desktop', width: 1440, height: 900, file: '/root/projects/hermes-virtual-office/screenshot-desktop-1440.png' },
    { name: 'tablet', width: 1024, height: 768, file: '/root/projects/hermes-virtual-office/screenshot-tablet-1024.png' },
    { name: 'constrained', width: 768, height: 1024, file: '/root/projects/hermes-virtual-office/screenshot-mobile-768.png' },
  ];

  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    const consoleLogs = [];
    page.on('console', msg => consoleLogs.push(msg.text()));
    page.on('pageerror', err => consoleLogs.push(`ERROR: ${err.message}`));

    await page.goto('http://127.0.0.1:3333');
    await page.waitForTimeout(2500);

    const canvasExists = await page.$eval('canvas', el => !!el).catch(() => false);
    await page.screenshot({ path: vp.file });
    console.log(`VIEWPORT ${vp.name} (${vp.width}x${vp.height}): Canvas=${canvasExists}, Errors=${consoleLogs.length}, Screenshot=${vp.file}`);
    await page.close();
  }

  await browser.close();
}

testViewports().catch(console.error);
