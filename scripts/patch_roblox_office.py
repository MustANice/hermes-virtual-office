with open('/root/projects/hermes-virtual-office/src/engine/RobloxOffice3D.ts', 'r') as f:
    content = f.read()

# 1. Update skinMat and face texture in RobloxAvatar3D
old_skin = '''    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xfde047,
      roughness: 0.45,
      metalness: 0.02,
    });
    const torsoMat = new THREE.MeshStandardMaterial({
      color: this.safeColor(state.color),
      roughness: 0.4,
      metalness: 0.05,
    });
    const pantsMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.65,
    });'''

new_skin = '''    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xECC8AF, // Warm natural human skin tone
      roughness: 0.65,
      metalness: 0.0,
    });
    const torsoMat = new THREE.MeshStandardMaterial({
      color: this.getExecutiveColor(state.id, state.color),
      roughness: 0.78,
      metalness: 0.05,
    });
    const pantsMat = new THREE.MeshStandardMaterial({
      color: 0x1A1E24, // Tailored dark charcoal slacks
      roughness: 0.82,
      metalness: 0.02,
    });'''

if old_skin in content:
    content = content.replace(old_skin, new_skin)
    print("Replaced skinMat & clothing!")
else:
    print("Could not find old_skin")

# 2. Add getExecutiveColor method to RobloxAvatar3D
old_face_fn = '''  private createRobloxFaceTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is required for avatar faces.');

    ctx.scale(2, 2);

    ctx.fillStyle = '#0F172A';
    for (const x of [38, 90]) {
      ctx.beginPath();
      ctx.arc(x, 50, 11, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#FFFFFF';
    for (const x of [35, 87]) {
      ctx.beginPath();
      ctx.arc(x, 46, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
    for (const x of [28, 100]) {
      ctx.beginPath();
      ctx.arc(x, 66, 7, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 5.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(64, 72, 22, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }'''

new_face_fn = '''  private getExecutiveColor(id: string, color: string): number {
    const PALETTE: Record<string, number> = {
      orion: 0x1E3A8A,    // Sovereign Navy Blazer
      forge: 0x9A3412,    // Terracotta / Warm Rust
      frame: 0x0E7490,    // Cyan Slate
      aurora: 0x9D174D,   // Rosewood / Plum
      radar: 0x065F46,    // Deep Forest Green
      quant: 0x4D7C0F,    // Olive / Moss
      prism: 0x6D28D9,    // Royal Amethyst
      lens: 0x4338CA,     // Midnight Indigo
      sentinel: 0x991B1B, // Burgundy / Crimson
      atlas: 0xB45309,    // Warm Amber / Ochre
      nexus: 0x0F766E,    // Deep Mineral Teal
    };
    return PALETTE[id] || parseInt(color.replace('#', '0x'), 16);
  }

  private createRobloxFaceTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is required for avatar faces.');

    ctx.clearRect(0, 0, 512, 512);

    // Refined modern architectural scale figure facial features
    ctx.fillStyle = '#1E242B';
    for (const x of [165, 347]) {
      ctx.beginPath();
      ctx.ellipse(x, 220, 26, 17, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Specular catchlight
    ctx.fillStyle = '#FFFFFF';
    for (const x of [158, 340]) {
      ctx.beginPath();
      ctx.arc(x, 214, 7, 0, Math.PI * 2);
      ctx.fill();
    }

    // Subtle modern brows
    ctx.strokeStyle = '#2D3748';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(135, 186);
    ctx.lineTo(195, 189);
    ctx.moveTo(377, 186);
    ctx.lineTo(317, 189);
    ctx.stroke();

    // Clean neutral mouth line
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(228, 308);
    ctx.lineTo(284, 308);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }'''

if old_face_fn in content:
    content = content.replace(old_face_fn, new_face_fn)
    print("Replaced createRobloxFaceTexture & added getExecutiveColor!")
else:
    print("Could not find old_face_fn")

# 3. Update IDLE_LOCATIONS
old_idle = '''    const IDLE_LOCATIONS: Record<string, { x: number; y: number; z: number; rotY: number; loc: 'desk' | 'coffee' | 'sofa' | 'meeting' | 'other' }> = {
      sentinel: { x: -3.8, y: 0.12, z: 9.8, rotY: 0, loc: 'coffee' },
      nexus: { x: -4.0, y: 0.12, z: 14.5, rotY: 0, loc: 'sofa' },
      aurora: { x: 0.0, y: 0.12, z: -5.12, rotY: 0, loc: 'meeting' },
      frame: { x: 0.0, y: 0.12, z: -1.5, rotY: Math.PI, loc: 'other' },
      radar: { x: 23.5, y: 0.12, z: -15.5, rotY: 0, loc: 'other' },
      prism: { x: -26.2, y: 0.12, z: 6.5, rotY: Math.PI, loc: 'other' }, // standing looking at QA telemetry board on North wall
      atlas: { x: 21.0, y: 0.12, z: 8.0, rotY: -Math.PI / 2, loc: 'other' },
      lens: { x: -17.55, y: 0.12, z: 9.92, rotY: Math.PI, loc: 'desk' },
      quant: { x: 17.0, y: 0.12, z: -12.88, rotY: Math.PI, loc: 'desk' },
      forge: { x: -5.3, y: 0.12, z: -16.98, rotY: Math.PI, loc: 'desk' },
      orion: { x: -21.0, y: 0.12, z: -16.27, rotY: 0, loc: 'desk' },
    };'''

