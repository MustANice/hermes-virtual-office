/**
 * AvatarMovementController.ts
 * Manages realistic humanoid movement, sitting state machine, local avoidance,
 * doorway queuing, and Hermes task synchronization.
 *
 * Implements Sections 4, 5, 6, 7 of the Realistic Office Movement Specification:
 * - Single authority over avatar world coordinates.
 * - State machine: IDLE -> RESERVE_SEAT -> WALK_TO_APPROACH -> ALIGN -> SIT_DOWN -> SEATED -> STAND_UP -> CLEAR_SEAT -> RELEASE_SEAT -> WALK/IDLE.
 * - Local avoidance & personal space clearance.
 * - Decoupled Hermes status from physical locomotion.
 */

import * as THREE from 'three';
import { OfficePathfinder, PathPoint } from './OfficePathfinder';
import {
  ChairDefinition,
  SittingPhase,
  CHAIR_REGISTRY,
  AGENT_HOME_CHAIRS,
  reserveChair,
  occupyChair,
  releaseChair,
  releaseAllAgentChairs,
  findAvailableChair,
} from './ChairInteractionSystem';
import { isPointWalkable, resolveCollision } from './SpatialCollisionModel';

export interface ControllerState {
  agentId: string;
  phase: SittingPhase;
  currentX: number;
  currentY: number;
  currentZ: number;
  rotationY: number;
  targetX: number;
  targetZ: number;
  targetRotY: number;
  velocity: number;
  currentSpeed: number;
  activeChair: ChairDefinition | null;
  waypoints: PathPoint[];
  stuckTime: number;
  sitTransitionProgress: number; // 0 (standing) to 1 (seated)
  isHermesWorking: boolean;
}

export class AvatarMovementController {
  public readonly agentId: string;
  public phase: SittingPhase = 'IDLE_STANDING';

  // Transform in world space
  public x = 0;
  public y = 0.08;
  public z = 0;
  public rotationY = 0;

  // Velocity and dynamics
  public currentSpeed = 0;
  public readonly maxSpeed = 3.6; // 3.6 m/s natural walking speed
  public readonly acceleration = 8.5; // m/s^2
  public readonly deceleration = 12.0; // m/s^2
  public readonly personalRadius = 0.55; // personal space radius in meters

  // Active path and destination
  public waypoints: PathPoint[] = [];
  public targetX = 0;
  public targetZ = 0;
  public targetRotY = 0;

  // Chair and seating interaction
  public assignedChair: ChairDefinition | null = null;
  public sitProgress = 0; // 0 = fully standing, 1 = fully seated
  private readonly sitTransitionDuration = 0.45; // seconds to sit down or stand up

  // Locomotion timing & step synchronization
  public stepDistanceTraveled = 0;
  public isWalking = false;
  private stuckTimer = 0;
  private lastPosition = { x: 0, z: 0 };

  // Hermes task state
  public isHermesWorking = false;

  private pathfinder: OfficePathfinder;

  constructor(agentId: string, initialX: number, initialZ: number, initialRotY = 0) {
    this.agentId = agentId;
    this.x = initialX;
    this.z = initialZ;
    this.rotationY = initialRotY;
    this.lastPosition = { x: initialX, z: initialZ };
    this.pathfinder = OfficePathfinder.getInstance();

    // Check if initial position is at a home chair
    const homeChairId = AGENT_HOME_CHAIRS[agentId];
    if (homeChairId) {
      const chair = CHAIR_REGISTRY.get(homeChairId);
      if (chair) {
        // Seat immediately at spawn at home desk
        this.assignedChair = chair;
        occupyChair(chair.chairId, agentId);
        this.x = chair.seatAnchor.x;
        this.z = chair.seatAnchor.z;
        this.rotationY = chair.facingAngle;
        this.phase = 'SEATED_IDLE';
        this.sitProgress = 1.0;
      }
    }
  }

