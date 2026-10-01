/**
 * SpatialCollisionModel.ts
 * Unified spatial and collision model for the Hermes Virtual Office.
 * Defines the walkable floor bounds, solid walls, doors, balustrades,
 * and all interior furniture footprints.
 *
 * Coordinates match the 3D diorama:
 * X: East-West (-X = West/Executive/QA, +X = East/Research/SRE)
 * Y: Up (Floor level Y = 0.08)
 * Z: North-South (-Z = North/Back, +Z = South/Front)
 */

export interface BoundingBox2D {
  id: string;
  name: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  isDoorway?: boolean;
}

export interface DoorwayPortal {
  id: string;
  name: string;
  x: number;
  z: number;
  width: number;
  direction: 'ns' | 'ew'; // ns = North-South doorway (corridor runs Z), ew = East-West (corridor runs X)
}

// 1. Overall walkable perimeter bounds of the elevated building slab
export const OFFICE_BOUNDS = {
  minX: -19.6,
  maxX: 19.6,
  minZ: -16.2,
  maxZ: 15.8,
};

// 2. Doorway portals providing safe passage between rooms and corridors
export const OFFICE_DOORWAYS: Record<string, DoorwayPortal> = {
  // North row room front doors (leading to central North corridor at Z ≈ -5.4)
  exec_front: { id: 'exec_front', name: 'Executive Front Portal', x: -13.2, z: -5.4, width: 2.8, direction: 'ns' },
  dev_front: { id: 'dev_front', name: 'Development Lab Front Portal', x: 0.0, z: -5.4, width: 2.8, direction: 'ns' },
  research_front: { id: 'research_front', name: 'Research & Intel Front Portal', x: 13.2, z: -5.4, width: 2.8, direction: 'ns' },

  // Internal party wall doors between north suites (Z = -6.0)
  exec_to_dev: { id: 'exec_to_dev', name: 'Executive to Dev Portal', x: -6.65, z: -6.0, width: 1.6, direction: 'ew' },
  dev_to_research: { id: 'dev_to_research', name: 'Dev to Research Portal', x: 6.65, z: -6.0, width: 1.6, direction: 'ew' },

  // War Room front entrance (South entrance at Z = 4.7)
  war_front: { id: 'war_front', name: 'War Room South Entrance', x: 0.0, z: 4.7, width: 3.3, direction: 'ns' },

  // South row room front doors (leading to central South corridor at Z ≈ 6.05)
  qa_front: { id: 'qa_front', name: 'QA & Hardening Front Portal', x: -13.2, z: 6.05, width: 2.65, direction: 'ns' },
  lounge_front: { id: 'lounge_front', name: 'Lounge & Operations Front Portal', x: 0.0, z: 6.05, width: 2.65, direction: 'ns' },
  sre_front: { id: 'sre_front', name: 'SRE & Infrastructure Front Portal', x: 13.2, z: 6.05, width: 2.65, direction: 'ns' },

  // Side corridor security checkpoints across the North-South hallways (Z = 0.2)
  west_security: { id: 'west_security', name: 'West Security Checkpoint Door', x: -13.55, z: 0.2, width: 2.5, direction: 'ew' },
  east_security: { id: 'east_security', name: 'East Security Checkpoint Door', x: 13.55, z: 0.2, width: 2.5, direction: 'ew' },
};

