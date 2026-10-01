import * as THREE from "three";

export interface OfficeFloorPlanOptions {
  scene?: THREE.Scene;
  aspect?: number;
  shadows?: boolean;
  background?: THREE.ColorRepresentation;
  addLights?: boolean;
}

type Material = THREE.Material;
type V3 = readonly [number, number, number];

interface Room {
  x: number;
  z: number;
  w: number;
  d: number;
}

interface Palette {
  oak: THREE.MeshStandardMaterial;
  oakLight: THREE.MeshStandardMaterial;
  walnut: THREE.MeshStandardMaterial;
  charcoal: THREE.MeshStandardMaterial;
  metal: THREE.MeshStandardMaterial;
  cream: THREE.MeshStandardMaterial;
  leather: THREE.MeshStandardMaterial;
  blackLeather: THREE.MeshStandardMaterial;
  rug: THREE.MeshStandardMaterial;
  ceramic: THREE.MeshStandardMaterial;
  foliage: THREE.MeshStandardMaterial;
  foliageLight: THREE.MeshStandardMaterial;
  earth: THREE.MeshStandardMaterial;
  cyan: THREE.MeshStandardMaterial;
  glass: THREE.MeshPhysicalMaterial;
  screen: THREE.MeshStandardMaterial;
  white: THREE.MeshStandardMaterial;
}

/**
 * Architectural cutaway, expressed in scene units approximately equal to metres.
 * North is -Z; the viewing camera faces north from +Z.
 *
 * The class owns its geometries, materials, textures and lights, but never the
 * caller's renderer. Keep the root untransformed when using the supplied camera.
 */
export class OfficeFloorPlan {
  public readonly group = new THREE.Group();
  public readonly camera: THREE.PerspectiveCamera;

  private readonly geometries = new Map<string, THREE.BufferGeometry>();
  private readonly materials = new Set<THREE.Material>();
  private readonly textures = new Set<THREE.Texture>();
  private readonly lights: THREE.Light[] = [];

  private readonly mat: Palette;
  private readonly shadows: boolean;
  private readonly attachedScene?: THREE.Scene;
  private readonly previousBackground: THREE.Scene["background"];
  private readonly installedBackground: THREE.Color;

  private disposed = false;
  private randomState = 737683;

  private readonly rooms = {
    executive: { x: -13.2, z: -10.65, w: 12.4, d: 10.3 },
    connect: { x: 0, z: -10.65, w: 12.8, d: 10.3 },
    research: { x: 13.2, z: -10.65, w: 12.4, d: 10.3 },
    war: { x: 0, z: 0.35, w: 15.4, d: 8.7 },
    qa: { x: -13.2, z: 11.1, w: 12.4, d: 10 },
    lounge: { x: 0, z: 11.1, w: 12.8, d: 10 },
    sre: { x: 13.2, z: 11.1, w: 12.4, d: 10 },
  } satisfies Record<string, Room>;

  public constructor(options: OfficeFloorPlanOptions | THREE.Scene = {}) {
    const config: OfficeFloorPlanOptions =
      options instanceof THREE.Scene ? { scene: options } : options;

    this.shadows = config.shadows ?? true;
    this.attachedScene = config.scene;
    this.previousBackground = config.scene?.background ?? null;
    this.installedBackground = new THREE.Color(
      config.background ?? "#0e1116",
    );

    this.group.name = "Architectural Office Diorama";

    this.camera = new THREE.PerspectiveCamera(
      30,
      Math.max(0.1, config.aspect ?? 16 / 10),
      0.1,
      240,
    );
    this.camera.name = "Frontal Architectural Camera";

    this.mat = this.createPalette();

    this.buildSlab();
    this.buildArchitecture();
    this.buildExecutive();
    this.buildConnect();
    this.buildResearch();
    this.buildWarRoom();
    this.buildQA();
    this.buildLounge();
    this.buildSRE();
    this.buildLabels();
    if (config.addLights !== false) {
      this.buildLighting();
    }

    this.resize(this.camera.aspect);

    if (this.attachedScene) {
      this.attachedScene.background = this.installedBackground;
      this.attachedScene.add(this.group);
    }
  }

  /** Width/height or a single aspect ratio are both accepted. */
  public resize(widthOrAspect: number, height?: number): void {
    const rawAspect =
      height === undefined ? widthOrAspect : widthOrAspect / height;
    const aspect =
      Number.isFinite(rawAspect) && rawAspect > 0 ? rawAspect : 1;

    this.camera.aspect = aspect;

    const target = new THREE.Vector3(0, 0.8, 0);
    const pitch = Math.PI / 4.7;
    const backward = new THREE.Vector3(0, Math.sin(pitch), Math.cos(pitch));
    const up = new THREE.Vector3(0, Math.cos(pitch), -Math.sin(pitch));
    const tanY = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    const tanX = tanY * aspect;

    // Fit the complete cutaway, including the raised slab, on narrow screens.
    let distance = 82;
    for (const x of [-21, 21]) {
      for (const y of [-0.8, 6.2]) {
        for (const z of [-17, 17]) {
          const p = new THREE.Vector3(x, y, z).sub(target);
          const depthOffset = p.dot(backward);
          distance = Math.max(
            distance,
            depthOffset + Math.abs(p.x) / tanX * 1.09,
            depthOffset + Math.abs(p.dot(up)) / tanY * 1.09,
          );
        }
      }
    }

    this.camera.position.copy(target).addScaledVector(backward, distance);
    this.camera.lookAt(target);
    this.camera.far = Math.max(240, distance + 100);
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();
  }

  /** Static by design: no per-frame allocations or texture regeneration. */
  public update(_deltaSeconds = 0, _elapsedSeconds = 0): void {}

  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    this.group.removeFromParent();

    this.group.traverse((object) => {
      if (object instanceof THREE.InstancedMesh) object.dispose();
    });

    for (const light of this.lights) {
      if (
        light instanceof THREE.DirectionalLight ||
        light instanceof THREE.SpotLight ||
        light instanceof THREE.PointLight
      ) {
        light.shadow.map?.dispose();
      }
    }

    for (const geometry of this.geometries.values()) geometry.dispose();
    for (const material of this.materials) material.dispose();
    for (const texture of this.textures) texture.dispose();

    if (
      this.attachedScene &&
      this.attachedScene.background === this.installedBackground
    ) {
      this.attachedScene.background = this.previousBackground;
    }

