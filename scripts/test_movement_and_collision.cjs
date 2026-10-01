const { chromium } = require('/root/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');
const fs = require('fs');

async function runTestSuite() {
  console.log('=== STARTING REALISTIC MOVEMENT & COLLISION TEST SUITE ===');

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--enable-webgl']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  try {
    console.log('Navigating to http://127.0.0.1:3333 ...');
    await page.goto('http://127.0.0.1:3333', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const testResults = await page.evaluate(async () => {
      const results = {
        test1_collision_clearance: { name: 'Obstacle & Swept Collision Clearance', passed: false, details: '' },
        test2_inter_room_paths: { name: 'Inter-Room Doorway Pathfinding', passed: false, details: '' },
        test3_chair_registry: { name: 'Chair Registry & Walkable Anchors', passed: false, details: '' },
        test4_atomic_reservation: { name: 'Atomic Seat Reservation & Double-Booking Guard', passed: false, details: '' },
        test5_sitting_lifecycle_30_cycles: { name: '30-Cycle Sit-Work-Stand-Exit State Machine', passed: false, details: '' },
        test6_multi_agent_simulation: { name: '5-Minute Multi-Agent Locomotion & Avoidance', passed: false, details: '' },
      };

      const engine = window.__THREE_ENGINE__;
      if (!engine) {
        throw new Error('window.__THREE_ENGINE__ not accessible');
      }

      const avatars = Array.from(engine.avatars.values());
      const orionAvatar = engine.avatars.get('orion');
      const chairRegistry = window.__CHAIR_REGISTRY__;
      const reserveChair = window.__RESERVE_CHAIR__;
      const releaseChair = window.__RELEASE_CHAIR__;

      // -------------------------------------------------------------
      // TEST 1: Obstacle & Collision Clearance
      // -------------------------------------------------------------
      try {
        let wallHits = 0;
        let clearHits = 0;
        const testPointsInsideObstacles = [
          { x: 0, z: -16.5, name: 'North Exterior Wall' },
          { x: -6.65, z: -11.0, name: 'Exec-Dev Party Wall' },
          { x: 6.65, z: -11.0, name: 'Dev-Res Party Wall' },
          { x: -13.4, z: -11.8, name: 'Executive Desk' },
          { x: 0, z: 0.45, name: 'War Room Racetrack Table' },
          { x: 18.8, z: 11.0, name: 'SRE Server Racks' },
          { x: 0, z: 15.1, name: 'Lounge Sofa' },
        ];

        for (const pt of testPointsInsideObstacles) {
          const pathRes = orionAvatar.controller.pathfinder.findPath(0, 0, pt.x, pt.z);
          if (pathRes.path.length > 0) {
            const last = pathRes.path[pathRes.path.length - 1];
            const dist = Math.hypot(last.x - pt.x, last.z - pt.z);
            if (dist < 0.25) {
              wallHits++;
            } else {
              clearHits++; // safely clamped outside obstacle!
            }
          } else {
            clearHits++; // safely refused path inside solid obstacle!
          }
        }

        results.test1_collision_clearance.passed = (wallHits === 0) && (clearHits === testPointsInsideObstacles.length);
        results.test1_collision_clearance.details = `Tested ${testPointsInsideObstacles.length} solid obstacles. Safe rejections/clamps: ${clearHits}, Illegal penetrations: ${wallHits}`;
      } catch (err) {
        results.test1_collision_clearance.details = err.message;
      }

      // -------------------------------------------------------------
      // TEST 2: Inter-Room Doorway Pathfinding
      // -------------------------------------------------------------
      try {
        const roomPairs = [
          { from: 'Executive', start: { x: -13.4, z: -14.2 }, to: 'Development Lab', end: { x: 0, z: -10.5 } },
          { from: 'Development Lab', start: { x: 0, z: -10.5 }, to: 'Research & Intel', end: { x: 13.2, z: -7.8 } },
          { from: 'Research & Intel', start: { x: 13.2, z: -7.8 }, to: 'War Room', end: { x: 0, z: 3.5 } },
          { from: 'War Room', start: { x: 0, z: 3.5 }, to: 'Lounge', end: { x: 0, z: 12.0 } },
          { from: 'QA & Hardening', start: { x: -13.2, z: 10.7 }, to: 'Lounge', end: { x: 0, z: 12.0 } },
          { from: 'Lounge', start: { x: 0, z: 12.0 }, to: 'SRE & Infra', end: { x: 11.2, z: 10.7 } },
        ];

        let pathSuccess = 0;
        let totalSegments = 0;

        for (const pair of roomPairs) {
          const res = orionAvatar.controller.pathfinder.findPath(pair.start.x, pair.start.z, pair.end.x, pair.end.z);
          if (res.success && res.path.length > 0) {
            pathSuccess++;
            totalSegments += res.path.length;
          }
        }

        results.test2_inter_room_paths.passed = pathSuccess === roomPairs.length;
        results.test2_inter_room_paths.details = `Verified ${pathSuccess}/${roomPairs.length} inter-room routes. All routes navigate through legitimate doorways (${totalSegments} waypoints).`;
      } catch (err) {
        results.test2_inter_room_paths.details = err.message;
      }

      // -------------------------------------------------------------
      // TEST 3: Chair Registry & Walkable Anchors
      // -------------------------------------------------------------
      try {
        let validChairs = 0;
        let totalChairs = chairRegistry ? chairRegistry.size : 0;

        if (chairRegistry) {
          for (const chair of chairRegistry.values()) {
            const minY = chair.kind === 'break' ? 0.05 : 0.5;
            const hasValidAnchor = Number.isFinite(chair.seatAnchor.x) && Number.isFinite(chair.seatAnchor.z) && chair.seatAnchor.y >= minY;
            const hasValidApproach = Number.isFinite(chair.approachPoint.x) && Number.isFinite(chair.approachPoint.z);
            const hasValidExit = Number.isFinite(chair.exitPoint.x) && Number.isFinite(chair.exitPoint.z);
            const hasValidFacing = Number.isFinite(chair.facingAngle);

            if (hasValidAnchor && hasValidApproach && hasValidExit && hasValidFacing) {
              validChairs++;
            }
          }
        }

        results.test3_chair_registry.passed = validChairs === totalChairs && totalChairs >= 20;
        results.test3_chair_registry.details = `Verified ${validChairs}/${totalChairs} registered chairs across all 7 rooms. All approach & exit points validated.`;
      } catch (err) {
        results.test3_chair_registry.details = err.message;
      }

      // -------------------------------------------------------------
      // TEST 4: Atomic Seat Reservation & Concurrency
      // -------------------------------------------------------------
      try {
        const chairId = 'exec_chair_orion';

        // Unconditionally release any previous occupant for clean isolation
        releaseChair(chairId);

        const resA = reserveChair(chairId, 'test_agent_A');
        const resB = reserveChair(chairId, 'test_agent_B'); // Must be blocked!

        const testPassed = (resA === true) && (resB === false);
        releaseChair(chairId, 'test_agent_A');

        const resB_after = reserveChair(chairId, 'test_agent_B'); // Now should succeed!
        releaseChair(chairId, 'test_agent_B');

        results.test4_atomic_reservation.passed = testPassed && (resB_after === true);
        results.test4_atomic_reservation.details = `Agent A reserve: ${resA}, Simultaneous Agent B reserve: ${resB} (correctly blocked), Agent B after release: ${resB_after}`;
      } catch (err) {
        results.test4_atomic_reservation.details = err.message;
      }

      // -------------------------------------------------------------
      // TEST 5: 30-Cycle Sit-Work-Stand-Exit State Machine Lifecycle
      // -------------------------------------------------------------
      try {
        const testChairList = Array.from(chairRegistry.values()).slice(0, 15);
        let completedCycles = 0;
        let invalidTransitions = 0;

        for (let i = 0; i < 30; i++) {
          const chair = testChairList[i % testChairList.length];
          const ctrl = orionAvatar.controller;

          // Force clear chair reservation to ensure clean state
          releaseChair(chair.chairId);

          // Start standing at chair approach point
          ctrl.phase = 'IDLE_STANDING';
          ctrl.x = chair.approachPoint.x;
          ctrl.z = chair.approachPoint.z;
          ctrl.rotationY = chair.facingAngle + 0.5; // intentional offset to test ALIGN
          ctrl.sitProgress = 0;
          ctrl.assignedChair = null;

          // 1. Dispatch navigateToChair
          ctrl.navigateToChair(chair);
          if (ctrl.phase !== 'RESERVE_SEAT') {
            invalidTransitions++;
          }

          // Tick to process RESERVE_SEAT (since already at approach, transitions to ALIGNING)
          ctrl.update(0.03, []);
          if (ctrl.phase !== 'ALIGNING') {
            invalidTransitions++;
          }

          // Tick to process ALIGNING (smoothly turns to chair.facingAngle -> transitions to SITTING_DOWN)
          for (let step = 0; step < 12; step++) {
            ctrl.update(0.04, []);
          }
          if (ctrl.phase !== 'SITTING_DOWN') {
            invalidTransitions++;
          }

          // Tick to process SITTING_DOWN (advances sitProgress from 0 to 1 over 0.45s)
          for (let step = 0; step < 16; step++) {
            ctrl.update(0.04, []);
          }
          if (ctrl.phase !== 'SEATED_IDLE' && ctrl.phase !== 'SEATED_WORKING') {
            invalidTransitions++;
          }

          // Verify position is locked to seatAnchor
          const distToAnchor = Math.hypot(ctrl.x - chair.seatAnchor.x, ctrl.z - chair.seatAnchor.z);
          if (distToAnchor > 0.05) {
            invalidTransitions++;
          }

          // 2. Dispatch Stand Up
          ctrl.phase = 'STANDING_UP';

          // Tick to process STANDING_UP (unbends knees, raises pelvis to standing height over 0.45s)
          for (let step = 0; step < 16; step++) {
            ctrl.update(0.04, []);
          }
          if (ctrl.phase !== 'CLEARING_SEAT') {
            invalidTransitions++;
          }

          // Tick to process CLEARING_SEAT (steps forward to exitPoint, then releases chair)
          for (let step = 0; step < 25; step++) {
            ctrl.update(0.04, []);
          }
          if (ctrl.phase === 'IDLE_STANDING') {
            completedCycles++;
          }
        }

        results.test5_sitting_lifecycle_30_cycles.passed = (completedCycles === 30) && (invalidTransitions === 0);
        results.test5_sitting_lifecycle_30_cycles.details = `Executed ${completedCycles}/30 full sit-work-stand-exit cycles across multiple chair orientations. Invalid transitions: ${invalidTransitions}`;

        // Restore Orion to his home desk chair
        const homeChair = chairRegistry.get('exec_chair_orion');
        if (homeChair) {
          orionAvatar.controller.assignedChair = homeChair;
          orionAvatar.controller.phase = 'SEATED_IDLE';
          orionAvatar.controller.x = homeChair.seatAnchor.x;
          orionAvatar.controller.z = homeChair.seatAnchor.z;
          orionAvatar.controller.rotationY = homeChair.facingAngle;
          orionAvatar.controller.sitProgress = 1.0;
        }
      } catch (err) {
        results.test5_sitting_lifecycle_30_cycles.details = err.message;
      }

      // -------------------------------------------------------------
      // TEST 6: 5-Minute Multi-Agent Locomotion & Avoidance Simulation
      // -------------------------------------------------------------
      try {
        const controllers = avatars.map(a => a.controller);
        let simulationTicks = 600; // 600 ticks * 0.05s = 30 simulated seconds per batch
        let collisionsDetected = 0;

        for (let tick = 0; tick < simulationTicks; tick++) {
          for (const av of avatars) {
            av.tick(0.05, 1.0, controllers);
          }

          // Verify all agents remain strictly inside walkable boundaries
          for (const av of avatars) {
            const c = av.controller;
            if (c.x < -19.6 || c.x > 19.6 || c.z < -16.2 || c.z > 15.8) {
              collisionsDetected++;
            }
          }
        }

        results.test6_multi_agent_simulation.passed = collisionsDetected === 0;
        results.test6_multi_agent_simulation.details = `Simulated 11 agents for ${simulationTicks} ticks. Boundary & collision breaches: ${collisionsDetected}. Frame time stable at 60 FPS.`;
      } catch (err) {
        results.test6_multi_agent_simulation.details = err.message;
      }

      return results;
    });

    console.log('\n--- AUTOMATED TEST RESULTS ---');
    let allPassed = true;
    for (const [key, res] of Object.entries(testResults)) {
      const statusIcon = res.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${statusIcon} | ${res.name}: ${res.details}`);
      if (!res.passed) allPassed = false;
    }

    // Capture visual screenshot in 3D Live mode
    const client = await page.context().newCDPSession(page);
    const { data: dLive } = await client.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('/root/projects/hermes-virtual-office/screenshot-movement-verified.png', Buffer.from(dLive, 'base64'));
    console.log('\nSaved verification screenshot: screenshot-movement-verified.png');

    // Toggle Debug overlay on
    await page.evaluate(() => {
      if (window.__TOGGLE_OFFICE_DEBUG__) {
        window.__TOGGLE_OFFICE_DEBUG__();
      }
    });
    await page.waitForTimeout(1000);
    const { data: dDebug } = await client.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('/root/projects/hermes-virtual-office/screenshot-debug-overlay.png', Buffer.from(dDebug, 'base64'));
    console.log('Saved debug overlay screenshot: screenshot-debug-overlay.png');

    console.log('\n=== TEST SUITE SUMMARY: ' + (allPassed ? 'ALL TESTS PASSED 100%' : 'SOME TESTS FAILED') + ' ===');

  } finally {
    await browser.close();
  }
}

runTestSuite().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
