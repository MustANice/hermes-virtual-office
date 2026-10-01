/**
 * OfficePathfinder.ts
 * High-performance A* pathfinding with body radius clearance,
 * strict corner-cutting prevention, and swept-circle line-of-sight smoothing.
 *
 * Implements Section 3 of the Realistic Office Movement Specification.
 */

import {
  OFFICE_BOUNDS,
  isPointWalkable,
  isLineOfSightClear,
} from './SpatialCollisionModel';

export interface PathPoint {
  x: number;
  z: number;
}

export interface PathResult {
  path: PathPoint[];
  success: boolean;
  length: number;
}

const CELL_SIZE = 0.2; // 20cm resolution
const ORIGIN_X = OFFICE_BOUNDS.minX;
const ORIGIN_Z = OFFICE_BOUNDS.minZ;
const GRID_COLS = Math.ceil((OFFICE_BOUNDS.maxX - OFFICE_BOUNDS.minX) / CELL_SIZE) + 1;
const GRID_ROWS = Math.ceil((OFFICE_BOUNDS.maxZ - OFFICE_BOUNDS.minZ) / CELL_SIZE) + 1;

class PriorityQueue<T> {
  private items: { item: T; priority: number }[] = [];

  push(item: T, priority: number): void {
    let low = 0;
    let high = this.items.length;
    while (low < high) {
      const mid = (low + high) >>> 1;
      if (this.items[mid].priority < priority) low = mid + 1;
      else high = mid;
    }
    this.items.splice(low, 0, { item, priority });
  }

  pop(): T | undefined {
    return this.items.shift()?.item;
  }

  get length(): number {
    return this.items.length;
  }
}

export class OfficePathfinder {
  private static instance: OfficePathfinder | null = null;
  private walkableGrid: Uint8Array;
  private readonly avatarRadius = 0.35; // 35cm body radius

  private constructor() {
    this.walkableGrid = new Uint8Array(GRID_COLS * GRID_ROWS);
    this.bakeGrid();
  }

  public static getInstance(): OfficePathfinder {
    if (!OfficePathfinder.instance) {
      OfficePathfinder.instance = new OfficePathfinder();
    }
    return OfficePathfinder.instance;
  }

  /**
   * Pre-bakes the binary occupancy grid with body radius collision checks.
   */
  private bakeGrid(): void {
    for (let r = 0; r < GRID_ROWS; r++) {
      const z = ORIGIN_Z + r * CELL_SIZE;
      for (let c = 0; c < GRID_COLS; c++) {
        const x = ORIGIN_X + c * CELL_SIZE;
        const index = r * GRID_COLS + c;
        this.walkableGrid[index] = isPointWalkable(x, z, this.avatarRadius) ? 1 : 0;
      }
    }
  }

  public worldToGrid(x: number, z: number): { col: number; row: number } {
    const col = Math.round((x - ORIGIN_X) / CELL_SIZE);
    const row = Math.round((z - ORIGIN_Z) / CELL_SIZE);
    return {
      col: Math.max(0, Math.min(GRID_COLS - 1, col)),
      row: Math.max(0, Math.min(GRID_ROWS - 1, row)),
    };
  }

  public gridToWorld(col: number, row: number): { x: number; z: number } {
    return {
      x: ORIGIN_X + col * CELL_SIZE,
      z: ORIGIN_Z + row * CELL_SIZE,
    };
  }

