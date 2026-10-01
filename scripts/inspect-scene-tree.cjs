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

  const breakdown = await page.evaluate(() => {
    const engine = window.__THREE_ENGINE__;
    if (!engine) return null;
    const scene = engine.scene;
    const stats = {
      totalObjects: 0,
      meshes: 0,
      sprites: 0,
      lights: 0,
      groups: 0,
      byNamePrefix: {}
    };

    scene.traverse(obj => {
      stats.totalObjects++;
      if (obj.isMesh) stats.meshes++;
      else if (obj.isSprite) stats.sprites++;
      else if (obj.isLight) stats.lights++;
      else if (obj.isGroup) stats.groups++;

      const prefix = obj.name ? obj.name.split('_')[0] : (obj.type || 'unknown');
      stats.byNamePrefix[prefix] = (stats.byNamePrefix[prefix] || 0) + 1;
    });

    return {
      stats,
      rendererCalls: window.__THREE_RENDERER__.info.render.calls
    };
  });

  console.log('Breakdown:', JSON.stringify(breakdown, null, 2));
  await browser.close();
})();
