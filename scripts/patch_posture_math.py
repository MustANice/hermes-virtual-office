with open('/root/projects/hermes-virtual-office/src/engine/RobloxOffice3D.ts', 'r') as f:
    text = f.read()

# 1. Fix AGENT_3D_SPOTS: correct rotY so every agent faces their monitors!
old_spots = """export const AGENT_3D_SPOTS: Record<string, { x: number; y: number; z: number; rotY: number }> = {
  // 1. Executive Suite (NW: ORION, faces South into the office)
  orion: { x: -21, y: 0.12, z: -16.15, rotY: Math.PI },

  // 2. Development Lab (North: FORGE, FRAME, AURORA)
  forge: { x: -5.3, y: 0.12, z: -17.1, rotY: 0 },
  frame: { x: 5.3, y: 0.12, z: -17.1, rotY: 0 },
  aurora: { x: 0, y: 0.12, z: -13.2, rotY: 0 },

  // 3. Research & Intel (NE: QUANT, RADAR)
  quant: { x: 17.0, y: 0.12, z: -13.0, rotY: 0 },
  radar: { x: 24.6, y: 0.12, z: -13.0, rotY: 0 },

  // 4. QA & Hardening (SW: PRISM, LENS)
  prism: { x: -25.35, y: 0.12, z: 9.8, rotY: 0 },
  lens: { x: -17.55, y: 0.12, z: 9.8, rotY: 0 },

  // 5. Lounge & Operations (South: SENTINEL, NEXUS)
  sentinel: { x: -3.85, y: 0.12, z: 10.45, rotY: -Math.PI / 2 },
  nexus: { x: 5.2, y: 0.12, z: 12.3, rotY: 0 },

  // 6. SRE & Infrastructure (SE: ATLAS)
  atlas: { x: 17.3, y: 0.12, z: 10.4, rotY: 0 },
};"""

new_spots = """export const AGENT_3D_SPOTS: Record<string, { x: number; y: number; z: number; rotY: number }> = {
  // 1. Executive Suite: Orion workstation is rotated by Math.PI, chair is at North (-16.27), faces South (rotY = 0) towards monitors!
  orion: { x: -21.0, y: 0.12, z: -16.27, rotY: 0 },

  // 2. Development Lab: Desks at Z = -18.65, monitors at North (-19.19), chair at South (-16.98), faces North (rotY = Math.PI)!
  forge: { x: -5.3, y: 0.12, z: -16.98, rotY: Math.PI },
  frame: { x: 5.3, y: 0.12, z: -16.98, rotY: Math.PI },
  aurora: { x: 0.0, y: 0.12, z: -13.08, rotY: Math.PI },

  // 3. Research & Intel: Desks at Z = -14.55, monitors at North (-15.09), chair at South (-12.88), faces North (rotY = Math.PI)!
  quant: { x: 17.0, y: 0.12, z: -12.88, rotY: Math.PI },
  radar: { x: 24.6, y: 0.12, z: -12.88, rotY: Math.PI },

  // 4. QA & Hardening: Desks at Z = 8.25, monitors at North (7.71), chair at South (9.92), faces North (rotY = Math.PI)!
  prism: { x: -25.35, y: 0.12, z: 9.92, rotY: Math.PI },
  lens: { x: -17.55, y: 0.12, z: 9.92, rotY: Math.PI },

  // 5. Lounge & Operations
  sentinel: { x: -21.25, y: 0.12, z: 15.47, rotY: Math.PI },
  nexus: { x: 5.2, y: 0.12, z: 12.42, rotY: Math.PI },

  // 6. SRE & Infrastructure: Desk at Z = 8.85, monitors at North (8.31), chair at South (10.52), faces North (rotY = Math.PI)!
  atlas: { x: 17.3, y: 0.12, z: 10.52, rotY: Math.PI },
};"""

text = text.replace(old_spots, new_spots)