  public isCellWalkable(col: number, row: number): boolean {
    if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) return false;
    return this.walkableGrid[row * GRID_COLS + col] === 1;
  }

  /**
   * Finds the nearest walkable grid cell within a search radius if target is inside an obstacle.
   */
  public findNearestWalkable(col: number, row: number, maxRadiusCells = 10): { col: number; row: number } | null {
    if (this.isCellWalkable(col, row)) return { col, row };

    for (let r = 1; r <= maxRadiusCells; r++) {
      for (let dc = -r; dc <= r; dc++) {
        for (let dr = -r; dr <= r; dr++) {
          if (Math.abs(dc) !== r && Math.abs(dr) !== r) continue;
          const nc = col + dc;
          const nr = row + dr;
          if (this.isCellWalkable(nc, nr)) {
            return { col: nc, row: nr };
          }
        }
      }
    }
    return null;
  }

  /**
   * Finds a safe, body-cleared, smoothed walking path between start and end world points.
   */
  public findPath(startX: number, startZ: number, endX: number, endZ: number): PathResult {
    // 1. Direct line of sight test (fast path)
    if (isLineOfSightClear(startX, startZ, endX, endZ, this.avatarRadius)) {
      const dist = Math.hypot(endX - startX, endZ - startZ);
      return {
        path: [{ x: endX, z: endZ }],
        success: true,
        length: dist,
      };
    }

    // 2. Map start & end to grid
    let startG = this.worldToGrid(startX, startZ);
    let endG = this.worldToGrid(endX, endZ);

    if (!this.isCellWalkable(startG.col, startG.row)) {
      const valid = this.findNearestWalkable(startG.col, startG.row);
      if (valid) startG = valid;
    }

    if (!this.isCellWalkable(endG.col, endG.row)) {
      const valid = this.findNearestWalkable(endG.col, endG.row);
      if (valid) endG = valid;
      else {
        return { path: [], success: false, length: 0 };
      }
    }

    // 3. A* Search
    const startIndex = startG.row * GRID_COLS + startG.col;
    const endIndex = endG.row * GRID_COLS + endG.col;

    const gScore = new Float32Array(GRID_COLS * GRID_ROWS);
    gScore.fill(Infinity);
    gScore[startIndex] = 0;

    const parent = new Int32Array(GRID_COLS * GRID_ROWS);
    parent.fill(-1);

    const closed = new Uint8Array(GRID_COLS * GRID_ROWS);
    const openSet = new PriorityQueue<number>();

    const h = (c: number, r: number) => Math.hypot(c - endG.col, r - endG.row);
    openSet.push(startIndex, h(startG.col, startG.row));

    const DIRS = [
      { dc: 0, dr: -1, cost: 1.0 },
      { dc: 0, dr: 1, cost: 1.0 },
      { dc: -1, dr: 0, cost: 1.0 },
      { dc: 1, dr: 0, cost: 1.0 },
      // Diagonals with strict corner-cutting prevention:
      { dc: -1, dr: -1, cost: 1.414, check1: [-1, 0], check2: [0, -1] },
      { dc: 1, dr: -1, cost: 1.414, check1: [1, 0], check2: [0, -1] },
      { dc: -1, dr: 1, cost: 1.414, check1: [-1, 0], check2: [0, 1] },
      { dc: 1, dr: 1, cost: 1.414, check1: [1, 0], check2: [0, 1] },
    ];

    let found = false;

    while (openSet.length > 0) {
      const current = openSet.pop()!;
      if (current === endIndex) {
        found = true;
        break;
      }

      if (closed[current]) continue;
      closed[current] = 1;

      const currRow = Math.floor(current / GRID_COLS);
      const currCol = current % GRID_COLS;
      const currentG = gScore[current];

      for (const d of DIRS) {
        const nextCol = currCol + d.dc;
        const nextRow = currRow + d.dr;

        if (nextCol < 0 || nextCol >= GRID_COLS || nextRow < 0 || nextRow >= GRID_ROWS) continue;

        const nextIndex = nextRow * GRID_COLS + nextCol;
        if (closed[nextIndex] || this.walkableGrid[nextIndex] === 0) continue;

        // Prevent cutting corners of walls on diagonal moves!
        if (d.check1 && d.check2) {
          const c1 = this.walkableGrid[(currRow + d.check1[1]) * GRID_COLS + (currCol + d.check1[0])];
          const c2 = this.walkableGrid[(currRow + d.check2[1]) * GRID_COLS + (currCol + d.check2[0])];
          if (c1 === 0 || c2 === 0) {
            continue; // Cannot cut through diagonal corner!
          }
        }

        const tentativeG = currentG + d.cost;
        if (tentativeG < gScore[nextIndex]) {
          gScore[nextIndex] = tentativeG;
          parent[nextIndex] = current;
          openSet.push(nextIndex, tentativeG + h(nextCol, nextRow));
        }
      }
    }

    if (!found) {
      return { path: [], success: false, length: 0 };
    }

    // 4. Reconstruct raw grid path
    const rawPath: PathPoint[] = [];
    let curr = endIndex;
    while (curr !== -1) {
      const r = Math.floor(curr / GRID_COLS);
      const c = curr % GRID_COLS;
      rawPath.unshift(this.gridToWorld(c, r));
      if (curr === startIndex) break;
      curr = parent[curr];
    }

    // Replace the exact endpoints with original real-world coordinates only if destination is walkable
    if (rawPath.length > 0 && isPointWalkable(endX, endZ, this.avatarRadius)) {
      rawPath[rawPath.length - 1] = { x: endX, z: endZ };
    }

    // 5. String-Pulling & Raycast Path Smoothing
    // Shorten waypoints with collision-checked line-of-sight tests
    const smoothedPath: PathPoint[] = [];
    let anchorIdx = 0;
    smoothedPath.push(rawPath[0]);

    while (anchorIdx < rawPath.length - 1) {
      let farthestIdx = anchorIdx + 1;
      for (let nextIdx = rawPath.length - 1; nextIdx > anchorIdx; nextIdx--) {
        if (
          isLineOfSightClear(
            rawPath[anchorIdx].x,
            rawPath[anchorIdx].z,
            rawPath[nextIdx].x,
            rawPath[nextIdx].z,
            this.avatarRadius,
          )
        ) {
          farthestIdx = nextIdx;
          break;
        }
      }
      smoothedPath.push(rawPath[farthestIdx]);
      anchorIdx = farthestIdx;
    }

    // Calculate total path length
    let totalLen = 0;
    let prev = { x: startX, z: startZ };
    for (const p of smoothedPath) {
      totalLen += Math.hypot(p.x - prev.x, p.z - prev.z);
      prev = p;
    }

    // Remove start point if it is essentially at current agent position
    if (
      smoothedPath.length > 1 &&
      Math.hypot(smoothedPath[0].x - startX, smoothedPath[0].z - startZ) < 0.2
    ) {
      smoothedPath.shift();
    }

    return {
      path: smoothedPath,
      success: true,
      length: totalLen,
    };
  }
}
