import re

with open('/root/projects/hermes-virtual-office/src/engine/RobloxOffice3D.ts', 'r') as f:
    text = f.read()

# 1. Update RobloxAvatar3D constructor to initialize controller
old_constructor_end = """    this.currentX = this.targetX = spot.x;
    this.currentY = this.targetY = spot.y;
    this.currentZ = this.targetZ = spot.z;
    this.targetRotY = spot.rotY;
    this.currentLocation = initLocation ? initLocation.loc : 'desk';
    this.group.position.set(spot.x, spot.y, spot.z);
    this.group.rotation.y = spot.rotY;

    // Stagger idle movement timers so agents don't move in robotic unison
    this.actionTimer = Math.random() * 22;

    this.billboard = this.createBillboard(state);"""

new_constructor_end = """    this.controller = new AvatarMovementController(state.id, spot.x, spot.z, spot.rotY);
    this.currentX = this.targetX = this.controller.x;
    this.currentY = this.targetY = this.controller.y;
    this.currentZ = this.targetZ = this.controller.z;
    this.targetRotY = this.controller.rotationY;
    this.currentLocation = initLocation ? initLocation.loc : 'desk';
    this.group.position.set(this.controller.x, this.controller.y, this.controller.z);
    this.group.rotation.y = this.controller.rotationY;

    // Stagger idle movement timers so agents don't move in robotic unison
    this.actionTimer = Math.random() * 22;

    this.billboard = this.createBillboard(state);"""

if old_constructor_end in text:
    text = text.replace(old_constructor_end, new_constructor_end)
    print("Updated RobloxAvatar3D constructor with controller initialization!")
else:
    print("Could not find old_constructor_end")

# 2. Replace navigateTo, returnToDesk, chooseIdleDestination
old_nav_methods = """  public navigateTo(
    destX: number,
    destY: number,
    destZ: number,
    targetRotY: number,
  ): void {
    if (
      this.disposed ||
      ![destX, destY, destZ, targetRotY].every(Number.isFinite)
    ) {
      return;
    }

    const horizontalDistance = Math.hypot(
      destX - this.currentX,
      destZ - this.currentZ,
    );

    const path = findPathThroughDoors(
      { x: this.currentX, z: this.currentZ },
      { x: destX, z: destZ },
    );

    // An empty route to a distant destination is not permission to teleport.
    if (horizontalDistance > 0.001 && (!path || path.length === 0)) {
      return;
    }

    this.targetX = destX;
    this.targetY = destY;
    this.targetZ = destZ;
    this.targetRotY = targetRotY;
    this.destinationLocation = this.inferLocation(destX, destY, destZ);
    this.waypoints = (path || []).map((point) => ({ ...point }));

    const last = this.waypoints[this.waypoints.length - 1];
    if (
      !last ||
      Math.hypot(last.x - destX, last.z - destZ) > 0.001
    ) {
      this.waypoints.push({ x: destX, z: destZ });
    }

    this.isSitting = false;
    this.refreshBillboard();
  }

  private returnToDesk(): void {
    const home = AGENT_3D_SPOTS[this.id];
    if (!home) return;

    releaseAgentSpot(this.id);
    this.navigateTo(home.x, home.y, home.z, home.rotY);
  }

  private chooseIdleDestination(): void {
    const choices = ['home', 'coffee', 'meeting', 'sofa'] as const;
    const choice = choices[Math.floor(Math.random() * choices.length)];

    if (choice === 'home') {
      this.returnToDesk();
      return;
    }

    const spots =
      FLEET_ACTIVITY_SPOTS[choice as keyof typeof FLEET_ACTIVITY_SPOTS] || [];
    const available = spots.filter(
      (spot) =>
        !OCCUPIED_SPOTS.has(spot.id) ||
        OCCUPIED_SPOTS.get(spot.id) === this.id,
    );

    if (available.length === 0) {
      this.returnToDesk();
      return;
    }

    const chosen = available[Math.floor(Math.random() * available.length)];
    this.navigateTo(chosen.x, chosen.y, chosen.z, chosen.rotY);

    if (
      this.targetX === chosen.x &&
      this.targetY === chosen.y &&
      this.targetZ === chosen.z
    ) {
      releaseAgentSpot(this.id);
      OCCUPIED_SPOTS.set(chosen.id, this.id);
    }
  }"""

