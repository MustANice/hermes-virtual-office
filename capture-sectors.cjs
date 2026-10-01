/**
 * Sector Close-Up Captures for LENS Art Direction Verification
 */
const { chromium } = require('/root/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = '/root/projects/hermes-virtual-office/lens-artifacts';

async function captureSector(room, filename, extraSetup) {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto('http://127.0.0.1:3333');
    await page.waitForTimeout(2000);

    if (extraSetup) {
      await page.evaluate(extraSetup);
    }

    if (room) {
      await page.evaluate((r) => {
        const engine = window.__THREE_ENGINE__;
        if (engine) engine.focusRoom(r);
      }, room);
      await page.waitForTimeout(1500);
    }

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
      console.log(`Saved ${outPath}`);
    }
  } finally {
    await browser.close();
  }
}

async function run() {
  // 1. War Room Close Up
  await captureSector('meeting', 'sector-warroom-hologram.png');

  // 2. Dev Lab Close Up (Frame Capsule Pill)
  await captureSector('dev', 'sector-devlab-capsule.png', () => {
    const engine = window.__THREE_ENGINE__;
    if (engine) {
      const frame = engine.avatars.get('frame');
      if (frame) {
        frame.updateState({
          ...frame.state,
          status: 'working',
          currentTask: { id: 'task-1', title: 'Building Frosted Capsule Pills', status: 'running' }
        });
      }
    }
  });

  // 3. Lounge Close Up (Coffee Steam)
  await captureSector('lounge', 'sector-lounge-props.png');

  // 4. Executive Suite Close Up (Orion Quiet Room Micro-Dot)
  await captureSector('manager', 'sector-executive-microdot.png');

  console.log('All sector close-ups captured successfully!');
}

run().catch(console.error);
