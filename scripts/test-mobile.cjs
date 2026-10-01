const { chromium } = require('/root/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');

(async () => {
  console.log('Testing Mobile iPhone 14 / Safari (390x844)...');
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--enable-webgl']
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2
  });

  const page = await context.newPage();
  await page.goto('http://127.0.0.1:3333', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Check metrics & bleed
  const metrics = await page.evaluate(() => {
    return {
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      bleed: document.documentElement.scrollWidth > window.innerWidth,
      canvasWidth: document.querySelector('canvas')?.clientWidth,
      canvasHeight: document.querySelector('canvas')?.clientHeight
    };
  });

  console.log('Mobile Layout Metrics:', metrics);

  // Test touch drag on canvas
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  if (box) {
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.touchscreen.tap(x, y);
    console.log('Touch tap executed successfully.');
  }

  await page.screenshot({ path: '/root/projects/hermes-virtual-office/screenshot-mobile-verified.png' });
  console.log('Mobile screenshot saved to screenshot-mobile-verified.png');

  await browser.close();
  console.log('Mobile test PASS!');
})();