# 2. Fix IDLE_LOCATIONS in constructor so rotY matches the target seats
old_constructor_idle = """    // Flexible idle postures and locations (when not working, disperse across cafe, sofa, war room, etc.)
    const IDLE_LOCATIONS: Record<string, { x: number; y: number; z: number; rotY: number; loc: 'desk' | 'coffee' | 'sofa' | 'meeting' | 'other' }> = {
      sentinel: { x: -3.8, y: 0.12, z: 9.8, rotY: 0, loc: 'coffee' },              // standing at coffee counter sipping espresso
      nexus: { x: -4.0, y: 0.12, z: 14.5, rotY: 0, loc: 'sofa' },                   // lounging casually on sofa
      aurora: { x: 0.0, y: 0.12, z: -5.12, rotY: 0, loc: 'meeting' },              // standing at War Room reviewing hologram
      frame: { x: 0.0, y: 0.12, z: -1.5, rotY: Math.PI, loc: 'other' },             // strolling in central corridor
      radar: { x: 23.5, y: 0.12, z: -15.5, rotY: 0, loc: 'other' },                 // standing by Research data wall
      prism: { x: -21.0, y: 0.12, z: 6.5, rotY: 0, loc: 'other' },                  // standing by QA telemetry screen
      atlas: { x: 21.0, y: 0.12, z: 8.0, rotY: -Math.PI / 2, loc: 'other' },        // standing by datacenter server racks
      lens: { x: -17.55, y: 0.12, z: 9.8, rotY: 0, loc: 'desk' },                  // relaxed lean-back at desk
      quant: { x: 17.0, y: 0.12, z: -13.0, rotY: 0, loc: 'desk' },                 // relaxed lean-back at desk
      forge: { x: -5.3, y: 0.12, z: -17.1, rotY: 0, loc: 'desk' },                 // relaxed lean-back at desk
      orion: { x: -21, y: 0.12, z: -16.15, rotY: Math.PI, loc: 'desk' },            // deep executive lean-back
    };"""

new_constructor_idle = """    // Flexible idle postures and locations (when not working, disperse across cafe, sofa, war room, etc.)
    const IDLE_LOCATIONS: Record<string, { x: number; y: number; z: number; rotY: number; loc: 'desk' | 'coffee' | 'sofa' | 'meeting' | 'other' }> = {
      sentinel: { x: -3.8, y: 0.12, z: 9.8, rotY: 0, loc: 'coffee' },
      nexus: { x: -4.0, y: 0.12, z: 14.5, rotY: 0, loc: 'sofa' },
      aurora: { x: 0.0, y: 0.12, z: -5.12, rotY: 0, loc: 'meeting' },
      frame: { x: 0.0, y: 0.12, z: -1.5, rotY: Math.PI, loc: 'other' },
      radar: { x: 23.5, y: 0.12, z: -15.5, rotY: 0, loc: 'other' },
      prism: { x: -21.0, y: 0.12, z: 6.5, rotY: 0, loc: 'other' },
      atlas: { x: 21.0, y: 0.12, z: 8.0, rotY: -Math.PI / 2, loc: 'other' },
      lens: { x: -17.55, y: 0.12, z: 9.92, rotY: Math.PI, loc: 'desk' },
      quant: { x: 17.0, y: 0.12, z: -12.88, rotY: Math.PI, loc: 'desk' },
      forge: { x: -5.3, y: 0.12, z: -16.98, rotY: Math.PI, loc: 'desk' },
      orion: { x: -21.0, y: 0.12, z: -16.27, rotY: 0, loc: 'desk' },
    };"""

text = text.replace(old_constructor_idle, new_constructor_idle)

# 3. Rewrite applyPosture completely with exact mathematical elevation and typing IK
old_posture_func_start = "  private applyPosture(walking: boolean, dt: number): void {"
old_posture_func_end = "  public tick(delta: number, simSpeed: number): void {"

