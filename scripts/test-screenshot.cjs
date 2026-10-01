const { chromium } = require('/root/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');
const fs = require('fs');

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--enable-webgl']
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('http://127.0.0.1:3333');
  await page.waitForTimeout(3000);

  // Method 1: canvas.toDataURL directly from WebGL canvas
  try {
    const dataUrl = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      return canvas ? canvas.toDataURL('image/png') : null;
    });
    if (dataUrl && dataUrl.startsWith('data:image/png;base64,')) {
      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
      fs.writeFileSync('/root/projects/hermes-virtual-office/screenshot-canvas-direct.png', Buffer.from(base64Data, 'base64'));
      console.log('Successfully captured canvas directly to screenshot-canvas-direct.png!');
    }
  } catch (err) {
    console.error('canvas.toDataURL failed:', err.message);
  }

  // Method 2: page.screenshot
  try {
    await page.screenshot({ path: '/root/projects/hermes-virtual-office/screenshot-full-page.png', timeout: 8000 });
    console.log('page.screenshot succeeded!');
  } catch (err) {
    console.error('page.screenshot failed:', err.message);
  }

  await browser.close();
}

main().catch(console.error);
