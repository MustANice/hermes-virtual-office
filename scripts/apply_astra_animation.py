with open('/root/projects/hermes-virtual-office/src/engine/RobloxOffice3D.ts', 'r') as f:
    code = f.read()

# 1. Add private seed: number; in RobloxAvatar3D properties
code = code.replace(
    "  private cup: THREE.Group;",
    "  private cup: THREE.Group;\n  private seed: number;"
)

# 2. Initialize seed in constructor
code = code.replace(
    "    this.group.name = `agent_${state.id}`;",
    "    this.group.name = `agent_${state.id}`;\n    this.seed = (state.id.charCodeAt(0) * 17 + state.id.length * 23) % 100;"
)

# 3. Replace applyPosture with world-class procedural animation system (Astra Blueprint)
start_marker = "  private applyPosture(walking: boolean, dt: number): void {"
end_marker = "  public tick(delta: number, simSpeed: number): void {"

start_idx = code.find(start_marker)
end_idx = code.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print(f"Error finding markers: start={start_idx}, end={end_idx}")
    exit(1)

new_posture_and_tick = """  private applyPosture(walking: boolean, dt: number): void {
    const t = this.elapsed;
    const working = this.isWorking();

    // Standing condition: strictly when walking or when idle at non-seating spots
    const standing = walking || (!working && (
      this.currentLocation === 'coffee' ||
      this.currentLocation === 'meeting' ||
      this.currentLocation === 'other'
    ));

    this.isSitting = !standing;

    // Cup visibility at coffee counter
    this.cup.visible = !walking && !working && (this.currentLocation === 'coffee');

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

    // Organic Respiration / Breathing Layer (Astra Blueprint - desynchronized per agent)
    const breathCycle = Math.sin(t * 1.5 + this.seed);
    const breathY = breathCycle * 0.024;
    const breathChest = breathCycle * 0.018;

    if (walking) {
      // Natural walking gait with spring step & torso forward lean
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
      torsoRX = 0.055; // natural forward momentum lean
      headRY = 0;
    } else if (working) {
      // 100% MATHEMATICAL SEATED TYPING POSTURE (Facing monitors!)
      hipY = 1.44;
      hipZ = 0.08;
      torsoY = 2.34 + breathY * 0.6;
      torsoZ = -0.04;
      torsoRX = 0.08 + breathChest * 0.5; // slight forward lean into keyboard

      // Thighs project horizontally forward:
      leftHipRX = -Math.PI / 2;
      rightHipRX = -Math.PI / 2;

      // Knees bend 90° downward into legwell:
      leftKneeRX = Math.PI / 2;
      rightKneeRX = Math.PI / 2;

      // Realistic Developer Cadence: 4.2s typing burst alternating hands, 1.8s reading code pause
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
        headRY = Math.sin(t * 0.8 + this.seed) * 0.14; // scanning dual monitors
      } else {
        // Thoughtful pause reading the screen:
        leftArmRX = -1.22;
        rightArmRX = -1.22;
        leftArmRZ = 0.22;
        rightArmRZ = -0.22;
        headRX = 0.12;
        headRY = Math.sin(t * 0.35 + this.seed) * 0.24; // glancing at terminal logs
      }
    } else if (this.currentLocation === 'sofa') {
      // Relaxed lounging on sofa
      hipY = 1.28;
      hipZ = 0.22;
      torsoY = 2.18 + breathY * 0.5;
      torsoZ = -0.20;
      torsoRX = -0.24 + breathChest * 0.4; // relaxed slouch against sofa backrest

      leftHipRX = -1.22; // legs casually stretched forward
      rightHipRX = -1.15;
      leftKneeRX = 0.68;
      rightKneeRX = 0.62;

      leftArmRX = -0.22;
      rightArmRX = -0.22;
      leftArmRZ = -0.32;
      rightArmRZ = 0.32;
      headRX = 0.08 + Math.sin(t * 0.4 + this.seed) * 0.02;
      headRY = Math.sin(t * 0.3 + this.seed) * 0.18;
    } else if (this.currentLocation === 'coffee') {
      // Standing at barista coffee counter sipping espresso
      torsoX = -0.08;
      torsoRZ = 0.04;
      torsoY = 2.58 + breathY;
      torsoRX = breathChest;
      hipY = 1.68;
      rightHipRX = -0.12;
      rightKneeRX = 0.24; // relaxed contrapposto stance

      leftArmRX = -0.12;
      leftArmRZ = -0.12;

      // Barista espresso sip sequence:
      const sipPhase = (Math.sin(t * 0.7 + this.seed) + 1) / 2;
      const sip = THREE.MathUtils.smoothstep(sipPhase, 0.70, 0.96);
      rightArmRX = THREE.MathUtils.lerp(-0.45, -2.44, sip);
      rightArmRZ = THREE.MathUtils.lerp(0.08, -0.56, sip);
      headRX = -sip * 0.10;

      this.cup.rotation.set(-rightArmRX - sip * 0.2, 0, -rightArmRZ);
    } else if (!standing) {
      // Idle seated at desk: relaxed lean-back with arms on armrests
      hipY = 1.44;
      hipZ = 0.08;
      torsoY = 2.34 + breathY * 0.6;
      torsoZ = -0.08;
      torsoRX = -0.16 + breathChest * 0.4; // relaxed lean-back

      leftHipRX = -Math.PI / 2;
      rightHipRX = -Math.PI / 2;
      leftKneeRX = Math.PI / 2;
      rightKneeRX = Math.PI / 2;

      leftArmRX = -0.45;
      rightArmRX = -0.45;
      leftArmRZ = -0.32;
      rightArmRZ = 0.32;
      headRX = 0.04 + Math.sin(t * 0.6 + this.seed) * 0.02;
      headRY = Math.sin(t * 0.45 + this.seed) * 0.22;
    } else {
      // General standing idle
      torsoY = 2.6 + breathY;
      torsoRX = breathChest;
    }

    if (this.isGreeting) {
      rightArmRX = -2.45;
      rightArmRZ = 0.2 + Math.sin(t * 12) * 0.3;
      this.cup.visible = false;
    }

    const alpha = dt > 0 ? 1 - Math.exp(-15 * dt) : 1;
    const blend = (value: number, target: number): number =>
      THREE.MathUtils.lerp(value, target, alpha);

    const pose = (
      mesh: THREE.Mesh,
      x: number,
      y: number,
      z: number,
      rx: number,
      ry = 0,
      rz = 0,
    ): void => {
      mesh.position.set(
        blend(mesh.position.x, x),
        blend(mesh.position.y, y),
        blend(mesh.position.z, z),
      );
      mesh.rotation.set(
        blend(mesh.rotation.x, rx),
        blend(mesh.rotation.y, ry),
        blend(mesh.rotation.z, rz),
      );
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

"""

code = code[:start_idx] + new_posture_and_tick + code[end_idx:]

# 4. In tick(), add buoyant floating thought cloud dynamics
tick_target = "    this.applyPosture(walking, dt);"
tick_replacement = """    this.applyPosture(walking, dt);

    // Buoyant Thought Cloud Levitation Physics (Astra Blueprint)
    const cloudBob = Math.sin(this.elapsed * 1.6 + this.seed) * 0.11;
    this.billboard.position.y = this.billboardY + cloudBob;"""

code = code.replace(tick_target, tick_replacement)

with open('/root/projects/hermes-virtual-office/src/engine/RobloxOffice3D.ts', 'w') as f:
    f.write(code)

print("SUCCESS: RobloxOffice3D.ts upgraded with Astra Animation Mastery!")
