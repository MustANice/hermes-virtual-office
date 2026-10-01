import * as THREE from 'three';

export interface JapandiRoomOptions {
  id: string;
  name: string;
  width?: number;
  depth?: number;
  height?: number;
  position?: THREE.Vector3;
  rotationY?: number;
  accentColor?: string;
  creamColor?: string;
  hasWindow?: boolean;
}

export interface JapandiRoomResult {
  group: THREE.Group;
  dispose: () => void;
}

export function createJapandiDioramaRoom(options: JapandiRoomOptions): JapandiRoomResult {
  const width = options.width ?? 11.0;
  const depth = options.depth ?? 9.0;
  const height = options.height ?? 4.2;

  const group = new THREE.Group();
  group.name = `JapandiRoom_${options.id}`;

  if (options.position) group.position.copy(options.position);
  group.rotation.y = options.rotationY ?? 0;

  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();

  const standard = (color: THREE.ColorRepresentation, roughness = 0.85, metalness = 0): THREE.MeshStandardMaterial => {
    const mat = new THREE.MeshStandardMaterial({ color, roughness, metalness });
    materials.add(mat);
    return mat;
  };

  const daylight = new THREE.MeshBasicMaterial({ color: '#FFFBEB', toneMapped: false });
  materials.add(daylight);

  const m = {
    trim: standard('#FFFFFF', 0.5), // Pure white architectural trim
    accent: standard(options.accentColor ?? '#9DB0BC', 0.9), // Soft slate / dusty blue
    cream: standard(options.creamColor ?? '#E8E3D8', 0.92), // Warm soft bone white
    oak: standard('#E5C5A8', 0.6), // Pale Scandinavian oak
    oakEdge: standard('#CFAE8B', 0.7),
    parquet: [
      standard('#DFC2A5', 0.65),
      standard('#E5CBB0', 0.65),
      standard('#D8B998', 0.65),
      standard('#E8CFB5', 0.65),
    ],
    charcoal: standard('#25292D', 0.7, 0.1),
    linen: standard('#F1EFEA', 0.95),
    terracotta: standard('#C47A6C', 0.9),
    soil: standard('#4A3728', 1.0),
    leaf: standard('#567451', 0.8),
    leafLight: standard('#779165', 0.8),
    ceramic: standard('#DCD8CC', 0.5),
    paper: standard('#F8FAFC', 0.9),
    daylight,
  };

  function mesh<G extends THREE.BufferGeometry>(
    parent: THREE.Object3D,
    geometry: G,
    material: THREE.Material,
    pos: readonly [number, number, number] = [0, 0, 0]
  ): THREE.Mesh<G, THREE.Material> {
    geometries.add(geometry);
    const obj = new THREE.Mesh(geometry, material);
    obj.position.set(...pos);
    obj.castShadow = true;
    obj.receiveShadow = true;
    parent.add(obj);
    return obj;
  }

  function box(parent: THREE.Object3D, w: number, h: number, d: number, material: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
    return mesh(parent, new THREE.BoxGeometry(w, h, d), material, [x, y, z]);
  }

  function beveledBox(
    parent: THREE.Object3D,
    w: number,
    h: number,
    d: number,
    radius: number,
    material: THREE.Material,
    x = 0,
    y = 0,
    z = 0
  ): THREE.Mesh {
    const r = Math.min(radius, w * 0.2, h * 0.2, d * 0.2);
    const hw = w / 2 - r;
    const hh = h / 2 - r;

    const shape = new THREE.Shape();
    shape.moveTo(-hw, -hh);
    shape.lineTo(hw, -hh);
    shape.lineTo(hw, hh);
    shape.lineTo(-hw, hh);
    shape.closePath();

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: Math.max(0.01, d - 2 * r),
      steps: 1,
      bevelEnabled: true,
      bevelThickness: r,
      bevelSize: r,
      bevelSegments: 2,
    });
    geometry.translate(0, 0, -d / 2 + r);
    return mesh(parent, geometry, material, [x, y, z]);
  }

  // 1. DIORAMA FOUNDATION & THICK WHITE ARCHITECTURAL SLAB
  const wallThickness = 0.35;
  const rim = 0.45;
  const northZ = -depth / 2;
  const westX = -width / 2;

  // Thick white base slab with beveled edges
  beveledBox(group, width + rim * 2, 0.4, depth + rim * 2, 0.08, m.trim, 0, -0.2, 0);

  // 2. STAGGERED SCANDINAVIAN PARQUET FLOOR
  const rowCount = Math.ceil(depth / 0.35);
  const rowDepth = depth / rowCount;
  const plankLength = 1.6;
  const gap = 0.015;

  for (let row = 0; row < rowCount; row++) {
    const z = -depth / 2 + (row + 0.5) * rowDepth;
    const offset = (row % 3) * plankLength / 3;
    let idx = 0;

    for (let start = -width / 2 - offset; start < width / 2; start += plankLength) {
      const left = Math.max(start, -width / 2);
      const right = Math.min(start + plankLength, width / 2);
      if (right - left <= gap) continue;

      box(
        group,
        right - left - gap,
        0.03,
        rowDepth - gap,
        m.parquet[(row * 5 + idx++) % m.parquet.length],
        (left + right) / 2,
        0.015,
        z
      );
    }
  }

  // 3. TWO-WALL DOLLHOUSE CUTAWAY (West Wall & North Wall Only)
  // Left/West Wall (Warm Cream / Bone White)
  box(group, wallThickness, height, depth, m.cream, westX - wallThickness / 2, height / 2, 0);

  // North Wall (Cool Dusty Blue Accent Wall)
  const wallZ = northZ - wallThickness / 2;
  const hasWindow = options.hasWindow ?? true;

  if (hasWindow) {
    // Recessed Double-Pane Daylight Window
    const winW = Math.min(3.8, width * 0.45);
    const winH = 2.2;
    const winBottom = 1.4;
    const winTop = winBottom + winH;
    const winX = 0.5;

    // Wall sections around window opening
    box(group, width, winBottom, wallThickness, m.accent, 0, winBottom / 2, wallZ);
    box(group, width, height - winTop, wallThickness, m.accent, 0, (height + winTop) / 2, wallZ);

    const leftW = (winX - winW / 2) + width / 2;
    const rightW = width / 2 - (winX + winW / 2);
    box(group, leftW, winH, wallThickness, m.accent, -width / 2 + leftW / 2, winBottom + winH / 2, wallZ);
    box(group, rightW, winH, wallThickness, m.accent, winX + winW / 2 + rightW / 2, winBottom + winH / 2, wallZ);

    // Natural Birch Window Frame
    const frame = 0.08;
    const winCenterY = winBottom + winH / 2;
    box(group, frame, winH, 0.28, m.oak, winX - winW / 2 + frame / 2, winCenterY, wallZ);
    box(group, frame, winH, 0.28, m.oak, winX + winW / 2 - frame / 2, winCenterY, wallZ);
    box(group, winW, frame, 0.28, m.oak, winX, winBottom + frame / 2, wallZ);
    box(group, winW, frame, 0.28, m.oak, winX, winTop - frame / 2, wallZ);
    // Center mullion
    box(group, 0.06, winH - frame * 2, 0.16, m.oak, winX, winCenterY, wallZ);

    // Bright daylight glass pane
    const paneW = (winW - frame * 2 - 0.06) / 2;
    for (const side of [-1, 1]) {
      const pane = box(
        group,
        paneW,
        winH - frame * 2,
        0.015,
        m.daylight,
        winX + side * (paneW / 2 + 0.03),
        winCenterY,
        northZ - wallThickness - 0.01
      );
      pane.castShadow = false;
      pane.receiveShadow = false;
    }

    // Birch Windowsill
    beveledBox(group, winW + 0.3, 0.08, 0.45, 0.02, m.oak, winX, winBottom - 0.02, northZ + 0.08);

    // Warm diffused daylight fill light spilling from window
    const windowLight = new THREE.PointLight('#FFF8EB', 1.6, 12, 1.5);
    windowLight.position.set(winX, winCenterY, northZ + 0.6);
    group.add(windowLight);
  } else {
    // Solid accent wall
    box(group, width, height, wallThickness, m.accent, 0, height / 2, wallZ);
  }

  // 4. THICK WHITE ARCHITECTURAL CAPS ON EXPOSED CUTAWAY EDGES
  beveledBox(group, width + rim, rim, rim, 0.03, m.trim, 0, height, wallZ);
  beveledBox(group, rim, rim, depth + rim, 0.03, m.trim, westX - wallThickness / 2, height, 0);
  beveledBox(group, rim, height + rim / 2, rim, 0.03, m.trim, width / 2, height / 2, wallZ);
  beveledBox(group, rim, height + rim / 2, rim, 0.03, m.trim, westX - wallThickness / 2, height / 2, depth / 2);

  // Modern White Baseboards along the 2 interior walls
  box(group, width, 0.14, 0.05, m.trim, 0, 0.07, northZ + 0.025);
  box(group, 0.05, 0.14, depth, m.trim, westX + 0.025, 0.07, 0);

  // 5. INTEGRATED TALL OPEN-SHELF BOOKCASE (Japandi Style)
  const shelfX = westX + 1.2;
  const shelfZ = northZ + 0.35;
  const shelfW = 1.8;
  const shelfD = 0.45;
  const shelfH = 3.0;

  for (const sx of [-shelfW / 2 + 0.04, shelfW / 2 - 0.04]) {
    box(group, 0.06, shelfH, 0.06, m.oakEdge, shelfX + sx, shelfH / 2, shelfZ);
  }
  const levels = [0.2, 0.9, 1.6, 2.3, 2.9];
  levels.forEach((ly) => {
    beveledBox(group, shelfW, 0.06, shelfD, 0.015, m.oak, shelfX, ly, shelfZ);
  });

  // Books and ceramic vase decor on shelves
  const bookColors = [m.accent, m.terracotta, m.charcoal, m.cream];
  for (let b = 0; b < 6; b++) {
    const bh = 0.32 + (b % 3) * 0.05;
    box(group, 0.08, bh, 0.28, bookColors[b % bookColors.length], shelfX - 0.6 + b * 0.11, levels[1] + bh / 2 + 0.03, shelfZ);
  }
  // Ceramic vase on shelf 3
  const vase = mesh(group, new THREE.CylinderGeometry(0.08, 0.12, 0.32, 12), m.ceramic, [shelfX + 0.4, levels[2] + 0.19, shelfZ]);
  vase.castShadow = true;

  // 6. SQUARE TERRACOTTA PLANTER & FIDDLE-LEAF FIG TREE IN CORNER
  const planterX = westX + 0.7;
  const planterZ = northZ + 1.8;
  beveledBox(group, 0.7, 0.65, 0.7, 0.04, m.terracotta, planterX, 0.325, planterZ);
  box(group, 0.6, 0.02, 0.6, m.soil, planterX, 0.64, planterZ);

  // Trunk
  const trunk = mesh(group, new THREE.CylinderGeometry(0.035, 0.05, 2.2, 8), m.oakEdge, [planterX, 1.4, planterZ]);
  // Broad green leaves
  for (let l = 0; l < 7; l++) {
    const angle = l * 2.4;
    const ly = 1.0 + l * 0.2;
    const leaf = mesh(group, new THREE.BoxGeometry(0.42, 0.02, 0.32), l % 2 === 0 ? m.leaf : m.leafLight, [
      planterX + Math.cos(angle) * 0.35,
      ly,
      planterZ + Math.sin(angle) * 0.35,
    ]);
    leaf.rotation.set(0.2, -angle, 0.3);
  }

  // 7. MINIMALIST DARK-FRAMED WALL ART
  const art = new THREE.Group();
  beveledBox(art, 0.9, 1.2, 0.05, 0.01, m.charcoal, 0, 0, 0);
  box(art, 0.8, 1.1, 0.01, m.paper, 0, 0, 0.03);
  // Minimalist warm circle graphic
  const artCircle = mesh(art, new THREE.CircleGeometry(0.22, 24), m.terracotta, [0.08, 0.15, 0.036]);
  artCircle.castShadow = false;
  art.position.set(westX + 0.04, 2.6, 1.2);
  art.rotation.y = Math.PI / 2;
  group.add(art);

  // 8. ELEGANT ROOM SIGNAGE ON CORNER BEVEL
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 360;
  signCanvas.height = 80;
  const sCtx = signCanvas.getContext('2d')!;
  sCtx.fillStyle = '#FFFFFF';
  sCtx.fillRect(0, 0, 360, 80);
  sCtx.strokeStyle = '#2563EB';
  sCtx.lineWidth = 6;
  sCtx.strokeRect(3, 3, 354, 74);
  sCtx.fillStyle = '#0F172A';
  sCtx.font = 'bold 24px monospace';
  sCtx.textAlign = 'center';
  sCtx.textBaseline = 'middle';
  sCtx.fillText(options.name, 180, 40);

  const signTex = new THREE.CanvasTexture(signCanvas);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.8), new THREE.MeshBasicMaterial({ map: signTex }));
  sign.position.set(0, height + 0.5, northZ);
  group.add(sign);

  return {
    group,
    dispose() {
      group.removeFromParent();
      geometries.forEach((g) => g.dispose());
      materials.forEach((mat) => mat.dispose());
      geometries.clear();
      materials.clear();
    },
  };
}