new_idle = '''    const IDLE_LOCATIONS: Record<string, { x: number; y: number; z: number; rotY: number; loc: 'desk' | 'coffee' | 'sofa' | 'meeting' | 'other' }> = {
      orion: { x: -13.4, y: 0.12, z: -13.15, rotY: 0, loc: 'desk' },
      forge: { x: -2.75, y: 0.12, z: -13.5, rotY: 0, loc: 'desk' },
      frame: { x: 2.75, y: 0.12, z: -13.5, rotY: 0, loc: 'desk' },
      aurora: { x: -3.35, y: 0.12, z: -7.9, rotY: Math.PI, loc: 'desk' },
      quant: { x: 10.3, y: 0.12, z: -11.05, rotY: 0, loc: 'desk' },
      radar: { x: 13.2, y: 0.12, z: -14.2, rotY: Math.PI, loc: 'other' },
      prism: { x: -15.4, y: 0.12, z: 9.4, rotY: Math.PI, loc: 'desk' },
      lens: { x: -11.2, y: 0.12, z: 9.4, rotY: Math.PI, loc: 'desk' },
      sentinel: { x: -3.8, y: 0.12, z: 8.5, rotY: 0, loc: 'coffee' },
      nexus: { x: -1.9, y: 0.12, z: 14.5, rotY: Math.PI, loc: 'sofa' },
      atlas: { x: 10.8, y: 0.12, z: 8.4, rotY: Math.PI, loc: 'desk' },
    };'''

if old_idle in content:
    content = content.replace(old_idle, new_idle)
    print("Replaced IDLE_LOCATIONS!")
else:
    print("Could not find old_idle")

# 4. Update camera default distance and initial target
old_cam_defaults = '''  public cameraAngleX = THREE.MathUtils.degToRad(46); // ~46 deg elevated perspective
  public cameraAngleY = 0.0;   // Frontal cutaway orientation (matching reference img_7d378372e808.jpg)
  public cameraDistance = 86;
  public cameraTarget = new THREE.Vector3(0, 0, 0);'''

new_cam_defaults = '''  public cameraAngleX = Math.PI / 4.7; // ~38.3 deg architectural cutaway pitch
  public cameraAngleY = 0.0;           // Frontal orientation
  public cameraDistance = 56;          // Fills the screen with stunning architectural presence!
  public cameraTarget = new THREE.Vector3(0, 0.8, 0);'''

if old_cam_defaults in content:
    content = content.replace(old_cam_defaults, new_cam_defaults)
    print("Replaced camera defaults!")
else:
    print("Could not find old_cam_defaults")

# 5. Update focusRoom camera distance
old_focus_room = '''  public focusRoom(roomKey: string) {
    if (roomKey === 'all') {
      if (this.floorPlan) {
        this.camera.position.copy(this.floorPlan.camera.position);
        this.camera.rotation.copy(this.floorPlan.camera.rotation);
        this.camera.fov = this.floorPlan.camera.fov;
        this.camera.updateProjectionMatrix();
        this.cameraTarget.set(0, 0.8, 0);
        this.cameraDistance = 82;
        this.cameraAngleX = Math.PI / 4.7;
        this.cameraAngleY = 0.0;
        return;
      }
      this.cameraTarget.set(0, 0.8, 0);
      this.cameraDistance = 82;
      this.cameraAngleX = Math.PI / 4.7;
      this.cameraAngleY = 0.0;
    } else {
      const r = ROOMS_3D[roomKey];
      if (r) {
        this.cameraTarget.set(r.centerX, r.centerY + 1, r.centerZ);
        this.cameraDistance = 32;
      }
    }
    this.updateCameraPosition();
  }'''

new_focus_room = '''  public focusRoom(roomKey: string) {
    if (roomKey === 'all') {
      this.cameraTarget.set(0, 0.8, 0);
      this.cameraDistance = 56;
      this.cameraAngleX = Math.PI / 4.7;
      this.cameraAngleY = 0.0;
    } else {
      const r = ROOMS_3D[roomKey];
      if (r) {
        this.cameraTarget.set(r.centerX, r.centerY + 0.8, r.centerZ);
        this.cameraDistance = 24;
        this.cameraAngleX = Math.PI / 4.8;
      }
    }
    this.updateCameraPosition();
  }'''