    this.group.clear();
    this.geometries.clear();
    this.materials.clear();
    this.textures.clear();
  }

  private random(): number {
    this.randomState =
      (Math.imul(this.randomState, 1664525) + 1013904223) >>> 0;
    return this.randomState / 4294967296;
  }

  private ownMaterial<T extends THREE.Material>(material: T): T {
    this.materials.add(material);
    return material;
  }

  private standard(
    color: THREE.ColorRepresentation,
    roughness = 0.6,
    metalness = 0,
  ): THREE.MeshStandardMaterial {
    return this.ownMaterial(
      new THREE.MeshStandardMaterial({ color, roughness, metalness }),
    );
  }

  private canvasTexture(
    width: number,
    height: number,
    draw: (ctx: CanvasRenderingContext2D) => void,
  ): THREE.CanvasTexture {
    if (typeof document === "undefined") {
      throw new Error(
        "OfficeFloorPlan must be instantiated in a browser after mount.",
      );
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("A Canvas 2D context is required.");

    draw(ctx);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    this.textures.add(texture);
    return texture;
  }

  private createPalette(): Palette {
    const wood = this.canvasTexture(512, 256, (ctx) => {
      ctx.fillStyle = "#c89d66";
      ctx.fillRect(0, 0, 512, 256);

      for (let i = 0; i < 420; i++) {
        const y = this.random() * 256;
        ctx.strokeStyle =
          i % 3 === 0 ? "rgba(76,43,20,.13)" : "rgba(255,235,189,.14)";
        ctx.lineWidth = 0.35 + this.random() * 1.2;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(
          160,
          y + this.random() * 8,
          320,
          y - this.random() * 8,
          512,
          y + this.random() * 3,
        );
        ctx.stroke();
      }
    });

    const fabric = this.canvasTexture(256, 256, (ctx) => {
      ctx.fillStyle = "#c7c2b7";
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 256; i += 2) {
        ctx.fillStyle = i % 4 ? "#bbb6ad" : "#d5d0c5";
        ctx.fillRect(i, 0, 1, 256);
        ctx.fillStyle = "rgba(244,239,227,.22)";
        ctx.fillRect(0, i, 256, 1);
      }
    });
    fabric.wrapS = fabric.wrapT = THREE.RepeatWrapping;
    fabric.repeat.set(5, 5);

    const oak = this.standard("#ffffff", 0.55);
    oak.map = wood;
    const oakLight = this.standard("#ffe0ac", 0.58);
    oakLight.map = wood;
    const walnut = this.standard("#69452f", 0.48);
    walnut.map = wood;

    const rug = this.standard("#ffffff", 0.98);
    rug.map = fabric;
    rug.bumpMap = fabric;
    rug.bumpScale = 0.025;

    const cyan = this.standard("#67e8f9", 0.3, 0.15);
    cyan.emissive.set("#00e5ff");
    cyan.emissiveIntensity = 3;

    const screenTexture = this.telemetryTexture();
    const screen = this.standard("#ffffff", 0.4, 0.05);
    screen.map = screenTexture;
    screen.emissiveMap = screenTexture;
    screen.emissive.set("#ffffff");
    screen.emissiveIntensity = 0.8;

    return {
      oak,
      oakLight,
      walnut,
      rug,
      cyan,
      screen,
      charcoal: this.standard("#1c1e22", 0.65, 0.1),
      metal: this.standard("#1e2024", 0.35, 0.85),
      cream: this.standard("#e8e1d3", 0.86),
      leather: this.standard("#a75d2a", 0.62),
      blackLeather: this.standard("#202329", 0.57),
      ceramic: this.standard("#eceae2", 0.3),
      foliage: this.standard("#285943", 0.87),
      foliageLight: this.standard("#497350", 0.86),
      earth: this.standard("#302820", 1),
      white: this.standard("#e5e6df", 0.68),
      glass: this.ownMaterial(
        new THREE.MeshPhysicalMaterial({
          color: "#e0f2fe",
          roughness: 0.16,
          metalness: 0.05,
          transparent: true,
          opacity: 0.16,
          depthWrite: false,
          side: THREE.DoubleSide,
          transmission: 0,
          clearcoat: 1,
          clearcoatRoughness: 0.12,
        }),
      ),
    };
  }

  private geometry(
    key: string,
    create: () => THREE.BufferGeometry,
  ): THREE.BufferGeometry {
    let geometry = this.geometries.get(key);
    if (!geometry) {
      geometry = create();
      this.geometries.set(key, geometry);
    }
    return geometry;
  }

  private mesh(
    geometry: THREE.BufferGeometry,
    material: Material,
    position: V3,
    scale: V3,
    parent: THREE.Object3D = this.group,
    shadow = true,
  ): THREE.Mesh {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.scale.set(...scale);
    mesh.castShadow = shadow && this.shadows;
    mesh.receiveShadow = shadow && this.shadows;
    parent.add(mesh);
    return mesh;
  }

  private box(
    position: V3,
    size: V3,
    material: Material,
    parent: THREE.Object3D = this.group,
    shadow = true,
  ): THREE.Mesh {
    return this.mesh(
      this.geometry("box", () => new THREE.BoxGeometry(1, 1, 1)),
      material,
      position,
      size,
      parent,
      shadow,
    );
  }

  private cylinder(
    position: V3,
    radius: number,
    height: number,
    material: Material,
    parent: THREE.Object3D = this.group,
    topRatio = 1,
  ): THREE.Mesh {
    const key = `cylinder:${topRatio}`;
    return this.mesh(
      this.geometry(
        key,
        () => new THREE.CylinderGeometry(topRatio, 1, 1, 20),
      ),
      material,
      position,
      [radius, height, radius],
      parent,
    );
  }

  private sphere(
    position: V3,
    scale: V3,
    material: Material,
    parent: THREE.Object3D,
  ): THREE.Mesh {
    return this.mesh(
      this.geometry("sphere", () => new THREE.SphereGeometry(1, 10, 7)),
      material,
      position,
      scale,
      parent,
    );
  }

  private node(
    x: number,
    z: number,
    rotation = 0,
    parent: THREE.Object3D = this.group,
  ): THREE.Group {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotation;
    parent.add(group);
    return group;
  }

  private instances(
    sizesAndPositions: Array<{ p: V3; s: V3 }>,
    material: Material,
    parent: THREE.Object3D = this.group,
    colorVariation = false,
  ): void {
    if (sizesAndPositions.length === 0) return;

    const mesh = new THREE.InstancedMesh(
      this.geometry("box", () => new THREE.BoxGeometry(1, 1, 1)),
      material,
      sizesAndPositions.length,
    );

    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const color = new THREE.Color();

    sizesAndPositions.forEach((entry, index) => {
      position.set(...entry.p);
      scale.set(...entry.s);
      matrix.compose(position, quaternion, scale);
      mesh.setMatrixAt(index, matrix);

      if (colorVariation) {
        const value = 0.84 + this.random() * 0.16;
        mesh.setColorAt(index, color.setRGB(value, value, value));
      }
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.castShadow = this.shadows;
    mesh.receiveShadow = this.shadows;
    mesh.computeBoundingSphere();
    parent.add(mesh);
  }

  private roundedTop(
    width: number,
    depth: number,
    radius: number,
    thickness: number,
  ): THREE.BufferGeometry {
    const key = `round:${width}:${depth}:${radius}:${thickness}`;

    return this.geometry(key, () => {
      const x = -width / 2;
      const y = -depth / 2;
      const r = Math.min(radius, width / 2, depth / 2);
      const shape = new THREE.Shape();

      shape.moveTo(x + r, y);
      shape.lineTo(x + width - r, y);
      shape.quadraticCurveTo(x + width, y, x + width, y + r);
      shape.lineTo(x + width, y + depth - r);
      shape.quadraticCurveTo(
        x + width,
        y + depth,
        x + width - r,
        y + depth,
      );
      shape.lineTo(x + r, y + depth);
      shape.quadraticCurveTo(x, y + depth, x, y + depth - r);
      shape.lineTo(x, y + r);
      shape.quadraticCurveTo(x, y, x + r, y);

      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: thickness,
        bevelEnabled: false,
        curveSegments: 12,
        steps: 1,
      });
      geometry.rotateX(-Math.PI / 2);
      geometry.translate(0, -thickness / 2, 0);
      geometry.computeVertexNormals();
      return geometry;
    });
  }

  private buildSlab(): void {
    this.box([0, -0.4, 0], [40.8, 0.8, 33.4], this.mat.charcoal);
    this.box([0, -0.82, 0], [39.7, 0.12, 32.3], this.mat.metal);

    const corridor: Array<{ p: V3; s: V3 }> = [];
    for (let z = -16.4; z < 16.4; z += 0.4) {
      corridor.push({
        p: [0, 0.016, z + 0.195],
        s: [40, 0.032, 0.387],
      });
    }
    this.instances(corridor, this.mat.charcoal, this.group, true);

    for (const [name, room] of Object.entries(this.rooms)) {
      if (name !== "sre") this.woodFloor(room);
    }

    const shadowTexture = this.canvasTexture(256, 256, (ctx) => {
      const gradient = ctx.createRadialGradient(128, 128, 40, 128, 128, 128);
      gradient.addColorStop(0, "rgba(0,0,0,.65)");
      gradient.addColorStop(0.55, "rgba(0,0,0,.38)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 256, 256);
    });

    const shadowMaterial = this.ownMaterial(
      new THREE.MeshBasicMaterial({
        map: shadowTexture,
        transparent: true,
        depthWrite: false,
      }),
    );
    const plane = this.mesh(
      this.geometry("plane", () => new THREE.PlaneGeometry(1, 1)),
      shadowMaterial,
      [0, -1.04, 0],
      [56, 45, 1],
      this.group,
      false,
    );
    plane.rotation.x = -Math.PI / 2;
  }

  private woodFloor(room: Room): void {
    this.box(
      [room.x, 0.045, room.z],
      [room.w, 0.06, room.d],
      this.mat.charcoal,
    );

    const boards: Array<{ p: V3; s: V3 }> = [];
    const rows = Math.ceil(room.d / 0.38);
    const rowDepth = room.d / rows;
    const left = room.x - room.w / 2;
    const right = room.x + room.w / 2;

    for (let row = 0; row < rows; row++) {
      const offset = row % 3 * 0.9;
      for (let start = left - offset; start < right; start += 3.1) {
        const a = Math.max(start, left);
        const b = Math.min(start + 3.1, right);
        if (b - a < 0.02) continue;

        boards.push({
          p: [(a + b) / 2, 0.083, room.z - room.d / 2 + (row + 0.5) * rowDepth],
          s: [b - a - 0.018, 0.032, rowDepth - 0.014],
        });
      }
    }
    this.instances(boards, this.mat.oak, this.group, true);
  }

  private slatPanel(
    width: number,
    height: number,
    parent: THREE.Object3D,
    centerY = height / 2,
    depth = 0.2,
  ): void {
    this.box([0, centerY, 0], [width, height, depth], this.mat.charcoal, parent);

    const slats: Array<{ p: V3; s: V3 }> = [];
    const count = Math.floor(width / 0.18);
    for (let i = 0; i < count; i++) {
      slats.push({
        p: [-width / 2 + (i + 0.5) * width / count, centerY, depth / 2 + 0.045],
        s: [0.105, height, 0.09],
      });
    }
    this.instances(slats, this.mat.oak, parent, true);
  }

  private backWallSection(x: number, width: number): void {
    const wall = this.node(x, -16.15);
    const windowWidth = width - 1.35;

    this.slatPanel(width, 3.55, wall, 1.775, 0.3);
    this.slatPanel(width, 0.9, wall, 5.35, 0.3);

    for (const side of [-1, 1]) {
      const pier = new THREE.Group();
      pier.position.x = side * (width / 2 - 0.3375);
      wall.add(pier);
      this.slatPanel(0.675, 1.35, pier, 4.225, 0.3);
    }

    const daylight = this.ownMaterial(
      new THREE.MeshBasicMaterial({ color: "#a5c2cf" }),
    );
    this.box([0, 4.225, 0.025], [windowWidth, 1.3, 0.055], daylight, wall, false);

    for (const y of [3.57, 4.88]) {
      this.box([0, y, 0.2], [windowWidth + 0.12, 0.07, 0.16], this.mat.metal, wall);
    }
    for (let i = 0; i <= 4; i++) {
      this.box(
        [-windowWidth / 2 + windowWidth * i / 4, 4.225, 0.2],
        [0.065, 1.35, 0.16],
        this.mat.metal,
        wall,
      );
    }
  }

  private partition(x: number): void {
    // A framed opening interrupts each structural slat wall near its front.
    const wall = this.node(x, -11.35, Math.PI / 2);
    this.slatPanel(8.9, 4.45, wall, 2.225, 0.32);
    wall.rotation.y = Math.PI / 2;

    const reverse = this.node(x - 0.19, -11.35, -Math.PI / 2);
    this.slatPanel(8.9, 4.45, reverse, 2.225, 0.06);

    this.box([x, 3.82, -6], [0.4, 1.26, 1.65], this.mat.oak);
    for (const z of [-6.82, -5.18]) {
      this.box([x, 1.6, z], [0.44, 3.2, 0.11], this.mat.metal);
    }
    this.box([x, 3.15, -6], [0.44, 0.11, 1.65], this.mat.metal);
  }

  private railing(
    x: number,
    z: number,
    length: number,
    rotation = 0,
  ): void {
    if (length < 0.15) return;
    const parent = this.node(x, z, rotation);
    const count = Math.max(1, Math.ceil(length / 2.1));
    const span = length / count;

    for (let i = 0; i < count; i++) {
      const center = -length / 2 + (i + 0.5) * span;
      this.box(
        [center, 0.64, 0],
        [span - 0.055, 0.96, 0.026],
        this.mat.glass,
        parent,
        false,
      );
    }

    for (let i = 0; i <= count; i++) {
      this.box(
        [-length / 2 + i * span, 0.64, 0],
        [0.045, 1.13, 0.065],
        this.mat.metal,
        parent,
      );
    }

    this.box([0, 1.225, 0], [length + 0.05, 0.075, 0.105], this.mat.oak, parent);
    this.box([0, 0.14, 0], [length, 0.055, 0.07], this.mat.metal, parent);
  }

  private roomFront(room: Room, frontZ: number, gap = 2.8): void {
    const wing = (room.w - gap) / 2;
    this.railing(room.x - gap / 2 - wing / 2, frontZ, wing);
    this.railing(room.x + gap / 2 + wing / 2, frontZ, wing);

    for (const side of [-1, 1]) {
      this.box(
        [room.x + side * gap / 2, 1.47, frontZ],
        [0.11, 2.78, 0.13],
        this.mat.metal,
      );
    }
    this.box([room.x, 2.83, frontZ], [gap + 0.12, 0.11, 0.13], this.mat.metal);
    this.box([room.x, 0.12, frontZ], [gap, 0.026, 0.055], this.mat.cyan, this.group, false);
  }

  private securityPartition(x: number): void {
    const parent = this.node(x, 0.2);
    const width = 10.8;
    const doorWidth = 2.5;
    const wing = (width - doorWidth) / 2;

    for (const side of [-1, 1]) {
      this.box(
        [side * (doorWidth / 2 + wing / 2), 1.45, 0],
        [wing - 0.08, 2.7, 0.04],
        this.mat.glass,
        parent,
        false,
      );
      for (const px of [side * width / 2, side * doorWidth / 2]) {
        this.box([px, 1.47, 0], [0.065, 2.85, 0.11], this.mat.metal, parent);
      }

      this.box(
        [side * doorWidth / 4, 1.44, 0],
        [doorWidth / 2 - 0.05, 2.7, 0.045],
        this.mat.glass,
        parent,
        false,
      );
      this.box([side * 0.06, 1.44, 0], [0.035, 2.7, 0.07], this.mat.metal, parent);
      this.box([side * 0.2, 1.35, 0.12], [0.035, 0.62, 0.045], this.mat.metal, parent);
    }

    this.box([0, 2.9, 0], [width, 0.085, 0.12], this.mat.metal, parent);
  }

  private cyanBorder(room: Room): void {
    const y = 0.135;
    for (const sign of [-1, 1]) {
      this.box(
        [room.x, y, room.z + sign * (room.d / 2 - 0.08)],
        [room.w - 0.12, 0.024, 0.038],
        this.mat.cyan,
        this.group,
        false,
      );
      this.box(
        [room.x + sign * (room.w / 2 - 0.08), y, room.z],
        [0.038, 0.024, room.d - 0.12],
        this.mat.cyan,
        this.group,
        false,
      );
    }
  }

  private buildArchitecture(): void {
    this.backWallSection(-13.3, 13.3);
    this.backWallSection(0, 13.1);
    this.backWallSection(13.3, 13.3);

    this.partition(-6.65);
    this.partition(6.65);

    for (const x of [-20, 20]) {
      const side = this.node(x, -10.7, x < 0 ? Math.PI / 2 : -Math.PI / 2);
      this.slatPanel(10.8, 2.55, side, 1.275, 0.22);
      this.railing(x, 5.7, 20.3, Math.PI / 2);
    }

    for (const name of ["executive", "connect", "research"] as const) {
      const room = this.rooms[name];
      this.roomFront(room, -5.4);
    }

    const warBack = this.node(0, -3.7);
    this.slatPanel(15.4, 3.15, warBack, 1.575, 0.24);
    this.roomFront(this.rooms.war, 4.7, 3.3);
    this.railing(-7.75, 0.5, 8.4, Math.PI / 2);
    this.railing(7.75, 0.5, 8.4, Math.PI / 2);

    for (const name of ["qa", "lounge", "sre"] as const) {
      const room = this.rooms[name];
      this.roomFront(room, 6.05, 2.65);
    }

    this.railing(-6.65, 11.2, 10, Math.PI / 2);
    this.railing(6.65, 11.2, 10, Math.PI / 2);

    this.securityPartition(-13.55);
    this.securityPartition(13.55);
    this.cyanBorder(this.rooms.qa);
    this.cyanBorder(this.rooms.sre);
  }

  private table(
    x: number,
    z: number,
    width: number,
    depth: number,
    material = this.mat.oak,
    height = 1.02,
    rounded = 0.16,
    parent: THREE.Object3D = this.group,
  ): THREE.Group {
    const table = this.node(x, z, 0, parent);

    this.mesh(
      this.roundedTop(width, depth, rounded, 0.13),
      material,
      [0, height, 0],
      [1, 1, 1],
      table,
    );

    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        this.box(
          [sx * (width / 2 - 0.24), height / 2, sz * (depth / 2 - 0.2)],
          [0.075, height, 0.075],
          this.mat.metal,
          table,
        );
      }
    }
    return table;
  }

  private chair(
    x: number,
    z: number,
    rotation = 0,
    kind: "task" | "conference" | "executive" = "task",
    parent: THREE.Object3D = this.group,
  ): THREE.Group {
    const chair = this.node(x, z, rotation, parent);
    chair.name = `${kind} chair`;

    const upholstery =
      kind === "conference" ? this.mat.leather : this.mat.blackLeather;
    const high = kind === "executive";

    this.cylinder([0, 0.34, 0], 0.065, 0.42, this.mat.metal, chair);
    this.cylinder([0, 0.15, 0], 0.12, 0.1, this.mat.metal, chair);

    for (let i = 0; i < 5; i++) {
      const angle = i * Math.PI * 2 / 5;
      const spoke = this.box(
        [Math.sin(angle) * 0.23, 0.14, Math.cos(angle) * 0.23],
        [0.055, 0.05, 0.48],
        this.mat.metal,
        chair,
      );
      spoke.rotation.y = angle;
      this.sphere(
        [Math.sin(angle) * 0.43, 0.105, Math.cos(angle) * 0.43],
        [0.065, 0.065, 0.065],
        this.mat.charcoal,
        chair,
      );
    }

    this.mesh(
      this.roundedTop(0.83, 0.76, 0.17, 0.14),
      upholstery,
      [0, 0.67, 0],
      [1, 1, 1],
      chair,
    );

    const backHeight = high ? 1.03 : 0.73;
    const backY = 0.73 + backHeight / 2;
    const back = this.box(
      [0, backY, 0.34],
      [0.79, backHeight, 0.12],
      upholstery,
      chair,
    );
    back.rotation.x = -0.08;

    if (kind === "task") {
      const ribs: Array<{ p: V3; s: V3 }> = [];
      for (let i = 0; i < 9; i++) {
        ribs.push({
          p: [0, 0.82 + i * 0.062, 0.263],
          s: [0.67, 0.018, 0.02],
        });
      }
      this.instances(ribs, this.mat.metal, chair);
    }

    for (const side of [-1, 1]) {
      this.box([side * 0.46, 0.84, 0.06], [0.045, 0.35, 0.045], this.mat.metal, chair);
      this.box([side * 0.46, 1.02, 0.01], [0.095, 0.065, 0.45], upholstery, chair);
    }
    return chair;
  }

  private monitor(
    x: number,
    z: number,
    parent: THREE.Object3D,
    width = 1.2,
    baseY = 1.1,
    rotation = 0,
  ): void {
    const monitor = this.node(x, z, rotation, parent);
    this.box([0, baseY + 0.025, 0], [0.5, 0.045, 0.28], this.mat.metal, monitor);
    this.box([0, baseY + 0.24, -0.035], [0.055, 0.43, 0.055], this.mat.metal, monitor);

    const segments = 20;
    const height = 0.62;
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= segments; i++) {
      const u = i / segments;
      const px = (u - 0.5) * width;
      const pz = 0.115 * Math.pow((u - 0.5) * 2, 2);
      positions.push(px, -height / 2, pz, px, height / 2, pz);
      uvs.push(u, 0, u, 1);

      if (i < segments) {
        const n = i * 2;
        indices.push(n, n + 2, n + 1, n + 2, n + 3, n + 1);
      }
    }

    const geometry = this.geometry(`curved-screen:${width}`, () => {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
      g.setIndex(indices);
      g.computeVertexNormals();
      return g;
    });

    this.box(
      [0, baseY + 0.56, -0.025],
      [width + 0.045, height + 0.045, 0.075],
      this.mat.metal,
      monitor,
    );
    this.mesh(
      geometry,
      this.mat.screen,
      [0, baseY + 0.56, 0.023],
      [1, 1, 1],
      monitor,
      false,
    );
  }

  private workstation(
    x: number,
    z: number,
    rotation = 0,
    width = 3.25,
  ): THREE.Group {
    const station = this.node(x, z, rotation);
    this.table(0, 0, width, 1.38, this.mat.oak, 1.05, 0.14, station);
    this.monitor(-0.66, -0.36, station, 1.23, 1.12, 0.07);
    this.monitor(0.66, -0.36, station, 1.23, 1.12, -0.07);
    this.box([0, 1.137, 0.31], [0.86, 0.03, 0.27], this.mat.charcoal, station);
    this.box([0.71, 1.13, 0.31], [0.25, 0.018, 0.31], this.mat.blackLeather, station);
    this.sphere([0.71, 1.16, 0.31], [0.055, 0.03, 0.085], this.mat.metal, station);
    this.box([width / 2 - 0.42, 0.55, 0], [0.55, 0.86, 0.95], this.mat.oak, station);
    this.chair(0, 1.2, 0, "task", station);
    this.cylinder([-width / 2 + 0.25, 1.22, 0.23], 0.075, 0.17, this.mat.ceramic, station);
    return station;
  }

  private plant(x: number, z: number, scale = 1): void {
    const plant = this.node(x, z);
    plant.name = "Ficus in ceramic planter";
    plant.scale.setScalar(scale);

    this.cylinder([0, 0.44, 0], 0.36, 0.76, this.mat.ceramic, plant, 1.3);
    this.cylinder([0, 0.826, 0], 0.43, 0.025, this.mat.earth, plant);
    this.cylinder([0, 1.25, 0], 0.055, 0.95, this.mat.walnut, plant, 0.7);

    const leafGeometry = this.geometry(
      "leaf",
      () => new THREE.SphereGeometry(1, 7, 5),
    );
    const leaves = new THREE.InstancedMesh(leafGeometry, this.mat.foliage, 28);
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    for (let i = 0; i < 28; i++) {
      const a = this.random() * Math.PI * 2;
      const radius = 0.18 + this.random() * 0.45;
      const y = 1.3 + this.random() * 1.08;
      dummy.position.set(Math.cos(a) * radius, y, Math.sin(a) * radius);
      dummy.scale.set(0.15, 0.07, 0.32 + this.random() * 0.16);
      dummy.rotation.set(this.random() * 0.8, -a, this.random() * 0.8);
      dummy.updateMatrix();
      leaves.setMatrixAt(i, dummy.matrix);
      leaves.setColorAt(
        i,
        color.set(this.random() > 0.65 ? "#64824d" : "#315f42"),
      );
    }

    leaves.instanceMatrix.needsUpdate = true;
    if (leaves.instanceColor) leaves.instanceColor.needsUpdate = true;
    leaves.castShadow = this.shadows;
    leaves.receiveShadow = this.shadows;
    leaves.computeBoundingSphere();
    plant.add(leaves);
  }

  private rug(x: number, z: number, width: number, depth: number): void {
    this.box([x, 0.125, z], [width, 0.04, depth], this.mat.rug);
  }

  private credenza(
    x: number,
    z: number,
    width: number,
    rotation = 0,
  ): THREE.Group {
    const parent = this.node(x, z, rotation);
    this.box([0, 0.53, 0], [width, 0.84, 0.75], this.mat.oak, parent);
    this.box([0, 0.99, 0], [width + 0.06, 0.08, 0.81], this.mat.oakLight, parent);
    const count = Math.max(2, Math.round(width / 0.8));
    for (let i = 0; i < count; i++) {
      const dx = -width / 2 + (i + 0.5) * width / count;
      this.box([dx, 0.53, 0.389], [width / count - 0.025, 0.76, 0.025], this.mat.oak, parent);
      this.box([dx + width / count * 0.3, 0.62, 0.412], [0.025, 0.18, 0.025], this.mat.metal, parent);
    }
    return parent;
  }

  private bookshelf(x: number, z: number, rotation: number): void {
    const shelf = this.node(x, z, rotation);
    const width = 3.8;
    this.box([0, 1.92, -0.3], [width, 3.7, 0.08], this.mat.charcoal, shelf);
    for (const px of [-width / 2, 0, width / 2]) {
      this.box([px, 1.92, 0], [0.09, 3.7, 0.68], this.mat.oak, shelf);
    }

    const bookMaterials = [
      this.standard("#d2c6ad"),
      this.standard("#647274"),
      this.standard("#343e49"),
      this.standard("#a2744f"),
    ];

    for (let level = 0; level <= 5; level++) {
      const y = 0.12 + level * 0.72;
      this.box([0, y, 0], [width, 0.08, 0.7], this.mat.oak, shelf);
      if (level === 5) continue;

      this.box([0, y + 0.075, -0.23], [width - 0.18, 0.015, 0.022], this.mat.cyan, shelf, false);

      for (let side = 0; side < 2; side++) {
        const start = -1.68 + side * 1.9;
        for (let i = 0; i < 6; i++) {
          const height = 0.28 + this.random() * 0.24;
          const book = this.box(
            [start + i * 0.16, y + 0.04 + height / 2, 0.04],
            [0.11, height, 0.33],
            bookMaterials[(level + i) % bookMaterials.length],
            shelf,
          );
          if (i === 5) book.rotation.z = -0.12;
        }
        this.cylinder(
          [start + 1.23, y + 0.2, 0.07],
          0.14,
          0.3,
          this.mat.ceramic,
          shelf,
          0.65,
        );
      }
    }
  }

  private art(x: number, y: number, z: number, width = 1.7, rotation = 0): void {
    const texture = this.canvasTexture(256, 320, (ctx) => {
      ctx.fillStyle = "#e9dfc9";
      ctx.fillRect(0, 0, 256, 320);
      ctx.fillStyle = "#b7864d";
      ctx.beginPath();
      ctx.arc(128, 142, 75, Math.PI, 0);
      ctx.lineTo(203, 275);
      ctx.lineTo(53, 275);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#e9dfc9";
      ctx.beginPath();
      ctx.arc(128, 145, 42, Math.PI, 0);
      ctx.lineTo(170, 275);
      ctx.lineTo(86, 275);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#25292b";
      ctx.beginPath();
      ctx.arc(173, 74, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(33, 282, 190, 3);
    });

    const material = this.standard("#ffffff", 0.9);
    material.map = texture;
    const frame = this.node(x, z, rotation);
    this.box([0, y, 0], [width + 0.09, width * 1.25 + 0.09, 0.075], this.mat.metal, frame);
    this.mesh(
      this.geometry("plane", () => new THREE.PlaneGeometry(1, 1)),
      material,
      [0, y, 0.045],
      [width, width * 1.25, 1],
      frame,
      false,
    );
  }

  private armchair(
    x: number,
    z: number,
    rotation: number,
    parent: THREE.Object3D = this.group,
  ): void {
    const chair = this.node(x, z, rotation, parent);
    this.box([0, 0.3, 0], [0.94, 0.35, 0.93], this.mat.walnut, chair);
    this.mesh(
      this.roundedTop(1.12, 1.04, 0.22, 0.25),
      this.mat.cream,
      [0, 0.61, 0],
      [1, 1, 1],
      chair,
    );
    this.box([0, 1.01, 0.41], [1.15, 0.79, 0.24], this.mat.cream, chair);
    for (const side of [-1, 1]) {
      this.box([side * 0.53, 0.81, 0], [0.23, 0.62, 1.08], this.mat.cream, chair);
    }
  }

  private buildExecutive(): void {
    this.rug(-13.3, -10, 8.5, 7.4);

    const desk = this.table(-13.4, -11.8, 4.8, 1.8, this.mat.oakLight, 1.12, 0.8);
    desk.name = "Curved executive desk";
    this.box([0, 1.2, 0.03], [2, 0.022, 0.83], this.mat.blackLeather, desk);
    this.monitor(0.9, -0.41, desk, 1.45, 1.22);
    this.box([-1.3, 1.225, 0.15], [0.55, 0.05, 0.4], this.mat.white, desk);
    this.chair(-13.4, -13.15, Math.PI, "executive");

    this.armchair(-14.8, -8.75, 0);
    this.armchair(-12, -8.75, 0);

    const cabinet = this.credenza(-13.6, -15.35, 6.1);
    this.cylinder([-1.95, 1.25, 0], 0.18, 0.43, this.mat.ceramic, cabinet, 0.6);
    this.cylinder([-1.45, 1.19, 0], 0.14, 0.3, this.mat.walnut, cabinet, 0.8);
    this.art(-13.6, 2.28, -15.87, 1.6);
    this.bookshelf(-19.2, -12.2, Math.PI / 2);

    this.plant(-18.1, -6.65);
    this.plant(-8.25, -14.65);
    this.plant(-8.1, -6.7);
  }

  private buildConnect(): void {
    this.workstation(-2.75, -12.85, 0, 3.5);
    this.workstation(2.75, -12.85, 0, 3.5);
    this.workstation(-3.35, -8.75, Math.PI / 2, 3.4);
    this.workstation(3.35, -8.75, -Math.PI / 2, 3.4);
    this.chair(0, -8.4, 0, "task");

    for (const [x, z] of [
      [-5.35, -14.75],
      [5.3, -14.75],
      [-5.3, -6.6],
      [5.3, -6.6],
    ]) this.plant(x, z, 0.92);
  }

  private buildResearch(): void {
    this.workstation(10.3, -10.25, 0, 4.2);
    this.workstation(15.4, -10.25, 0, 4.2);
    this.bookshelf(19.15, -12.45, -Math.PI / 2);

    const boardTexture = this.canvasTexture(1536, 480, (ctx) => {
      ctx.fillStyle = "#e4e9e2";
      ctx.fillRect(0, 0, 1536, 480);
      ctx.fillStyle = "#334a52";
      ctx.font = "600 32px sans-serif";
      ctx.fillText("RESEARCH / AGENT REASONING PIPELINE", 45, 58);

      const labels = ["INGEST", "REASON", "ACT", "INDEX", "VERIFY", "OBSERVE"];
      ctx.font = "600 21px sans-serif";
      labels.forEach((label, index) => {
        const x = 38 + index * 248;
        ctx.strokeStyle = "#587c89";
        ctx.lineWidth = 3;
        ctx.strokeRect(x, 143, 205, 90);
        ctx.fillStyle = "#244959";
        ctx.fillText(label, x + 18, 198);
        if (index < labels.length - 1) {
          ctx.beginPath();
          ctx.moveTo(x + 205, 188);
          ctx.lineTo(x + 241, 188);
          ctx.lineTo(x + 232, 181);
          ctx.moveTo(x + 241, 188);
          ctx.lineTo(x + 232, 195);
          ctx.stroke();
        }
        ctx.font = "18px monospace";
        ctx.fillText(`node ${index + 1} / validated`, x + 5, 283);
        ctx.font = "600 21px sans-serif";
      });

      ctx.strokeStyle = "#aa8056";
      ctx.beginPath();
      ctx.moveTo(1400, 245);
      ctx.lineTo(1400, 352);
      ctx.lineTo(144, 352);
      ctx.lineTo(144, 245);
      ctx.stroke();
      ctx.font = "20px monospace";
      ctx.fillStyle = "#61746f";
      ctx.fillText("feedback loop / context memory / continuous evaluation", 380, 405);
    });

    const material = this.standard("#ffffff", 0.75);
    material.map = boardTexture;
    this.box([12.6, 2.45, -15.83], [8.9, 2.2, 0.11], this.mat.metal);
    this.mesh(
      this.geometry("plane", () => new THREE.PlaneGeometry(1, 1)),
      material,
      [12.6, 2.45, -15.763],
      [8.72, 2.03, 1],
      this.group,
      false,
    );

    const display = this.node(7.04, -12.6, Math.PI / 2);
    this.box([0, 2.15, 0], [2.5, 1.5, 0.1], this.mat.metal, display);
    this.mesh(
      this.geometry("plane", () => new THREE.PlaneGeometry(1, 1)),
      this.mat.screen,
      [0, 2.15, 0.061],
      [2.37, 1.37, 1],
      display,
      false,
    );

    this.plant(8, -14.8, 0.92);
    this.plant(18.2, -6.6);
    this.plant(8.1, -6.6);
  }

  private buildWarRoom(): void {
    this.rug(0, 0.55, 12.75, 6.9);

    const table = this.node(0, 0.4);
    table.name = "War Room racetrack walnut conference table";
    this.mesh(
      this.roundedTop(10.2, 2.8, 1.4, 0.19),
      this.mat.walnut,
      [0, 1.12, 0],
      [1, 1, 1],
      table,
    );

    for (const x of [-3, 3]) {
      this.box([x, 0.58, 0], [0.36, 1.05, 1.48], this.mat.metal, table);
    }
    for (const x of [-2.4, 0, 2.4]) {
      this.box([x, 1.225, 0], [0.58, 0.035, 0.22], this.mat.metal, table);
      this.box([x + 0.2, 1.247, 0], [0.055, 0.009, 0.12], this.mat.cyan, table, false);
    }

    // Exactly ten conference chairs: four on each long side and two end caps.
    for (const x of [-3.45, -1.15, 1.15, 3.45]) {
      this.chair(x, -1.72, Math.PI, "conference");
      this.chair(x, 2.55, 0, "conference");
    }
    this.chair(-5.9, 0.4, -Math.PI / 2, "conference");
    this.chair(5.9, 0.4, Math.PI / 2, "conference");

    const texture = this.networkTexture();
    const panelWidth = 2.65;
    for (let i = 0; i < 4; i++) {
      const panelTexture = texture.clone();
      panelTexture.repeat.set(0.25, 1);
      panelTexture.offset.set(i * 0.25, 0);
      panelTexture.needsUpdate = true;
      this.textures.add(panelTexture);

      const material = this.standard("#ffffff", 0.4);
      material.map = panelTexture;
      material.emissiveMap = panelTexture;
      material.emissive.set("#ffffff");
      material.emissiveIntensity = 1.1;

      const x = (i - 1.5) * (panelWidth + 0.045);
      this.box([x, 2.04, -3.51], [panelWidth + 0.045, 1.85, 0.13], this.mat.metal);
      this.mesh(
        this.geometry("plane", () => new THREE.PlaneGeometry(1, 1)),
        material,
        [x, 2.04, -3.435],
        [panelWidth, 1.76, 1],
        this.group,
        false,
      );
    }

    this.plant(-6.6, -2.62, 0.9);
    this.plant(6.6, -2.62, 0.9);
    this.plant(-6.65, 3.75, 0.9);
    this.plant(6.65, 3.75, 0.9);
  }

  private buildQA(): void {
    this.workstation(-15.9, 8.4, 0, 3.55);
    this.workstation(-10.65, 8.4, 0, 3.55);
    this.workstation(-13.25, 12.35, 0, 3.75);

    this.credenza(-19.2, 11.45, 4.1, Math.PI / 2);
    this.art(-19.7, 2.03, 10.25, 1.05, Math.PI / 2);
    this.art(-19.7, 2.03, 12.05, 1.05, Math.PI / 2);

    this.plant(-18.35, 7.2, 0.87);
    this.plant(-8.1, 7.2, 0.87);
    this.plant(-18.3, 15.05, 0.9);
    this.plant(-8.15, 15.05, 0.9);
  }

  private buildLounge(): void {
    this.rug(-1.65, 12.2, 7.35, 6.25);

    const sofa = this.node(-2.1, 10.3);
    sofa.name = "Cream three-seat sofa";
    this.box([0, 0.31, 0], [4.45, 0.34, 1.24], this.mat.walnut, sofa);
    this.box([0, 0.97, -0.54], [4.72, 0.97, 0.29], this.mat.cream, sofa);

    for (let i = 0; i < 3; i++) {
      this.mesh(
        this.roundedTop(1.4, 1.13, 0.17, 0.3),
        this.mat.cream,
        [(i - 1) * 1.43, 0.63, 0.06],
        [1, 1, 1],
        sofa,
      );
      const cushion = this.box(
        [(i - 1) * 1.43, 1.02, -0.34],
        [1.34, 0.65, 0.23],
        this.mat.cream,
        sofa,
      );
      cushion.rotation.x = -0.12;
    }
    for (const side of [-1, 1]) {
      this.box([side * 2.3, 0.78, 0], [0.32, 0.77, 1.36], this.mat.cream, sofa);
    }

    this.armchair(-4.05, 14.4, -0.25);
    this.armchair(0.2, 14.4, 0.25);

    this.cylinder([-1.9, 0.63, 12.6], 1.13, 0.13, this.mat.walnut);
    this.cylinder([-1.9, 0.35, 12.6], 0.4, 0.52, this.mat.metal);
    const magazine = this.box([-2.15, 0.715, 12.56], [0.7, 0.035, 0.46], this.mat.white);
    magazine.rotation.y = 0.18;
    this.box([-1.62, 0.735, 12.6], [0.37, 0.075, 0.5], this.mat.oakLight);
    this.cylinder([-1.37, 0.77, 12.17], 0.08, 0.15, this.mat.ceramic);

    const counter = this.credenza(-2.75, 7.05, 5.45);
    this.box([-1.12, 1.43, 0], [1.16, 0.77, 0.58], this.mat.metal, counter);
    this.box([-1.12, 1.53, 0.31], [0.97, 0.3, 0.035], this.mat.charcoal, counter);
    this.box([-1.12, 1.1, 0.29], [1.1, 0.055, 0.36], this.mat.metal, counter);
    for (const x of [-1.36, -0.9]) {
      this.cylinder([x, 1.36, 0.31], 0.048, 0.22, this.mat.metal, counter);
      this.cylinder([x, 1.2, 0.3], 0.078, 0.15, this.mat.ceramic, counter);
    }
    this.box([0.18, 1.34, -0.04], [0.46, 0.57, 0.47], this.mat.charcoal, counter);
    this.cylinder([0.2, 1.2, 0.22], 0.15, 0.29, this.mat.metal, counter, 0.8);
    for (const x of [0.82, 1.2, 1.58]) {
      this.cylinder([x, 1.17, 0.12], 0.085, 0.21, this.mat.ceramic, counter);
    }

    this.cylinder([2.18, 1.34, 0], 0.035, 0.61, this.mat.metal, counter);
    const shade = this.standard("#f1d9a5", 0.9);
    shade.emissive.set("#eeb96b");
    shade.emissiveIntensity = 0.5;
    this.cylinder([2.18, 1.73, 0], 0.33, 0.38, shade, counter, 0.65);

    this.workstation(4.12, 10.8, 0, 3.4);
    this.plant(-5.5, 8.25, 0.85);
    this.plant(-5.45, 15.05, 0.92);
    this.plant(5.3, 15.05, 0.92);
  }

  private buildSRE(): void {
    const room = this.rooms.sre;
    const accessFloor = this.standard("#26292e", 0.45, 0.35);
    const tiles: Array<{ p: V3; s: V3 }> = [];
    const nx = Math.ceil(room.w / 0.6);
    const nz = Math.ceil(room.d / 0.6);
    const tw = room.w / nx;
    const td = room.d / nz;

    for (let iz = 0; iz < nz; iz++) {
      for (let ix = 0; ix < nx; ix++) {
        tiles.push({
          p: [
            room.x - room.w / 2 + (ix + 0.5) * tw,
            0.081,
            room.z - room.d / 2 + (iz + 0.5) * td,
          ],
          s: [tw - 0.018, 0.07, td - 0.018],
        });
      }
    }
    this.instances(tiles, accessFloor, this.group, true);

    const rackTexture = this.canvasTexture(256, 512, (ctx) => {
      ctx.fillStyle = "#151a20";
      ctx.fillRect(0, 0, 256, 512);
      for (let y = 7; y < 505; y += 9) {
        for (let x = 8; x < 248; x += 9) {
          ctx.fillStyle = "#080d12";
          ctx.fillRect(x, y, 4, 4);
          ctx.fillStyle = "#313a40";
          ctx.fillRect(x, y + 4, 4, 1);
        }
      }
      for (let i = 0; i < 17; i++) {
        const y = 20 + i * 27;
        ctx.fillStyle = "#39434c";
        ctx.fillRect(13, y, 220, 2);
        ctx.fillStyle = i % 5 === 0 ? "#b5dc98" : "#58dcef";
        ctx.fillRect(219, y + 8, 5, 3);
      }
    });
    const rackFace = this.standard("#ffffff", 0.48, 0.4);
    rackFace.map = rackTexture;

    const rackParent = this.node(18.48, 11.03, -Math.PI / 2);
    rackParent.name = "Six 42U server cabinets";

    for (let i = 0; i < 6; i++) {
      const x = (i - 2.5) * 1.43;
      this.box([x, 1.94, 0], [1.34, 3.65, 1.35], this.mat.metal, rackParent);
      this.box([x, 0.19, 0], [1.39, 0.16, 1.41], this.mat.charcoal, rackParent);
      this.mesh(
        this.geometry("plane", () => new THREE.PlaneGeometry(1, 1)),
        rackFace,
        [x, 1.94, 0.686],
        [1.17, 3.4, 1],
        rackParent,
        false,
      );
      this.box([x - 0.52, 1.94, 0.71], [0.024, 3.12, 0.018], this.mat.cyan, rackParent, false);
      this.box([x + 0.42, 1.89, 0.74], [0.035, 0.47, 0.035], this.mat.metal, rackParent);
      this.box([x, 3.66, 0.702], [0.56, 0.075, 0.022], this.mat.charcoal, rackParent);
    }

    this.workstation(11.15, 8.45, 0, 4);

    const incident = this.table(11.4, 13.05, 2.7, 2.7, this.mat.oak, 1.05, 0.13);
    incident.name = "Four-person incident response table";
    this.chair(11.4, 11.05, Math.PI);
    this.chair(11.4, 15.05, 0);
    this.chair(9.4, 13.05, -Math.PI / 2);
    this.chair(13.4, 13.05, Math.PI / 2);

    this.cylinder([0, 1.25, 0], 0.18, 0.27, this.mat.ceramic, incident, 1.1);
    for (let i = 0; i < 7; i++) {
      const angle = i * Math.PI * 2 / 7;
      const leaf = this.sphere(
        [Math.cos(angle) * 0.1, 1.43, Math.sin(angle) * 0.1],
        [0.075, 0.07, 0.2],
        this.mat.foliageLight,
        incident,
      );
      leaf.rotation.y = -angle;
    }

    this.plant(15.4, 7.23, 0.85);
  }

  private label(text: string, x: number, z: number, width: number): void {
    const texture = this.canvasTexture(1536, 256, (ctx) => {
      ctx.fillStyle = "#181c21";
      ctx.fillRect(0, 0, 1536, 256);
      ctx.strokeStyle = "#69777d";
      ctx.lineWidth = 3;
      ctx.strokeRect(19, 20, 1498, 216);
      ctx.strokeStyle = "#39444b";
      ctx.lineWidth = 1;
      ctx.strokeRect(29, 30, 1478, 196);

      let fontSize = 66;
      do {
        ctx.font = `600 ${fontSize}px sans-serif`;
        if (ctx.measureText(text).width <= 1370) break;
        fontSize--;
      } while (fontSize > 16);

      ctx.fillStyle = "#f0f2ed";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, 768, 132);
    });

    const material = this.standard("#ffffff", 0.98);
    material.map = texture;
    const mat = this.mesh(
      this.geometry("plane", () => new THREE.PlaneGeometry(1, 1)),
      material,
      [x, 0.155, z],
      [width, 0.82, 1],
      this.group,
      false,
    );
    mat.rotation.x = -Math.PI / 2;
    mat.name = `Threshold: ${text}`;
  }

  private buildLabels(): void {
    this.label("EXECUTIVE SUITE", -13.2, -6.15, 5.1);
    this.label("A2A COORDINATION / CONNECT", 0, -6.15, 6.5);
    this.label("RESEARCH & INTEL", 13.2, -6.15, 5.25);
    this.label("WAR ROOM / A", 0, 3.95, 4.8);
    this.label("QA & HARDENING", -13.2, 6.9, 5.1);
    this.label("LOUNGE & OPERATIONS", 0, 6.9, 5.7);
    this.label("SRE & INFRASTRUCTURE", 13.2, 6.9, 5.8);
  }

  private telemetryTexture(): THREE.CanvasTexture {
    return this.canvasTexture(768, 384, (ctx) => {
      ctx.fillStyle = "#07131f";
      ctx.fillRect(0, 0, 768, 384);
      ctx.fillStyle = "#102637";
      ctx.fillRect(0, 0, 768, 40);
      ctx.font = "600 17px monospace";
      ctx.fillStyle = "#b4e8f4";
      ctx.fillText("SYSTEM / TELEMETRY", 20, 27);
      ctx.fillStyle = "#76dfb8";
      ctx.fillText("LIVE", 691, 27);

      ctx.strokeStyle = "#183645";
      ctx.lineWidth = 1;
      for (let x = 20; x < 748; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 60);
        ctx.lineTo(x, 366);
        ctx.stroke();
      }
      for (let y = 60; y < 370; y += 32) {
        ctx.beginPath();
        ctx.moveTo(20, y);
        ctx.lineTo(748, y);
        ctx.stroke();
      }

      for (let curve = 0; curve < 3; curve++) {
        ctx.strokeStyle = ["#5fdcf2", "#408fd5", "#9bdfc2"][curve];
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 25; x < 500; x += 3) {
          const y =
            130 + curve * 61 +
            Math.sin(x * 0.027 + curve * 2) * 20 +
            Math.sin(x * 0.09) * 5;
          if (x === 25) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      ctx.font = "14px monospace";
      for (let i = 0; i < 11; i++) {
        const y = 78 + i * 25;
        ctx.fillStyle = "#6592a6";
        ctx.fillText(`node_${String(i + 1).padStart(2, "0")}`, 530, y);
        ctx.fillStyle = "#7cddbd";
        ctx.fillText("PASS", 676, y);
      }

      ctx.fillStyle = "#64a6bb";
      ctx.fillText("latency 12ms    throughput 98.4%    errors 0", 25, 361);
    });
  }

  private networkTexture(): THREE.CanvasTexture {
    return this.canvasTexture(2048, 512, (ctx) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, 512);
      gradient.addColorStop(0, "#07131e");
      gradient.addColorStop(1, "#102b43");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 2048, 512);

      ctx.strokeStyle = "rgba(77,150,186,.16)";
      ctx.lineWidth = 1;
      for (let x = 0; x < 2048; x += 64) {
        ctx.beginPath();
        ctx.moveTo(x, 55);
        ctx.lineTo(x, 480);
        ctx.stroke();
      }
      for (let y = 64; y < 512; y += 48) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(2048, y);
        ctx.stroke();
      }

      // Stylized continental silhouettes, not a geographic data dependency.
      const continents: number[][][] = [
        [[.08,.24],[.15,.15],[.26,.17],[.32,.27],[.26,.36],[.22,.42],[.16,.37],[.11,.31]],
        [[.24,.43],[.30,.47],[.33,.59],[.30,.73],[.27,.86],[.24,.69],[.22,.54]],
        [[.43,.24],[.48,.18],[.54,.23],[.55,.32],[.49,.37],[.45,.32]],
        [[.46,.38],[.54,.35],[.59,.47],[.55,.64],[.51,.76],[.47,.62],[.43,.47]],
        [[.54,.22],[.64,.15],[.78,.18],[.89,.29],[.83,.41],[.74,.44],[.67,.36],[.61,.43],[.56,.33]],
        [[.77,.63],[.85,.58],[.91,.67],[.87,.78],[.79,.76]],
      ];

      for (const polygon of continents) {
        ctx.beginPath();
        polygon.forEach(([x, y], i) => {
          if (i === 0) ctx.moveTo(x * 2048, y * 512);
          else ctx.lineTo(x * 2048, y * 512);
        });
        ctx.closePath();
        ctx.fillStyle = "rgba(39,106,144,.42)";
        ctx.fill();
        ctx.strokeStyle = "rgba(81,177,218,.58)";
        ctx.stroke();
      }

      const nodes = [
        [310, 156], [420, 207], [540, 293], [972, 162],
        [1050, 203], [1090, 305], [1320, 158], [1490, 209],
        [1620, 244], [1730, 351], [1200, 235],
      ];

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          if ((i + j) % 3 !== 0) continue;
          const [ax, ay] = nodes[i];
          const [bx, by] = nodes[j];
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.quadraticCurveTo((ax + bx) / 2, Math.min(ay, by) - 100, bx, by);
          ctx.strokeStyle = "rgba(73,208,251,.52)";
          ctx.lineWidth = 1.6;
          ctx.stroke();
        }
      }

      for (const [x, y] of nodes) {
        const halo = ctx.createRadialGradient(x, y, 1, x, y, 20);
        halo.addColorStop(0, "rgba(105,238,255,.95)");
        halo.addColorStop(1, "rgba(50,163,244,0)");
        ctx.fillStyle = halo;
        ctx.fillRect(x - 20, y - 20, 40, 40);
        ctx.fillStyle = "#c7f8ff";
        ctx.beginPath();
        ctx.arc(x, y, 3.4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.font = "600 22px monospace";
      ctx.fillStyle = "#b7ebfa";
      ctx.fillText("GLOBAL THREAT / NETWORK TOPOLOGY", 36, 38);
      ctx.font = "17px monospace";
      ctx.fillStyle = "#7bcedd";
      ctx.fillText("SECURE FABRIC     128 NODES     24 REGIONS     ALL SYSTEMS NOMINAL", 36, 486);
    });
  }

  private buildLighting(): void {
    const hemisphere = new THREE.HemisphereLight("#dceaf2", "#67513a", 1.65);
    hemisphere.name = "Studio ambient";
    this.group.add(hemisphere);
    this.lights.push(hemisphere);

    const key = new THREE.DirectionalLight("#fff0d8", 3.1);
    key.name = "Soft architectural key";
    key.position.set(-18, 30, 18);
    key.target.position.set(0, 0, 0);
    key.castShadow = this.shadows;

    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -30;
    key.shadow.camera.right = 30;
    key.shadow.camera.top = 30;
    key.shadow.camera.bottom = -30;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 95;
    key.shadow.normalBias = 0.045;
    key.shadow.bias = -0.00015;
    key.shadow.radius = 3;

    this.group.add(key, key.target);
    this.lights.push(key);

    const fill = new THREE.DirectionalLight("#aecfef", 1.3);
    fill.name = "Cool clerestory fill";
    fill.position.set(8, 16, -24);
    fill.target.position.set(0, 0, 0);
    this.group.add(fill, fill.target);
    this.lights.push(fill);
  }
}

export default OfficeFloorPlan;
