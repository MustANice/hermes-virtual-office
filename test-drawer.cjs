const { chromium } = require('/root/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');

async function testDrawer() {
  const browser = await chromium.launch({ 
    headless: true,
    executablePath: '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('http://127.0.0.1:3333');
  await page.waitForSelector('text=FRAME', { timeout: 10000 });

  // Click on FRAME in bottom roster
  const frameButton = page.locator('button:has-text("FRAME")');
  await frameButton.click();
  await page.waitForTimeout(1000);

  const drawerVisible = await page.$eval('aside', el => !!el).catch(() => false);
  const drawerTitle = await page.$eval('aside h2', el => el.innerText).catch(() => '');
  const taskText = await page.$eval('aside', el => el.innerText).catch(() => '');

  const screenshotPath = '/root/projects/hermes-virtual-office/screenshot-drawer.png';
  await page.screenshot({ path: screenshotPath });

  console.log('DRAWER VISIBLE:', drawerVisible);
  console.log('DRAWER TITLE:', drawerTitle);
  console.log('SCREENSHOT SAVED TO:', screenshotPath);
  console.log('DRAWER EXCERPT:', taskText.replace(/\n+/g, ' | ').slice(0, 300));

  await browser.close();
}

testDrawer().catch(console.error);