if old_focus_room in content:
    content = content.replace(old_focus_room, new_focus_room)
    print("Replaced focusRoom!")
else:
    print("Could not find old_focus_room")

# 6. Update setupLighting to add contact shadow plane and warm lighting
old_lighting = '''  private setupLighting() {
    // 1. Primary Warm Scandinavian Sun through Clerestory Windows (Directional Light at ~4500K)
    const sun = new THREE.DirectionalLight('#FFF3E0', 2.6);
    sun.position.set(-25, 45, 18);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 160;
    const d = 42;
    sun.shadow.camera.left = -d;
    sun.shadow.camera.right = d;
    sun.shadow.camera.top = d;
    sun.shadow.camera.bottom = -d;
    sun.shadow.radius = 3;
    sun.shadow.bias = -0.0001;
    sun.shadow.normalBias = 0.02;
    this.scene.add(sun);

    // 2. Studio Balanced Ambient & Sky Fill
    this.scene.add(new THREE.AmbientLight('#242932', 0.85));
    const hemiLight = new THREE.HemisphereLight('#FFF6EB', '#16181D', 1.25);
    hemiLight.position.set(0, 50, 0);
    this.scene.add(hemiLight);

    // 3. Warm Indoor Bounce Light
    const fillLight = new THREE.DirectionalLight('#F7EEE4', 0.85);
    fillLight.position.set(25, 30, -20);
    this.scene.add(fillLight);
  }'''

new_lighting = '''  private setupLighting() {
    // 1. Primary Warm Architectural Key Sun (Directional Light at ~4200K)
    const sun = new THREE.DirectionalLight('#FFF5E6', 3.4);
    sun.position.set(-24, 48, 22);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 140;
    const d = 32;
    sun.shadow.camera.left = -d;
    sun.shadow.camera.right = d;
    sun.shadow.camera.top = d;
    sun.shadow.camera.bottom = -d;
    sun.shadow.radius = 2.5;
    sun.shadow.bias = -0.0001;
    sun.shadow.normalBias = 0.025;
    this.scene.add(sun);

    // 2. Soft Cool Clerestory Skylight Fill from the North
    const fillLight = new THREE.DirectionalLight('#D4E5F8', 1.4);
    fillLight.position.set(12, 25, -28);
    this.scene.add(fillLight);

    // 3. Studio Ambient & Warm Floor Bounce
    const hemiLight = new THREE.HemisphereLight('#FFF2E0', '#1C2028', 1.35);
    hemiLight.position.set(0, 40, 0);
    this.scene.add(hemiLight);

    this.scene.add(new THREE.AmbientLight('#2E2620', 0.65));

    // 4. Large Soft Contact Shadow Stage Plane (grounds the floating diorama)
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = shadowCanvas.height = 512;
    const sCtx = shadowCanvas.getContext('2d')!;
    const grad = sCtx.createRadialGradient(256, 256, 80, 256, 256, 256);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.88)');
    grad.addColorStop(0.42, 'rgba(0, 0, 0, 0.55)');
    grad.addColorStop(0.75, 'rgba(0, 0, 0, 0.18)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 512, 512);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(95, 80),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        opacity: 0.92,
        depthWrite: false,
      })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -0.84, 0);
    this.scene.add(ground);
  }'''

if old_lighting in content:
    content = content.replace(old_lighting, new_lighting)
    print("Replaced setupLighting & added ground contact shadow stage!")
else:
    print("Could not find old_lighting")

# 7. Update buildOfficeLayout to pass addLights: false
old_build_layout = '''  private buildOfficeLayout() {
    this.floorPlan = new OfficeFloorPlan({
      scene: this.scene,
      aspect: this.camera.aspect,
      shadows: true,
      background: "#0e1116",
    });

    // Sync camera to Astra's frontal architectural perspective
    this.camera.position.copy(this.floorPlan.camera.position);
    this.camera.rotation.copy(this.floorPlan.camera.rotation);
    this.camera.fov = this.floorPlan.camera.fov;
    this.camera.near = this.floorPlan.camera.near;
    this.camera.far = this.floorPlan.camera.far;
    this.camera.updateProjectionMatrix();
  }'''

new_build_layout = '''  private buildOfficeLayout() {
    this.floorPlan = new OfficeFloorPlan({
      scene: this.scene,
      aspect: this.camera.aspect,
      shadows: true,
      background: "#0e1116",
      addLights: false, // RobloxOffice3D manages the unified master architectural lighting!
    });
  }'''

if old_build_layout in content:
    content = content.replace(old_build_layout, new_build_layout)
    print("Replaced buildOfficeLayout!")
else:
    print("Could not find old_build_layout")

with open('/root/projects/hermes-virtual-office/src/engine/RobloxOffice3D.ts', 'w') as f:
    f.write(content)

print("RobloxOffice3D.ts overhaul applied successfully!")
