import re

with open('/root/projects/hermes-virtual-office/src/engine/RobloxOffice3D.ts', 'r') as f:
    text = f.read()

# 1. Add import of findPathThroughDoors and Point2D
text = text.replace(
    "import { createOfficeFloorPlan, OfficeFloorPlan } from './OfficeFloorPlan';",
    "import { createOfficeFloorPlan, OfficeFloorPlan } from './OfficeFloorPlan';\nimport { findPathThroughDoors, Point2D } from './OfficeNavMesh';"
)

# 2. Add FLEET_ACTIVITY_SPOTS and occupancy manager
spots_code = """
// Dedicated fleet activity spots with strict occupancy reservation (Zero character merging!)
export const FLEET_ACTIVITY_SPOTS = {
  coffee: [
    { id: 'coffee_1', x: -5.5, y: 0.12, z: 9.8, rotY: 0 },
    { id: 'coffee_2', x: -3.8, y: 0.12, z: 9.8, rotY: 0 },
    { id: 'coffee_3', x: -2.2, y: 0.12, z: 9.8, rotY: 0 },
  ],
  sofa: [
    { id: 'sofa_1', x: -5.8, y: 0.12, z: 14.5, rotY: 0 },
    { id: 'sofa_2', x: -4.0, y: 0.12, z: 14.5, rotY: 0 },
    { id: 'sofa_3', x: -2.2, y: 0.12, z: 14.5, rotY: 0 },
    { id: 'sofa_4', x: -7.0, y: 0.12, z: 16.0, rotY: Math.PI / 2 },
  ],
  meeting: [
    { id: 'meet_1', x: -3.8, y: 0.12, z: -5.12, rotY: 0 },
    { id: 'meet_2', x: 0.0, y: 0.12, z: -5.12, rotY: 0 },
    { id: 'meet_3', x: 3.8, y: 0.12, z: -5.12, rotY: 0 },
    { id: 'meet_4', x: -3.8, y: 0.12, z: 0.12, rotY: Math.PI },
    { id: 'meet_5', x: 0.0, y: 0.12, z: 0.12, rotY: Math.PI },
    { id: 'meet_6', x: 3.8, y: 0.12, z: 0.12, rotY: Math.PI },
  ],
};

const OCCUPIED_SPOTS = new Map<string, string>(); // spotId -> agentId

export function releaseAgentSpot(agentId: string) {
  for (const [spotId, occId] of OCCUPIED_SPOTS.entries()) {
    if (occId === agentId) {
      OCCUPIED_SPOTS.delete(spotId);
    }
  }
}
"""

text = text.replace("// War Room / A2A Conference Table Seats (Hexagonal Table with 6 Integrated Seats)", spots_code + "\n// War Room / A2A Conference Table Seats (Hexagonal Table with 6 Integrated Seats)")

# 3. Update RobloxAvatar3D constructor: add group scale and waypoints
avatar_init_old = """    this.group = new THREE.Group();
    this.group.name = `agent_${state.id}`;"""

avatar_init_new = """    this.group = new THREE.Group();
    this.group.name = `agent_${state.id}`;
    // Proportional humanoid scale: fits seamlessly inside 4.2m partition walls and chairs!
    this.group.scale.set(0.68, 0.68, 0.68);"""

text = text.replace(avatar_init_old, avatar_init_new)

# Add waypoints property to RobloxAvatar3D
prop_old = """  public isSitting = false;
  public walkTime = 0;
  public state: AgentState;"""

prop_new = """  public isSitting = false;
  public walkTime = 0;
  public state: AgentState;
  public waypoints: Point2D[] = [];"""

text = text.replace(prop_old, prop_new)

# Add navigateTo method and update tick method
old_methods_start = "  public onUserClick() {"
old_methods_end = "export class RobloxOffice3D {"

start_idx = text.find(old_methods_start)
end_idx = text.find(old_methods_end)

