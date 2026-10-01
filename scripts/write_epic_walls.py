code = '''import * as THREE from "three";

/**
 * Builds high-ceiling (5.8m), premium Scandinavian & Industrial Loft
 * architectural outer cutaway walls and interior partitions for the 7-room virtual office.
 */
export function buildArchitecturalWalls(parent: THREE.Group): THREE.Group {
  const architecture = new THREE.Group();
  architecture.name = "ArchitecturalWalls";

  const materials = {
    plaster: new THREE.MeshStandardMaterial({
      color: 0xF1EFEA,
      roughness: 0.85,
    }),
    charcoalBase: new THREE.MeshStandardMaterial({
      color: 0x1E242B,
      roughness: 0.75,
    }),
    oakSlat: new THREE.MeshStandardMaterial({
      color: 0xC49868, // Warm Scandinavian blonde oak
      roughness: 0.55,
      metalness: 0.05,
    }),
    oakCoping: new THREE.MeshStandardMaterial({
      color: 0xB58757, // Deep golden oak
      roughness: 0.5,
    }),
    blackSteel: new THREE.MeshStandardMaterial({
      color: 0x15191E, // Matte black architectural steel
      metalness: 0.85,
      roughness: 0.25,
    }),
    aluminum: new THREE.MeshStandardMaterial({
      color: 0x94A3B8,
      metalness: 0.8,
      roughness: 0.2,
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
    frostedGlass: new THREE.MeshPhysicalMaterial({
      color: 0xEEF5F8,
      metalness: 0.02,
      roughness: 0.32,
      transmission: 0.72,
      thickness: 0.08,
      ior: 1.48,
      transparent: true,
      opacity: 0.7,
    }),
    warmLedGlow: new THREE.MeshStandardMaterial({
      color: 0xFFFBEB,
      emissive: 0xFDE68A,
      emissiveIntensity: 1.8,
      roughness: 0.3,
    }),
    mossWall: new THREE.MeshStandardMaterial({
      color: 0x3F6844, // Biophilic preserved moss
      roughness: 0.95,
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
  const northHeight = 5.8; // High ceiling!
  const windowBottom = 2.5;
  const windowTop = 5.3;
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

  // Vertical Fluted Scandinavian Oak Slats along lower north wall (Apple Park aesthetic)
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

  // Continuous upper header beam above windows (5.3m to 5.8m)
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

  // Crittall Black Steel Multi-Pane Windows
  for (let i = 0; i < bayCount; i++) {
    const x = -outerX + (i + 0.5) * bayWidth;
    const openingWidth = bayWidth - pierWidth;
    const clearWidth = openingWidth - frameWidth * 2;
    const glassHeight = windowHeight - frameWidth * 2;
    const centerY = (windowBottom + windowTop) / 2;

    // Outer window frame (Jambs & Rails)
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

    // Crittall grid horizontal and vertical steel glazing bars
    box(
      north, `Window-${i}-Center-Mullion`,
      frameWidth, glassHeight, 0.14,
      x, centerY, 0, materials.blackSteel,
    );
    box(
      north, `Window-${i}-Transom-Bar`,
      clearWidth, frameWidth, 0.14,
      x, centerY, 0, materials.blackSteel,
    );

    // Glass panes with clerestory daylight transmission
    const paneWidth = (clearWidth - frameWidth) / 2;
    for (const direction of [-1, 1]) {
      box(
        north, `Window-${i}-Glass-${direction}`,
        paneWidth, glassHeight, 0.05,
        x + direction * (paneWidth + frameWidth) / 2,
        centerY, 0, materials.clerestoryGlass, false,
      );
    }

    // Projected oak interior window stool/sill
    box(
      north, `Window-${i}-Projecting-Sill`,
      openingWidth + 0.08, 0.08, wallThickness + 0.22,
      x, windowBottom - 0.04, 0.04, materials.oakCoping,
    );
  }

  // =========================================================================
  // 2. WEST & EAST SIDE WALLS: 5.8m to 3.0m Grand Stepped Architectural Cutaways
  // =========================================================================
  const sideSteps = [
    { start: -21.5 + wallThickness / 2, end: -10.5, height: 5.8 }, // North tier: full 5.8m!
    { start: -10.5, end: 0.5, height: 4.8 },                        // Mid tier 1: 4.8m!
    { start: 0.5, end: 11.5, height: 3.9 },                         // Mid tier 2: 3.9m!
    { start: 11.5, end: 22.5, height: 3.0 },                        // South tier: 3.0m!
  ];

  for (const side of [-1, 1]) {
    const wall = group(side < 0 ? "West-Architectural-Wall" : "East-Architectural-Wall");
    const x = side * (outerX - wallThickness / 2);

    sideSteps.forEach(({ start, end, height }, index) => {
      const length = end - start;
      const z = (start + end) / 2;
      const capHeight = 0.12;

      // Main structural plaster wall
      box(
        wall, `Side-Wall-Step-${index}`,
        wallThickness, height - capHeight, length,
        x, (height - capHeight) / 2, z, materials.plaster,
      );

      // Thick Scandinavian oak coping / fascia on top edge
      box(
        wall, `Side-Oak-Coping-${index}`,
        wallThickness + 0.14, capHeight, length + 0.04,
        x, height - capHeight / 2, z, materials.oakCoping,
      );

      // Warm LED Wall-Wash Strip right beneath the coping
      box(
        wall, `Side-LED-Wash-${index}`,
        0.05, 0.06, length - 0.2,
        x - side * (wallThickness / 2 + 0.02),
        height - capHeight - 0.06, z,
        materials.warmLedGlow, false,
      );

      // Interior vertical acoustic oak slats on lower portion (0 to 2.2m)
      const slatCount = Math.floor(length / 0.5);
      const slatPitch = length / slatCount;
      for (let s = 0; s < slatCount; s++) {
        const sz = start + (s + 0.5) * slatPitch;
        box(
          wall, `Side-Acoustic-Slat-${index}-${s}`,
          0.05, Math.min(2.4, height - 0.4), 0.28,
          x - side * (wallThickness / 2 + 0.03),
          Math.min(2.4, height - 0.4) / 2 + 0.06, sz,
          materials.oakSlat,
        );
      }

      // Base skirting trim in matte black steel
      box(
        wall, `Side-Skirting-${index}`,
        0.04, 0.16, length,
        x - side * (wallThickness / 2 + 0.02),
        0.08, z, materials.blackSteel,
      );
    });
  }

  // Feature Biophilic Preserved Moss Wall on Executive Suite (West side)
  box(
    north, "Executive-Moss-Wall",
    4.5, 2.0, 0.06,
    -21, 1.25, wallThickness / 2 + 0.04,
    materials.mossWall,
  );

  // =========================================================================
  // 3. INTERIOR ROOM PARTITIONS: 3.5m Tall Modern Steel & Fluted Glass System
  // =========================================================================
  type PartitionSpec = {
    name: string;
    axis: "x" | "z";
    fixed: number;
    start: number;
    end: number;
    doorCenter: number;
    doorWidth: number;
  };

  const partitionSpecs: PartitionSpec[] = [
    {
      name: "Executive-Development",
      axis: "z", fixed: -11, start: -21.5, end: -7,
      doorCenter: -13.5, doorWidth: 2.6,
    },
    {
      name: "Development-Research",
      axis: "z", fixed: 11, start: -21.5, end: -7,
      doorCenter: -13.5, doorWidth: 2.6,
    },
    {
      name: "Executive-QA",
      axis: "x", fixed: -2, start: -30, end: -12,
      doorCenter: -21, doorWidth: 2.8,
    },
    {
      name: "Development-WarRoom",
      axis: "x", fixed: -9.5, start: -10, end: 10,
      doorCenter: 0, doorWidth: 3.0,
    },
    {
      name: "WarRoom-Lounge",
      axis: "x", fixed: 5, start: -10, end: 10,
      doorCenter: 0, doorWidth: 3.0,
    },
    {
      name: "Research-SRE",
      axis: "x", fixed: 2, start: 12, end: 30,
      doorCenter: 21, doorWidth: 2.8,
    },
    {
      name: "Lounge-SRE",
      axis: "z", fixed: 11, start: 6.5, end: 21.5,
      doorCenter: 14, doorWidth: 2.6,
    },
  ];

  const baseHeight = 1.05;         // Solid acoustic base height
  const partitionHeight = 3.5;     // Tall modern partition height!
  const baseDepth = 0.22;
  const postWidth = 0.06;
  const railHeight = 0.06;
  const glassDepth = 0.05;
  const maxBayWidth = 1.4;

  function partitionRun(
    target: THREE.Group,
    start: number,
    end: number,
    label: string,
  ): void {
    const length = end - start;
    if (length <= postWidth * 2) return;

    const center = (start + end) / 2;
    const capHeight = 0.08;

    // Solid Lower Acoustic Wainscoting Base
    box(
      target, `${label}-Acoustic-Base`,
      length, baseHeight - capHeight, baseDepth,
      center, (baseHeight - capHeight) / 2, 0, materials.charcoalBase,
    );

    // Warm Oak Middle Rail Coping
    box(
      target, `${label}-Oak-Middle-Cap`,
      length, capHeight, baseDepth + 0.04,
      center, baseHeight - capHeight / 2, 0, materials.oakCoping,
    );

    // Top Header Beam in Matte Black Steel
    box(
      target, `${label}-Top-Steel-Rail`,
      length, railHeight, 0.12,
      center, partitionHeight - railHeight / 2, 0, materials.blackSteel,
    );

    // Warm LED Uplight strip along partition header
    box(
      target, `${label}-Header-LED`,
      length - 0.1, 0.03, 0.06,
      center, partitionHeight + 0.015, 0, materials.warmLedGlow, false,
    );

    const bayCount = Math.max(1, Math.ceil(length / maxBayWidth));
    const pitch = (length - postWidth) / bayCount;
    const glassBottom = baseHeight;
    const glassTop = partitionHeight - railHeight;
    const glassHeight = glassTop - glassBottom;

    // Vertical Black Steel Mullions
    for (let i = 0; i <= bayCount; i++) {
      box(
        target, `${label}-Steel-Mullion-${i}`,
        postWidth, partitionHeight - railHeight, 0.09,
        start + postWidth / 2 + i * pitch,
        (partitionHeight - railHeight) / 2, 0, materials.blackSteel,
      );
    }

    // Frosted Fluted Glass Panels with Crittall Transom Bars
    for (let i = 0; i < bayCount; i++) {
      const width = pitch - postWidth;
      const x = start + postWidth / 2 + (i + 0.5) * pitch;
      const y = (glassBottom + glassTop) / 2;

      // Frosted Glass Pane
      box(
        target, `${label}-Frosted-Glass-${i}`,
        width, glassHeight, glassDepth,
        x, y, 0, materials.frostedGlass, false,
      );

      // Mid-height horizontal Crittall divider bar
      box(
        target, `${label}-Crittall-Bar-${i}`,
        width, 0.045, 0.07,
        x, y, 0, materials.blackSteel,
      );
    }
  }

  // Build each partitioned boundary with realistic doorway portals
  for (const spec of partitionSpecs) {
    const partition = group(`Partition-${spec.name}`);

    if (spec.axis === "x") {
      partition.position.z = spec.fixed;
    } else {
      partition.position.x = spec.fixed;
      partition.rotation.y = -Math.PI / 2;
    }

    const doorLeft = spec.doorCenter - spec.doorWidth / 2;
    const doorRight = spec.doorCenter + spec.doorWidth / 2;

    partitionRun(partition, spec.start, doorLeft, "Left");
    partitionRun(partition, doorRight, spec.end, "Right");

    // Grand Doorway Oak Casing Posts
    const casingWidth = 0.12;
    for (const [name, x] of [
      ["Left", doorLeft - casingWidth / 2],
      ["Right", doorRight + casingWidth / 2],
    ] as const) {
      box(
        partition, `Door-${name}-Oak-Casing`,
        casingWidth, partitionHeight, 0.26,
        x, partitionHeight / 2, 0, materials.oakCoping,
      );
    }

    // Thick Solid Oak Doorway Lintel / Header
    const lintelHeight = 0.18;
    box(
      partition, "Door-Oak-Header",
      spec.doorWidth + casingWidth * 2, lintelHeight, 0.28,
      spec.doorCenter, partitionHeight - lintelHeight / 2, 0, materials.oakCoping,
    );

    // Warm Minimalist Doorway Entrance Downlight
    box(
      partition, "Door-Entrance-Light",
      spec.doorWidth * 0.75, 0.04, 0.14,
      spec.doorCenter, partitionHeight - lintelHeight - 0.02, 0, materials.warmLedGlow, false,
    );
  }

  parent.add(architecture);
  return architecture;
}
'''

with open('/root/projects/hermes-virtual-office/src/engine/ArchitecturalWalls.ts', 'w') as f:
    f.write(code)

print("SUCCESS: wrote epic high-ceiling ArchitecturalWalls.ts!")