  /**
   * Main update tick for movement, animation, and state machine.
   * Enforces bounded dt to prevent teleports on frame lag.
   */
  public update(
    rawDt: number,
    otherAgents: AvatarMovementController[] = [],
  ): void {
    // 1. Cap delta time to 50ms (handles tab switches & GC pauses safely)
    const dt = Math.min(rawDt, 0.05);

    // 2. State Machine Update
    switch (this.phase) {
      case 'IDLE_STANDING':
        this.currentSpeed = 0;
        this.isWalking = false;
        break;

      case 'RESERVE_SEAT':
        this.handleReserveSeat();
        break;

      case 'WALK_TO_APPROACH':
        this.handleWalkToApproach(dt, otherAgents);
        break;

      case 'ALIGNING':
        this.handleAligning(dt);
        break;

      case 'SITTING_DOWN':
        this.handleSittingDown(dt);
        break;

      case 'SEATED_WORKING':
      case 'SEATED_IDLE':
        this.currentSpeed = 0;
        this.isWalking = false;
        if (this.assignedChair) {
          // Lock pelvis position to seat anchor
          this.x = this.assignedChair.seatAnchor.x;
          this.z = this.assignedChair.seatAnchor.z;
          this.rotationY = this.assignedChair.facingAngle;
        }
        break;

      case 'STANDING_UP':
        this.handleStandingUp(dt);
        break;

      case 'CLEARING_SEAT':
        this.handleClearingSeat(dt, otherAgents);
        break;

      case 'BLOCKED':
        this.currentSpeed = 0;
        this.isWalking = false;
        break;
    }
  }

  // =========================================================================
  // STATE MACHINE HANDLERS
  // =========================================================================

  private handleReserveSeat(): void {
    if (!this.assignedChair) {
      this.phase = 'IDLE_STANDING';
      return;
    }

    const reserved = reserveChair(this.assignedChair.chairId, this.agentId);
    if (!reserved) {
      // Chair is occupied/reserved, fail safely
      this.assignedChair = null;
      this.phase = 'BLOCKED';
      return;
    }

    // Successfully claimed reservation! Plan path to the chair's approach point
    const approach = this.assignedChair.approachPoint;
    const distToApproach = Math.hypot(approach.x - this.x, approach.z - this.z);

    if (distToApproach < 0.25) {
      this.waypoints = [];
      this.phase = 'ALIGNING';
      return;
    }

    const result = this.pathfinder.findPath(this.x, this.z, approach.x, approach.z);

    if (result.success && result.path.length > 0) {
      this.waypoints = result.path;
      this.targetX = approach.x;
      this.targetZ = approach.z;
      this.phase = 'WALK_TO_APPROACH';
    } else {
      // Already at approach point or direct step
      if (distToApproach < 0.5) {
        this.waypoints = [];
        this.phase = 'ALIGNING';
      } else {
        releaseChair(this.assignedChair.chairId, this.agentId);
        this.assignedChair = null;
        this.phase = 'BLOCKED';
      }
    }
  }

  private handleWalkToApproach(dt: number, otherAgents: AvatarMovementController[]): void {
    this.moveAlongWaypoints(dt, otherAgents);

    // Check if reached approach point
    if (this.waypoints.length === 0) {
      this.currentSpeed = 0;
      this.isWalking = false;
      this.phase = 'ALIGNING';
    }
  }

