/**
 * ChairInteractionSystem.ts
 * Explicit chair data model, atomic reservation, and seating state machine.
 *
 * Implements Section 5 of the Realistic Office Movement Specification:
 * - Explicit definition: chairId, approachPoint, seatAnchor, exitPoint, facingDirection, occupiedBy, reservedBy.
 * - Strict transition sequence:
 *   IDLE -> RESERVE_SEAT -> WALK_TO_APPROACH -> ALIGN -> SIT_DOWN -> SEATED/WORKING -> STAND_UP -> CLEAR_SEAT -> RELEASE_SEAT -> WALK/IDLE.
 * - Atomic reservation with safe timeout cleanup.
 * - 1 character per chair.
 */

export type SittingPhase =
  | 'IDLE_STANDING'
  | 'RESERVE_SEAT'
  | 'WALK_TO_APPROACH'
  | 'ALIGNING'
  | 'SITTING_DOWN'
  | 'SEATED_WORKING'
  | 'SEATED_IDLE'
  | 'STANDING_UP'
  | 'CLEARING_SEAT'
  | 'BLOCKED';

export interface ChairDefinition {
  chairId: string;
  name: string;
  roomId: string;
  deskId?: string;
  // Contact point of avatar pelvis when seated (World coords)
  seatAnchor: { x: number; y: number; z: number };
  // Reachable standing position in front/aisle of the chair
  approachPoint: { x: number; y: number; z: number };
  // Safe standing position after standing up before walking into open corridor
  exitPoint: { x: number; y: number; z: number };
  // Rotation (Y axis) of avatar when seated (facing the desk/work surface)
  facingAngle: number;
  kind: 'executive' | 'task' | 'conference' | 'lounge' | 'break';
  occupiedBy: string | null;
  reservedBy: string | null;
  reservedAt: number;
}

// Global registry of all physical seats in the office
export const CHAIR_REGISTRY: Map<string, ChairDefinition> = new Map();

function registerChair(def: Omit<ChairDefinition, 'occupiedBy' | 'reservedBy' | 'reservedAt'>): void {
  CHAIR_REGISTRY.set(def.chairId, {
    ...def,
    occupiedBy: null,
    reservedBy: null,
    reservedAt: 0,
  });
}

// =========================================================================
// POPULATE ALL CHAIRS MATCHING 3D ARCHITECTURAL FLOORPLAN
// =========================================================================

// 1. Executive Suite
registerChair({
  chairId: 'exec_chair_orion',
  name: 'Orion Executive Desk Chair',
  roomId: 'manager',
  deskId: 'exec_desk',
  seatAnchor: { x: -13.4, y: 0.68, z: -13.15 },
  approachPoint: { x: -13.4, y: 0.08, z: -14.25 },
  exitPoint: { x: -13.4, y: 0.08, z: -14.25 },
  facingAngle: 0.0, // Faces South toward desk at Z = -11.8
  kind: 'executive',
});

// 2. Development Lab / A2A Connect
registerChair({
  chairId: 'dev_chair_forge',
  name: 'Forge Workstation Chair',
  roomId: 'dev',
  deskId: 'dev_desk_1',
  seatAnchor: { x: -2.75, y: 0.68, z: -11.65 },
  approachPoint: { x: -2.75, y: 0.08, z: -10.55 },
  exitPoint: { x: -2.75, y: 0.08, z: -10.55 },
  facingAngle: Math.PI, // Faces North toward desk at Z = -12.85
  kind: 'task',
});

registerChair({
  chairId: 'dev_chair_frame',
  name: 'Frame Workstation Chair',
  roomId: 'dev',
  deskId: 'dev_desk_2',
  seatAnchor: { x: 2.75, y: 0.68, z: -11.65 },
  approachPoint: { x: 2.75, y: 0.08, z: -10.55 },
  exitPoint: { x: 2.75, y: 0.08, z: -10.55 },
  facingAngle: Math.PI, // Faces North toward desk at Z = -12.85
  kind: 'task',
});

