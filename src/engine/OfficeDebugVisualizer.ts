/**
 * OfficeDebugVisualizer.ts
 * Visual debugging layer for collision footprints, chair anchors, doorways,
 * and live agent paths.
 *
 * Implements Section 8 of the Realistic Office Movement Specification.
 * Non-intrusive: disabled by default, zero runtime overhead when hidden.
 */

import * as THREE from 'three';
import { STATIC_OBSTACLES, OFFICE_DOORWAYS } from './SpatialCollisionModel';
import { CHAIR_REGISTRY } from './ChairInteractionSystem';
import { AvatarMovementController } from './AvatarMovementController';

export class OfficeDebugVisualizer {
  public readonly group = new THREE.Group();
  public isEnabled = false;

  private obstacleGroup = new THREE.Group();
  private chairGroup = new THREE.Group();
  private doorGroup = new THREE.Group();
  private pathLinesGroup = new THREE.Group();

  constructor() {
    this.group.name = 'OfficeDebugVisualizer';
    this.group.visible = false;

    this.group.add(this.obstacleGroup);
    this.group.add(this.chairGroup);
    this.group.add(this.doorGroup);
    this.group.add(this.pathLinesGroup);

    this.buildObstacleVisuals();
    this.buildChairVisuals();
    this.buildDoorVisuals();

    // Check URL parameter ?debug=1
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('debug') === '1' || params.get('debug') === 'true') {
        this.setEnabled(true);
      }
      (window as any).__TOGGLE_OFFICE_DEBUG__ = () => this.toggle();
    }
  }

  public toggle(): boolean {
    this.setEnabled(!this.isEnabled);
    return this.isEnabled;
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    this.group.visible = enabled;
  }

  private buildObstacleVisuals(): void {
    const mat = new THREE.MeshBasicMaterial({
      color: 0xff3b30,
      wireframe: true,
      transparent: true,
      opacity: 0.7,
    });

    for (const obs of STATIC_OBSTACLES) {
      const width = obs.maxX - obs.minX;
      const depth = obs.maxZ - obs.minZ;
      const height = 1.2;
      const x = (obs.minX + obs.maxX) / 2;
      const z = (obs.minZ + obs.maxZ) / 2;

      const geom = new THREE.BoxGeometry(width, height, depth);
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(x, height / 2 + 0.08, z);
      this.obstacleGroup.add(mesh);
    }
  }

  private buildChairVisuals(): void {
    const approachGeom = new THREE.SphereGeometry(0.14, 8, 8);
    const seatGeom = new THREE.SphereGeometry(0.18, 8, 8);
    const exitGeom = new THREE.SphereGeometry(0.12, 8, 8);

    const approachMat = new THREE.MeshBasicMaterial({ color: 0x34d399 }); // Emerald Green = approach
    const seatMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });     // Cyan = seat anchor
    const exitMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });     // Yellow = exit

    for (const chair of CHAIR_REGISTRY.values()) {
      // 1. Approach Point
      const appMesh = new THREE.Mesh(approachGeom, approachMat);
      appMesh.position.set(chair.approachPoint.x, chair.approachPoint.y + 0.15, chair.approachPoint.z);
      this.chairGroup.add(appMesh);

      // 2. Seat Anchor
      const seatMesh = new THREE.Mesh(seatGeom, seatMat);
      seatMesh.position.set(chair.seatAnchor.x, chair.seatAnchor.y, chair.seatAnchor.z);
      this.chairGroup.add(seatMesh);

      // 3. Exit Point
      const exitMesh = new THREE.Mesh(exitGeom, exitMat);
      exitMesh.position.set(chair.exitPoint.x, chair.exitPoint.y + 0.15, chair.exitPoint.z);
      this.chairGroup.add(exitMesh);

      // Line between approach and seat
      const lineGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(chair.approachPoint.x, 0.2, chair.approachPoint.z),
        new THREE.Vector3(chair.seatAnchor.x, 0.68, chair.seatAnchor.z),
      ]);
      const line = new THREE.Line(
        lineGeom,
        new THREE.LineBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.8 }),
      );
      this.chairGroup.add(line);
    }
  }

  private buildDoorVisuals(): void {
    const mat = new THREE.MeshBasicMaterial({ color: 0xd946ef, wireframe: true });

    for (const door of Object.values(OFFICE_DOORWAYS)) {
      const w = door.direction === 'ns' ? door.width : 0.2;
      const d = door.direction === 'ns' ? 0.2 : door.width;
      const box = new THREE.Mesh(new THREE.BoxGeometry(w, 2.4, d), mat);
      box.position.set(door.x, 1.2, door.z);
      this.doorGroup.add(box);
    }
  }

  /**
   * Updates live debug path lines for moving agents.
   */
  public update(controllers: AvatarMovementController[]): void {
    if (!this.isEnabled) return;

    // Clear old path lines
    while (this.pathLinesGroup.children.length > 0) {
      const child = this.pathLinesGroup.children[0];
      if (child instanceof THREE.Line) {
        child.geometry.dispose();
      }
      this.pathLinesGroup.remove(child);
    }

    const pathMat = new THREE.LineBasicMaterial({ color: 0x00e5ff, linewidth: 2 });

    for (const ctrl of controllers) {
      if (ctrl.waypoints.length > 0) {
        const points = [
          new THREE.Vector3(ctrl.x, 0.2, ctrl.z),
          ...ctrl.waypoints.map((wp) => new THREE.Vector3(wp.x, 0.2, wp.z)),
        ];
        const geom = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geom, pathMat);
        this.pathLinesGroup.add(line);
      }
    }
  }

  public dispose(): void {
    this.obstacleGroup.clear();
    this.chairGroup.clear();
    this.doorGroup.clear();
    this.pathLinesGroup.clear();
  }
}
