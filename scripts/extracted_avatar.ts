export class RobloxAvatar3D {
  public id: string;
  public group: THREE.Group;
  public head: THREE.Mesh;
  public torso: THREE.Mesh;
  public leftArm: THREE.Mesh;
  public rightArm: THREE.Mesh;
  public leftLeg: THREE.Mesh;
  public rightLeg: THREE.Mesh;
  public leftShin: THREE.Mesh;
  public rightShin: THREE.Mesh;
  public accessory?: THREE.Object3D;
  public billboard: THREE.Sprite;

  public currentX = 0;
  public currentY = 0;
  public currentZ = 0;
  public targetX = 0;
  public targetY = 0;
  public targetZ = 0;
  public targetRotY = 0;
  public isSitting = false;
  public walkTime = 0;
  public state: AgentState;
  public waypoints: Point2D[] = [];

  public actionTimer = Math.random() * 10;
  public currentThought = '';
  public thoughtTimer = Math.random() * 5;
  public jumpVelocity = 0;
  public isGreeting = false;

  private readonly billboardY = 5.8;
  private readonly movementSpeed = 7.2;
  private readonly gravity = 18;

  private elapsed = 0;
  private jumpOffset = 0;
  private greetingRemaining = 0;
  private disposed = false;
  private billboardKey = '';

  private currentLocation: 'desk' | 'coffee' | 'sofa' | 'meeting' | 'other' = 'desk';
  private destinationLocation: 'desk' | 'coffee' | 'sofa' | 'meeting' | 'other' = 'desk';
  private cup: THREE.Group;

  constructor(state: AgentState) {
    this.id = state.id;
    this.state = state;
    this.group = new THREE.Group();
    this.group.name = `agent_${state.id}`;
    this.group.scale.setScalar(0.68);

    const skinMat = new THREE.MeshStandardMaterial({
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
    });

    this.torso = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 1.8, 0.9),
      torsoMat,
    );
    this.torso.position.y = 2.6;
    this.group.add(this.torso);

    this.head = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      skinMat,
    );
    this.head.position.y = 1.45;
    this.torso.add(this.head);

    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(0.85, 0.85),
      new THREE.MeshBasicMaterial({
        map: this.createRobloxFaceTexture(),
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    face.position.z = 0.506;
    this.head.add(face);

    const hair = new THREE.Mesh(
      new THREE.BoxGeometry(1.08, 0.35, 1.08),
      new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.8,
      }),
    );
    hair.position.y = 0.45;
    this.head.add(hair);

    const armGeo = new THREE.BoxGeometry(0.7, 1.6, 0.7);
    armGeo.translate(0, -0.6, 0);

    this.leftArm = new THREE.Mesh(armGeo, torsoMat);
    this.leftArm.position.set(-1.18, 0.8, 0);
    this.torso.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeo, torsoMat);
    this.rightArm.position.set(1.18, 0.8, 0);
    this.torso.add(this.rightArm);

    const thighGeo = new THREE.BoxGeometry(0.72, 0.85, 0.75);
    thighGeo.translate(0, -0.425, 0);

    const shinGeo = new THREE.BoxGeometry(0.68, 0.85, 0.72);
    shinGeo.translate(0, -0.425, 0);

    this.leftLeg = new THREE.Mesh(thighGeo, pantsMat);
    this.leftLeg.position.set(-0.42, 1.7, 0);
    this.group.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(thighGeo, pantsMat);
    this.rightLeg.position.set(0.42, 1.7, 0);
    this.group.add(this.rightLeg);

    this.leftShin = new THREE.Mesh(shinGeo, pantsMat);
    this.leftShin.position.y = -0.85;
    this.leftLeg.add(this.leftShin);

    this.rightShin = new THREE.Mesh(shinGeo, pantsMat);
    this.rightShin.position.y = -0.85;
    this.rightLeg.add(this.rightShin);

    this.cup = this.createCoffeeCup();
    this.cup.position.set(0, -1.18, 0.24);
    this.cup.visible = false;
    this.rightArm.add(this.cup);

    this.addRoleAccessory(state.id);

    this.group.traverse((object) => {
      if (object instanceof THREE.Mesh && object !== face) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });

    // Flexible idle postures and locations (when not working, disperse across cafe, sofa, war room, etc.)
    const IDLE_LOCATIONS: Record<string, { x: number; y: number; z: number; rotY: number; loc: 'desk' | 'coffee' | 'sofa' | 'meeting' | 'other' }> = {
      sentinel: { x: -3.8, y: 0.12, z: 9.8, rotY: 0, loc: 'coffee' },              // standing at coffee counter sipping espresso
      nexus: { x: -4.0, y: 0.12, z: 14.5, rotY: 0, loc: 'sofa' },                   // lounging casually on sofa
      aurora: { x: 0.0, y: 0.12, z: -5.12, rotY: 0, loc: 'meeting' },              // standing at War Room reviewing hologram
      frame: { x: 0.0, y: 0.12, z: -1.5, rotY: Math.PI, loc: 'other' },             // strolling in central corridor
      radar: { x: 23.5, y: 0.12, z: -15.5, rotY: 0, loc: 'other' },                 // standing by Research data wall
      prism: { x: -21.0, y: 0.12, z: 6.5, rotY: 0, loc: 'other' },                  // standing by QA telemetry screen
      atlas: { x: 21.0, y: 0.12, z: 8.0, rotY: -Math.PI / 2, loc: 'other' },        // standing by datacenter server racks
      lens: { x: -17.55, y: 0.12, z: 9.8, rotY: 0, loc: 'desk' },                  // relaxed lean-back at desk
      quant: { x: 17.0, y: 0.12, z: -13.0, rotY: 0, loc: 'desk' },                 // relaxed lean-back at desk
      forge: { x: -5.3, y: 0.12, z: -17.1, rotY: 0, loc: 'desk' },                 // relaxed lean-back at desk
      orion: { x: -21, y: 0.12, z: -16.15, rotY: Math.PI, loc: 'desk' },            // deep executive lean-back
    };

    const isIdle = state.status === 'idle';
    const initLocation = (isIdle && IDLE_LOCATIONS[state.id]) ? IDLE_LOCATIONS[state.id] : null;
    const spot = initLocation || AGENT_3D_SPOTS[state.id] || { x: 0, y: 0, z: 0, rotY: 0 };

    this.currentX = this.targetX = spot.x;
    this.currentY = this.targetY = spot.y;
    this.currentZ = this.targetZ = spot.z;
    this.targetRotY = spot.rotY;
    this.currentLocation = initLocation ? initLocation.loc : 'desk';
    this.group.position.set(spot.x, spot.y, spot.z);
    this.group.rotation.y = spot.rotY;

    // Stagger idle movement timers so agents don't move in robotic unison
    this.actionTimer = Math.random() * 22;

    this.billboard = this.createBillboard(state);
    this.billboard.position.y = this.billboardY;
    this.group.add(this.billboard);

    this.applyPosture(false, 0);
  }

  private safeColor(color: string): string {
    return /^#[0-9a-f]{6}$/i.test(color || '') ? color : '#38BDF8';
  }

  private isWorking(): boolean {
    return this.state.status === 'working' || this.state.status === 'tool_call';
  }

  private addRoleAccessory(agentId: string): void {
    let accessory: THREE.Mesh | undefined;

    if (agentId === 'orion') {
      accessory = new THREE.Mesh(
        new THREE.CylinderGeometry(0.65, 0.55, 0.35, 6),
        new THREE.MeshStandardMaterial({
          color: 0xfbbf24,
          metalness: 0.8,
          roughness: 0.2,
        }),
      );
      accessory.position.y = 0.75;
      this.head.add(accessory);
    } else if (agentId === 'frame') {
      accessory = new THREE.Mesh(
        new THREE.TorusGeometry(0.6, 0.08, 8, 20, Math.PI),
        new THREE.MeshStandardMaterial({
          color: 0x06b6d4,
          metalness: 0.5,
          roughness: 0.35,
        }),
      );
      accessory.position.y = 0.12;
      this.head.add(accessory);
    } else if (agentId === 'atlas') {
      accessory = new THREE.Mesh(
        new THREE.SphereGeometry(
          0.65, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2,
        ),
        new THREE.MeshStandardMaterial({
          color: 0xeab308,
          roughness: 0.35,
        }),
      );
      accessory.position.y = 0.5;
      this.head.add(accessory);
    } else if (agentId === 'sentinel') {
      accessory = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.2, 0.8),
        new THREE.MeshStandardMaterial({
          color: 0xef4444,
          metalness: 0.6,
          roughness: 0.35,
        }),
      );
      accessory.position.set(0.9, 0.85, 0);
      this.torso.add(accessory);
    }

    this.accessory = accessory;
  }

  private createCoffeeCup(): THREE.Group {
    const cup = new THREE.Group();
    const ceramic = new THREE.MeshStandardMaterial({
      color: 0xfffbeb,
      roughness: 0.3,
    });

    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.17, 0.14, 0.3, 16),
      ceramic,
    );
    cup.add(body);

    const coffee = new THREE.Mesh(
      new THREE.CircleGeometry(0.145, 16),
      new THREE.MeshStandardMaterial({
        color: 0x482817,
        roughness: 0.25,
      }),
    );
    coffee.rotation.x = -Math.PI / 2;
    coffee.position.y = 0.151;
    cup.add(coffee);

    const handle = new THREE.Mesh(
      new THREE.TorusGeometry(0.095, 0.035, 8, 16),
      ceramic,
    );
    handle.position.x = 0.19;
    cup.add(handle);

    return cup;
  }

  private createRobloxFaceTexture(): THREE.CanvasTexture {
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
  }

  private roleIcon(): string {
    const icons: Record<string, string> = {
      orion: '👑',
      frame: '🎨',
      atlas: '🛠️',
      sentinel: '🛡️',
    };
    return icons[this.id] || '🤖';
  }

  private resolveBillboard(state: AgentState): {
    badge: string;
    color: string;
    activity: string;
  } {
    const task = state.currentTask;

    if (
      state.status === 'error' ||
      task?.status === 'blocked' ||
      task?.lastFailure
    ) {
      return {
        badge: '⚠️ TERKENDALA',
        color: '#DC2626',
        activity: `⚠️ Terkendala: ${
          task?.lastFailure || task?.title || 'Eksekusi membutuhkan perhatian'
        }`,
      };
    }

    // Explicit tool execution takes precedence over a running parent task.
    if (state.status === 'tool_call') {
      const tool = state.activeTool;
      return {
        badge: '💻 EKSEKUSI TOOL',
        color: '#007E9E',
        activity: tool
          ? `💻 Menjalankan tool: ${tool.name}${
              tool.snippet ? ` ${tool.snippet}` : ''
            }`
          : '💻 Menjalankan tool: Menunggu detail eksekusi',
      };
    }

    if (state.status === 'meeting') {
      return {
        badge: '💬 RAPAT TIM',
        color: '#2563EB',
        activity: `💬 Koordinasi bersama: ${
          state.meetingWith?.join(', ') || 'tim'
        }`,
      };
    }

    if (state.status === 'working' || task?.status === 'running') {
      return {
        badge: '⚡ SEDANG KERJA',
        color: '#078342',
        activity: `⚡ Mengerjakan task: ${
          task?.title || state.lastActivity || 'Sesi kerja aktif'
        }`,
      };
    }

    if (this.isGreeting) {
      return {
        badge: '👋 MENYAPA',
        color: '#0284C7',
        activity: '👋 Halo Bos Adhi! Siap membantu dan menerima task!',
      };
    }

    if (this.waypoints.length > 0) {
      const destinations = {
        desk: 'meja kerja',
        coffee: 'barista cafe',
        sofa: 'sofa lounge',
        meeting: 'ruang rapat',
        other: 'lokasi tujuan',
      };
      return {
        badge: '☕ IDLE / SANTAI',
        color: '#B45309',
        activity: `🚶 Berjalan menuju ${destinations[this.destinationLocation]}`,
      };
    }

    const specificIdleTexts: Record<string, string> = {
      sentinel: '☕ Istirahat • Minum kopi di barista cafe',
      nexus: '🛋️ Santai & diskusi di sofa lounge',
      aurora: '💬 Meninjau hologram di War Room',
      frame: '🚶 Berkeliling santai di koridor utama',
      radar: '📡 Memantau sinyal di layar Research',
      prism: '🔬 Meninjau status telemetri QA',
      atlas: '🌐 Inspeksi kabel server datacenter',
    };

    const activities = {
      desk: '☕ Standby • Memantau sistem di meja kerja',
      coffee: '☕ Istirahat • Minum kopi di barista cafe',
      sofa: '🛋️ Santai & diskusi di sofa lounge',
      meeting: '💬 Meninjau hologram di War Room',
      other: specificIdleTexts[this.id] || '🚶 Berkeliling santai di kantor',
    };

    return {
      badge: '☕ IDLE / SANTAI',
      color: '#B45309',
      activity: activities[this.currentLocation],
    };
  }

  private fitText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
  ): string {
    const normalized = text.replace(/\s+/g, ' ').trim();
    if (ctx.measureText(normalized).width <= maxWidth) return normalized;

    const characters = Array.from(normalized);
    let low = 0;
    let high = characters.length;

    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      const candidate = `${characters.slice(0, middle).join('')}…`;
      if (ctx.measureText(candidate).width <= maxWidth) {
        low = middle;
      } else {
        high = middle - 1;
      }
    }

    return `${characters.slice(0, low).join('').trimEnd()}…`;
  }

  private roundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
  ): void {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  private drawSymmetricalCloud(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + width * 0.1, y + height * 0.8);
    ctx.bezierCurveTo(
      x - width * 0.02, y + height * 0.78,
      x - width * 0.02, y + height * 0.28,
      x + width * 0.1, y + height * 0.25,
    );
    ctx.bezierCurveTo(
      x + width * 0.08, y + height * 0.02,
      x + width * 0.25, y - height * 0.02,
      x + width * 0.3, y + height * 0.12,
    );
    ctx.bezierCurveTo(
      x + width * 0.35, y - height * 0.04,
      x + width * 0.46, y - height * 0.04,
      x + width * 0.5, y + height * 0.08,
    );
    ctx.bezierCurveTo(
      x + width * 0.54, y - height * 0.04,
      x + width * 0.65, y - height * 0.04,
      x + width * 0.7, y + height * 0.12,
    );
    ctx.bezierCurveTo(
      x + width * 0.75, y - height * 0.02,
      x + width * 0.92, y + height * 0.02,
      x + width * 0.9, y + height * 0.25,
    );
    ctx.bezierCurveTo(
      x + width * 1.02, y + height * 0.28,
      x + width * 1.02, y + height * 0.78,
      x + width * 0.9, y + height * 0.8,
    );
    ctx.bezierCurveTo(
      x + width * 0.88, y + height * 1.02,
      x + width * 0.74, y + height * 1.03,
      x + width * 0.68, y + height * 0.92,
    );
    ctx.bezierCurveTo(
      x + width * 0.61, y + height * 1.06,
      x + width * 0.54, y + height * 1.06,
      x + width * 0.5, y + height * 0.97,
    );
    ctx.bezierCurveTo(
      x + width * 0.46, y + height * 1.06,
      x + width * 0.39, y + height * 1.06,
      x + width * 0.32, y + height * 0.92,
    );
    ctx.bezierCurveTo(
      x + width * 0.26, y + height * 1.03,
      x + width * 0.12, y + height * 1.02,
      x + width * 0.1, y + height * 0.8,
    );
    ctx.closePath();
  }

  private createBillboardTexture(state: AgentState): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1100;
    canvas.height = 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is required for avatar billboards.');

    const content = this.resolveBillboard(state);
    this.currentThought = content.activity;

    // Outer cloud bounds
    const circles = [
      { x: 230, y: 125, r: 85 },
      { x: 380, y: 100, r: 98 },
      { x: 550, y: 90, r: 108 },
      { x: 720, y: 100, r: 98 },
      { x: 870, y: 125, r: 85 },
      { x: 940, y: 215, r: 90 },
      { x: 870, y: 305, r: 85 },
      { x: 710, y: 325, r: 98 },
      { x: 550, y: 335, r: 105 },
      { x: 390, y: 325, r: 98 },
      { x: 230, y: 305, r: 85 },
      { x: 160, y: 215, r: 90 },
    ];

    // 1. Soft Ambient Drop Shadow
    ctx.save();
    ctx.shadowColor = 'rgba(15, 23, 42, 0.28)';
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 14;
    ctx.beginPath();
    ctx.roundRect(210, 115, 680, 190, 40);
    circles.forEach((c) => {
      ctx.moveTo(c.x + c.r, c.y);
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    });
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.restore();

    // 2. Crisp Vibrant Border
    ctx.save();
    ctx.strokeStyle = content.color;
    ctx.lineWidth = 7.0;
    circles.forEach((c) => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.stroke();
    });
    // Refill interior to eliminate internal circle lines
    ctx.beginPath();
    ctx.roundRect(210, 115, 680, 190, 40);
    circles.forEach((c) => {
      ctx.moveTo(c.x + c.r - 4.5, c.y);
      ctx.arc(c.x, c.y, c.r - 3.5, 0, Math.PI * 2);
    });
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.restore();

    // 3. Descending Trail Bubbles pointing straight down to avatar head
    const tailX = 550;
    const tailY = 425;
    [
      { x: tailX, y: tailY + 10, r: 24 },
      { x: tailX - 6, y: tailY + 48, r: 16 },
      { x: tailX - 12, y: tailY + 76, r: 10 },
    ].forEach((b) => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.strokeStyle = content.color;
      ctx.lineWidth = 4.5;
      ctx.stroke();
    });

    const font = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const left = 160;
    const right = 940;

    // 4. Status Badge on Right (Huge 34px bold pill badge)
    ctx.font = `900 34px ${font}`;
    const badgeText = content.badge;
    const badgeWidth = Math.ceil(ctx.measureText(badgeText).width) + 48;
    const badgeX = right - badgeWidth;
    const badgeY = 135;
    const badgeH = 62;

    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeWidth, badgeH, 31);
    ctx.fillStyle = content.color;
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(badgeText, badgeX + badgeWidth / 2, badgeY + badgeH / 2 + 1);

    // 5. Agent Name on Left (Huge 50px bold with guaranteed clearance)
    ctx.font = `900 50px ${font}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#0F172A';
    const maxNameWidth = badgeX - left - 24;
    ctx.fillText(
      this.fitText(ctx, `${this.roleIcon()} ${state.name}`, maxNameWidth),
      left,
      badgeY + badgeH / 2,
    );

    // 6. Crisp Horizontal Divider
    ctx.beginPath();
    ctx.moveTo(left, 224);
    ctx.lineTo(right, 224);
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // 7. Large, Bold Activity Explanation (Huge 40px bold)
    ctx.font = `bold 31px ${font}`;
    ctx.fillStyle = '#1E293B';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      this.fitText(ctx, content.activity, right - left),
      left,
      275,
    );

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    return texture;
  }

  public createBillboard(state: AgentState): THREE.Sprite {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.createBillboardTexture(state),
        transparent: true,
        depthTest: true,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    sprite.name = `billboard_${this.id}`;
    sprite.scale.set(9.2, 4.2, 1);
    return sprite;
  }

  public refreshBillboard(): void {
    if (this.disposed) return;

    const content = this.resolveBillboard(this.state);
    const key = JSON.stringify([
      this.state.name,
      content.badge,
      content.color,
      content.activity,
    ]);

    if (key === this.billboardKey) return;
    this.billboardKey = key;

    const material = this.billboard.material;
    const oldTexture = material.map;
    material.map = this.createBillboardTexture(this.state);
    material.needsUpdate = true;
    oldTexture?.dispose();
    this.billboard.position.y = this.billboardY;
  }

  public onUserClick(): void {
    if (this.disposed) return;

    if (this.jumpOffset === 0) this.jumpVelocity = 3.4;
    this.isGreeting = true;
    this.greetingRemaining = 4;
    this.refreshBillboard();
  }

  public updateState(newState: AgentState): void {
    if (this.disposed) return;

    const wasWorking = this.isWorking();
    this.state = newState;

    const material = this.torso.material as THREE.MeshStandardMaterial;
    material.color.set(this.safeColor(newState.color));

    if (this.isWorking() && !wasWorking) {
      this.actionTimer = 0;
      this.returnToDesk();
    }

    this.refreshBillboard();
  }

  private inferLocation(
    x: number,
    y: number,
    z: number,
  ): 'desk' | 'coffee' | 'sofa' | 'meeting' | 'other' {
    let closest: 'desk' | 'coffee' | 'sofa' | 'meeting' | 'other' = 'other';
    let closestDistance = 0.8;

    const home = AGENT_3D_SPOTS[this.id];
    if (home) {
      const distance = Math.hypot(x - home.x, y - home.y, z - home.z);
      if (distance < closestDistance) {
        closest = 'desk';
        closestDistance = distance;
      }
    }

    for (const kind of ['coffee', 'sofa', 'meeting'] as const) {
      const spots =
        FLEET_ACTIVITY_SPOTS[kind as keyof typeof FLEET_ACTIVITY_SPOTS] || [];

      for (const spot of spots) {
        const distance = Math.hypot(x - spot.x, y - spot.y, z - spot.z);
        if (distance < closestDistance) {
          closest = kind;
          closestDistance = distance;
        }
      }
    }

    return closest;
  }

  public navigateTo(
    destX: number,
    destY: number,
    destZ: number,
    targetRotY: number,
  ): void {
    if (
      this.disposed ||
      ![destX, destY, destZ, targetRotY].every(Number.isFinite)
    ) {
      return;
    }

    const horizontalDistance = Math.hypot(
      destX - this.currentX,
      destZ - this.currentZ,
    );

    const path = findPathThroughDoors(
      { x: this.currentX, z: this.currentZ },
      { x: destX, z: destZ },
    );

    // An empty route to a distant destination is not permission to teleport.
    if (horizontalDistance > 0.001 && (!path || path.length === 0)) {
      return;
    }

    this.targetX = destX;
    this.targetY = destY;
    this.targetZ = destZ;
    this.targetRotY = targetRotY;
    this.destinationLocation = this.inferLocation(destX, destY, destZ);
    this.waypoints = (path || []).map((point) => ({ ...point }));

    const last = this.waypoints[this.waypoints.length - 1];
    if (
      !last ||
      Math.hypot(last.x - destX, last.z - destZ) > 0.001
    ) {
      this.waypoints.push({ x: destX, z: destZ });
    }

    this.isSitting = false;
    this.refreshBillboard();
  }

  private returnToDesk(): void {
    const home = AGENT_3D_SPOTS[this.id];
    if (!home) return;

    releaseAgentSpot(this.id);
    this.navigateTo(home.x, home.y, home.z, home.rotY);
  }

  private chooseIdleDestination(): void {
    const choices = ['home', 'coffee', 'meeting', 'sofa'] as const;
    const choice = choices[Math.floor(Math.random() * choices.length)];

    if (choice === 'home') {
      this.returnToDesk();
      return;
    }

    const spots =
      FLEET_ACTIVITY_SPOTS[choice as keyof typeof FLEET_ACTIVITY_SPOTS] || [];
    const available = spots.filter(
      (spot) =>
        !OCCUPIED_SPOTS.has(spot.id) ||
        OCCUPIED_SPOTS.get(spot.id) === this.id,
    );

    if (available.length === 0) {
      this.returnToDesk();
      return;
    }

    const chosen = available[Math.floor(Math.random() * available.length)];
    this.navigateTo(chosen.x, chosen.y, chosen.z, chosen.rotY);

    if (
      this.targetX === chosen.x &&
      this.targetY === chosen.y &&
      this.targetZ === chosen.z
    ) {
      releaseAgentSpot(this.id);
      OCCUPIED_SPOTS.set(chosen.id, this.id);
    }
  }

  private moveAlongPath(dt: number): boolean {
    let distanceBudget = this.movementSpeed * dt;
    let travelled = 0;

    // Consume the complete frame budget without cutting doorway corners.
    while (this.waypoints.length > 0) {
      const next = this.waypoints[0];
      const dx = next.x - this.currentX;
      const dz = next.z - this.currentZ;
      const distance = Math.hypot(dx, dz);

      if (distance <= 0.000001) {
        this.currentX = next.x;
        this.currentZ = next.z;
        this.waypoints.shift();
        continue;
      }

      if (distanceBudget <= 0) break;

      const step = Math.min(distance, distanceBudget);
      this.currentX += (dx / distance) * step;
      this.currentZ += (dz / distance) * step;
      this.group.rotation.y = Math.atan2(dx, dz);
      travelled += step;
      distanceBudget -= step;

      if (step >= distance) {
        this.currentX = next.x;
        this.currentZ = next.z;
        this.waypoints.shift();
      }
    }

    this.currentY = THREE.MathUtils.damp(
      this.currentY,
      this.targetY,
      10,
      dt,
    );
    this.walkTime += travelled * 2.1;

    if (this.waypoints.length === 0) {
      this.currentX = this.targetX;
      this.currentZ = this.targetZ;
      this.currentLocation = this.destinationLocation;
    }

    return this.waypoints.length > 0;
  }

  private applyPosture(walking: boolean, dt: number): void {
    const t = this.elapsed;
    const working = this.isWorking();
    const standing =
      walking ||
      this.currentLocation === 'coffee' ||
      this.currentLocation === 'meeting' ||
      this.currentLocation === 'other';

    let torsoX = 0;
    let torsoY = standing ? 2.6 : 1.78;
    let torsoZ = 0;
    let torsoRX = 0;
    let torsoRZ = 0;

    let hipY = standing ? 1.7 : 0.88;
    let hipZ = standing ? 0 : 0.12;
    let leftHipRX = standing ? 0 : -Math.PI / 2;
    let rightHipRX = leftHipRX;
    let leftKneeRX = standing ? 0 : Math.PI / 2;
    let rightKneeRX = leftKneeRX;

    let leftArmRX = -0.25;
    let rightArmRX = -0.25;
    let leftArmRZ = -0.06;
    let rightArmRZ = 0.06;
    let headRX = 0.03;
    let headRY = Math.sin(t * 0.6) * 0.06;

    this.isSitting = !standing;
    this.cup.visible =
      !walking &&
      !working &&
      this.state.status === 'idle' &&
      this.currentLocation === 'coffee';

    if (walking) {
      const swing = Math.sin(this.walkTime) * 0.68;
      leftHipRX = swing;
      rightHipRX = -swing;

      // Positive knee rotation folds the lower leg backward, not forward.
      leftKneeRX = Math.max(0, Math.cos(this.walkTime)) * 0.85;
      rightKneeRX = Math.max(0, -Math.cos(this.walkTime)) * 0.85;
      leftArmRX = -swing * 0.8;
      rightArmRX = swing * 0.8;
      torsoY += Math.abs(Math.sin(this.walkTime)) * 0.055;
      torsoRX = 0.035;
      headRY = 0;
    } else if (working && this.currentLocation === 'desk') {
      torsoRX = 0.045;
      leftArmRX = -1.18 + Math.sin(t * 16) * 0.09;
      rightArmRX = -1.18 + Math.sin(t * 16 + 1.7) * 0.09;
      leftArmRZ = 0.12;
      rightArmRZ = -0.12;
      headRX = 0.075 + Math.sin(t * 1.6) * 0.012;
      headRY = Math.sin(t * 0.9) * 0.07;
    } else if (this.currentLocation === 'sofa') {
      // In Three.js, negative X rotation tilts a +Y torso backward from +Z.
      torsoRX = -0.18;
      torsoY = 1.64;
      torsoZ = -0.16;
      hipY = 0.78;
      hipZ = 0.18;
      leftHipRX = -1.25;
      rightHipRX = -1.2;
      leftKneeRX = 0.75;
      rightKneeRX = 0.7;
      leftArmRX = -0.16;
      rightArmRX = -0.2;
      leftArmRZ = -0.22;
      rightArmRZ = 0.22;
      headRX = 0.11;
    } else if (this.currentLocation === 'coffee') {
      torsoX = -0.09;
      torsoRZ = 0.045;
      torsoY -= 0.012;
      rightHipRX = -0.12;
      rightKneeRX = 0.22;
      leftArmRX = -0.08;
      leftArmRZ = -0.1;

      const sipPhase = (Math.sin(t * 0.85) + 1) / 2;
      const sip = THREE.MathUtils.smoothstep(sipPhase, 0.72, 0.98);
      rightArmRX = THREE.MathUtils.lerp(-0.48, -2.42, sip);
      rightArmRZ = THREE.MathUtils.lerp(0.08, -0.55, sip);
      headRX = -sip * 0.07;

      // Counter-rotate the rigid arm attachment so the cup stays upright.
      this.cup.rotation.set(-rightArmRX - sip * 0.18, 0, -rightArmRZ);
    } else if (!standing) {
      // Idle at desk: Relaxed lean-back posture with arms resting casually on chair armrests!
      torsoRX = -0.22;
      torsoY = 1.72;
      torsoZ = -0.12;
      leftArmRX = -0.42;
      rightArmRX = -0.42;
      leftArmRZ = -0.28;
      rightArmRZ = 0.28;
      headRX = 0.04;
      headRY = Math.sin(t * 0.7) * 0.16; // casual head looking around
      leftArmRX = -0.55;
      rightArmRX = -0.55;
      leftArmRZ = -0.15;
      rightArmRZ = 0.15;
      headRX = 0.06;
    }

    if (this.isGreeting) {
      rightArmRX = -2.45;
      rightArmRZ = 0.2 + Math.sin(t * 12) * 0.3;
      this.cup.visible = false;
    }

    const alpha = dt > 0 ? 1 - Math.exp(-14 * dt) : 1;
    const blend = (value: number, target: number): number =>
      THREE.MathUtils.lerp(value, target, alpha);

    const pose = (
      mesh: THREE.Mesh,
      x: number,
      y: number,
      z: number,
      rx: number,
      ry = 0,
      rz = 0,
    ): void => {
      mesh.position.set(
        blend(mesh.position.x, x),
        blend(mesh.position.y, y),
        blend(mesh.position.z, z),
      );
      mesh.rotation.set(
        blend(mesh.rotation.x, rx),
        blend(mesh.rotation.y, ry),
        blend(mesh.rotation.z, rz),
      );
    };

    pose(this.torso, torsoX, torsoY, torsoZ, torsoRX, 0, torsoRZ);
    pose(this.head, 0, 1.45, 0, headRX, headRY);
    pose(this.leftArm, -1.18, 0.8, 0, leftArmRX, 0, leftArmRZ);
    pose(this.rightArm, 1.18, 0.8, 0, rightArmRX, 0, rightArmRZ);
    pose(this.leftLeg, -0.42, hipY, hipZ, leftHipRX);
    pose(this.rightLeg, 0.42, hipY, hipZ, rightHipRX);
    pose(this.leftShin, 0, -0.85, 0, leftKneeRX);
    pose(this.rightShin, 0, -0.85, 0, rightKneeRX);
  }

  public tick(delta: number, simSpeed: number): void {
    if (
      this.disposed ||
      !Number.isFinite(delta) ||
      !Number.isFinite(simSpeed) ||
      delta <= 0
    ) {
      return;
    }

    const realDt = Math.min(delta, 0.1);
    const dt = Math.min(realDt * Math.max(0, simSpeed), 0.1);

    if (this.isGreeting) {
      this.greetingRemaining -= realDt;
      if (this.greetingRemaining <= 0) {
        this.isGreeting = false;
        this.refreshBillboard();
      }
    }

    if (dt <= 0) return;

    this.elapsed += dt;

    if (this.state.status === 'idle' && this.waypoints.length === 0) {
      this.actionTimer += dt;
      if (this.actionTimer >= 14) {
        this.actionTimer = 0;
        this.chooseIdleDestination();
      }
    }

    const hadWaypoints = this.waypoints.length > 0;
    const walking = hadWaypoints
      ? this.moveAlongPath(dt)
      : false;

    if (!walking) {
      this.currentY = THREE.MathUtils.damp(
        this.currentY,
        this.targetY,
        10,
        dt,
      );

      const angleDifference = Math.atan2(
        Math.sin(this.targetRotY - this.group.rotation.y),
        Math.cos(this.targetRotY - this.group.rotation.y),
      );
      this.group.rotation.y += angleDifference * (1 - Math.exp(-12 * dt));
    }

    if (this.jumpOffset > 0 || this.jumpVelocity > 0) {
      this.jumpOffset +=
        this.jumpVelocity * dt - 0.5 * this.gravity * dt * dt;
      this.jumpVelocity -= this.gravity * dt;

      if (this.jumpOffset <= 0) {
        this.jumpOffset = 0;
        this.jumpVelocity = 0;
      }
    }

    this.group.position.set(
      this.currentX,
      this.currentY + this.jumpOffset,
      this.currentZ,
    );

    this.applyPosture(walking, dt);

    if (hadWaypoints && !walking) {
      this.refreshBillboard();
    }
  }

  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    releaseAgentSpot(this.id);

    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>();

    this.group.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        geometries.add(object.geometry);
        const entries = Array.isArray(object.material)
          ? object.material
          : [object.material];
        entries.forEach((material) => materials.add(material));
      } else if (object instanceof THREE.Sprite) {
        materials.add(object.material);
      }
    });

    for (const material of materials) {
      const map = (
        material as THREE.Material & { map?: THREE.Texture | null }
      ).map;
      if (map) textures.add(map);
    }

    textures.forEach((texture) => texture.dispose());
    materials.forEach((material) => material.dispose());
    geometries.forEach((geometry) => geometry.dispose());

    this.group.removeFromParent();
    this.group.clear();
    this.waypoints = [];
  }
}