// 3. Static solid obstacle footprints (walls, glass balustrades, furniture, and fixtures)
export const STATIC_OBSTACLES: BoundingBox2D[] = [
  // --- NORTH EXTERIOR BACK WALL & SLATS ---
  { id: 'north_wall', name: 'North Exterior Wall', minX: -20.5, maxX: 20.5, minZ: -16.8, maxZ: -15.9 },

  // --- WEST & EAST EXTERIOR CUTAWAY WALLS ---
  { id: 'west_wall', name: 'West Exterior Wall', minX: -20.5, maxX: -19.5, minZ: -16.2, maxZ: 15.8 },
  { id: 'east_wall', name: 'East Exterior Wall', minX: 19.5, maxX: 20.5, minZ: -16.2, maxZ: 15.8 },

  // --- SOUTH EXTERIOR PERIMETER ---
  { id: 'south_perimeter', name: 'South Floor Edge Boundary', minX: -20.5, maxX: 20.5, minZ: 15.9, maxZ: 16.8 },

  // --- STRUCTURAL PARTY WALLS (North Suites) ---
  // Executive <-> Dev Party Wall (X = -6.65, door at Z = -6.0)
  { id: 'party_exec_dev_north', name: 'Exec-Dev Party Wall North', minX: -6.95, maxX: -6.35, minZ: -16.0, maxZ: -6.8 },

  // Dev <-> Research Party Wall (X = 6.65, door at Z = -6.0)
  { id: 'party_dev_res_north', name: 'Dev-Research Party Wall North', minX: 6.35, maxX: 6.95, minZ: -16.0, maxZ: -6.8 },

  // --- ROOM FRONT BALUSTRADES / GLASS WALLS ---
  // Executive Suite front glass balustrade (frontZ = -5.4, door gap = 2.8 around X = -13.2)
  { id: 'balustrade_exec_left', name: 'Executive Front Railing Left', minX: -19.4, maxX: -14.6, minZ: -5.55, maxZ: -5.25 },
  { id: 'balustrade_exec_right', name: 'Executive Front Railing Right', minX: -11.8, maxX: -7.0, minZ: -5.55, maxZ: -5.25 },

  // Dev Lab front glass balustrade (frontZ = -5.4, door gap = 2.8 around X = 0)
  { id: 'balustrade_dev_left', name: 'Dev Front Railing Left', minX: -6.4, maxX: -1.4, minZ: -5.55, maxZ: -5.25 },
  { id: 'balustrade_dev_right', name: 'Dev Front Railing Right', minX: 1.4, maxX: 6.4, minZ: -5.55, maxZ: -5.25 },

  // Research & Intel front glass balustrade (frontZ = -5.4, door gap = 2.8 around X = 13.2)
  { id: 'balustrade_res_left', name: 'Research Front Railing Left', minX: 7.0, maxX: 11.8, minZ: -5.55, maxZ: -5.25 },
  { id: 'balustrade_res_right', name: 'Research Front Railing Right', minX: 14.6, maxX: 19.4, minZ: -5.55, maxZ: -5.25 },

  // War Room back slat wall (Z = -3.7, width 15.4)
  { id: 'war_back_wall', name: 'War Room Video Wall Slat Partition', minX: -7.7, maxX: 7.7, minZ: -3.85, maxZ: -3.55 },
  // War Room side glass railings (X = -7.75 and 7.75, Z in [-3.7, 4.7])
  { id: 'war_side_railing_west', name: 'War Room West Railing', minX: -7.9, maxX: -7.6, minZ: -3.7, maxZ: 4.7 },
  { id: 'war_side_railing_east', name: 'War Room East Railing', minX: 7.6, maxX: 7.9, minZ: -3.7, maxZ: 4.7 },
  // War Room front glass balustrade (frontZ = 4.7, door gap = 3.3 around X = 0)
  { id: 'war_front_railing_left', name: 'War Room Front Railing Left', minX: -7.7, maxX: -1.65, minZ: 4.55, maxZ: 4.85 },
  { id: 'war_front_railing_right', name: 'War Room Front Railing Right', minX: 1.65, maxX: 7.7, minZ: 4.55, maxZ: 4.85 },

  // South row front balustrades (frontZ = 6.05, gap = 2.65)
  // QA & Hardening (door around X = -13.2)
  { id: 'balustrade_qa_left', name: 'QA Front Railing Left', minX: -19.4, maxX: -14.5, minZ: 5.9, maxZ: 6.2 },
  { id: 'balustrade_qa_right', name: 'QA Front Railing Right', minX: -11.9, maxX: -7.0, minZ: 5.9, maxZ: 6.2 },

  // Lounge & Operations (door around X = 0)
  { id: 'balustrade_lounge_left', name: 'Lounge Front Railing Left', minX: -6.4, maxX: -1.35, minZ: 5.9, maxZ: 6.2 },
  { id: 'balustrade_lounge_right', name: 'Lounge Front Railing Right', minX: 1.35, maxX: 6.4, minZ: 5.9, maxZ: 6.2 },

  // SRE & Infrastructure (door around X = 13.2)
  { id: 'balustrade_sre_left', name: 'SRE Front Railing Left', minX: 7.0, maxX: 11.9, minZ: 5.9, maxZ: 6.2 },
  { id: 'balustrade_sre_right', name: 'SRE Front Railing Right', minX: 14.5, maxX: 19.4, minZ: 5.9, maxZ: 6.2 },

  // Side corridor security partitions across the North-South hallways (Z = 0.2, width 10.8, door gap = 2.5 around X = -13.55 & 13.55)
  // West Corridor (X = -13.55, door gap X in [-14.8, -12.3])
  { id: 'sec_partition_west_left', name: 'West Security Partition Outer', minX: -19.4, maxX: -14.8, minZ: 0.05, maxZ: 0.35 },
  { id: 'sec_partition_west_right', name: 'West Security Partition Inner', minX: -12.3, maxX: -8.0, minZ: 0.05, maxZ: 0.35 },

  // East Corridor (X = 13.55, door gap X in [12.3, 14.8])
  { id: 'sec_partition_east_left', name: 'East Security Partition Inner', minX: 8.0, maxX: 12.3, minZ: 0.05, maxZ: 0.35 },
  { id: 'sec_partition_east_right', name: 'East Security Partition Outer', minX: 14.8, maxX: 19.4, minZ: 0.05, maxZ: 0.35 },

  // --- 4. FURNITURE & OBSTACLE FOOTPRINTS ---

  // Executive Suite (Top-Left)
  { id: 'exec_desk', name: 'Executive Desk', minX: -15.8, maxX: -11.0, minZ: -12.7, maxZ: -10.9 },
  { id: 'exec_credenza', name: 'Executive Credenza', minX: -16.7, maxX: -10.5, minZ: -15.8, maxZ: -14.9 },
  { id: 'exec_bookshelf', name: 'Executive West Bookshelf', minX: -19.5, maxX: -18.7, minZ: -14.5, maxZ: -9.9 },
  { id: 'exec_guest_chair_1', name: 'Executive Guest Chair Left', minX: -15.4, maxX: -14.2, minZ: -9.3, maxZ: -8.2 },
  { id: 'exec_guest_chair_2', name: 'Executive Guest Chair Right', minX: -12.6, maxX: -11.4, minZ: -9.3, maxZ: -8.2 },

  // A2A Coordination / Connect (Top-Center)
  { id: 'dev_desk_1', name: 'Dev Desk West (Forge)', minX: -4.5, maxX: -1.0, minZ: -13.55, maxZ: -12.15 },
  { id: 'dev_desk_2', name: 'Dev Desk East (Frame)', minX: 1.0, maxX: 4.5, minZ: -13.55, maxZ: -12.15 },
  { id: 'dev_desk_3', name: 'Dev Desk South-West (Aurora)', minX: -4.05, maxX: -2.65, minZ: -10.45, maxZ: -7.05 },
  { id: 'dev_desk_4', name: 'Dev Desk South-East', minX: 2.65, maxX: 4.05, minZ: -10.45, maxZ: -7.05 },

  // Research & Intel (Top-Right)
  { id: 'research_desk_1', name: 'Research Desk West (Quant)', minX: 8.2, maxX: 12.4, minZ: -10.95, maxZ: -9.55 },
  { id: 'research_desk_2', name: 'Research Desk East (Radar)', minX: 13.3, maxX: 17.5, minZ: -10.95, maxZ: -9.55 },
  { id: 'research_bookshelf', name: 'Research East Bookshelf', minX: 18.7, maxX: 19.5, minZ: -14.5, maxZ: -10.4 },

  // War Room / A (Center)
  { id: 'war_racetrack_table', name: 'War Room Racetrack Conference Table', minX: -4.3, maxX: 4.3, minZ: -1.15, maxZ: 2.05 },

  // QA & Hardening (Bottom-Left)
  { id: 'qa_desk_1', name: 'QA Desk West (Prism)', minX: -17.7, maxX: -14.1, minZ: 7.7, maxZ: 9.1 },
  { id: 'qa_desk_2', name: 'QA Desk East (Lens)', minX: -12.4, maxX: -8.9, minZ: 7.7, maxZ: 9.1 },
  { id: 'qa_desk_3', name: 'QA Desk South', minX: -15.1, maxX: -11.4, minZ: 11.65, maxZ: 13.05 },
  { id: 'qa_credenza', name: 'QA West Storage Credenza', minX: -19.5, maxX: -18.7, minZ: 7.5, maxZ: 14.5 },

  // Lounge & Operations (Bottom-Center)
  { id: 'lounge_sofa', name: 'Lounge Sectional Sofa', minX: -2.4, maxX: 2.4, minZ: 14.4, maxZ: 15.8 },
  { id: 'lounge_coffee_table', name: 'Lounge Coffee Table', minX: -2.5, maxX: -1.3, minZ: 12.0, maxZ: 13.2 },
  { id: 'lounge_refreshment', name: 'Lounge Refreshment Bar (Sentinel)', minX: -4.8, maxX: -1.9, minZ: 7.3, maxZ: 8.3 },
  { id: 'lounge_ops_desk', name: 'Lounge Operations Desk (Nexus)', minX: 2.4, maxX: 5.8, minZ: 10.1, maxZ: 11.5 },

  // SRE & Infrastructure (Bottom-Right)
  { id: 'sre_server_racks', name: 'SRE Server Cabinets Bank', minX: 18.2, maxX: 19.5, minZ: 7.5, maxZ: 15.5 },
  { id: 'sre_ops_desk', name: 'SRE Operator Workstation (Atlas)', minX: 9.15, maxX: 13.15, minZ: 7.75, maxZ: 9.15 },
  { id: 'sre_collab_table', name: 'SRE Collaboration Square Table', minX: 10.5, maxX: 12.3, minZ: 12.15, maxZ: 13.95 },
];

