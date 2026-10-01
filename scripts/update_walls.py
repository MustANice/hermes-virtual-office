import re

content = '''import * as THREE from "three";

/**
 * ArchitecturalWalls.ts
 * Implements the exact architectural cutaway enclosure and interior partitions
 * matching the user's reference image (Warm Cyber-Atelier & Japandi Mission Control):
 * 1. North Back Wall: 5.8m tall industrial loft wall with clerestory ribbon windows,
 *    vertical natural white oak acoustic slats, and warm LED cove grazing strip.
 * 2. West & East Side Walls: Stepped architectural cutaway walls with oak coping caps.
 * 3. Back-Suite Party Walls: Full-height interior dividing walls between Executive <-> A2A Connect
 *    and A2A Connect <-> Research & Intel, complete with casing door portals.
 * 4. Corridor-Facing Boundaries: Low waist-high (1.0m) clear tempered glass balustrades
 *    with slender matte-black steel posts, champagne brass top handrail caps, and generous open doorways.
 * 5. Full-Height East-West Corridor Glass Checkpoints: 3.2m tall glass partition with brass-framed
 *    double doors (ajar with long vertical brass pull handles) running East-West across the side corridors:
 *    - West Checkpoint: Hallway between Executive Suite and QA & Hardening (Z = -1.5)
 *    - East Checkpoint: Hallway between Research & Intel and SRE & Infrastructure (Z = -1.5)
 */
export function buildArchitecturalWalls(parent: THREE.Group): THREE.Group {
  const architecture = new THREE.Group();
  architecture.name = "ArchitecturalWalls";

  const materials = {
    plaster: new THREE.MeshStandardMaterial({
      color: 0xE8E6E1,
      roughness: 0.88,
    }),
    charcoalBase: new THREE.MeshStandardMaterial({
      color: 0x1E2022,
      roughness: 0.84,
    }),
    oakSlat: new THREE.MeshStandardMaterial({
      color: 0xC89D66, // Warm natural white oak
      roughness: 0.65,
      metalness: 0.04,
    }),
    oakCoping: new THREE.MeshStandardMaterial({
      color: 0xBA8C63, // Deep golden architectural oak
      roughness: 0.55,
    }),
    blackSteel: new THREE.MeshStandardMaterial({
      color: 0x222528, // Matte black architectural steel
      metalness: 0.75,
      roughness: 0.38,
    }),
    brass: new THREE.MeshStandardMaterial({
      color: 0xC5A059, // Champagne gold / brushed brass
      metalness: 0.82,
      roughness: 0.32,
    }),
    clerestoryGlass: new THREE.MeshPhysicalMaterial({
      color: 0xDCEBFF,
      metalness: 0.05,
      roughness: 0.08,
      transmission: 0.88,
      thickness: 0.12,
      ior: 1.5,
      transparent: true,
      opacity: 0.65,
    }),
    balustradeGlass: new THREE.MeshPhysicalMaterial({
      color: 0xF3F8F8,
      metalness: 0.0,
      roughness: 0.09,
      transmission: 0.95,
      thickness: 0.015,
      ior: 1.5,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    }),
    warmLedGlow: new THREE.MeshStandardMaterial({
      color: 0xFFFBEB,
      emissive: 0xFFB86C,
      emissiveIntensity: 1.4,
      roughness: 0.3,
    }),
    cyanLedGlow: new THREE.MeshStandardMaterial({
      color: 0x67E8F9,
      emissive: 0x00E5FF,
      emissiveIntensity: 2.5,
      roughness: 0.2,
    }),
  };

  const cube = new THREE.BoxGeometry(1, 1, 1);

  function box(
    target: THREE.Group,
    name: string,
    width: number,
    height: number,
    depth: number,
    x: number,
    y: number,
    z: number,
    material: THREE.Material,
    castShadow = true,
  ): THREE.Mesh {
    const mesh = new THREE.Mesh(cube, material);
    mesh.name = name;
    mesh.scale.set(width, height, depth);
    mesh.position.set(x, y, z);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = true;
    target.add(mesh);
    return mesh;
  }

  function group(name: string): THREE.Group {
    const result = new THREE.Group();
    result.name = name;
    architecture.add(result);
    return result;
  }

  // =========================================================================
  // 1. NORTH BACK WALL: 5.8m Tall Grand Industrial Loft Clerestory Wall
  // =========================================================================
  const north = group("North-Grand-Loft-Wall");
  north.position.z = -21.5;

  const outerX = 31.5;
  const wallThickness = 0.42;
  const northHeight = 6.0;
  const windowBottom = 2.5;
  const windowTop = 5.5;
  const bayCount = 10;
  const bayWidth = (outerX * 2) / bayCount;
  const pierWidth = 0.32;
  const frameWidth = 0.055;
  const windowHeight = windowTop - windowBottom;

  // Solid base sill wall (0 to 2.5m)
  box(
    north, "North-Sill-Base",
    outerX * 2, windowBottom, wallThickness,
    0, windowBottom / 2, 0, materials.charcoalBase,
  );

  // Vertical Fluted Scandinavian Oak Slats along lower north wall
  const slatSpacing = 0.38;
  const slatWidth = 0.22;
  const slatDepth = 0.08;
  for (let sx = -outerX + 0.6; sx < outerX - 0.6; sx += slatSpacing) {
    box(
      north, "North-Acoustic-Slat",
      slatWidth, windowBottom - 0.15, slatDepth,
      sx, (windowBottom - 0.15) / 2 + 0.08, wallThickness / 2 + slatDepth / 2,
      materials.oakSlat,
    );
  }

  // Warm LED grazing cove strip between wood slats and window sill
  box(
    north, "North-LED-Cove",
    outerX * 2 - 0.5, 0.06, 0.08,
    0, windowBottom - 0.03, wallThickness / 2 + 0.04,
    materials.warmLedGlow, false,
  );

  // Continuous upper header beam above windows
  box(
    north, "North-Header-Beam",
    outerX * 2, northHeight - windowTop, wallThickness + 0.08,
    0, (northHeight + windowTop) / 2, 0, materials.charcoalBase,
  );

  // Oak top cornice cap along ceiling line
  box(
    north, "North-Ceiling-Cornice",
    outerX * 2 + 0.2, 0.12, wallThickness + 0.16,
    0, northHeight - 0.06, 0, materials.oakCoping,
  );

  // Vertical solid piers between window bays
  for (let i = 0; i <= bayCount; i++) {
    const edge = i === 0 || i === bayCount;
    const width = edge ? pierWidth / 2 : pierWidth;
    const x = -outerX + i * bayWidth + (i === 0 ? width / 2 : i === bayCount ? -width / 2 : 0);
    box(
      north, `North-Pier-${i}`,
      width, windowHeight, wallThickness,
      x, (windowBottom + windowTop) / 2, 0, materials.charcoalBase,
    );
  }

  // Crittall Black Steel Windows
  for (let i = 0; i < bayCount; i++) {
    const x = -outerX + (i + 0.5) * bayWidth;
    const openingWidth = bayWidth - pierWidth;
    const clearWidth = openingWidth - frameWidth * 2;
    const glassHeight = windowHeight - frameWidth * 2;
    const centerY = (windowBottom + windowTop) / 2;

    for (const direction of [-1, 1]) {
      box(
        north, `Window-${i}-Jamb-${direction}`,
        frameWidth, windowHeight, 0.16,
        x + direction * (openingWidth - frameWidth) / 2,
        centerY, 0, materials.blackSteel,
      );
      box(
        north, `Window-${i}-Rail-${direction}`,
        clearWidth, frameWidth, 0.16,
        x,
        centerY + direction * (windowHeight - frameWidth) / 2,
        0, materials.blackSteel,
      );
    }

    box(
      north, `Window-${i}-Center-Mullion`,
      frameWidth, glassHeight, 0.14,
      x, centerY, 0, materials.blackSteel,
    );

    const paneWidth = (clearWidth - frameWidth) / 2;
    for (const direction of [-1, 1]) {
      box(
        north, `Window-${i}-Glass-${direction}`,
        paneWidth, glassHeight, 0.05,
        x + direction * (paneWidth + frameWidth) / 2,
        centerY, 0, materials.clerestoryGlass, false,
      );
    }
  }

  // =========================================================================
  // 2. WEST & EAST SIDE WALLS: Stepped Architectural Cutaways
  // =========================================================================
  const sideSteps = [
    { start: -21.5 + wallThickness / 2, end: -10.5, height: 6.0 },
    { start: -10.5, end: 0.5, height: 4.8 },
    { start: 0.5, end: 11.5, height: 3.8 },
    { start: 11.5, end: 22.5, height: 2.8 },
  ];

  for (const side of [-1, 1]) {
    const wall = group(side < 0 ? "West-Architectural-Wall" : "East-Architectural-Wall");
    const x = side * (outerX - wallThickness / 2);

    sideSteps.forEach(({ start, end, height }, index) => {
      const length = end - start;
      const z = (start + end) / 2;
      const capHeight = 0.12;

      box(
        wall, `Side-Wall-Step-${index}`,
        wallThickness, height - capHeight, length,
        x, (height - capHeight) / 2, z, materials.plaster,
      );

      box(
        wall, `Side-Oak-Coping-${index}`,
        wallThickness + 0.14, capHeight, length + 0.04,
        x, height - capHeight / 2, z, materials.oakCoping,
      );

      // Lower vertical acoustic slats
      const slatCount = Math.floor(length / 0.5);
      const slatPitch = length / slatCount;
      for (let s = 0; s < slatCount; s++) {
        const sz = start + (s + 0.5) * slatPitch;
        box(
          wall, `Side-Acoustic-Slat-${index}-${s}`,
          0.05, Math.min(2.2, height - 0.4), 0.28,
          x - side * (wallThickness / 2 + 0.03),
          Math.min(2.2, height - 0.4) / 2 + 0.06, sz,
          materials.oakSlat,
        );
      }
    });
  }

  // =========================================================================
  // 3. FULL-HEIGHT PARTY WALLS BETWEEN TOP 3 ROOMS
  // =========================================================================
  const partyWallHeight = 4.2;
  const partyWalls = [
    { name: "Executive-Dev-PartyWall", x: -11.0, startZ: -21.5, endZ: -7.0, doorCenterZ: -14.0, doorWidth: 2.6 },
    { name: "Dev-Research-PartyWall", x: 11.0, startZ: -21.5, endZ: -7.0, doorCenterZ: -14.0, doorWidth: 2.6 },
  ];

  for (const pw of partyWalls) {
    const pwGroup = group(pw.name);
    const doorStartZ = pw.doorCenterZ - pw.doorWidth / 2;
    const doorEndZ = pw.doorCenterZ + pw.doorWidth / 2;

    // Segment north of door
    const len1 = doorStartZ - pw.startZ;
    if (len1 > 0.1) {
      box(
        pwGroup, `${pw.name}-North`,
        0.24, partyWallHeight, len1,
        pw.x, partyWallHeight / 2, pw.startZ + len1 / 2,
        materials.charcoalBase,
      );
      for (let sz = pw.startZ + 0.3; sz < doorStartZ - 0.2; sz += 0.45) {
        box(pwGroup, `${pw.name}-Slat-L`, 0.05, 2.2, 0.26, pw.x - 0.14, 1.1, sz, materials.oakSlat);
        box(pwGroup, `${pw.name}-Slat-R`, 0.05, 2.2, 0.26, pw.x + 0.14, 1.1, sz, materials.oakSlat);
      }
    }

    // Segment south of door
    const len2 = pw.endZ - doorEndZ;
    if (len2 > 0.1) {
      box(
        pwGroup, `${pw.name}-South`,
        0.24, partyWallHeight, len2,
        pw.x, partyWallHeight / 2, doorEndZ + len2 / 2,
        materials.charcoalBase,
      );
      for (let sz = doorEndZ + 0.3; sz < pw.endZ - 0.2; sz += 0.45) {
        box(pwGroup, `${pw.name}-Slat-L`, 0.05, 2.2, 0.26, pw.x - 0.14, 1.1, sz, materials.oakSlat);
        box(pwGroup, `${pw.name}-Slat-R`, 0.05, 2.2, 0.26, pw.x + 0.14, 1.1, sz, materials.oakSlat);
      }
    }

    // Doorway Lintel Header
    box(
      pwGroup, `${pw.name}-Lintel`,
      0.28, partyWallHeight - 2.8, pw.doorWidth + 0.2,
      pw.x, (partyWallHeight + 2.8) / 2, pw.doorCenterZ,
      materials.oakCoping,
    );
  }

  // =========================================================================
  // 4. CORRIDOR-FACING ARCHITECTURAL GLASS BALUSTRADES (WAIST-HIGH 1.0M)
  // All 7 rooms have low, open balustrades with generous openings
  // =========================================================================
  type BalustradeRun = {
    name: string;
    fromX: number; fromZ: number;
    toX: number; toZ: number;
    doorCenterX?: number; doorCenterZ?: number; doorWidth?: number;
  };

  const balustrades: BalustradeRun[] = [
    // Executive Suite front boundary
    { name: "Executive-Front", fromX: -29.5, fromZ: -7.0, toX: -11.2, toZ: -7.0, doorCenterX: -21.0, doorCenterZ: -7.0, doorWidth: 2.8 },

    // A2A Connect (Dev) front boundary
    { name: "Dev-Front", fromX: -9.8, fromZ: -10.5, toX: 9.8, toZ: -10.5, doorCenterX: 0, doorCenterZ: -10.5, doorWidth: 3.2 },

    // Research & Intel front boundary
    { name: "Research-Front", fromX: 11.2, fromZ: -7.0, toX: 29.5, toZ: -7.0, doorCenterX: 21.0, doorCenterZ: -7.0, doorWidth: 2.8 },

    // QA & Hardening north boundary
    { name: "QA-North", fromX: -29.5, fromZ: 4.0, toX: -12.0, toZ: 4.0, doorCenterX: -21.0, doorCenterZ: 4.0, doorWidth: 2.8 },

    // Lounge & Operations north boundary
    { name: "Lounge-North", fromX: -9.8, fromZ: 6.5, toX: 9.8, toZ: 6.5, doorCenterX: 0, doorCenterZ: 6.5, doorWidth: 3.2 },

    // SRE & Infrastructure north boundary
    { name: "SRE-North", fromX: 12.0, fromZ: 4.0, toX: 29.5, toZ: 4.0, doorCenterX: 21.0, doorCenterZ: 4.0, doorWidth: 2.8 },
  ];

  function buildBalustrade(
    target: THREE.Group,
    name: string,
    x1: number, z1: number,
    x2: number, z2: number,
  ): void {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const length = Math.hypot(dx, dz);
    if (length < 0.2) return;

    const angle = Math.atan2(dx, dz);
    const midX = (x1 + x2) / 2;
    const midZ = (z1 + z2) / 2;

    const bGroup = new THREE.Group();
    bGroup.position.set(midX, 0, midZ);
    bGroup.rotation.y = angle;
    target.add(bGroup);

    const balustradeHeight = 1.0;
    const postW = 0.035;
    const bayCount = Math.max(1, Math.round(length / 1.3));
    const bayW = length / bayCount;

    // Slender Black Steel Posts with Brass Top Caps
    for (let i = 0; i <= bayCount; i++) {
      const pz = -length / 2 + i * bayW;
      box(bGroup, `${name}-Post-${i}`, postW, balustradeHeight, postW, 0, balustradeHeight / 2, pz, materials.blackSteel);
      box(bGroup, `${name}-BrassCap-${i}`, postW + 0.02, 0.03, postW + 0.02, 0, balustradeHeight + 0.015, pz, materials.brass, false);
    }

    // Tempered Glass Panes
    for (let i = 0; i < bayCount; i++) {
      const pz = -length / 2 + (i + 0.5) * bayW;
      const glassW = bayW - postW * 2;
      box(bGroup, `${name}-Glass-${i}`, 0.015, balustradeHeight - 0.12, glassW, 0, (balustradeHeight - 0.12) / 2 + 0.06, pz, materials.balustradeGlass, false);
    }

    // Brass Top Handrail
    box(bGroup, `${name}-Handrail`, 0.045, 0.035, length, 0, balustradeHeight - 0.015, 0, materials.brass, false);

    // Dark Bottom Base Rail
    box(bGroup, `${name}-BaseRail`, 0.055, 0.05, length, 0, 0.025, 0, materials.blackSteel);
  }

  const balustradeContainer = group("Corridor-Balustrades");

  for (const b of balustrades) {
    if (b.doorCenterX !== undefined && b.doorCenterZ !== undefined && b.doorWidth) {
      const halfDoor = b.doorWidth / 2;
      const isX = Math.abs(b.toZ - b.fromZ) < 0.01;

      if (isX) {
        const leftX = Math.min(b.fromX, b.toX);
        const rightX = Math.max(b.fromX, b.toX);
        const doorLeft = b.doorCenterX - halfDoor;
        const doorRight = b.doorCenterX + halfDoor;

        buildBalustrade(balustradeContainer, `${b.name}-L`, leftX, b.fromZ, doorLeft, b.fromZ);
        buildBalustrade(balustradeContainer, `${b.name}-R`, doorRight, b.fromZ, rightX, b.fromZ);
      } else {
        const topZ = Math.min(b.fromZ, b.toZ);
        const bottomZ = Math.max(b.fromZ, b.toZ);
        const doorTop = b.doorCenterZ - halfDoor;
        const doorBottom = b.doorCenterZ + halfDoor;

        buildBalustrade(balustradeContainer, `${b.name}-T`, b.fromX, topZ, b.fromX, doorTop);
        buildBalustrade(balustradeContainer, `${b.name}-B`, b.fromX, doorBottom, b.fromX, bottomZ);
      }
    } else {
      buildBalustrade(balustradeContainer, b.name, b.fromX, b.fromZ, b.toX, b.toZ);
    }
  }

  // =========================================================================
  // 5. FULL-HEIGHT CORRIDOR GLASS PARTITIONS WITH BRASS-FRAMED DOUBLE DOORS
  // Two distinct East-West security checkpoints crossing the side corridors:
  // 1. West Checkpoint: Hallway south of Executive Suite (separating Executive from QA)
  // 2. East Checkpoint: Hallway north of SRE & Infra (separating Research from SRE)
  // =========================================================================
  function buildEastWestCorridorDoorway(
    target: THREE.Group,
    name: string,
    z: number,
    startX: number,
    endX: number,
    doorCenterX: number,
    doorWidth: number,
  ): void {
    const pGroup = new THREE.Group();
    pGroup.position.set((startX + endX) / 2, 0, z);
    target.add(pGroup);

    const height = 3.2;
    const totalLen = Math.abs(endX - startX);
    const halfDoor = doorWidth / 2;
    const relDoorX = doorCenterX - (startX + endX) / 2;

    // Continuous Matte Black Steel Header Beam (3.2m above floor)
    box(pGroup, `${name}-TopBeam`, totalLen, 0.08, 0.08, 0, height - 0.04, 0, materials.blackSteel);

    // Outer Left and Right Wall Jambs
    box(pGroup, `${name}-Jamb-L`, 0.08, height, 0.08, -totalLen / 2 + 0.04, height / 2, 0, materials.blackSteel);
    box(pGroup, `${name}-Jamb-R`, 0.08, height, 0.08, totalLen / 2 - 0.04, height / 2, 0, materials.blackSteel);

    // Doorway Frame Posts with Brass Finials
    const doorLeftX = relDoorX - halfDoor;
    const doorRightX = relDoorX + halfDoor;
    box(pGroup, `${name}-DoorPost-L`, 0.08, height, 0.08, doorLeftX, height / 2, 0, materials.blackSteel);
    box(pGroup, `${name}-DoorPost-R`, 0.08, height, 0.08, doorRightX, height / 2, 0, materials.blackSteel);
    box(pGroup, `${name}-DoorPost-L-Cap`, 0.1, 0.04, 0.1, doorLeftX, height + 0.02, 0, materials.brass, false);
    box(pGroup, `${name}-DoorPost-R-Cap`, 0.1, 0.04, 0.1, doorRightX, height + 0.02, 0, materials.brass, false);

    // Horizontal Transom Bar above double doors (at 2.4m height) in Brushed Brass
    box(pGroup, `${name}-TransomBar`, doorWidth, 0.06, 0.06, relDoorX, 2.4, 0, materials.brass);

    // Transom Glass Pane above doors (between 2.4m and 3.2m)
    box(pGroup, `${name}-TransomGlass`, doorWidth - 0.06, 0.74, 0.015, relDoorX, 2.8, 0, materials.balustradeGlass, false);

    // Fixed Glass Sidelight Panels (West of Door)
    const leftLen = Math.abs(doorLeftX - (-totalLen / 2 + 0.08));
    if (leftLen > 0.2) {
      const midLX = (-totalLen / 2 + 0.08 + doorLeftX) / 2;
      box(pGroup, `${name}-FixedGlass-L`, leftLen, height - 0.12, 0.015, midLX, height / 2, 0, materials.balustradeGlass, false);
      box(pGroup, `${name}-MidBar-L`, leftLen, 0.04, 0.05, midLX, 1.1, 0, materials.blackSteel);
      // Cyan under-glow baseboard
      box(pGroup, `${name}-GlowBase-L`, leftLen, 0.08, 0.06, midLX, 0.04, 0, materials.cyanLedGlow, false);
    }

    // Fixed Glass Sidelight Panels (East of Door)
    const rightLen = Math.abs((totalLen / 2 - 0.08) - doorRightX);
    if (rightLen > 0.2) {
      const midRX = (doorRightX + totalLen / 2 - 0.08) / 2;
      box(pGroup, `${name}-FixedGlass-R`, rightLen, height - 0.12, 0.015, midRX, height / 2, 0, materials.balustradeGlass, false);
      box(pGroup, `${name}-MidBar-R`, rightLen, 0.04, 0.05, midRX, 1.1, 0, materials.blackSteel);
      // Cyan under-glow baseboard
      box(pGroup, `${name}-GlowBase-R`, rightLen, 0.08, 0.06, midRX, 0.04, 0, materials.cyanLedGlow, false);
    }

    // Double-leaf Glass Doors with Distinctive Brushed Brass Frames & Long Vertical Pull Handles
    const doorLeafW = doorWidth / 2 - 0.05;

    // Left Door Leaf (swung slightly ajar forward)
    const leafL = new THREE.Group();
    leafL.position.set(doorLeftX, 0, 0);
    leafL.rotation.y = 0.35; // Ajar forward
    box(leafL, `${name}-DoorLeaf-L-Glass`, doorLeafW, 2.34, 0.015, doorLeafW / 2, 1.18, 0, materials.balustradeGlass, false);
    // Brushed Brass Perimeter Frame on door leaf
    box(leafL, `${name}-DoorLeaf-L-TopFrame`, doorLeafW, 0.04, 0.04, doorLeafW / 2, 2.35, 0, materials.brass);
    box(leafL, `${name}-DoorLeaf-L-BottomFrame`, doorLeafW, 0.08, 0.04, doorLeafW / 2, 0.04, 0, materials.brass);
    box(leafL, `${name}-DoorLeaf-L-EdgeFrame`, 0.04, 2.36, 0.04, doorLeafW, 1.18, 0, materials.brass);
    // Distinctive Long Vertical Cylindrical Brass Pull Handle
    box(leafL, `${name}-Handle-L`, 0.025, 0.72, 0.025, doorLeafW - 0.08, 1.18, 0.045, materials.brass, false);
    pGroup.add(leafL);

    // Right Door Leaf (swung slightly ajar backward)
    const leafR = new THREE.Group();
    leafR.position.set(doorRightX, 0, 0);
    leafR.rotation.y = -0.35; // Ajar backward
    box(leafR, `${name}-DoorLeaf-R-Glass`, doorLeafW, 2.34, 0.015, -doorLeafW / 2, 1.18, 0, materials.balustradeGlass, false);
    // Brushed Brass Perimeter Frame on door leaf
    box(leafR, `${name}-DoorLeaf-R-TopFrame`, doorLeafW, 0.04, 0.04, -doorLeafW / 2, 2.35, 0, materials.brass);
    box(leafR, `${name}-DoorLeaf-R-BottomFrame`, doorLeafW, 0.08, 0.04, -doorLeafW / 2, 0.04, 0, materials.brass);
    box(leafR, `${name}-DoorLeaf-R-EdgeFrame`, 0.04, 2.36, 0.04, -doorLeafW, 1.18, 0, materials.brass);
    // Distinctive Long Vertical Cylindrical Brass Pull Handle
    box(leafR, `${name}-Handle-R`, 0.025, 0.72, 0.025, -(doorLeafW - 0.08), 1.18, 0.045, materials.brass, false);
    pGroup.add(leafR);
  }

  // West Security Checkpoint (Between Executive Suite & QA & Hardening across the hallway at Z = -1.5)
  buildEastWestCorridorDoorway(balustradeContainer, "West-Corridor-Security-Checkpoint", -1.5, -29.5, -11.5, -20.5, 2.8);

  // East Security Checkpoint (Between Research & Intel & SRE & Infrastructure across the hallway at Z = -1.5)
  buildEastWestCorridorDoorway(balustradeContainer, "East-Corridor-Security-Checkpoint", -1.5, 11.5, 29.5, 20.5, 2.8);

  parent.add(architecture);
  return architecture;
}
'''

with open('/root/projects/hermes-virtual-office/src/engine/ArchitecturalWalls.ts', 'w') as f:
    f.write(content)

print("ArchitecturalWalls.ts updated successfully!")