new_posture_func = """  private applyPosture(walking: boolean, dt: number): void {
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
    let headRY = Math.sin(t * 0.5) * 0.06;

    if (walking) {
      // Natural walking swing
      const swing = Math.sin(this.walkTime) * 0.68;
      leftHipRX = swing;
      rightHipRX = -swing;
      leftKneeRX = Math.max(0, Math.cos(this.walkTime)) * 0.85;
      rightKneeRX = Math.max(0, -Math.cos(this.walkTime)) * 0.85;
      leftArmRX = -swing * 0.8;
      rightArmRX = swing * 0.8;
      torsoY = 2.6 + Math.abs(Math.sin(this.walkTime)) * 0.055;
      torsoRX = 0.035;
      headRY = 0;
    } else if (working) {
      // 100% MATHEMATICAL SEATED TYPING POSTURE (Facing monitors!)
      // Pelvis rests right on top of chair cushion at World Y = 1.10
      hipY = 1.44;
      hipZ = 0.08;
      torsoY = 2.34;
      torsoZ = -0.04;
      torsoRX = 0.08; // slight forward lean into keyboard

      // Thighs project horizontally forward:
      leftHipRX = -Math.PI / 2;
      rightHipRX = -Math.PI / 2;

      // Knees bend 90° downward: shins hang straight down into legwell towards floor!
      leftKneeRX = Math.PI / 2;
      rightKneeRX = Math.PI / 2;

      // Active keyboard typing hands animation:
      const typingLeft = Math.sin(t * 19) * 0.12;
      const typingRight = Math.sin(t * 19 + 1.7) * 0.12;
      leftArmRX = -1.32 + typingLeft;
      rightArmRX = -1.32 + typingRight;
      leftArmRZ = 0.24;  // angled inward over mechanical keyboard
      rightArmRZ = -0.24;

      // Head looking down at screen & scanning between monitors:
      headRX = 0.24;
      headRY = Math.sin(t * 1.2) * 0.14;
    } else if (this.currentLocation === 'sofa') {
      // Relaxed lounging on sofa
      hipY = 1.28;
      hipZ = 0.22;
      torsoY = 2.18;
      torsoZ = -0.20;
      torsoRX = -0.24; // relaxed slouch against sofa backrest

      leftHipRX = -1.22; // legs casually stretched forward
      rightHipRX = -1.15;
      leftKneeRX = 0.68;
      rightKneeRX = 0.62;

      leftArmRX = -0.22;
      rightArmRX = -0.22;
      leftArmRZ = -0.32;
      rightArmRZ = 0.32;
      headRX = 0.08;
    } else if (this.currentLocation === 'coffee') {
      // Standing at barista coffee counter sipping espresso
      torsoX = -0.08;
      torsoRZ = 0.04;
      torsoY = 2.58;
      hipY = 1.68;
      rightHipRX = -0.12;
      rightKneeRX = 0.24; // relaxed contrapposto stance

      leftArmRX = -0.12;
      leftArmRZ = -0.12;

      const sipPhase = (Math.sin(t * 0.8) + 1) / 2;
      const sip = THREE.MathUtils.smoothstep(sipPhase, 0.72, 0.98);
      rightArmRX = THREE.MathUtils.lerp(-0.45, -2.42, sip);
      rightArmRZ = THREE.MathUtils.lerp(0.08, -0.55, sip);
      headRX = -sip * 0.08;

      this.cup.rotation.set(-rightArmRX - sip * 0.18, 0, -rightArmRZ);
    } else if (!standing) {
      // Idle seated at desk: relaxed lean-back with arms on armrests
      hipY = 1.44;
      hipZ = 0.08;
      torsoY = 2.34;
      torsoZ = -0.08;
      torsoRX = -0.16; // relaxed lean-back

      leftHipRX = -Math.PI / 2;
      rightHipRX = -Math.PI / 2;
      leftKneeRX = Math.PI / 2;
      rightKneeRX = Math.PI / 2;

      leftArmRX = -0.45;
      rightArmRX = -0.45;
      leftArmRZ = -0.32;
      rightArmRZ = 0.32;
      headRX = 0.04;
      headRY = Math.sin(t * 0.5) * 0.22;
    }

    if (this.isGreeting) {
      rightArmRX = -2.45;
      rightArmRZ = 0.2 + Math.sin(t * 12) * 0.3;
      this.cup.visible = false;
    }

    const alpha = dt > 0 ? 1 - Math.exp(-14 * dt) : 1;
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

start_pos = text.find(old_posture_func_start)
end_pos = text.find(old_posture_func_end)

if start_pos != -1 and end_pos != -1:
    text = text[:start_pos] + new_posture_func + text[end_pos:]
    with open('/root/projects/hermes-virtual-office/src/engine/RobloxOffice3D.ts', 'w') as f:
        f.write(text)
    print("SUCCESS: applied mathematical seated posture and facing direction in RobloxOffice3D.ts!")
else:
    print(f"FAILED to find applyPosture markers: start_pos={start_pos}, end_pos={end_pos}")
