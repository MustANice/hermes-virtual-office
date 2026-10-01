const { chromium, devices } = require('/root/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');
const fs = require('fs');

async function testMobileGestures() {
  const iPhone = devices['iPhone 14 Pro'];
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--enable-webgl']
  });

  const context = await browser.newContext({
    ...iPhone,
    hasTouch: true,
  });

  const page = await context.newPage();
  console.log("Navigating to mobile view...");
  await page.goto('http://127.0.0.1:3333', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  // Take initial mobile screenshot
  const buf1 = await page.screenshot();
  fs.writeFileSync('/root/projects/hermes-virtual-office/screenshot-mobile-initial.png', buf1);
  console.log("Initial mobile screenshot saved!");

  // Perform touch drag (swipe horizontally by 140px across canvas)
  console.log("Simulating single-finger touch drag / swipe gesture...");
  await page.touchscreen.tap(200, 450); // initial tap
  
  // Custom touch sequence via CDP or page dispatch
  await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) throw new Error("Canvas not found");

    // Simulate touchstart
    const touch1 = new Touch({ identifier: 1, target: canvas, clientX: 200, clientY: 450 });
    canvas.dispatchEvent(new TouchEvent('touchstart', { touches: [touch1], changedTouches: [touch1], cancelable: true, bubbles: true }));

    // Simulate touchmove to rotate view
    const touch2 = new Touch({ identifier: 1, target: canvas, clientX: 90, clientY: 410 });
    canvas.dispatchEvent(new TouchEvent('touchmove', { touches: [touch2], changedTouches: [touch2], cancelable: true, bubbles: true }));

    // Simulate touchend
    canvas.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [touch2], cancelable: true, bubbles: true }));
  });

  await page.waitForTimeout(1000);

  // Capture rotated mobile view
  const buf2 = await page.screenshot();
  fs.writeFileSync('/root/projects/hermes-virtual-office/screenshot-mobile-swiped.png', buf2);
  console.log("Swiped mobile screenshot saved!");

  // Test tap on agent avatar
  console.log("Testing tap on avatar...");
  await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const touch = new Touch({ identifier: 2, target: canvas, clientX: 180, clientY: 400 });
    canvas.dispatchEvent(new TouchEvent('touchstart', { touches: [touch], changedTouches: [touch], cancelable: true, bubbles: true }));
    canvas.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [touch], cancelable: true, bubbles: true }));
  });

  await page.waitForTimeout(1500);
  const buf3 = await page.screenshot();
  fs.writeFileSync('/root/projects/hermes-virtual-office/screenshot-mobile-tapped.png', buf3);
  console.log("Tapped mobile screenshot saved!");

  await browser.close();
  console.log("All mobile tests completed successfully!");
}

testMobileGestures().catch(console.error);