if start_idx != -1 and end_idx != -1:
    replacement = """  public onUserClick() {
    this.jumpVelocity = 0.35;
    this.isGreeting = true;
    this.refreshBillboard();
    setTimeout(() => {
      this.isGreeting = false;
      this.refreshBillboard();
    }, 4000);
  }

  public refreshBillboard() {
    this.group.remove(this.billboard);
    this.billboard = this.createBillboard(this.state);
    this.billboard.position.y = 4.2;
    this.group.add(this.billboard);
  }

  public updateState(newState: AgentState) {
    this.state = newState;
    this.refreshBillboard();
  }

  /**
   * Plans a doorway-guided path through partitions and corridors,
   * guaranteeing the avatar passes through open doors instead of walking through walls!
   */
  public navigateTo(destX: number, destY: number, destZ: number, targetRotY: number) {
    this.targetX = destX;
    this.targetY = destY;
    this.targetZ = destZ;
    this.targetRotY = targetRotY;

    const path = findPathThroughDoors(
      { x: this.currentX, z: this.currentZ },
      { x: destX, z: destZ }
    );
    this.waypoints = path;
  }

  public tick(delta: number, simSpeed: number) {
    // 1. Autonomous Action Loop across 7-Room Zones for idle agents (With strict non-merging spot reservation!)
    this.actionTimer += delta * simSpeed;
    if (this.actionTimer > 32 && this.state.status === 'idle') {
      this.actionTimer = 0;
      const choices = ['home', 'coffee', 'meeting', 'sofa'];
      const pick = choices[Math.floor(Math.random() * choices.length)];

      if (pick === 'home') {
        releaseAgentSpot(this.id);
        const spot = AGENT_3D_SPOTS[this.id];
        if (spot) {
          this.navigateTo(spot.x, spot.y, spot.z, spot.rotY);
        }
      } else {
        const spots = FLEET_ACTIVITY_SPOTS[pick as keyof typeof FLEET_ACTIVITY_SPOTS] || [];
        const available = spots.filter((s) => !OCCUPIED_SPOTS.has(s.id) || OCCUPIED_SPOTS.get(s.id) === this.id);
        if (available.length > 0) {
          const chosen = available[Math.floor(Math.random() * available.length)];
          releaseAgentSpot(this.id);
          OCCUPIED_SPOTS.set(chosen.id, this.id);
          this.navigateTo(chosen.x, chosen.y, chosen.z, chosen.rotY);
        } else {
          // If target area full, return to assigned home desk
          releaseAgentSpot(this.id);
          const spot = AGENT_3D_SPOTS[this.id];
          if (spot) {
            this.navigateTo(spot.x, spot.y, spot.z, spot.rotY);
          }
        }
      }
    }

    // 2. Doorway-Guided Movement Physics
    if (this.waypoints.length > 0) {
      const nextWp = this.waypoints[0];
      const dx = nextWp.x - this.currentX;
      const dz = nextWp.z - this.currentZ;
      const distHoriz = Math.hypot(dx, dz);

      // Reached doorway threshold! Advance to next waypoint
      if (distHoriz < 0.45) {
        this.waypoints.shift();
      } else {
        this.isSitting = false;
        const speed = 7.2 * delta * simSpeed;
        const moveX = (dx / distHoriz) * Math.min(distHoriz, speed);
        const moveZ = (dz / distHoriz) * Math.min(distHoriz, speed);
        this.currentX += moveX;
        this.currentZ += moveZ;
        this.currentY += (this.targetY - this.currentY) * 0.15;
        this.group.position.set(this.currentX, this.currentY, this.currentZ);

        this.group.rotation.y = Math.atan2(dx, dz);

        this.walkTime += delta * 15 * simSpeed;
        const walkAngle = Math.sin(this.walkTime) * 0.85;

        this.leftLeg.position.set(-0.42, 1.2, 0);
        this.rightLeg.position.set(0.42, 1.2, 0);
        this.leftLeg.rotation.x = walkAngle;
        this.rightLeg.rotation.x = -walkAngle;
        this.leftShin.rotation.x = Math.max(0, -walkAngle * 0.4);
        this.rightShin.rotation.x = Math.max(0, walkAngle * 0.4);
        this.leftArm.rotation.x = -walkAngle;
        this.rightArm.rotation.x = walkAngle;
        this.torso.position.y = 2.1 + Math.abs(Math.sin(this.walkTime * 2)) * 0.2;
      }
    } else {
      // Arrived at destination! Face target direction and sit comfortably
      this.currentX = this.targetX;
      this.currentY = this.targetY;
      this.currentZ = this.targetZ;
      this.group.position.set(this.currentX, this.currentY, this.currentZ);
      this.group.rotation.y = this.targetRotY;
      this.isSitting = true;

      // Click Jump Animation
      if (this.jumpVelocity > 0) {
        this.group.position.y += this.jumpVelocity;
        this.jumpVelocity -= 0.03;
        if (this.group.position.y < this.currentY) {
          this.group.position.y = this.currentY;
          this.jumpVelocity = 0;
        }
      }

      if (this.isGreeting) {
        this.rightArm.rotation.x = -Math.PI / 1.3;
        this.rightArm.rotation.z = Math.sin(performance.now() * 0.02) * 0.4;
      }

      if (this.isSitting) {
        // Natural Sitting Posture (Zero desk/chair clipping)
        this.torso.position.y = 1.35;
        this.leftLeg.position.set(-0.42, 0.88, 0.12);
        this.rightLeg.position.set(0.42, 0.88, 0.12);
        this.leftLeg.rotation.x = -Math.PI / 2; // Thigh rests horizontally on chair cushion
        this.rightLeg.rotation.x = -Math.PI / 2;
        this.leftShin.rotation.x = Math.PI / 2;  // Knee bends 90 deg down, shin hangs vertically into legwell
        this.rightShin.rotation.x = Math.PI / 2;

        if (this.state.status === 'working' || this.state.status === 'tool_call') {
          const typeAngle = Math.sin(performance.now() * 0.025) * 0.2;
          this.leftArm.rotation.x = -Math.PI / 2.5 + typeAngle;
          this.rightArm.rotation.x = -Math.PI / 2.5 - typeAngle;
          this.head.rotation.y = Math.sin(performance.now() * 0.005) * 0.12;
          this.head.rotation.x = 0.08;
        } else if (!this.isGreeting) {
          const sip = Math.sin(performance.now() * 0.002);
          if (sip > 0.8) {
            this.rightArm.rotation.x = -Math.PI / 1.8;
            this.leftArm.rotation.x = -0.3;
          } else {
            this.leftArm.rotation.x = -0.4;
            this.rightArm.rotation.x = -0.4;
          }
          this.head.rotation.y = Math.sin(performance.now() * 0.001) * 0.08;
          this.head.rotation.x = 0.05;
        }
      }
    }
  }
}

"""
    text = text[:start_idx] + replacement + text[end_idx:]
    with open('/root/projects/hermes-virtual-office/src/engine/RobloxOffice3D.ts', 'w') as f:
        f.write(text)
    print("SUCCESS: integrated doorway pathfinding and anti-merging system!")
else:
    print(f"FAILED: start_idx={start_idx}, end_idx={end_idx}")
