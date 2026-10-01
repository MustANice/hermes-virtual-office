/**
 * LENS Comprehensive Dual-Mode Visual QA Audit Suite for Paket B
 * Standard: Fleet V3.1 / V3.3 Dual-Mode & 5-Gate Fail-Fast Standard
 */
const { chromium } = require('/root/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = '/root/projects/hermes-virtual-office/lens-artifacts';
if (!fs.existsSync(ARTIFACTS_DIR)) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

async function runLensAudit() {
  console.log('================================================================');
  console.log('🔍 LENS INDEPENDENT DUAL-MODE VISUAL QA: PAKET B TRANSFORMATION');
  console.log('================================================================');

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--enable-webgl']
  });

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleErrors = [];
  const consoleWarnings = [];
  const networkFailures = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push({ text: msg.text(), location: msg.location() });
    } else if (msg.type() === 'warning') {
      consoleWarnings.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push({ text: err.message, stack: err.stack });
  });

  page.on('response', resp => {
    const status = resp.status();
    const type = resp.request().resourceType();
    if (status >= 400 && ['image', 'font', 'stylesheet', 'script'].includes(type)) {
      networkFailures.push({ url: resp.url(), status, type });
    }
  });

  // Navigate to local port 3333
  console.log('\n[GATE 0] Navigating to http://127.0.0.1:3333 ...');
  await page.goto('http://127.0.0.1:3333', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  // Check Gate 0 status
  console.log(`- Console Errors: ${consoleErrors.length}`);
  console.log(`- Network Failures: ${networkFailures.length}`);
  const gate0Pass = consoleErrors.length === 0 && networkFailures.length === 0;
  console.log(`==> GATE 0 VERDICT: ${gate0Pass ? 'PASS' : 'FAIL'}`);

  // GATE 1: 3D Scene Architecture & Metrology
  console.log('\n[GATE 1] Auditing 3D Scene Architecture (Dark Void #0B0F17, Slab, Contact Shadow)...');
  const sceneAudit = await page.evaluate(() => {
    const engine = window.__THREE_ENGINE__;
    if (!engine) return { error: 'No __THREE_ENGINE__ found on window' };

    const scene = engine.scene;
    const bg = scene.background;
    const fog = scene.fog;

    const bgHex = bg ? '#' + bg.getHexString().toUpperCase() : null;
    const fogHex = fog && fog.color ? '#' + fog.color.getHexString().toUpperCase() : null;
    const fogDensity = fog ? fog.density : null;

    let contactShadowFound = false;
    let contactShadowDimensions = null;
    let contactShadowY = null;
    let beveledSlabCount = 0;
    const slabMeshes = [];

    scene.traverse(obj => {
      if (obj.isMesh) {
        if (obj.geometry && obj.geometry.type === 'PlaneGeometry' && obj.position.y < -0.9 && obj.position.y > -1.2) {
          contactShadowFound = true;
          contactShadowY = obj.position.y;
          contactShadowDimensions = {
            scaleX: obj.scale.x,
            scaleY: obj.scale.y,
            scaleZ: obj.scale.z,
            opacity: obj.material ? obj.material.opacity : null
          };
        }
        if (obj.position.y < 0.05 && obj.position.y >= -1.0 && obj.scale.x > 50) {
          beveledSlabCount++;
          slabMeshes.push({
            name: obj.name || 'unnamed',
            y: Number(obj.position.y.toFixed(3)),
            scale: { x: Number(obj.scale.x.toFixed(1)), y: Number(obj.scale.y.toFixed(2)), z: Number(obj.scale.z.toFixed(1)) },
            color: obj.material && obj.material.color ? '#' + obj.material.color.getHexString().toUpperCase() : null
          });
        }
      }
    });

    let coffeeSteamFound = false;
    let coffeeSteamDetails = null;
    if (engine.coffeeSteam && engine.coffeeSteam.points) {
      const pts = engine.coffeeSteam.points;
      coffeeSteamFound = true;
      coffeeSteamDetails = {
        particleCount: pts.geometry.attributes.position ? pts.geometry.attributes.position.count : 0,
        blending: pts.material.blending,
        color: '#' + pts.material.color.getHexString().toUpperCase(),
        transparent: pts.material.transparent,
        size: pts.material.size
      };
    }

    let workstationGlowCount = 0;
    if (engine.workstationLights) {
      workstationGlowCount = engine.workstationLights.size;
    }

    return {
      bgHex,
      fogHex,
      fogDensity,
      contactShadowFound,
      contactShadowY,
      contactShadowDimensions,
      beveledSlabCount,
      slabMeshes,
      coffeeSteamFound,
      coffeeSteamDetails,
      workstationGlowCount
    };
  });

  console.log('Scene Audit Results:', JSON.stringify(sceneAudit, null, 2));

  // GATE 2: Frosted Capsule Pills & Quiet Room State-Driven Density
  console.log('\n[GATE 2] Auditing Frosted Glass Capsule Pills & The Quiet Room Micro-Dots...');
  const avatarAudit = await page.evaluate(() => {
    const engine = window.__THREE_ENGINE__;
    if (!engine || !engine.avatars) return { error: 'No avatars map found' };

    const avatarsData = [];
    let comicCloudFound = false;

    for (const [id, avatar] of engine.avatars.entries()) {
      const billboard = avatar.billboard;
      const microDot = avatar.microDot;

      const tex = billboard && billboard.material && billboard.material.map;
      const texW = tex && tex.image ? tex.image.width : null;
      const texH = tex && tex.image ? tex.image.height : null;

      if (billboard && billboard.scale.x > 8.0) {
        comicCloudFound = true;
      }

      avatarsData.push({
        id,
        isWorking: avatar.isWorking(),
        status: avatar.state.status,
        currentLocation: avatar.currentLocation,
        billboardScale: {
          x: Number(billboard.scale.x.toFixed(2)),
          y: Number(billboard.scale.y.toFixed(2)),
          z: Number(billboard.scale.z.toFixed(2))
        },
        billboardVisible: billboard.visible,
        pillScaleLerp: Number(avatar.pillScaleLerp.toFixed(3)),
        textureResolution: `${texW}x${texH}`,
        microDotVisible: microDot ? microDot.visible : false,
        microDotScale: microDot ? Number(microDot.scale.x.toFixed(2)) : null
      });
    }

    return {
      totalAvatars: engine.avatars.size,
      comicCloudFound,
      avatarsData
    };
  });

  console.log(`Total Avatars: ${avatarAudit.totalAvatars}, Comic Clouds Present: ${avatarAudit.comicCloudFound}`);

  // Test State-Driven Density Transition dynamically!
  console.log('\n[GATE 2.1] Testing Dynamic State-Driven Transition (Quiet Room -> Working -> Click)...');
  const dynamicTransitionTest = await page.evaluate(async () => {
    const engine = window.__THREE_ENGINE__;
    const testAvatar = engine.avatars.get('forge');
    if (!testAvatar) return { error: 'Avatar forge not found' };

    const beforeStatus = {
      status: testAvatar.state.status,
      pillScaleLerp: testAvatar.pillScaleLerp,
      billboardVisible: testAvatar.billboard.visible,
      microDotVisible: testAvatar.microDot.visible
    };

    // Transition 1: Simulate Working State
    testAvatar.updateState({
      ...testAvatar.state,
      status: 'working',
      currentTask: { id: 'task-test', title: 'Refactoring API endpoints', status: 'running' }
    });

    await new Promise(r => setTimeout(r, 450));

    const workingStatus = {
      pillScaleLerp: Number(testAvatar.pillScaleLerp.toFixed(2)),
      billboardVisible: testAvatar.billboard.visible,
      billboardScaleX: Number(testAvatar.billboard.scale.x.toFixed(2)),
      microDotVisible: testAvatar.microDot.visible
    };

    // Transition 2: Simulate User Click
    testAvatar.onUserClick();
    await new Promise(r => setTimeout(r, 200));

    const clickStatus = {
      isGreeting: testAvatar.isGreeting,
      pillScaleLerp: Number(testAvatar.pillScaleLerp.toFixed(2)),
      billboardVisible: testAvatar.billboard.visible
    };

    // Transition 3: Return to Idle
    testAvatar.updateState({
      ...testAvatar.state,
      status: 'idle',
      currentTask: undefined,
      activeTool: undefined
    });
    testAvatar.isGreeting = false;
    await new Promise(r => setTimeout(r, 500));

    const idleStatus = {
      pillScaleLerp: Number(testAvatar.pillScaleLerp.toFixed(2)),
      billboardVisible: testAvatar.billboard.visible,
      microDotVisible: testAvatar.microDot.visible
    };

    return { beforeStatus, workingStatus, clickStatus, idleStatus };
  });

  console.log('Dynamic Transition Test Results:', JSON.stringify(dynamicTransitionTest, null, 2));

  // GATE 3: War Room Hologram Radial Exclusion Zone
  console.log('\n[GATE 3] Auditing War Room Hologram 100% Text Occlusion Elimination...');
  const warRoomAudit = await page.evaluate(async () => {
    const engine = window.__THREE_ENGINE__;
    if (!engine) return { error: 'No engine' };

    let hologramFound = false;
    let hologramPosition = null;

    engine.scene.traverse(obj => {
      if (obj.name && (obj.name.toLowerCase().includes('hologram') || obj.name.toLowerCase().includes('meeting') || obj.name.toLowerCase().includes('a2a'))) {
        hologramFound = true;
        hologramPosition = { x: obj.position.x, y: obj.position.y, z: obj.position.z };
      }
    });

    const testAvatar = engine.avatars.get('aurora');
    const originalPos = { x: testAvatar.currentX, z: testAvatar.currentZ, status: testAvatar.state.status };

    testAvatar.currentX = 0;
    testAvatar.currentZ = -2.5; // War Room center
    testAvatar.updateState({
      ...testAvatar.state,
      status: 'meeting'
    });

    await new Promise(r => setTimeout(r, 350));

    const dist = Math.hypot(testAvatar.currentX - 0, testAvatar.currentZ - (-2.5));
    const inWarRoomRadius = dist < 2.5;

    const warRoomPillStatus = {
      avatarId: 'aurora',
      distToCenter: Number(dist.toFixed(2)),
      inWarRoomRadius,
      pillScaleLerp: Number(testAvatar.pillScaleLerp.toFixed(2)),
      billboardVisible: testAvatar.billboard.visible,
      occlusionFree: testAvatar.billboard.visible === false || testAvatar.pillScaleLerp <= 0.05
    };

    testAvatar.currentX = originalPos.x;
    testAvatar.currentZ = originalPos.z;
    testAvatar.updateState({ ...testAvatar.state, status: originalPos.status });

    return {
      hologramFound,
      hologramPosition,
      warRoomPillStatus
    };
  });

  console.log('War Room Hologram Audit:', JSON.stringify(warRoomAudit, null, 2));

  // GATE 4: Metrology 60 FPS & GPU Performance Sampling
  console.log('\n[GATE 4] Metrology: Sampling 60 Frames for 60 FPS & Frame Delta...');
  const metrology = await page.evaluate(() => {
    return new Promise(resolve => {
      const deltas = [];
      let lastTime = performance.now();
      let frames = 0;
      const targetFrames = 60;
      const timer = setTimeout(() => finish(), 2500);

      function finish() {
        clearTimeout(timer);
        deltas.sort((a, b) => a - b);
        const avgDelta = deltas.length ? (deltas.reduce((a, b) => a + b, 0) / deltas.length) : 16.6;
        const avgFps = 1000 / avgDelta;
        const p95Delta = deltas.length ? deltas[Math.floor(deltas.length * 0.95)] : avgDelta;
        const p99Delta = deltas.length ? deltas[Math.floor(deltas.length * 0.99)] : avgDelta;
        const low1Fps = 1000 / p99Delta;

        const rendererInfo = window.__THREE_RENDERER__ ? {
          drawCalls: window.__THREE_RENDERER__.info.render.calls,
          triangles: window.__THREE_RENDERER__.info.render.triangles,
          points: window.__THREE_RENDERER__.info.render.points,
          lines: window.__THREE_RENDERER__.info.render.lines,
          geometries: window.__THREE_RENDERER__.info.memory.geometries,
          textures: window.__THREE_RENDERER__.info.memory.textures
        } : null;

        resolve({
          avgFps: Number(avgFps.toFixed(1)),
          low1Fps: Number(low1Fps.toFixed(1)),
          avgDeltaMs: Number(avgDelta.toFixed(2)),
          p95DeltaMs: Number(p95Delta.toFixed(2)),
          maxDeltaMs: Number(Math.max(...(deltas.length ? deltas : [16.6])).toFixed(2)),
          rendererInfo
        });
      }

      function step(now) {
        const delta = now - lastTime;
        lastTime = now;
        if (frames > 2) deltas.push(delta);
        frames++;

        if (frames < targetFrames) {
          requestAnimationFrame(step);
        } else {
          finish();
        }
      }
      requestAnimationFrame(step);
    });
  });

  console.log('Metrology Results:', JSON.stringify(metrology, null, 2));

  // GATE 5: Multi-Viewport Responsive Matrix
  console.log('\n[GATE 5] Testing Multi-Viewport Responsive Matrix & Screen Captures...');
  const viewports = [
    { name: 'desktop-1920', width: 1920, height: 1080 },
    { name: 'desktop-1440', width: 1440, height: 900 },
    { name: 'tablet-1024', width: 1024, height: 768 },
    { name: 'tablet-768', width: 768, height: 1024 },
    { name: 'mobile-390', width: 390, height: 844 },
    { name: 'mobile-375', width: 375, height: 812 }
  ];

  const viewportResults = [];
  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(250);

    const check = await page.evaluate(() => {
      const scrollBleed = document.documentElement.scrollWidth > window.innerWidth;
      return {
        scrollBleed,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth
      };
    });

    const shotPath = path.join(ARTIFACTS_DIR, `lens-${vp.name}.png`);
    await page.screenshot({ path: shotPath, fullPage: false });

    viewportResults.push({
      viewport: vp.name,
      width: vp.width,
      height: vp.height,
      scrollBleed: check.scrollBleed,
      screenshot: shotPath
    });
  }

  // Restore 1440x900
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(250);

  // Sector Crops
  console.log('\n[SECTOR CROPS] Capturing sector crops for Art Direction QA...');

  const shotOverview = path.join(ARTIFACTS_DIR, 'lens-atelier-overview-1440.png');
  await page.screenshot({ path: shotOverview });

  await page.evaluate(() => {
    const engine = window.__THREE_ENGINE__;
    if (engine) engine.focusRoom('meeting');
  });
  await page.waitForTimeout(600);
  const shotWarRoom = path.join(ARTIFACTS_DIR, 'lens-sector-warroom-hologram.png');
  await page.screenshot({ path: shotWarRoom });

  await page.evaluate(() => {
    const engine = window.__THREE_ENGINE__;
    if (engine) engine.focusRoom('lounge');
  });
  await page.waitForTimeout(600);
  const shotLounge = path.join(ARTIFACTS_DIR, 'lens-sector-lounge-steam.png');
  await page.screenshot({ path: shotLounge });

  await page.evaluate(() => {
    const engine = window.__THREE_ENGINE__;
    if (engine) engine.focusRoom('dev');
  });
  await page.waitForTimeout(600);
  const shotDevLab = path.join(ARTIFACTS_DIR, 'lens-sector-devlab-glow.png');
  await page.screenshot({ path: shotDevLab });

  await page.evaluate(() => {
    const engine = window.__THREE_ENGINE__;
    if (engine) engine.focusRoom('all');
  });
  await page.waitForTimeout(400);

  // Production Reachability Test
  console.log('\n[PRODUCTION PROBE] Testing Live Production URL (https://office.dindustries.my.id)...');
  const prodPage = await context.newPage();
  const prodErrors = [];
  prodPage.on('console', msg => { if (msg.type() === 'error') prodErrors.push(msg.text()); });
  prodPage.on('pageerror', err => prodErrors.push(err.message));

  let prodReachable = false;
  try {
    await prodPage.goto('https://office.dindustries.my.id', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await prodPage.waitForTimeout(2000);
    prodReachable = true;
    const shotProd = path.join(ARTIFACTS_DIR, 'lens-production-live.png');
    await prodPage.screenshot({ path: shotProd });
    console.log(`- Production reachable: YES, Console Errors: ${prodErrors.length}`);
  } catch (err) {
    console.log(`- Production reach warning: ${err.message}`);
  }
  await prodPage.close();

  // Close context and browser cleanly
  await page.close();
  await context.close();
  await browser.close();

  // Synthesis
  const allTestsPass = (
    gate0Pass &&
    sceneAudit.bgHex === '#0B0F17' &&
    sceneAudit.fogHex === '#0B0F17' &&
    sceneAudit.contactShadowFound &&
    sceneAudit.beveledSlabCount >= 3 &&
    sceneAudit.coffeeSteamFound &&
    !avatarAudit.comicCloudFound &&
    avatarAudit.totalAvatars >= 9 &&
    dynamicTransitionTest.workingStatus.pillScaleLerp >= 0.35 &&
    dynamicTransitionTest.clickStatus.pillScaleLerp >= 0.85 &&
    warRoomAudit.warRoomPillStatus.occlusionFree &&
    metrology.avgFps >= 50 &&
    viewportResults.every(v => !v.scrollBleed)
  );

  console.log('\n================================================================');
  console.log(`FINAL AUDIT CONCLUSION: ${allTestsPass ? '✅ FULL PASS (5/5 GATES)' : '❌ FAIL'}`);
  console.log('================================================================');

  const reportData = {
    allTestsPass,
    gate0Pass,
    sceneAudit,
    avatarAudit,
    dynamicTransitionTest,
    warRoomAudit,
    metrology,
    viewportResults,
    prodReachable,
    prodErrors
  };

  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'lens-audit-results.json'), JSON.stringify(reportData, null, 2));
  console.log(`Saved structured audit results to ${path.join(ARTIFACTS_DIR, 'lens-audit-results.json')}`);

  process.exit(allTestsPass ? 0 : 1);
}

runLensAudit().catch(err => {
  console.error('Audit execution error:', err);
  process.exit(1);
});