registerChair({
  chairId: 'dev_chair_aurora',
  name: 'Aurora Workstation Chair',
  roomId: 'dev',
  deskId: 'dev_desk_3',
  seatAnchor: { x: -2.15, y: 0.68, z: -8.75 },
  approachPoint: { x: -1.05, y: 0.08, z: -8.75 },
  exitPoint: { x: -1.05, y: 0.08, z: -8.75 },
  facingAngle: -Math.PI / 2, // Faces West toward desk at X = -3.35
  kind: 'task',
});

registerChair({
  chairId: 'dev_chair_spare',
  name: 'Dev Lab Auxiliary Chair',
  roomId: 'dev',
  deskId: 'dev_desk_4',
  seatAnchor: { x: 2.15, y: 0.68, z: -8.75 },
  approachPoint: { x: 1.05, y: 0.08, z: -8.75 },
  exitPoint: { x: 1.05, y: 0.08, z: -8.75 },
  facingAngle: -Math.PI / 2, // Faces East toward desk at X = 3.35
  kind: 'task',
});

// 3. Research & Intel
registerChair({
  chairId: 'res_chair_quant',
  name: 'Quant Research Chair',
  roomId: 'research',
  deskId: 'research_desk_1',
  seatAnchor: { x: 10.3, y: 0.68, z: -9.05 },
  approachPoint: { x: 10.3, y: 0.08, z: -7.85 },
  exitPoint: { x: 10.3, y: 0.08, z: -7.85 },
  facingAngle: Math.PI, // Faces North toward desk at Z = -10.25
  kind: 'task',
});

registerChair({
  chairId: 'res_chair_radar',
  name: 'Radar Research Chair',
  roomId: 'research',
  deskId: 'research_desk_2',
  seatAnchor: { x: 15.4, y: 0.68, z: -9.05 },
  approachPoint: { x: 15.4, y: 0.08, z: -7.85 },
  exitPoint: { x: 15.4, y: 0.08, z: -7.85 },
  facingAngle: Math.PI, // Faces North toward desk at Z = -10.25
  kind: 'task',
});

// 4. QA & Hardening
registerChair({
  chairId: 'qa_chair_prism',
  name: 'Prism QA Workstation Chair',
  roomId: 'qa_security',
  deskId: 'qa_desk_1',
  seatAnchor: { x: -15.9, y: 0.68, z: 9.6 },
  approachPoint: { x: -15.9, y: 0.08, z: 10.7 },
  exitPoint: { x: -15.9, y: 0.08, z: 10.7 },
  facingAngle: Math.PI, // Faces North toward desk at Z = 8.4
  kind: 'task',
});

registerChair({
  chairId: 'qa_chair_lens',
  name: 'Lens QA Workstation Chair',
  roomId: 'qa_security',
  deskId: 'qa_desk_2',
  seatAnchor: { x: -10.65, y: 0.68, z: 9.6 },
  approachPoint: { x: -10.65, y: 0.08, z: 10.7 },
  exitPoint: { x: -10.65, y: 0.08, z: 10.7 },
  facingAngle: Math.PI, // Faces North toward desk at Z = 8.4
  kind: 'task',
});

registerChair({
  chairId: 'qa_chair_sentinel',
  name: 'Sentinel Security Workstation Chair',
  roomId: 'qa_security',
  deskId: 'qa_desk_3',
  seatAnchor: { x: -13.25, y: 0.68, z: 13.55 },
  approachPoint: { x: -13.25, y: 0.08, z: 14.65 },
  exitPoint: { x: -13.25, y: 0.08, z: 14.65 },
  facingAngle: Math.PI, // Faces North toward QA south workstation
  kind: 'task',
});

// 5. Lounge & Operations
registerChair({
  chairId: 'lounge_chair_nexus',
  name: 'Nexus Operations Workstation Chair',
  roomId: 'lounge',
  deskId: 'lounge_ops_desk',
  seatAnchor: { x: 4.12, y: 0.68, z: 12.0 },
  approachPoint: { x: 4.12, y: 0.08, z: 13.1 },
  exitPoint: { x: 4.12, y: 0.08, z: 13.1 },
  facingAngle: Math.PI, // Faces North toward monitors
  kind: 'task',
});