new_nav_methods = """  public navigateTo(
    destX: number,
    destY: number,
    destZ: number,
    targetRotY: number,
  ): void {
    if (
      this.disposed ||
      ![destX, destY, destZ, targetRotY].every(Number.isFinite)
    ) {
      return;
    }

    this.controller.navigateToFloorPoint(destX, destZ, targetRotY);
    this.refreshBillboard();
  }

  private returnToDesk(): void {
    const homeChairId = AGENT_HOME_CHAIRS[this.id];
    if (homeChairId) {
      const chair = CHAIR_REGISTRY.get(homeChairId);
      if (chair) {
        this.controller.navigateToChair(chair);
      }
    }
  }

  private chooseIdleDestination(): void {
    const choices = ['home', 'coffee', 'meeting', 'sofa'] as const;
    const choice = choices[Math.floor(Math.random() * choices.length)];

    if (choice === 'home') {
      this.returnToDesk();
      return;
    }

    if (choice === 'coffee') {
      const cafeSpot = CHAIR_REGISTRY.get('lounge_cafe_sentinel');
      if (cafeSpot && (!cafeSpot.occupiedBy || cafeSpot.occupiedBy === this.id)) {
        this.controller.navigateToChair(cafeSpot);
        return;
      }
    } else if (choice === 'sofa') {
      const sofaChair = findAvailableChair('lounge', 'lounge', this.controller.assignedChair?.chairId);
      if (sofaChair) {
        this.controller.navigateToChair(sofaChair);
        return;
      }
    } else if (choice === 'meeting') {
      const confChair = findAvailableChair('meeting', 'conference', this.controller.assignedChair?.chairId);
      if (confChair) {
        this.controller.navigateToChair(confChair);
        return;
      }
    }

    this.returnToDesk();
  }"""

if old_nav_methods in text:
    text = text.replace(old_nav_methods, new_nav_methods)
    print("Replaced navigateTo, returnToDesk, chooseIdleDestination!")
else:
    print("Could not find old_nav_methods")

# 3. Replace applyPosture and tick
old_posture_and_tick_pattern = r"  private applyPosture\(walking: boolean, dt: number\): void \{.*?public tick\(delta: number, simSpeed: number\): void \{.*?\n  \}"

