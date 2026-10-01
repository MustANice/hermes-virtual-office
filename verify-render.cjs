const { chromium } = require('/root/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');

async function test() {
  const browser = await chromium.launch({ 
    headless: true,
    executablePath: '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  const consoleLogs = [];
  page.on('console', msg => consoleLogs.push(msg.text()));
  page.on('pageerror', err => consoleLogs.push(`ERROR: ${err.message}`));

  await page.goto('http://127.0.0.1:3333');
  await page.waitForTimeout(3000);

  const title = await page.title();
  const canvasExists = await page.$eval('canvas', el => !!el).catch(() => false);
  const headerText = await page.$eval('header', el => el.innerText).catch(() => '');
  
  const screenshotPath = '/root/projects/hermes-virtual-office/screenshot-office.png';
  await page.screenshot({ path: screenshotPath });

  console.log('PAGE TITLE:', title);
  console.log('CANVAS EXISTS:', canvasExists);
  console.log('HEADER TEXT EXCERPT:', headerText.replace(/\n+/g, ' | ').slice(0, 200));
  console.log('SCREENSHOT SAVED TO:', screenshotPath);
  console.log('CONSOLE LOGS:', consoleLogs);

  await browser.close();
}

test().catch(console.error);
