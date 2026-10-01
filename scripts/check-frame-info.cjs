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

  const info = await page.evaluate(() => {
    const r = window.__THREE_RENDERER__;
    if (!r) return null;
    return {
      calls: r.info.render.calls,
      triangles: r.info.render.triangles,
      points: r.info.render.points,
      lines: r.info.render.lines,
      geometries: r.info.memory.geometries,
      textures: r.info.memory.textures
    };
  });

  console.log('Single Frame Render Info:', JSON.stringify(info, null, 2));
  await browser.close();
})();
