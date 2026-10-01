const { chromium } = require('/root/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('console', msg => console.log(`[Browser ${msg.type()}]:`, msg.text()));
  page.on('pageerror', err => console.error('[Browser Error]:', err));
  await page.goto('http://127.0.0.1:3333', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Click on FRAME in bottom roster
  const clicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const frameBtn = btns.find(b => b.innerText && b.innerText.includes('FRAME'));
    if (frameBtn) {
      frameBtn.click();
      return true;
    }
    return false;
  });

  console.log('FRAME clicked:', clicked);
  await page.waitForTimeout(1000);

  const drawerState = await page.evaluate(() => {
    const aside = document.querySelector('aside');
    return {
      asideExists: !!aside,
      title: aside ? aside.querySelector('h2')?.innerText : null,
      textPreview: aside ? aside.innerText.slice(0, 150) : null
    };
  });

  console.log('Drawer state:', drawerState);
  await page.screenshot({ path: '/root/projects/hermes-virtual-office/screenshot-drawer-verified.png' });
  console.log('Screenshot saved to screenshot-drawer-verified.png');
  await browser.close();
})();