// Sentinel Coffee Barista Stand/Stool
registerChair({
  chairId: 'lounge_cafe_sentinel',
  name: 'Sentinel Barista Station',
  roomId: 'lounge',
  deskId: 'lounge_refreshment',
  seatAnchor: { x: -3.35, y: 0.08, z: 8.65 },
  approachPoint: { x: -3.35, y: 0.08, z: 9.6 },
  exitPoint: { x: -3.35, y: 0.08, z: 9.6 },
  facingAngle: 0.0, // Faces North toward espresso machine
  kind: 'break',
});

// Lounge Sofa spots
for (let i = 0; i < 3; i++) {
  const sx = (i - 1) * 1.43;
  registerChair({
    chairId: `lounge_sofa_${i}`,
    name: `Lounge Sofa Spot ${i + 1}`,
    roomId: 'lounge',
    seatAnchor: { x: sx, y: 0.58, z: 14.5 },
    approachPoint: { x: sx, y: 0.08, z: 13.3 },
    exitPoint: { x: sx, y: 0.08, z: 13.3 },
    facingAngle: 0.0, // Faces North
    kind: 'lounge',
  });
}

// 6. SRE & Infrastructure
registerChair({
  chairId: 'sre_chair_atlas',
  name: 'Atlas SRE Operator Chair',
  roomId: 'server_room',
  deskId: 'sre_ops_desk',
  seatAnchor: { x: 11.15, y: 0.68, z: 9.65 },
  approachPoint: { x: 11.15, y: 0.08, z: 10.75 },
  exitPoint: { x: 11.15, y: 0.08, z: 10.75 },
  facingAngle: Math.PI, // Faces North toward monitors
  kind: 'task',
});

// SRE Huddle Table (4 chairs)
registerChair({
  chairId: 'sre_huddle_north',
  name: 'SRE Collaboration North',
  roomId: 'server_room',
  seatAnchor: { x: 11.4, y: 0.68, z: 11.05 },
  approachPoint: { x: 11.4, y: 0.08, z: 10.15 },
  exitPoint: { x: 11.4, y: 0.08, z: 10.15 },
  facingAngle: Math.PI, // Faces South toward table
  kind: 'task',
});

registerChair({
  chairId: 'sre_huddle_south',
  name: 'SRE Collaboration South',
  roomId: 'server_room',
  seatAnchor: { x: 11.4, y: 0.68, z: 15.05 },
  approachPoint: { x: 11.4, y: 0.08, z: 15.85 },
  exitPoint: { x: 11.4, y: 0.08, z: 15.85 },
  facingAngle: 0.0, // Faces North toward table
  kind: 'task',
});

// 7. War Room (10 Conference Chairs)
const warXPositions = [-4.5, -1.5, 1.5, 4.5];
warXPositions.forEach((wx, i) => {
  // North row (facing South)
  registerChair({
    chairId: `war_chair_north_${i}`,
    name: `War Room North Chair ${i + 1}`,
    roomId: 'meeting',
    deskId: 'war_racetrack_table',
    seatAnchor: { x: wx, y: 0.68, z: -1.72 },
    approachPoint: { x: wx, y: 0.08, z: -2.65 },
    exitPoint: { x: wx, y: 0.08, z: -2.65 },
    facingAngle: Math.PI, // Faces South toward table
    kind: 'conference',
  });

  // South row (facing North)
  registerChair({
    chairId: `war_chair_south_${i}`,
    name: `War Room South Chair ${i + 1}`,
    roomId: 'meeting',
    deskId: 'war_racetrack_table',
    seatAnchor: { x: wx, y: 0.68, z: 2.55 },
    approachPoint: { x: wx, y: 0.08, z: 3.55 },
    exitPoint: { x: wx, y: 0.08, z: 3.55 },
    facingAngle: 0.0, // Faces North toward table
    kind: 'conference',
  });
});

registerChair({
  chairId: 'war_chair_west',
  name: 'War Room West Head Chair',
  roomId: 'meeting',
  deskId: 'war_racetrack_table',
  seatAnchor: { x: -5.9, y: 0.68, z: 0.45 },
  approachPoint: { x: -6.8, y: 0.08, z: 0.45 },
  exitPoint: { x: -6.8, y: 0.08, z: 0.45 },
  facingAngle: -Math.PI / 2, // Faces East
  kind: 'conference',
});

