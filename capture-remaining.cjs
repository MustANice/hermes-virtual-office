/**
 * Capture Lounge, Executive, and Mobile Viewport
 */
const { chromium } = require('/root/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = '/root/projects/hermes-virtual-office/lens-artifacts';

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:3333');
  await page.waitForTimeout(3000);

  const captureCanvas = async (filename) => {
    const dataUrl = await page.evaluate(() => {
      return new Promise((resolve) => {
        requestAnimationFrame(() => {
          const canvas = document.querySelector('canvas');
          resolve(canvas ? canvas.toDataURL('image/png') : null);
        });
      });
    });

    if (dataUrl) {
      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
      const outPath = path.join(ARTIFACTS_DIR, filename);
      fs.writeFileSync(outPath, base64Data, 'base64');
      console.log(`Saved ${outPath} (${(base64Data.length / 1024).toFixed(1)} KB)`);
    }
  };

  // 1. Lounge
  console.log('Focusing Lounge...');
  await page.evaluate(() => {
    const engine = window.__THREE_ENGINE__;
    if (engine) engine.focusRoom('lounge');
  });
  await page.waitForTimeout(1000);
  await captureCanvas('sector-lounge-props.png');

  // 2. Executive Suite
  console.log('Focusing Executive Suite...');
  await page.evaluate(() => {
    const engine = window.__THREE_ENGINE__;
    if (engine) engine.focusRoom('manager');
  });
  await page.waitForTimeout(1000);
  await captureCanvas('sector-executive-suite.png');

  // 3. Mobile Viewport 390x844
  console.log('Resizing to Mobile Viewport (390x844)...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    const engine = window.__THREE_ENGINE__;
    if (engine) engine.focusRoom('all');
  });
  await page.waitForTimeout(1000);
  await captureCanvas('mobile-390-canvas.png');

  await browser.close();
  console.log('Done captures!');
}

main().catch(console.error);
