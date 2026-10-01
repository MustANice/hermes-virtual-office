with open('/root/projects/hermes-virtual-office/src/engine/RobloxOffice3D.ts', 'r') as f:
    text = f.read()

# 1. Add debugVisualizer property
prop_to_add = "  public floorPlan?: OfficeFloorPlan;\n  public debugVisualizer!: OfficeDebugVisualizer;"
text = text.replace("  public floorPlan?: OfficeFloorPlan;", prop_to_add)

# 2. Initialize debugVisualizer in constructor
init_to_add = """    this.buildOfficeLayout();
    this.debugVisualizer = new OfficeDebugVisualizer();
    this.scene.add(this.debugVisualizer.group);"""
text = text.replace("    this.buildOfficeLayout();", init_to_add)

# 3. Update loop to pass controllers
old_loop = """  private loop = (now: number) => {
    const delta = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    // 1. Tick Avatars
    for (const avatar of this.avatars.values()) {
      avatar.tick(delta, this.simSpeed);
    }

    // 2. Animate Floor Plan (Spinning A2A Hologram & Server LEDs)
    if (this.floorPlan) {
      this.floorPlan.update(now * 0.001);
    }

    // 3. Living Props & Workstation Lighting (Atelier Japandi)
    this.coffeeSteam?.update(delta, now * 0.001);
    this.updateWorkstationLighting(delta);

    // 4. Smooth Camera Lerp Interpolation (Astra Blueprint)
    const alpha = 1 - Math.exp(-6 * delta);
    this.camera.position.lerp(this.desiredCameraPos, alpha);
    this.smoothTarget.lerp(this.desiredCameraTarget, alpha);
    this.camera.lookAt(this.smoothTarget);

    this.renderer.render(this.scene, this.camera);
    this.rafId = requestAnimationFrame(this.loop);
  };"""

new_loop = """  private loop = (now: number) => {
    const delta = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;

    // 1. Collect all controllers for local avoidance
    const controllers = Array.from(this.avatars.values()).map((a) => a.controller);

    // 2. Tick Avatars with full local avoidance
    for (const avatar of this.avatars.values()) {
      avatar.tick(delta, this.simSpeed, controllers);
    }

    // 3. Update debug visualizer
    if (this.debugVisualizer && this.debugVisualizer.isEnabled) {
      this.debugVisualizer.update(controllers);
    }

    // 4. Animate Floor Plan
    if (this.floorPlan) {
      this.floorPlan.update(now * 0.001);
    }

    // 5. Living Props & Workstation Lighting
    this.coffeeSteam?.update(delta, now * 0.001);
    this.updateWorkstationLighting(delta);

    // 6. Smooth Camera Lerp Interpolation
    const alpha = 1 - Math.exp(-6 * delta);
    this.camera.position.lerp(this.desiredCameraPos, alpha);
    this.smoothTarget.lerp(this.desiredCameraTarget, alpha);
    this.camera.lookAt(this.smoothTarget);

    this.renderer.render(this.scene, this.camera);
    this.rafId = requestAnimationFrame(this.loop);
  };"""

if old_loop in text:
    text = text.replace(old_loop, new_loop)
    print("Replaced loop with controllers and debugVisualizer update!")
else:
    print("Could not find old_loop")

# 4. Update updateAgentsData
old_meeting = """      } else if (state.status === 'meeting' && prevStatus !== 'meeting') {
        const meetingSeats = FLEET_ACTIVITY_SPOTS.meeting;
        const available = meetingSeats.filter((s) => !OCCUPIED_SPOTS.has(s.id) || OCCUPIED_SPOTS.get(s.id) === id);
        if (available.length > 0) {
          releaseAgentSpot(id);
          OCCUPIED_SPOTS.set(available[0].id, id);
          avatar.navigateTo(available[0].x, available[0].y, available[0].z, available[0].rotY);
        }
      }"""

new_meeting = """      } else if (state.status === 'meeting' && prevStatus !== 'meeting') {
        const confChair = findAvailableChair('meeting', 'conference');
        if (confChair) {
          avatar.controller.navigateToChair(confChair);
        }
      }"""

if old_meeting in text:
    text = text.replace(old_meeting, new_meeting)
    print("Replaced meeting logic with conference chair routing!")
else:
    print("Could not find old_meeting")

with open('/root/projects/hermes-virtual-office/src/engine/RobloxOffice3D.ts', 'w') as f:
    f.write(text)

print("Step 3 applied!")
