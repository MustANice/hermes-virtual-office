/**
 * OfficeNavMesh.ts
 * Backward-compatible facade delegating to the unified OfficePathfinder.
 * Ensures zero corner-cutting, obstacle clearance, and doorway passage.
 */

import { OfficePathfinder } from './OfficePathfinder';

export interface Point2D {
  x: number;
  z: number;
}

export type RoomKey =
  | 'executive'
  | 'dev'
  | 'research'
  | 'war'
  | 'qa'
  | 'lounge'
  | 'sre';

export const ROOM_BOUNDS: Record<RoomKey, { minX: number; maxX: number; minZ: number; maxZ: number }> = {
  executive: { minX: -20, maxX: -6.65, minZ: -16.2, maxZ: -5.4 },
  dev: { minX: -6.65, maxX: 6.65, minZ: -16.2, maxZ: -5.4 },
  research: { minX: 6.65, maxX: 20, minZ: -16.2, maxZ: -5.4 },
  war: { minX: -7.7, maxX: 7.7, minZ: -3.7, maxZ: 4.7 },
  qa: { minX: -20, maxX: -6.65, minZ: 6.05, maxZ: 15.8 },
  lounge: { minX: -6.65, maxX: 6.65, minZ: 6.05, maxZ: 15.8 },
  sre: { minX: 6.65, maxX: 20, minZ: 6.05, maxZ: 15.8 },
};

export function getRoomAt(x: number, z: number): RoomKey {
  for (const [room, b] of Object.entries(ROOM_BOUNDS) as [RoomKey, typeof ROOM_BOUNDS[RoomKey]][]) {
    if (x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ) {
      return room;
    }
  }
  if (z < -5.4) {
    if (x < -6.65) return 'executive';
    if (x > 6.65) return 'research';
    return 'dev';
  }
  if (z > 6.05) {
    if (x < -6.65) return 'qa';
    if (x > 6.65) return 'sre';
    return 'lounge';
  }
  return 'war';
}

/**
 * Finds a collision-free path with body radius clearance.
 */
export function findPathThroughDoors(start: Point2D, dest: Point2D): Point2D[] {
  const pathfinder = OfficePathfinder.getInstance();
  const result = pathfinder.findPath(start.x, start.z, dest.x, dest.z);
  return result.path;
}
