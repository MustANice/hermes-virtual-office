/**
 * Verification of Live Production Deployment: https://office.dindustries.my.id
 */
const { chromium } = require('/root/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = '/root/projects/hermes-virtual-office/lens-artifacts';

async function testProduction() {
  console.log('Testing Live Production: https://office.dindustries.my.id ...');
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  const networkFailures = [];
  page.on('response', resp => {
    const status = resp.status();
    const type = resp.request().resourceType();
    if (status >= 400 && ['image', 'font', 'stylesheet', 'script'].includes(type)) {
      networkFailures.push({ url: resp.url(), status, type });
    }
  });

  await page.goto('https://office.dindustries.my.id', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForFunction(() => window.__THREE_ENGINE__ && window.__THREE_ENGINE__.avatars && window.__THREE_ENGINE__.avatars.size > 0, { timeout: 15000 });
  await page.waitForTimeout(2000);

  const prodAudit = await page.evaluate(() => {
    const engine = window.__THREE_ENGINE__;
    if (!engine) return { error: 'No Three.js engine found on window' };

    const bgHex = engine.scene.background ? '#' + engine.scene.background.getHexString().toUpperCase() : null;
    const fogHex = engine.scene.fog && engine.scene.fog.color ? '#' + engine.scene.fog.color.getHexString().toUpperCase() : null;

    let contactShadow = false;
    engine.scene.traverse(obj => {
      if (obj.isMesh && obj.geometry && obj.geometry.type === 'PlaneGeometry' && obj.position.y < -0.9 && obj.position.y > -1.2) {
        contactShadow = true;
      }
    });

    const avatars = [];
    for (const [id, a] of engine.avatars.entries()) {
      avatars.push({
        id,
        isWorking: a.isWorking(),
        status: a.state.status,
        billboardVisible: a.billboard.visible,
        microDotVisible: a.microDot.visible,
        pillScaleLerp: Number(a.pillScaleLerp.toFixed(2))
      });
    }

    return {
      bgHex,
      fogHex,
      contactShadow,
      avatarsCount: engine.avatars.size,
      avatars
    };
  });

  console.log('Production Audit Results:', JSON.stringify(prodAudit, null, 2));
  console.log(`Production Console Errors: ${consoleErrors.length}`);
  console.log(`Production Network Failures: ${networkFailures.length}`);

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
    const outPath = path.join(ARTIFACTS_DIR, 'production-live-verified.png');
    fs.writeFileSync(outPath, base64Data, 'base64');
    console.log(`Saved ${outPath}`);
  }

  await browser.close();

  const isPass = consoleErrors.length === 0 && networkFailures.length === 0 && prodAudit.bgHex === '#0B0F17' && prodAudit.contactShadow && prodAudit.avatarsCount >= 9;
  console.log(`\n================================================================`);
  console.log(`PRODUCTION DEPLOYMENT VERDICT: ${isPass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`================================================================\n`);
  process.exit(isPass ? 0 : 1);
}

testProduction().catch(console.error);