  private handleAligning(dt: number): void {
    if (!this.assignedChair) {
      this.phase = 'IDLE_STANDING';
      return;
    }

    const targetAngle = this.assignedChair.facingAngle;
    const angleDiff = this.shortestAngleDiff(this.rotationY, targetAngle);

    // Smooth rotation damp to align facing angle
    if (Math.abs(angleDiff) > 0.03) {
      this.rotationY += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), 9.0 * dt);
    } else {
      this.rotationY = targetAngle;
      // Orientation aligned! Proceed to sitting down
      this.phase = 'SITTING_DOWN';
      this.sitProgress = 0;
    }
  }

  private handleSittingDown(dt: number): void {
    if (!this.assignedChair) {
      this.phase = 'IDLE_STANDING';
      return;
    }

    this.sitProgress += dt / this.sitTransitionDuration;
    const t = Math.min(1.0, this.sitProgress);

    // Smooth cubic hermite interpolation from approach point to seat anchor
    const smoothT = t * t * (3 - 2 * t);
    this.x = THREE.MathUtils.lerp(this.assignedChair.approachPoint.x, this.assignedChair.seatAnchor.x, smoothT);
    this.z = THREE.MathUtils.lerp(this.assignedChair.approachPoint.z, this.assignedChair.seatAnchor.z, smoothT);

    if (this.sitProgress >= 1.0) {
      this.sitProgress = 1.0;
      occupyChair(this.assignedChair.chairId, this.agentId);
      this.phase = this.isHermesWorking ? 'SEATED_WORKING' : 'SEATED_IDLE';
    }
  }

  private handleStandingUp(dt: number): void {
    this.sitProgress -= dt / this.sitTransitionDuration;

    if (this.sitProgress <= 0.0) {
      this.sitProgress = 0.0;
      // Pelvis is fully raised to standing height!
      // Step to exitPoint
      if (this.assignedChair) {
        this.targetX = this.assignedChair.exitPoint.x;
        this.targetZ = this.assignedChair.exitPoint.z;
        this.waypoints = [{ x: this.targetX, z: this.targetZ }];
        this.phase = 'CLEARING_SEAT';
      } else {
        this.phase = 'IDLE_STANDING';
      }
    }
  }

  private handleClearingSeat(dt: number, otherAgents: AvatarMovementController[]): void {
    this.moveAlongWaypoints(dt, otherAgents);

    // Check if reached exitPoint
    if (this.waypoints.length === 0) {
      this.currentSpeed = 0;
      this.isWalking = false;
      // Safely cleared seat! Atomically release chair reservation
      if (this.assignedChair) {
        releaseChair(this.assignedChair.chairId, this.agentId);
        this.assignedChair = null;
      }
      this.phase = 'IDLE_STANDING';
    }
  }

  // =========================================================================
  // HIGH-LEVEL COMMAND DISPATCH
  // =========================================================================

  /**
   * Command to occupy a specific chair (e.g. home desk or conference seat).
   */
  public navigateToChair(chair: ChairDefinition): void {
    if (this.assignedChair && this.assignedChair.chairId === chair.chairId && this.isSeated()) {
      if (this.isHermesWorking) {
        this.phase = 'SEATED_WORKING';
      }
      return; // Already seated in this chair!
    }

    if (this.isSeated()) {
      // Must stand up and exit current chair first!
      this.phase = 'STANDING_UP';
      // Queue next chair destination
      setTimeout(() => {
        this.assignedChair = chair;
        this.phase = 'RESERVE_SEAT';
      }, (this.sitTransitionDuration + 0.3) * 1000);
      return;
    }

    this.assignedChair = chair;
    this.phase = 'RESERVE_SEAT';
  }

  /**
   * Command to walk to a free floor coordinate (e.g. coffee counter, whiteboard).
   */
  public navigateToFloorPoint(destX: number, destZ: number, targetRotY?: number): void {
    const distToTarget = Math.hypot(destX - this.x, destZ - this.z);
    if (distToTarget < 0.35 && this.isSeated()) {
      return; // Already seated at this exact location!
    }

    if (this.isSeated()) {
      // Must stand up first!
      this.phase = 'STANDING_UP';
      setTimeout(() => {
        this.startWalkToPoint(destX, destZ, targetRotY);
      }, (this.sitTransitionDuration + 0.3) * 1000);
      return;
    }

    this.startWalkToPoint(destX, destZ, targetRotY);
  }

  private startWalkToPoint(destX: number, destZ: number, targetRotY?: number): void {
    const result = this.pathfinder.findPath(this.x, this.z, destX, destZ);
    if (result.success && result.path.length > 0) {
      this.waypoints = result.path;
      this.targetX = destX;
      this.targetZ = destZ;
      this.targetRotY = targetRotY ?? this.rotationY;
      this.phase = 'WALK_TO_APPROACH'; // Reuses walking locomotion
    } else {
      this.phase = 'BLOCKED';
    }
  }

  /**
   * Syncs Hermes backend task status (working, tool_call, idle).
   */
  public setHermesStatus(isWorking: boolean): void {
    this.isHermesWorking = isWorking;

    if (isWorking) {
      const homeChairId = AGENT_HOME_CHAIRS[this.agentId];
      if (this.assignedChair && this.assignedChair.chairId === homeChairId && this.isSeated()) {
        this.phase = 'SEATED_WORKING';
        return;
      }
      if (homeChairId) {
        const homeChair = CHAIR_REGISTRY.get(homeChairId);
        if (homeChair) {
          this.navigateToChair(homeChair);
        }
      }
    } else {
      if (this.phase === 'SEATED_WORKING') {
        this.phase = 'SEATED_IDLE';
      }
    }
  }

  // =========================================================================
  // LOCOMOTION, AVOIDANCE & WAYPOINT FOLLOWING
  // =========================================================================

  private moveAlongWaypoints(dt: number, otherAgents: AvatarMovementController[]): void {
    if (this.waypoints.length === 0) {
      this.currentSpeed = 0;
      this.isWalking = false;
      return;
    }

    const nextWp = this.waypoints[0];
    const dx = nextWp.x - this.x;
    const dz = nextWp.z - this.z;
    const distToWp = Math.hypot(dx, dz);

    // Target orientation toward waypoint
    const targetAngle = Math.atan2(dx, dz);
    const angleDiff = this.shortestAngleDiff(this.rotationY, targetAngle);
    this.rotationY += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), 10.0 * dt);

    // Acceleration & Deceleration near final waypoint
    const totalRemaining = distToWp + this.remainingPathLength();
    let desiredSpeed = this.maxSpeed;

    if (totalRemaining < 1.2) {
      // Decelerate smoothly to stop at goal
      desiredSpeed = Math.max(0.4, this.maxSpeed * (totalRemaining / 1.2));
    }

    if (this.currentSpeed < desiredSpeed) {
      this.currentSpeed = Math.min(desiredSpeed, this.currentSpeed + this.acceleration * dt);
    } else if (this.currentSpeed > desiredSpeed) {
      this.currentSpeed = Math.max(desiredSpeed, this.currentSpeed - this.deceleration * dt);
    }

    let moveDistance = this.currentSpeed * dt;
    this.isWalking = moveDistance > 0.001;

    // Local Avoidance: check proximity to other moving agents
    const separation = this.computeAgentSeparation(otherAgents);
    let vx = (dx / Math.max(0.001, distToWp)) * moveDistance + separation.x * dt;
    let vz = (dz / Math.max(0.001, distToWp)) * moveDistance + separation.z * dt;

    // Apply movement with swept world collision check
    const candidateX = this.x + vx;
    const candidateZ = this.z + vz;

    if (isPointWalkable(candidateX, candidateZ, 0.32)) {
      this.x = candidateX;
      this.z = candidateZ;
    } else {
      // Slide along collision normal
      const resolved = resolveCollision(candidateX, candidateZ, 0.32);
      this.x = resolved.x;
      this.z = resolved.z;
    }

    this.stepDistanceTraveled += moveDistance;

    // Waypoint reached threshold
    if (distToWp < 0.28) {
      this.waypoints.shift();
    }

    // Stuck detection
    const distMoved = Math.hypot(this.x - this.lastPosition.x, this.z - this.lastPosition.z);
    if (distMoved < 0.02) {
      this.stuckTimer += dt;
      if (this.stuckTimer > 2.5) {
        // Stuck for 2.5s, trigger replan
        this.stuckTimer = 0;
        this.waypoints = [];
        this.phase = 'BLOCKED';
      }
    } else {
      this.stuckTimer = 0;
      this.lastPosition = { x: this.x, z: this.z };
    }
  }

  private computeAgentSeparation(otherAgents: AvatarMovementController[]): { x: number; z: number } {
    let sepX = 0;
    let sepZ = 0;

    for (const other of otherAgents) {
      if (other.agentId === this.agentId) continue;
      // Skip agents currently seated inside their chairs
      if (other.isSeated()) continue;

      const odx = this.x - other.x;
      const odz = this.z - other.z;
      const dist = Math.hypot(odx, odz);
      const minDistance = this.personalRadius + other.personalRadius;

      if (dist < minDistance && dist > 0.01) {
        const force = (minDistance - dist) / minDistance;
        sepX += (odx / dist) * force * 2.2;
        sepZ += (odz / dist) * force * 2.2;
      }
    }

    return { x: sepX, z: sepZ };
  }

  private remainingPathLength(): number {
    let len = 0;
    for (let i = 0; i < this.waypoints.length - 1; i++) {
      len += Math.hypot(
        this.waypoints[i + 1].x - this.waypoints[i].x,
        this.waypoints[i + 1].z - this.waypoints[i].z,
      );
    }
    return len;
  }

  private shortestAngleDiff(from: number, to: number): number {
    let diff = (to - from) % (Math.PI * 2);
    if (diff > Math.PI) diff -= Math.PI * 2;
    if (diff < -Math.PI) diff += Math.PI * 2;
    return diff;
  }

  public isSeated(): boolean {
    return this.phase === 'SEATED_WORKING' || this.phase === 'SEATED_IDLE';
  }

  public dispose(): void {
    releaseAllAgentChairs(this.agentId);
  }
}