/**
 * Checks if a circle of radius `r` centered at (x, z) intersects any static obstacle
 * or exceeds the building perimeter bounds.
 */
export function isPointWalkable(x: number, z: number, radius = 0.35): boolean {
  // 1. Check outer building bounds
  if (
    x - radius < OFFICE_BOUNDS.minX ||
    x + radius > OFFICE_BOUNDS.maxX ||
    z - radius < OFFICE_BOUNDS.minZ ||
    z + radius > OFFICE_BOUNDS.maxZ
  ) {
    return false;
  }

  // 2. Check all static obstacles
  for (const obs of STATIC_OBSTACLES) {
    // Expanded AABB by character radius
    if (
      x >= obs.minX - radius &&
      x <= obs.maxX + radius &&
      z >= obs.minZ - radius &&
      z <= obs.maxZ + radius
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Checks if a swept circle from (x1, z1) to (x2, z2) with `radius` has
 * a completely clear, collision-free line of sight.
 */
export function isLineOfSightClear(
  x1: number,
  z1: number,
  x2: number,
  z2: number,
  radius = 0.35,
  stepSize = 0.15,
): boolean {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const dist = Math.hypot(dx, dz);
  if (dist < 0.001) return isPointWalkable(x1, z1, radius);

  const steps = Math.ceil(dist / stepSize);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const px = x1 + dx * t;
    const pz = z1 + dz * t;
    if (!isPointWalkable(px, pz, radius)) {
      return false;
    }
  }
  return true;
}

/**
 * Pushes a candidate position out of any overlapping obstacles.
 */
export function resolveCollision(
  x: number,
  z: number,
  radius = 0.35,
): { x: number; z: number; collided: boolean } {
  let resX = Math.max(OFFICE_BOUNDS.minX + radius, Math.min(OFFICE_BOUNDS.maxX - radius, x));
  let resZ = Math.max(OFFICE_BOUNDS.minZ + radius, Math.min(OFFICE_BOUNDS.maxZ - radius, z));
  let collided = false;

  for (const obs of STATIC_OBSTACLES) {
    const minX = obs.minX - radius;
    const maxX = obs.maxX + radius;
    const minZ = obs.minZ - radius;
    const maxZ = obs.maxZ + radius;

    if (resX > minX && resX < maxX && resZ > minZ && resZ < maxZ) {
      collided = true;
      // Find minimal pushout axis
      const distLeft = resX - minX;
      const distRight = maxX - resX;
      const distTop = resZ - minZ;
      const distBottom = maxZ - resZ;

      const minDist = Math.min(distLeft, distRight, distTop, distBottom);
      if (minDist === distLeft) resX = minX;
      else if (minDist === distRight) resX = maxX;
      else if (minDist === distTop) resZ = minZ;
      else resZ = maxZ;
    }
  }

  return { x: resX, z: resZ, collided };
}