registerChair({
  chairId: 'war_chair_east',
  name: 'War Room East Head Chair',
  roomId: 'meeting',
  deskId: 'war_racetrack_table',
  seatAnchor: { x: 5.9, y: 0.68, z: 0.45 },
  approachPoint: { x: 6.8, y: 0.08, z: 0.45 },
  exitPoint: { x: 6.8, y: 0.08, z: 0.45 },
  facingAngle: Math.PI / 2, // Faces West
  kind: 'conference',
});

// Map of default home chairs for the 11 fleet agents
export const AGENT_HOME_CHAIRS: Record<string, string> = {
  orion: 'exec_chair_orion',
  forge: 'dev_chair_forge',
  frame: 'dev_chair_frame',
  aurora: 'dev_chair_aurora',
  quant: 'res_chair_quant',
  radar: 'res_chair_radar',
  prism: 'qa_chair_prism',
  lens: 'qa_chair_lens',
  sentinel: 'qa_chair_sentinel',
  nexus: 'lounge_chair_nexus',
  atlas: 'sre_chair_atlas',
};

// =========================================================================
// ATOMIC RESERVATION API
// =========================================================================

/**
 * Attempts to atomically reserve a specific chair for an agent.
 * Returns true if successful, false if already occupied or reserved by someone else.
 */
export function reserveChair(chairId: string, agentId: string): boolean {
  const chair = CHAIR_REGISTRY.get(chairId);
  if (!chair) return false;

  const now = Date.now();
  // Check if chair is free or reservation expired (timeout 45s)
  const isAvailable =
    (!chair.occupiedBy || chair.occupiedBy === agentId) &&
    (!chair.reservedBy || chair.reservedBy === agentId || (now - chair.reservedAt > 45000));

  if (!isAvailable) {
    return false;
  }

  // Atomically claim reservation
  chair.reservedBy = agentId;
  chair.reservedAt = now;
  return true;
}

/**
 * Marks chair as actively occupied once the agent sits down.
 */
export function occupyChair(chairId: string, agentId: string): boolean {
  const chair = CHAIR_REGISTRY.get(chairId);
  if (!chair) return false;

  if (chair.reservedBy && chair.reservedBy !== agentId) {
    return false;
  }

  chair.occupiedBy = agentId;
  chair.reservedBy = null;
  return true;
}

/**
 * Releases chair occupancy and reservation when agent leaves the interaction area.
 * If agentId is omitted, forces unconditional release.
 */
export function releaseChair(chairId: string, agentId?: string): void {
  const chair = CHAIR_REGISTRY.get(chairId);
  if (!chair) return;

  if (!agentId || chair.occupiedBy === agentId) {
    chair.occupiedBy = null;
  }
  if (!agentId || chair.reservedBy === agentId) {
    chair.reservedBy = null;
    chair.reservedAt = 0;
  }
}

/**
 * Releases all chairs associated with an agent (fail-safe cleanup).
 */
export function releaseAllAgentChairs(agentId: string): void {
  for (const chair of CHAIR_REGISTRY.values()) {
    if (chair.occupiedBy === agentId) chair.occupiedBy = null;
    if (chair.reservedBy === agentId) chair.reservedBy = null;
  }
}

/**
 * Finds the chair currently occupied or reserved by an agent.
 */
export function getAgentActiveChair(agentId: string): ChairDefinition | null {
  for (const chair of CHAIR_REGISTRY.values()) {
    if (chair.occupiedBy === agentId || chair.reservedBy === agentId) {
      return chair;
    }
  }
  return null;
}

/**
 * Finds an available chair in a specific room or category.
 */
export function findAvailableChair(
  roomId?: string,
  kind?: ChairDefinition['kind'],
  excludeChairId?: string,
): ChairDefinition | null {
  const now = Date.now();
  for (const chair of CHAIR_REGISTRY.values()) {
    if (excludeChairId && chair.chairId === excludeChairId) continue;
    if (roomId && chair.roomId !== roomId) continue;
    if (kind && chair.kind !== kind) continue;

    const isAvailable =
      !chair.occupiedBy &&
      (!chair.reservedBy || now - chair.reservedAt > 45000);

    if (isAvailable) {
      return chair;
    }
  }
  return null;
}
