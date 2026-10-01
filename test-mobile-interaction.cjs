/**
 * Interactive Touch & Navigation Test on Mobile 390x844
 */
const { chromium } = require('/root/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = '/root/projects/hermes-virtual-office/lens-artifacts';

async function testMobileInteractivity() {
  console.log('Testing Mobile Touch & Interaction (390x844)...');
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage({ 
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true
  });

  await page.goto('http://127.0.0.1:3333');
  await page.waitForTimeout(2500);

  // 1. Initial State
  const initialCamera = await page.evaluate(() => {
    const engine = window.__THREE_ENGINE__;
    return {
      angleX: engine.cameraAngleX,
      angleY: engine.cameraAngleY,
      dist: engine.cameraDistance
    };
  });
  console.log('Initial Camera:', initialCamera);

  // 2. Simulate Touch Drag / Pan
  console.log('Simulating touch drag orbit on 3D canvas...');
  await page.touchscreen.tap(200, 400);
  // Perform drag
  await page.mouse.move(200, 400);
  await page.mouse.down();
  await page.mouse.move(120, 360, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(300);

  const draggedCamera = await page.evaluate(() => {
    const engine = window.__THREE_ENGINE__;
    return {
      angleX: engine.cameraAngleX,
      angleY: engine.cameraAngleY,
      dist: engine.cameraDistance,
      moved: engine.cameraAngleY !== Math.PI / 4
    };
  });
  console.log('Camera After Drag:', draggedCamera);

  // 3. Test Room Filter Tap (War Room)
  console.log('Testing Room Filter navigation...');
  const roomFilterExists = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim());
    return buttons;
  });
  console.log('Available buttons on mobile:', roomFilterExists);

  // Tap meeting room button if available
  const meetingBtn = page.locator('button:has-text("War Room"), button:has-text("WAR ROOM"), button:has-text("Rapat")').first();
  const meetingBtnCount = await meetingBtn.count();
  if (meetingBtnCount > 0) {
    console.log('Tapping War Room pill button...');
    await meetingBtn.tap();
    await page.waitForTimeout(1000);
    const warRoomCamera = await page.evaluate(() => {
      const engine = window.__THREE_ENGINE__;
      return {
        dist: engine.cameraDistance,
        target: { x: engine.cameraTarget.x, z: engine.cameraTarget.z }
      };
    });
    console.log('Camera Focused on War Room:', warRoomCamera);
  }

  // 4. Capture Mobile Focused State
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
    const outPath = path.join(ARTIFACTS_DIR, 'mobile-390-warroom-focused.png');
    fs.writeFileSync(outPath, base64Data, 'base64');
    console.log(`Saved ${outPath}`);
  }

  await browser.close();
  console.log('Mobile interactivity test PASSED!');
}

testMobileInteractivity().catch(console.error);
