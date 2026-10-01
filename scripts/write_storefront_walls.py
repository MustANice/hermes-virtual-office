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
 * 4. STOREFRONT ENTRANCE FACADE WALLS (2.60m tall - Exactly matching img_2a7ab1f0a353.jpg):
 *    - Recessed dark charcoal baseboard plinth (height 0.18m)
 *    - Natural white oak horizontal sill ledge (height 0.05m)
 *    - Matte black architectural steel mullion grid (transom at Y = 1.25m, vertical bays ~0.75m)
 *    - Semi-translucent frosted/fluted architectural privacy glass panels
 *    - Heavy natural oak door casing portal (jambs and header) with double glass doors swung open
 *    - Long vertical architectural pull handles
 *    - Branded floor welcome mat inside doorway (e.g. "EXECUTIVE SUITE", "A2A COORDINATION / CONNECT", etc.)
 *    - Potted green plants in conical white ceramic planters behind glass bays
 * 5. Full-Height East-West Corridor Glass Checkpoints: 3.2m tall glass partition with brass-framed
 *    double doors (ajar with long vertical brass pull handles) running East-West across the side corridors.
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
      color: 0x1A1C1E, // Matte black architectural steel
      metalness: 0.82,
      roughness: 0.35,
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
    storefrontGlass: new THREE.MeshPhysicalMaterial({
      color: 0xFFFFFF,
      metalness: 0.0,
      roughness: 0.32, // Soft frosted privacy glass
      transmission: 0.84, // High light passthrough revealing interior silhouettes
      thickness: 0.02,
      ior: 1.52,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
    }),
    doorGlass: new THREE.MeshPhysicalMaterial({
      color: 0xF5FAFA,
      metalness: 0.0,
      roughness: 0.12,
      transmission: 0.94,
      thickness: 0.015,
      ior: 1.5,
      transparent: true,
      opacity: 0.88,
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
      emissiveIntensity: 2.8,
      roughness: 0.2,
    }),
    whitePlanter: new THREE.MeshStandardMaterial({
      color: 0xF8FAFC,
      roughness: 0.28,
    }),
    plantLeaf: new THREE.MeshStandardMaterial({
      color: 0x2E6B38,
      roughness: 0.55,
    }),
    soilDark: new THREE.MeshStandardMaterial({
      color: 0x241E18,
      roughness: 0.95,
    }),
  };

  const cube = new THREE.BoxGeometry(1, 1, 1);
  const cylinderGeom = new THREE.CylinderGeometry(1, 1, 1, 16);

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
  // 4. STOREFRONT ENTRANCE FACADE WALLS (2.60m Tall, Exactly Matching img_2a7ab1f0a353.jpg)
  // Replaces low railings with full-height architectural glass partitions:
  // - Dual-layer base: Recessed black baseboard (0.18m) + Natural Oak Sill Ledge (0.05m)
  // - Frosted/fluted privacy architectural glass divided by black steel mullions
  // - Intermediate horizontal transom mullion at Y = 1.25m
  // - Heavy natural oak door casing portal (jambs + header) with double glass doors
  // - Branded entrance floor welcome mat inside doorway
  // - Potted plants in conical white ceramic planters behind glass bays
  // =========================================================================

  function createEntranceMatTexture(text: string): THREE.CanvasTexture {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context unavailable");

    // Dark charcoal nylon/coir woven runner mat
    ctx.fillStyle = "#1E2024";
    ctx.fillRect(0, 0, 1024, 512);

    // Subtle dark ribbed mat texture
    ctx.fillStyle = "#16181A";
    for (let y = 0; y < 512; y += 8) {
      ctx.fillRect(0, y, 1024, 4);
    }

    // Crisp pure white sans-serif capital lettering
    ctx.font = "bold 64px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Letter-spacing
    const tracking = 12;
    const widths = Array.from(text, ch => ctx.measureText(ch).width);
    const total = widths.reduce((a, b) => a + b, 0) + Math.max(0, text.length - 1) * tracking;

    ctx.save();
    ctx.translate(512, 256);
    ctx.scale(Math.min(1, 920 / Math.max(total, 1)), 1);

    let cursor = -total / 2;
    Array.from(text).forEach((ch, i) => {
      ctx.fillText(ch, cursor + widths[i] / 2, 0);
      cursor += widths[i] + tracking;
    });
    ctx.restore();

    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.anisotropy = 16;
    return t;
  }

  function addConicalPlant(target: THREE.Group, x: number, y: number, z: number, scale = 1.0): void {
    const pGroup = new THREE.Group();
    pGroup.position.set(x, y, z);
    pGroup.scale.set(scale, scale, scale);
    target.add(pGroup);

    // Conical white ceramic floor planter (tapered cylinder)
    const planterGeom = new THREE.CylinderGeometry(0.24, 0.16, 0.58, 20);
    const planter = new THREE.Mesh(planterGeom, materials.whitePlanter);
    planter.position.y = 0.29;
    planter.castShadow = true;
    pGroup.add(planter);

    // Dark potting soil
    const soilGeom = new THREE.CylinderGeometry(0.22, 0.22, 0.05, 16);
    const soil = new THREE.Mesh(soilGeom, materials.soilDark);
    soil.position.y = 0.56;
    pGroup.add(soil);

    // Lush broadleaf ficus plant foliage
    for (let i = 0; i < 7; i++) {
      const angle = (i * Math.PI * 2) / 7;
      const leafGroup = new THREE.Group();
      leafGroup.position.set(0, 0.56, 0);
      leafGroup.rotation.y = angle;
      leafGroup.rotation.z = 0.35 + (i % 2) * 0.15;

      const leaf = new THREE.Mesh(cube, materials.plantLeaf);
      leaf.scale.set(0.18, 0.015, 0.38);
      leaf.position.set(0, 0.18, 0.16);
      leaf.castShadow = true;
      leafGroup.add(leaf);
      pGroup.add(leafGroup);
    }
  }

  function buildStorefrontFacade(
    target: THREE.Group,
    name: string,
    z: number,
    startX: number,
    endX: number,
    doorCenterX: number,
    doorWidth: number,
    doorSwungSign: 1 | -1, // 1 = inside (+Z for north rooms, -Z for south rooms)
    roomTitle: string,
  ): void {
    const facadeGroup = new THREE.Group();
    facadeGroup.name = name;
    facadeGroup.position.set((startX + endX) / 2, 0, z);
    target.add(facadeGroup);

    const totalWidth = Math.abs(endX - startX);
    const wallHeight = 2.60;
    const baseHeight = 0.18;
    const sillHeight = 0.05;
    const glassBaseY = baseHeight + sillHeight; // 0.23m
    const transomY = 1.25;
    const mullionW = 0.04;
    const frameDepth = 0.08;

    const relDoorX = doorCenterX - (startX + endX) / 2;
    const halfDoor = doorWidth / 2;

    const leftWingStartX = -totalWidth / 2;
    const leftWingEndX = relDoorX - halfDoor;
    const leftWingW = Math.abs(leftWingEndX - leftWingStartX);

    const rightWingStartX = relDoorX + halfDoor;
    const rightWingEndX = totalWidth / 2;
    const rightWingW = Math.abs(rightWingEndX - rightWingStartX);

    // 1. Build Glazed Wing function
    const buildWing = (wingName: string, wStartX: number, wEndX: number, wWidth: number) => {
      if (wWidth < 0.3) return;
      const wMidX = (wStartX + wEndX) / 2;

      // A. Lower Black Baseboard Plinth (0 to 0.18m)
      box(facadeGroup, `${wingName}-Baseboard`, wWidth, baseHeight, 0.10, wMidX, baseHeight / 2, 0, materials.charcoalBase);

      // B. Natural Oak Wood Sill Ledge (0.18m to 0.23m)
      box(facadeGroup, `${wingName}-OakSill`, wWidth + 0.02, sillHeight, 0.14, wMidX, baseHeight + sillHeight / 2, 0, materials.oakSlat);

      // C. Continuous Top Header Channel (2.56m to 2.60m)
      box(facadeGroup, `${wingName}-TopChannel`, wWidth, 0.05, frameDepth, wMidX, wallHeight - 0.025, 0, materials.blackSteel);

      // D. Intermediate Horizontal Transom Mullion at Y = 1.25m
      box(facadeGroup, `${wingName}-TransomMullion`, wWidth, mullionW, frameDepth, wMidX, transomY, 0, materials.blackSteel);

      // E. Outer and Inner Vertical Mullions dividing into bays
      const bayCount = Math.max(1, Math.round(wWidth / 0.85));
      const bayW = wWidth / bayCount;

      for (let i = 0; i <= bayCount; i++) {
        const mx = wStartX + i * bayW;
        box(facadeGroup, `${wingName}-VertMullion-${i}`, mullionW, wallHeight - glassBaseY - 0.05, frameDepth, mx, (wallHeight + glassBaseY) / 2, 0, materials.blackSteel);
      }

      // F. Frosted/Fluted Privacy Glass Panes
      const glassW = bayW - mullionW;
      const lowerGlassH = transomY - glassBaseY - mullionW;
      const upperGlassH = (wallHeight - 0.05) - (transomY + mullionW / 2);

      for (let i = 0; i < bayCount; i++) {
        const px = wStartX + (i + 0.5) * bayW;
        // Lower glass pane
        box(facadeGroup, `${wingName}-Glass-Lower-${i}`, glassW, lowerGlassH, 0.018, px, glassBaseY + lowerGlassH / 2, 0, materials.storefrontGlass, false);
        // Upper glass pane
        box(facadeGroup, `${wingName}-Glass-Upper-${i}`, glassW, upperGlassH, 0.018, px, transomY + mullionW / 2 + upperGlassH / 2, 0, materials.storefrontGlass, false);
      }
    };

    // Build Left and Right Glazed Wings
    buildWing(`${name}-LeftWing`, leftWingStartX, leftWingEndX, leftWingW);
    buildWing(`${name}-RightWing`, rightWingStartX, rightWingEndX, rightWingW);

    // 2. Heavy Natural Oak Door Portal Casing (Jambs + Header)
    const portalCasingW = 0.12;
    const portalCasingD = 0.18;
    const doorJambL_X = relDoorX - halfDoor;
    const doorJambR_X = relDoorX + halfDoor;

    // Left Oak Jamb
    box(facadeGroup, `${name}-OakJamb-L`, portalCasingW, wallHeight, portalCasingD, doorJambL_X, wallHeight / 2, 0, materials.oakSlat);
    // Right Oak Jamb
    box(facadeGroup, `${name}-OakJamb-R`, portalCasingW, wallHeight, portalCasingD, doorJambR_X, wallHeight / 2, 0, materials.oakSlat);
    // Top Oak Lintel
    box(facadeGroup, `${name}-OakLintel`, doorWidth + portalCasingW * 2, 0.12, portalCasingD, relDoorX, wallHeight - 0.06, 0, materials.oakSlat);

    // 3. Double-Leaf Glass Doors Swung Open
    const doorLeafW = doorWidth / 2 - 0.04;
    const doorLeafH = wallHeight - 0.16;

    // Left Door Leaf (Swung open into room)
    const doorL = new THREE.Group();
    doorL.position.set(doorJambL_X, 0, 0);
    doorL.rotation.y = doorSwungSign * 1.35; // Swung ~77 degrees open
    box(doorL, `${name}-DoorL-Glass`, doorLeafW, doorLeafH, 0.015, doorLeafW / 2, doorLeafH / 2, 0, materials.doorGlass, false);
    box(doorL, `${name}-DoorL-EdgeFrame`, 0.035, doorLeafH, 0.035, doorLeafW, doorLeafH / 2, 0, materials.blackSteel);
    // Vertical Pull Handle
    box(doorL, `${name}-DoorL-Handle`, 0.025, 0.85, 0.025, doorLeafW - 0.06, 1.1, 0.04, materials.blackSteel, false);
    facadeGroup.add(doorL);

    // Right Door Leaf (Swung open into room)
    const doorR = new THREE.Group();
    doorR.position.set(doorJambR_X, 0, 0);
    doorR.rotation.y = -doorSwungSign * 1.35;
    box(doorR, `${name}-DoorR-Glass`, doorLeafW, doorLeafH, 0.015, -doorLeafW / 2, doorLeafH / 2, 0, materials.doorGlass, false);
    box(doorR, `${name}-DoorR-EdgeFrame`, 0.035, doorLeafH, 0.035, -doorLeafW, doorLeafH / 2, 0, materials.blackSteel);
    // Vertical Pull Handle
    box(doorR, `${name}-DoorR-Handle`, 0.025, 0.85, 0.025, -(doorLeafW - 0.06), 1.1, 0.04, materials.blackSteel, false);
    facadeGroup.add(doorR);

    // 4. Branded Entrance Floor Welcome Mat inside the suite
    const matW = Math.min(doorWidth + 0.8, 3.2);
    const matD = 1.35;
    const matZ = doorSwungSign * (matD / 2 + 0.15);

    const matMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(matW, matD),
      new THREE.MeshBasicMaterial({
        map: createEntranceMatTexture(roomTitle),
        toneMapped: false,
      }),
    );
    matMesh.name = `${name}-WelcomeMat`;
    matMesh.rotation.x = -Math.PI / 2;
    matMesh.position.set(relDoorX, 0.035, matZ);
    facadeGroup.add(matMesh);

    // 5. Indoor Potted Plant in conical white ceramic planter behind left glass bay
    addConicalPlant(facadeGroup, leftWingStartX + 1.2, 0.03, doorSwungSign * 0.85, 1.1);
  }

  // =========================================================================
  // INSTALL STOREFRONT FACADE WALLS FOR ALL 7 ROOMS (Exactly matching img_2a7ab1f0a353.jpg)
  // =========================================================================
  const storefrontContainer = group("Room-Storefront-Facades");

  // 1. Executive Suite (Top-Left): Z = -7.0, door into room towards -Z (sign = -1)
  buildStorefrontFacade(
    storefrontContainer, "Executive-Storefront",
    -7.0, -29.5, -11.5, -20.5, 2.6, -1, "EXECUTIVE SUITE",
  );

  // 2. A2A Coordination / Connect (Top-Center): Z = -10.5, door into room towards -Z (sign = -1)
  buildStorefrontFacade(
    storefrontContainer, "Dev-Storefront",
    -10.5, -9.8, 9.8, 0, 3.2, -1, "A2A COORDINATION / CONNECT",
  );

  // 3. Research & Intel (Top-Right): Z = -7.0, door into room towards -Z (sign = -1)
  buildStorefrontFacade(
    storefrontContainer, "Research-Storefront",
    -7.0, 11.5, 29.5, 20.5, 2.6, -1, "RESEARCH & INTEL",
  );

  // 4. War Room / A (Dead Center): South entrance at Z = 3.5, door into room towards -Z (sign = -1)
  buildStorefrontFacade(
    storefrontContainer, "WarRoom-Storefront",
    3.5, -9.8, 9.8, 0, 3.2, -1, "WAR ROOM / A",
  );

  // 5. QA & Hardening (Bottom-Left): North boundary at Z = 4.0, door into room towards +Z (sign = 1)
  buildStorefrontFacade(
    storefrontContainer, "QA-Storefront",
    4.0, -29.5, -11.5, -20.5, 2.6, 1, "QA & HARDENING",
  );

  // 6. Lounge & Operations (Bottom-Center): North boundary at Z = 6.5, door into room towards +Z (sign = 1)
  buildStorefrontFacade(
    storefrontContainer, "Lounge-Storefront",
    6.5, -9.8, 9.8, 0, 3.2, 1, "LOUNGE & OPERATIONS",
  );

  // 7. SRE & Infrastructure (Bottom-Right): North boundary at Z = 4.0, door into room towards +Z (sign = 1)
  buildStorefrontFacade(
    storefrontContainer, "SRE-Storefront",
    4.0, 11.5, 29.5, 20.5, 2.6, 1, "SRE & INFRASTRUCTURE",
  );

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
    box(pGroup, `${name}-TransomGlass`, doorWidth - 0.06, 0.74, 0.015, relDoorX, 2.8, 0, materials.doorGlass, false);

    // Fixed Glass Sidelight Panels (West of Door)
    const leftLen = Math.abs(doorLeftX - (-totalLen / 2 + 0.08));
    if (leftLen > 0.2) {
      const midLX = (-totalLen / 2 + 0.08 + doorLeftX) / 2;
      box(pGroup, `${name}-FixedGlass-L`, leftLen, height - 0.12, 0.015, midLX, height / 2, 0, materials.doorGlass, false);
      box(pGroup, `${name}-MidBar-L`, leftLen, 0.04, 0.05, midLX, 1.1, 0, materials.blackSteel);
      // Cyan under-glow baseboard
      box(pGroup, `${name}-GlowBase-L`, leftLen, 0.08, 0.06, midLX, 0.04, 0, materials.cyanLedGlow, false);
    }

    // Fixed Glass Sidelight Panels (East of Door)
    const rightLen = Math.abs((totalLen / 2 - 0.08) - doorRightX);
    if (rightLen > 0.2) {
      const midRX = (doorRightX + totalLen / 2 - 0.08) / 2;
      box(pGroup, `${name}-FixedGlass-R`, rightLen, height - 0.12, 0.015, midRX, height / 2, 0, materials.doorGlass, false);
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
    box(leafL, `${name}-DoorLeaf-L-Glass`, doorLeafW, 2.34, 0.015, doorLeafW / 2, 1.18, 0, materials.doorGlass, false);
    box(leafL, `${name}-DoorLeaf-L-TopFrame`, doorLeafW, 0.04, 0.04, doorLeafW / 2, 2.35, 0, materials.brass);
    box(leafL, `${name}-DoorLeaf-L-BottomFrame`, doorLeafW, 0.08, 0.04, doorLeafW / 2, 0.04, 0, materials.brass);
    box(leafL, `${name}-DoorLeaf-L-EdgeFrame`, 0.04, 2.36, 0.04, doorLeafW, 1.18, 0, materials.brass);
    box(leafL, `${name}-Handle-L`, 0.025, 0.72, 0.025, doorLeafW - 0.08, 1.18, 0.045, materials.brass, false);
    pGroup.add(leafL);

    // Right Door Leaf (swung slightly ajar backward)
    const leafR = new THREE.Group();
    leafR.position.set(doorRightX, 0, 0);
    leafR.rotation.y = -0.35; // Ajar backward
    box(leafR, `${name}-DoorLeaf-R-Glass`, doorLeafW, 2.34, 0.015, -doorLeafW / 2, 1.18, 0, materials.doorGlass, false);
    box(leafR, `${name}-DoorLeaf-R-TopFrame`, doorLeafW, 0.04, 0.04, -doorLeafW / 2, 2.35, 0, materials.brass);
    box(leafR, `${name}-DoorLeaf-R-BottomFrame`, doorLeafW, 0.08, 0.04, -doorLeafW / 2, 0.04, 0, materials.brass);
    box(leafR, `${name}-DoorLeaf-R-EdgeFrame`, 0.04, 2.36, 0.04, -doorLeafW, 1.18, 0, materials.brass);
    box(leafR, `${name}-Handle-R`, 0.025, 0.72, 0.025, -(doorLeafW - 0.08), 1.18, 0.045, materials.brass, false);
    pGroup.add(leafR);
  }

  // West Security Checkpoint (Between Executive Suite & QA & Hardening across the hallway at Z = -1.5)
  buildEastWestCorridorDoorway(storefrontContainer, "West-Corridor-Security-Checkpoint", -1.5, -29.5, -11.5, -20.5, 2.8);

  // East Security Checkpoint (Between Research & Intel & SRE & Infrastructure across the hallway at Z = -1.5)
  buildEastWestCorridorDoorway(storefrontContainer, "East-Corridor-Security-Checkpoint", -1.5, 11.5, 29.5, 20.5, 2.8);

  parent.add(architecture);
  return architecture;
}
'''

with open('/root/projects/hermes-virtual-office/src/engine/ArchitecturalWalls.ts', 'w') as f:
    f.write(content)

print("ArchitecturalWalls.ts successfully written with exact storefront facade walls matching img_2a7ab1f0a353.jpg!")