new_posture_and_tick = """  private applyPosture(walking: boolean, dt: number): void {
    const t = this.elapsed;
    const isSeatedWorking = this.controller.phase === 'SEATED_WORKING';
    const isSeatedIdle = this.controller.phase === 'SEATED_IDLE';
    const sp = this.controller.sitProgress; // 0.0 = standing, 1.0 = seated

    this.isSitting = sp > 0.5;

    // Cup visibility only when at break counter and not walking
    const isAtBreak = this.controller.assignedChair?.kind === 'break' && !walking;
    this.cup.visible = isAtBreak;

    let torsoX = 0;
    let torsoY = 2.6; // default standing
    let torsoZ = 0;
    let torsoRX = 0;
    let torsoRZ = 0;

    let hipY = 1.7; // default standing
    let hipZ = 0;
    let leftHipRX = 0;
    let rightHipRX = 0;
    let leftKneeRX = 0;
    let rightKneeRX = 0;

    let leftArmRX = -0.2;
    let rightArmRX = -0.2;
    let leftArmRZ = -0.06;
    let rightArmRZ = 0.06;

    let headRX = 0.02;
    let headRY = Math.sin(t * 0.45 + this.seed) * 0.08;

    // Organic Respiration
    const breathCycle = Math.sin(t * 1.5 + this.seed);
    const breathY = breathCycle * 0.024;
    const breathChest = breathCycle * 0.018;

    if (walking) {
      // Natural walking gait with spring step & torso forward lean
      this.walkTime += this.controller.currentSpeed * dt * 2.8;
      const swing = Math.sin(this.walkTime) * 0.72;
      leftHipRX = swing;
      rightHipRX = -swing;
      leftKneeRX = Math.max(0, Math.cos(this.walkTime)) * 0.92;
      rightKneeRX = Math.max(0, -Math.cos(this.walkTime)) * 0.92;
      leftArmRX = -swing * 0.78;
      rightArmRX = swing * 0.78;
      leftArmRZ = -0.08;
      rightArmRZ = 0.08;
      torsoY = 2.6 + Math.abs(Math.sin(this.walkTime)) * 0.075;
      torsoRX = 0.055;
      headRY = 0;
    } else if (sp > 0) {
      // Smooth interpolation into seated posture according to sitProgress!
      hipY = THREE.MathUtils.lerp(1.7, 1.25, sp);
      hipZ = THREE.MathUtils.lerp(0, 0.08, sp);
      torsoY = THREE.MathUtils.lerp(2.6, 2.15, sp) + breathY * 0.6;
      torsoZ = THREE.MathUtils.lerp(0, -0.04, sp);
      torsoRX = THREE.MathUtils.lerp(0, 0.08, sp) + breathChest * 0.5;

      leftHipRX = THREE.MathUtils.lerp(0, -Math.PI / 2, sp);
      rightHipRX = THREE.MathUtils.lerp(0, -Math.PI / 2, sp);
      leftKneeRX = THREE.MathUtils.lerp(0, Math.PI / 2, sp);
      rightKneeRX = THREE.MathUtils.lerp(0, Math.PI / 2, sp);

      if (isSeatedWorking && sp >= 0.95) {
        // Typing cadence on keyboard:
        const devCycle = (t * 0.45 + this.seed) % 6.0;
        const isBurst = devCycle < 4.2;
        if (isBurst) {
          const typingLeft = Math.sin(t * 22) * 0.14;
          const typingRight = Math.sin(t * 22 + 1.7) * 0.14;
          leftArmRX = -1.34 + typingLeft;
          rightArmRX = -1.34 + typingRight;
          leftArmRZ = 0.24 + Math.sin(t * 11) * 0.035;
          rightArmRZ = -0.24 - Math.sin(t * 11 + 1.3) * 0.035;
          headRX = 0.22 + Math.sin(t * 2.2) * 0.015;
          headRY = Math.sin(t * 0.8 + this.seed) * 0.14;
        } else {
          leftArmRX = -1.22;
          rightArmRX = -1.22;
          leftArmRZ = 0.22;
          rightArmRZ = -0.22;
          headRX = 0.12;
          headRY = Math.sin(t * 0.35 + this.seed) * 0.24;
        }
      } else if (this.controller.assignedChair?.kind === 'lounge' && sp >= 0.95) {
        // Relaxed couch slouch
        torsoRX = -0.20 + breathChest * 0.4;
        leftHipRX = -1.22;
        rightHipRX = -1.15;
        leftKneeRX = 0.68;
        rightKneeRX = 0.62;
        leftArmRX = -0.22;
        rightArmRX = -0.22;
        leftArmRZ = -0.32;
        rightArmRZ = 0.32;
      } else {
        // Idle seated with hands comfortably on armrests / table
        leftArmRX = THREE.MathUtils.lerp(-0.2, -0.42, sp);
        rightArmRX = THREE.MathUtils.lerp(-0.2, -0.42, sp);
        leftArmRZ = THREE.MathUtils.lerp(-0.06, -0.18, sp);
        rightArmRZ = THREE.MathUtils.lerp(0.06, 0.18, sp);
        headRX = 0.08;
        headRY = Math.sin(t * 0.3 + this.seed) * 0.12;
      }
    } else if (isAtBreak) {
      // Standing at barista coffee counter sipping espresso
      torsoX = -0.08;
      torsoRZ = 0.04;
      torsoY = 2.58 + breathY;
      torsoRX = breathChest;
      hipY = 1.68;
      rightHipRX = -0.12;
      rightKneeRX = 0.24;
      leftArmRX = -0.12;
      leftArmRZ = -0.12;

      const sipPhase = (Math.sin(t * 0.7 + this.seed) + 1) / 2;
      const sip = THREE.MathUtils.smoothstep(sipPhase, 0.70, 0.96);
      rightArmRX = THREE.MathUtils.lerp(-0.45, -2.44, sip);
      rightArmRZ = THREE.MathUtils.lerp(0.08, -0.56, sip);
      headRX = -sip * 0.10;
      this.cup.rotation.set(-rightArmRX - sip * 0.2, 0, -rightArmRZ);
    } else {
      // Natural standing idle
      hipY = 1.7;
      torsoY = 2.6 + breathY;
      leftHipRX = 0;
      rightHipRX = -0.08;
      rightKneeRX = 0.16;
      leftArmRX = -0.12;
      rightArmRX = -0.12;
      leftArmRZ = -0.08;
      rightArmRZ = 0.08;
      headRY = Math.sin(t * 0.35 + this.seed) * 0.12;
    }

    const pose = (
      mesh: THREE.Object3D,
      x: number,
      y: number,
      z: number,
      rx = 0,
      ry = 0,
      rz = 0,
    ) => {
      mesh.position.set(x, y, z);
      mesh.rotation.set(rx, ry, rz);
    };

    pose(this.torso, torsoX, torsoY, torsoZ, torsoRX, 0, torsoRZ);
    pose(this.head, 0, 1.45, 0, headRX, headRY);
    pose(this.leftArm, -1.18, 0.8, 0, leftArmRX, 0, leftArmRZ);
    pose(this.rightArm, 1.18, 0.8, 0, rightArmRX, 0, rightArmRZ);
    pose(this.leftLeg, -0.42, hipY, hipZ, leftHipRX);
    pose(this.rightLeg, 0.42, hipY, hipZ, rightHipRX);
    pose(this.leftShin, 0, -0.85, 0, leftKneeRX);
    pose(this.rightShin, 0, -0.85, 0, rightKneeRX);
  }

  public tick(delta: number, simSpeed: number, otherControllers: AvatarMovementController[] = []): void {
    if (
      this.disposed ||
      !Number.isFinite(delta) ||
      !Number.isFinite(simSpeed) ||
      delta <= 0
    ) {
      return;
    }

    const realDt = Math.min(delta, 0.05);
    const dt = Math.min(realDt * Math.max(0, simSpeed), 0.05);
    if (dt <= 0) return;

    this.elapsed += dt;

    if (this.isGreeting) {
      this.greetingRemaining -= realDt;
      if (this.greetingRemaining <= 0) {
        this.isGreeting = false;
        this.refreshBillboard();
      }
    }

    // 1. Synchronize Hermes Status with Controller
    const isHermesBusy = this.isWorking() || !!this.state.activeTool || this.state.currentTask?.status === 'running';
    if (this.controller.isHermesWorking !== isHermesBusy) {
      this.controller.setHermesStatus(isHermesBusy);
    }

    // 2. Autonomous Idle Decisions (only when idle and seated at desk)
    if (!isHermesBusy) {
      if (this.controller.isSeated() && this.controller.phase === 'SEATED_IDLE') {
        this.actionTimer += dt;
        if (this.actionTimer >= 22 + (this.seed % 14)) {
          this.actionTimer = 0;
          this.chooseIdleDestination();
        }
      } else if (this.controller.phase === 'IDLE_STANDING') {
        this.actionTimer += dt;
        if (this.actionTimer >= 14 + (this.seed % 10)) {
          this.actionTimer = 0;
          this.returnToDesk();
        }
      }
    }

    // 3. Update Controller Locomotion & State Machine
    this.controller.update(dt, otherControllers);

    // 4. Update Position from Controller
    this.currentX = this.controller.x;
    this.currentY = this.controller.y;
    this.currentZ = this.controller.z;
    this.targetRotY = this.controller.rotationY;

    if (this.jumpOffset > 0 || this.jumpVelocity > 0) {
      this.jumpOffset +=
        this.jumpVelocity * dt - 0.5 * this.gravity * dt * dt;
      this.jumpVelocity -= this.gravity * dt;

      if (this.jumpOffset <= 0) {
        this.jumpOffset = 0;
        this.jumpVelocity = 0;
      }
    }

    this.group.position.set(
      this.controller.x,
      this.controller.y + this.jumpOffset,
      this.controller.z,
    );
    this.group.rotation.y = this.controller.rotationY;

    // 5. Apply Procedural Skeletal Posture
    this.applyPosture(this.controller.isWalking, dt);

    // 6. Billboard & MicroDot
    const isWorking = isHermesBusy || this.controller.phase === 'SEATED_WORKING';
    let targetPill = 0;
    if (this.isGreeting) targetPill = 1;
    else if (this.isSelected) targetPill = 1;
    else if (isWorking) targetPill = 1;
    else targetPill = 0;

    this.pillScaleLerp = THREE.MathUtils.damp(this.pillScaleLerp, targetPill, 10, dt);

    if (this.pillScaleLerp > 0.01) {
      this.billboard.visible = true;
      const s = this.pillScaleLerp;
      this.billboard.scale.set(5.3 * s, 1.7 * s, 1);
      const pillBob = Math.sin(this.elapsed * 1.8 + this.seed) * 0.05;
      this.billboard.position.y = this.billboardY + pillBob;
    } else {
      this.billboard.visible = false;
      this.billboard.scale.set(0, 0, 0);
    }

    if (this.pillScaleLerp < 0.98) {
      this.microDot.visible = true;
      const dotProgress = 1 - this.pillScaleLerp;
      const breathe = 1 + Math.sin(this.elapsed * 2.2 + this.seed) * 0.16;
      const dotScale = 0.95 * dotProgress * breathe;
      this.microDot.scale.set(dotScale, dotScale, 1);
      this.microDot.position.y = 1.45 + Math.sin(this.elapsed * 1.5 + this.seed) * 0.05;
    } else {
      this.microDot.visible = false;
      this.microDot.scale.set(0, 0, 0);
    }
  }"""

# Use regex to find and replace
m = re.search(old_posture_and_tick_pattern, text, re.DOTALL)
if m:
    text = text[:m.start()] + new_posture_and_tick + text[m.end():]
    print("Replaced applyPosture and tick successfully!")
else:
    print("Could not match old_posture_and_tick_pattern via regex")

with open('/root/projects/hermes-virtual-office/src/engine/RobloxOffice3D.ts', 'w') as f:
    f.write(text)

print("Step 2 done")
