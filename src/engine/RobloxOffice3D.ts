import * as THREE from 'three';
import { OfficeUpdatePayload, AgentState } from '../types/office';
import { OfficeFloorPlan } from './OfficeFloorPlan';
import { findPathThroughDoors, Point2D } from './OfficeNavMesh';
import { AvatarMovementController } from './AvatarMovementController';
import {
  CHAIR_REGISTRY,
  AGENT_HOME_CHAIRS,
  findAvailableChair,
} from './ChairInteractionSystem';
import { OfficeDebugVisualizer } from './OfficeDebugVisualizer';


// 3D Room Definitions matching user's exact 7-room floor plan
export interface Room3D {
  id: string;
  name: string;
  centerX: number;
  centerY: number;
  centerZ: number;
  width: number;
  depth: number;
  color: number;
}

export const ROOMS_3D: Record<string, Room3D> = {
  manager: { id: 'manager', name: 'EXECUTIVE SUITE', centerX: -13.3, centerY: 0.12, centerZ: -11.2, width: 12.8, depth: 10.4, color: 0x2563eb },
  dev: { id: 'dev', name: 'A2A COORDINATION / CONNECT', centerX: 0, centerY: 0.12, centerZ: -11.2, width: 12.8, depth: 10.4, color: 0xf97316 },
  research: { id: 'research', name: 'RESEARCH & INTEL', centerX: 13.3, centerY: 0.12, centerZ: -11.2, width: 12.8, depth: 10.4, color: 0x10b981 },
  meeting: { id: 'meeting', name: 'WAR ROOM / A', centerX: 0, centerY: 0.12, centerZ: 0.5, width: 15, depth: 7.6, color: 0x38bdf8 },
  qa_security: { id: 'qa_security', name: 'QA & HARDENING', centerX: -13.2, centerY: 0.12, centerZ: 11.1, width: 12.4, depth: 10, color: 0xa855f7 },
  lounge: { id: 'lounge', name: 'LOUNGE & OPERATIONS', centerX: 0, centerY: 0.12, centerZ: 11.1, width: 12.8, depth: 10, color: 0x06b6d4 },
  server_room: { id: 'server_room', name: 'SRE & INFRASTRUCTURE', centerX: 13.2, centerY: 0.12, centerZ: 11.1, width: 12.4, depth: 10, color: 0xeab308 },
};

// Exact Agent Home Spots in the 7 Rooms (Matching User's Reference Blueprint)
export const AGENT_3D_SPOTS: Record<string, { x: number; y: number; z: number; rotY: number }> = {
  orion: { x: -13.4, y: 0.12, z: -13.15, rotY: 0 },
  forge: { x: -2.75, y: 0.12, z: -11.65, rotY: Math.PI },
  frame: { x: 2.75, y: 0.12, z: -11.65, rotY: Math.PI },
  aurora: { x: -2.15, y: 0.12, z: -8.75, rotY: -Math.PI / 2 },
  quant: { x: 10.3, y: 0.12, z: -9.05, rotY: Math.PI },
  radar: { x: 15.4, y: 0.12, z: -9.05, rotY: Math.PI },
  prism: { x: -15.9, y: 0.12, z: 9.6, rotY: Math.PI },
  lens: { x: -10.65, y: 0.12, z: 9.6, rotY: Math.PI },
  sentinel: { x: -13.25, y: 0.12, z: 13.55, rotY: Math.PI },
  nexus: { x: 4.12, y: 0.12, z: 12.0, rotY: Math.PI },
  atlas: { x: 11.15, y: 0.12, z: 9.65, rotY: Math.PI },
};


// Dedicated fleet activity spots with strict occupancy reservation (Zero character merging!)
export const FLEET_ACTIVITY_SPOTS = {
  coffee: [
    { id: 'coffee_1', x: -5.5, y: 0.12, z: 9.8, rotY: 0 },
    { id: 'coffee_2', x: -3.8, y: 0.12, z: 9.8, rotY: 0 },
    { id: 'coffee_3', x: -2.2, y: 0.12, z: 9.8, rotY: 0 },
  ],
  sofa: [
    { id: 'sofa_1', x: -5.8, y: 0.12, z: 14.5, rotY: 0 },
    { id: 'sofa_2', x: -4.0, y: 0.12, z: 14.5, rotY: 0 },
    { id: 'sofa_3', x: -2.2, y: 0.12, z: 14.5, rotY: 0 },
    { id: 'sofa_4', x: -7.0, y: 0.12, z: 16.0, rotY: Math.PI / 2 },
  ],
  meeting: [
    { id: 'meet_1', x: -4.5, y: 0.12, z: -5.45, rotY: 0 },
    { id: 'meet_2', x: -1.5, y: 0.12, z: -5.45, rotY: 0 },
    { id: 'meet_3', x: 1.5, y: 0.12, z: -5.45, rotY: 0 },
    { id: 'meet_4', x: 4.5, y: 0.12, z: -5.45, rotY: 0 },
    { id: 'meet_5', x: -4.5, y: 0.12, z: 0.45, rotY: Math.PI },
    { id: 'meet_6', x: -1.5, y: 0.12, z: 0.45, rotY: Math.PI },
    { id: 'meet_7', x: 1.5, y: 0.12, z: 0.45, rotY: Math.PI },
    { id: 'meet_8', x: 4.5, y: 0.12, z: 0.45, rotY: Math.PI },
  ],
};

const OCCUPIED_SPOTS = new Map<string, string>(); // spotId -> agentId

export function releaseAgentSpot(agentId: string) {
  for (const [spotId, occId] of OCCUPIED_SPOTS.entries()) {
    if (occId === agentId) {
      OCCUPIED_SPOTS.delete(spotId);
    }
  }
}

// War Room / A2A Conference Table Seats (Hexagonal Table with 6 Integrated Seats)
export const MEETING_3D_SEATS = [
  { x: -3.8, y: 0.12, z: -5.12, rotY: 0 },
  { x: 0, y: 0.12, z: -5.12, rotY: 0 },
  { x: 3.8, y: 0.12, z: -5.12, rotY: 0 },
  { x: -3.8, y: 0.12, z: 0.12, rotY: Math.PI },
  { x: 0, y: 0.12, z: 0.12, rotY: Math.PI },
  { x: 3.8, y: 0.12, z: 0.12, rotY: Math.PI },
];

const ROLE_THOUGHTS: Record<string, string[]> = {
  orion: [
    '👑 Delegating tasks across fleet...',
    'Orchestrating sprint roadmap 🚀',
    'Hermes fleet at 100% capacity',
    'Reviewing deliverables with Lens',
    'Zero regressions certified!',
  ],
  forge: [
    '⚙️ Shipping API microservices...',
    'Optimizing SQL query indices ⚡',
    'Writing Drizzle migrations',
    'Need another espresso ☕',
    'All backend tests passing!',
  ],
  frame: [
    '🎨 3D Terraced Atelier 60 FPS verified!',
    'Refining UI microcopy ✨',
    'Subpixel alignment checked',
    'Zero layout shifts detected',
    'Building modern UX at scale...',
  ],
  aurora: [
    '✨ Apple HIG physical craft',
    'Refining Design DNA 💎',
    'Harmonizing color palette',
    'Sunken Agora acoustics tuned',
    'Typography tokens locked!',
  ],
  radar: [
    '📡 Scraping newest AI papers',
    'Indexing arXiv discovery 🔍',
    'Primary sources verified',
    'Monitoring tech trends',
    'Knowledge graph updated',
  ],
  quant: [
    '📊 Calculating Sharpe ratio...',
    'Backtesting alpha models 📈',
    'Volatility regime optimal',
    'Analyzing order books',
    'Risk scenario verified',
  ],
  prism: [
    '🔬 Running test suite...',
    'Reproducing edge case 🐞',
    'Coverage 100% certified',
    'Zero regression confirmed!',
    'Verifying API contracts',
  ],
  lens: [
    '👁️ Auditing DOM rendering',
    'Anti-slop check passed! ✅',
    'Checking Retina DPR 2 clarity',
    'Zero-occlusion layout verified',
    'Art direction approved!',
  ],
  sentinel: [
    '🛡️ Scanning attack surface...',
    'Zero CVEs detected! 🔒',
    'Auditing API auth boundaries',
    'Security firewall active',
    'Hardening systemd units',
  ],
  atlas: [
    '🌐 Server uptime 99.999% ⚡',
    'Docker containers healthy',
    'Load average: 0.08 optimal',
    'Checking Cloudflare Tunnel',
    'SRE telemetry all green',
  ],
  nexus: [
    '📋 Fresh espresso brewed ☕',
    'Updating fleet runbooks...',
    'Documentation synced! 📚',
    'Social commons energized',
    'Snack bar restocked 🍩',
  ],
};

// Procedural Texture Generators based on Codex Astra Blueprint
function createParquetTexture(color1 = '#B47846', color2 = '#8C532B'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = color1;
  ctx.fillRect(0, 0, 512, 512);

  const block = 64;
  for (let y = 0; y < 512; y += block) {
    for (let x = 0; x < 512; x += block) {
      const isHorizontal = ((x / block) + (y / block)) % 2 === 0;
      ctx.fillStyle = (x + y) % 128 === 0 ? color2 : color1;
      ctx.fillRect(x + 1, y + 1, block - 2, block - 2);

      // High-contrast plank lines & wood grain
      ctx.strokeStyle = 'rgba(40, 20, 10, 0.4)';
      ctx.lineWidth = 2.5;
      for (let p = 0; p < block; p += 16) {
        if (isHorizontal) {
          ctx.strokeRect(x, y + p, block, 16);
        } else {
          ctx.strokeRect(x + p, y, 16, block);
        }
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

function createAcousticCarpetTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1E293B';
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  for (let y = 0; y < 256; y += 4) {
    for (let x = 0; x < 256; x += 4) {
      if ((x + y) % 8 === 0) {
        ctx.fillRect(x, y, 2, 2);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

function createArchitectureWhiteboardTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Whiteboard background
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(0, 0, 1024, 512);

  // Title
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText('HERMES AGENT FLEET / DISTRIBUTED ARCHITECTURE', 40, 55);

  // System Nodes
  const drawNode = (x: number, y: number, w: number, h: number, title: string, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(title, x + 16, y + h / 2 + 6);
  };

  const drawArrow = (x1: number, y1: number, x2: number, y2: number, color = '#2563EB') => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 12 * Math.cos(angle - 0.4), y2 - 12 * Math.sin(angle - 0.4));
    ctx.lineTo(x2 - 12 * Math.cos(angle + 0.4), y2 - 12 * Math.sin(angle + 0.4));
    ctx.fill();
  };

  drawNode(60, 140, 220, 80, 'ORION / ORCHESTRATOR', '#93C5FD');
  drawNode(380, 140, 220, 80, 'FORGE / BACKEND API', '#FED7AA');
  drawNode(700, 140, 220, 80, 'FRAME / THREE.JS UI', '#A5F3FC');

  drawNode(60, 320, 220, 80, 'A2A CONSUL GATEWAY', '#E9D5FF');
  drawNode(380, 320, 220, 80, 'SHARED KANBAN WAL', '#BBF7D0');
  drawNode(700, 320, 220, 80, 'SRE / ATLAS VAULT', '#FEF08A');

  drawArrow(280, 180, 380, 180);
  drawArrow(600, 180, 700, 180);
  drawArrow(170, 220, 170, 320);
  drawArrow(490, 220, 490, 320);
  drawArrow(810, 220, 810, 320);

  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('STATUS: 60 FPS • ZERO REGRESSION • ACES TONEMAP ACTIVE', 40, 470);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export class RobloxAvatar3D {
  public id: string;
  public controller!: AvatarMovementController;
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
  public microDot: THREE.Sprite;
  public pillScaleLerp = 0; // Starts at 0 (Quiet Room mode: idle agents hide pill!)
  public isSelected = false;

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

  private readonly billboardY = 5.2;
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
  private seed: number;

  constructor(state: AgentState) {
    this.id = state.id;
    this.state = state;
    this.group = new THREE.Group();
    this.group.name = `agent_${state.id}`;
    this.seed = (state.id.charCodeAt(0) * 17 + state.id.length * 23) % 100;
    this.group.scale.setScalar(0.54);

    const skinMat = new THREE.MeshStandardMaterial({
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
      orion: { x: -13.4, y: 0.12, z: -13.15, rotY: 0, loc: 'desk' },
      forge: { x: -2.75, y: 0.12, z: -11.65, rotY: Math.PI, loc: 'desk' },
      frame: { x: 2.75, y: 0.12, z: -11.65, rotY: Math.PI, loc: 'desk' },
      aurora: { x: -2.15, y: 0.12, z: -8.75, rotY: -Math.PI / 2, loc: 'desk' },
      quant: { x: 10.3, y: 0.12, z: -9.05, rotY: Math.PI, loc: 'desk' },
      radar: { x: 15.4, y: 0.12, z: -9.05, rotY: Math.PI, loc: 'desk' },
      prism: { x: -15.9, y: 0.12, z: 9.6, rotY: Math.PI, loc: 'desk' },
      lens: { x: -10.65, y: 0.12, z: 9.6, rotY: Math.PI, loc: 'desk' },
      sentinel: { x: -13.25, y: 0.12, z: 13.55, rotY: Math.PI, loc: 'desk' },
      nexus: { x: 4.12, y: 0.12, z: 12.0, rotY: Math.PI, loc: 'desk' },
      atlas: { x: 11.15, y: 0.12, z: 9.65, rotY: Math.PI, loc: 'desk' },
    };

    const isIdle = state.status === 'idle';
    const initLocation = (isIdle && IDLE_LOCATIONS[state.id]) ? IDLE_LOCATIONS[state.id] : null;
    const spot = initLocation || AGENT_3D_SPOTS[state.id] || { x: 0, y: 0, z: 0, rotY: 0 };

    this.controller = new AvatarMovementController(state.id, spot.x, spot.z, spot.rotY);
    this.currentX = this.targetX = this.controller.x;
    this.currentY = this.targetY = this.controller.y;
    this.currentZ = this.targetZ = this.controller.z;
    this.targetRotY = this.controller.rotationY;
    this.currentLocation = initLocation ? initLocation.loc : 'desk';
    this.group.position.set(this.controller.x, this.controller.y, this.controller.z);
    this.group.rotation.y = this.controller.rotationY;

    // Stagger idle movement timers so agents don't move in robotic unison
    this.actionTimer = Math.random() * 22;

    this.billboard = this.createBillboard(state);
    this.billboard.position.y = this.billboardY;
    this.billboard.scale.set(0, 0, 0);
    this.billboard.visible = false;
    this.group.add(this.billboard);

    this.microDot = this.createMicroDot(state);
    this.microDot.position.set(0, 1.45, 0);
    this.microDot.scale.set(0.95, 0.95, 1);
    this.head.add(this.microDot);

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

  private getExecutiveColor(id: string, color: string): number {
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
  }

  private roleIcon(): string {
    const icons: Record<string, string> = {
      orion: '👑',
      forge: '⚙️',
      frame: '🎨',
      aurora: '✨',
      radar: '📡',
      quant: '📊',
      prism: '🔬',
      lens: '👁️',
      sentinel: '🛡️',
      atlas: '🌐',
      nexus: '📋',
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

  private createMicroDotTexture(color: string): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D required for micro-dot.');

    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.3, '#FFFFFF');
    grad.addColorStop(0.5, color);
    grad.addColorStop(0.8, `${color}44`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    return texture;
  }

  public createMicroDot(state: AgentState): THREE.Sprite {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.createMicroDotTexture(this.safeColor(state.color)),
        transparent: true,
        depthTest: true,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    sprite.name = `microdot_${this.id}`;
    return sprite;
  }

  private createBillboardTexture(state: AgentState): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 160;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is required for avatar billboards.');

    const content = this.resolveBillboard(state);
    this.currentThought = content.activity;

    const padX = 14;
    const padY = 12;
    const pillX = padX;
    const pillY = padY;
    const pillW = 512 - padX * 2; // 484
    const pillH = 160 - padY * 2; // 136
    const pillR = pillH / 2; // 68 (rounded-full horizontal capsule pill)

    // 1. Soft Ambient Drop Shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 6;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, pillR);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
    ctx.fill();
    ctx.restore();

    // 2. Translucent Dark Frosted Glass Fill (Dark Obsidian Slate rgba(15, 23, 42, 0.88))
    const bgGrad = ctx.createLinearGradient(pillX, pillY, pillX, pillY + pillH);
    bgGrad.addColorStop(0, 'rgba(26, 36, 56, 0.90)');
    bgGrad.addColorStop(1, 'rgba(12, 18, 32, 0.94)');
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, pillR);
    ctx.fillStyle = bgGrad;
    ctx.fill();

    // 3. Subtle Inner Specular Rim Highlight (Apple Glass Polish)
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(pillX + 1.2, pillY + 1.2, pillW - 2.4, pillH - 2.4, pillR - 1);
    const topRimGrad = ctx.createLinearGradient(pillX, pillY, pillX, pillY + 45);
    topRimGrad.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
    topRimGrad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
    ctx.strokeStyle = topRimGrad;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();

    // 4. Crisp Hairline Border (1px hairline in screen space)
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, pillR);
    const borderGrad = ctx.createLinearGradient(pillX, pillY, pillX, pillY + pillH);
    borderGrad.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
    borderGrad.addColorStop(1, 'rgba(255, 255, 255, 0.08)');
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // If selected / clicked by user, render glowing accent focus ring
    if (this.isSelected) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(pillX - 2, pillY - 2, pillW + 4, pillH + 4, pillR + 2);
      ctx.strokeStyle = `${content.color}cc`;
      ctx.lineWidth = 2.0;
      ctx.stroke();
      ctx.restore();
    }

    const font = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif';
    const contentLeft = pillX + 38;
    const contentRight = pillX + pillW - 38;

    // 5. Row 1: Agent Name & Role Icon (Left) + Status Badge (Right)
    ctx.font = `800 24px ${font}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#F8FAFC'; // WCAG AAA crisp white (contrast ratio >= 14:1)
    const nameStr = `${this.roleIcon()}  ${state.name.toUpperCase()}`;
    ctx.fillText(nameStr, contentLeft, pillY + 44);

    // Right: Status Badge Micro-Pill
    const badgeText = content.badge;
    ctx.font = `bold 15px ${font}`;
    const badgeW = Math.ceil(ctx.measureText(badgeText).width) + 24;
    const badgeH = 28;
    const badgeX = contentRight - badgeW;
    const badgeY = pillY + 30;

    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 14);
    ctx.fillStyle = content.color;
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(badgeText, badgeX + badgeW / 2, badgeY + badgeH / 2 + 1);

    // 6. Hairline Divider
    ctx.beginPath();
    ctx.moveTo(contentLeft, pillY + 72);
    ctx.lineTo(contentRight, pillY + 72);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 7. Row 2: Crisp Activity Description (WCAG AAA white #F8FAFC)
    ctx.font = `bold 19px ${font}`;
    ctx.fillStyle = '#F8FAFC';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const maxTextW = contentRight - contentLeft;
    ctx.fillText(
      this.fitText(ctx, content.activity, maxTextW),
      contentLeft,
      pillY + 104,
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
    sprite.scale.set(3.4, 0.95, 1);
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
    const oldColor = this.state.color;
    this.state = newState;

    const material = this.torso.material as THREE.MeshStandardMaterial;
    material.color.set(this.safeColor(newState.color));

    if (oldColor !== newState.color) {
      const dotMat = this.microDot.material as THREE.SpriteMaterial;
      const oldTex = dotMat.map;
      dotMat.map = this.createMicroDotTexture(this.safeColor(newState.color));
      dotMat.needsUpdate = true;
      oldTex?.dispose();
    }

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

    this.controller.navigateToFloorPoint(destX, destZ, targetRotY);
    this.refreshBillboard();
  }

  private returnToDesk(): void {
    const homeChairId = AGENT_HOME_CHAIRS[this.id];
    if (homeChairId) {
      const chair = CHAIR_REGISTRY.get(homeChairId);
      if (chair) {
        this.controller.navigateToChair(chair);
      }
    }
  }

  private chooseIdleDestination(): void {
    const choices = ['home', 'coffee', 'meeting', 'sofa'] as const;
    const choice = choices[Math.floor(Math.random() * choices.length)];

    if (choice === 'home') {
      this.returnToDesk();
      return;
    }

    if (choice === 'coffee') {
      const cafeSpot = CHAIR_REGISTRY.get('lounge_cafe_sentinel');
      if (cafeSpot && (!cafeSpot.occupiedBy || cafeSpot.occupiedBy === this.id)) {
        this.controller.navigateToChair(cafeSpot);
        return;
      }
    } else if (choice === 'sofa') {
      const sofaChair = findAvailableChair('lounge', 'lounge', this.controller.assignedChair?.chairId);
      if (sofaChair) {
        this.controller.navigateToChair(sofaChair);
        return;
      }
    } else if (choice === 'meeting') {
      const confChair = findAvailableChair('meeting', 'conference', this.controller.assignedChair?.chairId);
      if (confChair) {
        this.controller.navigateToChair(confChair);
        return;
      }
    }

    this.returnToDesk();
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
    const isSeatedWorking = this.controller.phase === 'SEATED_WORKING';
    const isSeatedIdle = this.controller.phase === 'SEATED_IDLE';
    const sp = this.controller.sitProgress; // 0.0 = standing, 1.0 = seated

    this.isSitting = sp > 0.5;

    // Cup visibility only when at break counter and not walking
    const isAtBreak = this.controller.assignedChair?.kind === 'break' && !walking;
    this.cup.visible = isAtBreak;

    let torsoX = 0;
    let torsoY = 2.6; // default standing
    let torsoZ = 0;
    let torsoRX = 0;
    let torsoRZ = 0;

    let hipY = 1.7; // default standing
    let hipZ = 0;
    let leftHipRX = 0;
    let rightHipRX = 0;
    let leftKneeRX = 0;
    let rightKneeRX = 0;

    let leftArmRX = -0.2;
    let rightArmRX = -0.2;
    let leftArmRZ = -0.06;
    let rightArmRZ = 0.06;

    let headRX = 0.02;
    let headRY = Math.sin(t * 0.45 + this.seed) * 0.08;

    // Organic Respiration
    const breathCycle = Math.sin(t * 1.5 + this.seed);
    const breathY = breathCycle * 0.024;
    const breathChest = breathCycle * 0.018;

    if (walking) {
      // Natural walking gait with spring step & torso forward lean
      this.walkTime += this.controller.currentSpeed * dt * 2.8;
      const swing = Math.sin(this.walkTime) * 0.72;
      leftHipRX = swing;
      rightHipRX = -swing;
      leftKneeRX = Math.max(0, Math.cos(this.walkTime)) * 0.92;
      rightKneeRX = Math.max(0, -Math.cos(this.walkTime)) * 0.92;
      leftArmRX = -swing * 0.78;
      rightArmRX = swing * 0.78;
      leftArmRZ = -0.08;
      rightArmRZ = 0.08;
      torsoY = 2.6 + Math.abs(Math.sin(this.walkTime)) * 0.075;
      torsoRX = 0.055;
      headRY = 0;
    } else if (sp > 0) {
      // Smooth interpolation into seated posture according to sitProgress!
      hipY = THREE.MathUtils.lerp(1.7, 1.25, sp);
      hipZ = THREE.MathUtils.lerp(0, 0.08, sp);
      torsoY = THREE.MathUtils.lerp(2.6, 2.15, sp) + breathY * 0.6;
      torsoZ = THREE.MathUtils.lerp(0, -0.04, sp);
      torsoRX = THREE.MathUtils.lerp(0, 0.08, sp) + breathChest * 0.5;

      leftHipRX = THREE.MathUtils.lerp(0, -Math.PI / 2, sp);
      rightHipRX = THREE.MathUtils.lerp(0, -Math.PI / 2, sp);
      leftKneeRX = THREE.MathUtils.lerp(0, Math.PI / 2, sp);
      rightKneeRX = THREE.MathUtils.lerp(0, Math.PI / 2, sp);

      if (isSeatedWorking && sp >= 0.95) {
        // Typing cadence on keyboard:
        const devCycle = (t * 0.45 + this.seed) % 6.0;
        const isBurst = devCycle < 4.2;
        if (isBurst) {
          const typingLeft = Math.sin(t * 22) * 0.14;
          const typingRight = Math.sin(t * 22 + 1.7) * 0.14;
          leftArmRX = -1.34 + typingLeft;
          rightArmRX = -1.34 + typingRight;
          leftArmRZ = 0.24 + Math.sin(t * 11) * 0.035;
          rightArmRZ = -0.24 - Math.sin(t * 11 + 1.3) * 0.035;
          headRX = 0.22 + Math.sin(t * 2.2) * 0.015;
          headRY = Math.sin(t * 0.8 + this.seed) * 0.14;
        } else {
          leftArmRX = -1.22;
          rightArmRX = -1.22;
          leftArmRZ = 0.22;
          rightArmRZ = -0.22;
          headRX = 0.12;
          headRY = Math.sin(t * 0.35 + this.seed) * 0.24;
        }
      } else if (this.controller.assignedChair?.kind === 'lounge' && sp >= 0.95) {
        // Relaxed couch slouch
        torsoRX = -0.20 + breathChest * 0.4;
        leftHipRX = -1.22;
        rightHipRX = -1.15;
        leftKneeRX = 0.68;
        rightKneeRX = 0.62;
        leftArmRX = -0.22;
        rightArmRX = -0.22;
        leftArmRZ = -0.32;
        rightArmRZ = 0.32;
      } else {
        // Idle seated with hands comfortably on armrests / table
        leftArmRX = THREE.MathUtils.lerp(-0.2, -0.42, sp);
        rightArmRX = THREE.MathUtils.lerp(-0.2, -0.42, sp);
        leftArmRZ = THREE.MathUtils.lerp(-0.06, -0.18, sp);
        rightArmRZ = THREE.MathUtils.lerp(0.06, 0.18, sp);
        headRX = 0.08;
        headRY = Math.sin(t * 0.3 + this.seed) * 0.12;
      }
    } else if (isAtBreak) {
      // Standing at barista coffee counter sipping espresso
      torsoX = -0.08;
      torsoRZ = 0.04;
      torsoY = 2.58 + breathY;
      torsoRX = breathChest;
      hipY = 1.68;
      rightHipRX = -0.12;
      rightKneeRX = 0.24;
      leftArmRX = -0.12;
      leftArmRZ = -0.12;

      const sipPhase = (Math.sin(t * 0.7 + this.seed) + 1) / 2;
      const sip = THREE.MathUtils.smoothstep(sipPhase, 0.70, 0.96);
      rightArmRX = THREE.MathUtils.lerp(-0.45, -2.44, sip);
      rightArmRZ = THREE.MathUtils.lerp(0.08, -0.56, sip);
      headRX = -sip * 0.10;
      this.cup.rotation.set(-rightArmRX - sip * 0.2, 0, -rightArmRZ);
    } else {
      // Natural standing idle
      hipY = 1.7;
      torsoY = 2.6 + breathY;
      leftHipRX = 0;
      rightHipRX = -0.08;
      rightKneeRX = 0.16;
      leftArmRX = -0.12;
      rightArmRX = -0.12;
      leftArmRZ = -0.08;
      rightArmRZ = 0.08;
      headRY = Math.sin(t * 0.35 + this.seed) * 0.12;
    }

    const pose = (
      mesh: THREE.Object3D,
      x: number,
      y: number,
      z: number,
      rx = 0,
      ry = 0,
      rz = 0,
    ) => {
      mesh.position.set(x, y, z);
      mesh.rotation.set(rx, ry, rz);
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

  public tick(delta: number, simSpeed: number, otherControllers: AvatarMovementController[] = []): void {
    if (
      this.disposed ||
      !Number.isFinite(delta) ||
      !Number.isFinite(simSpeed) ||
      delta <= 0
    ) {
      return;
    }

    const realDt = Math.min(delta, 0.05);
    const dt = Math.min(realDt * Math.max(0, simSpeed), 0.05);
    if (dt <= 0) return;

    this.elapsed += dt;

    if (this.isGreeting) {
      this.greetingRemaining -= realDt;
      if (this.greetingRemaining <= 0) {
        this.isGreeting = false;
        this.refreshBillboard();
      }
    }

    // 1. Synchronize Hermes Status with Controller
    const isHermesBusy = this.isWorking() || !!this.state.activeTool || this.state.currentTask?.status === 'running';
    if (this.controller.isHermesWorking !== isHermesBusy) {
      this.controller.setHermesStatus(isHermesBusy);
    }

    // 2. Autonomous Idle Decisions (only when idle and seated at desk)
    if (!isHermesBusy) {
      if (this.controller.isSeated() && this.controller.phase === 'SEATED_IDLE') {
        this.actionTimer += dt;
        if (this.actionTimer >= 22 + (this.seed % 14)) {
          this.actionTimer = 0;
          this.chooseIdleDestination();
        }
      } else if (this.controller.phase === 'IDLE_STANDING') {
        this.actionTimer += dt;
        if (this.actionTimer >= 14 + (this.seed % 10)) {
          this.actionTimer = 0;
          this.returnToDesk();
        }
      }
    }

    // 3. Update Controller Locomotion & State Machine
    this.controller.update(dt, otherControllers);

    // 4. Update Position from Controller
    this.currentX = this.controller.x;
    this.currentY = this.controller.y;
    this.currentZ = this.controller.z;
    this.targetRotY = this.controller.rotationY;

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
      this.controller.x,
      this.controller.y + this.jumpOffset,
      this.controller.z,
    );
    this.group.rotation.y = this.controller.rotationY;

    // 5. Apply Procedural Skeletal Posture
    this.applyPosture(this.controller.isWalking, dt);

    // 6. Billboard & MicroDot
    const isWorking = isHermesBusy || this.controller.phase === 'SEATED_WORKING';
    let targetPill = 0;
    if (this.isGreeting) targetPill = 1;
    else if (this.isSelected) targetPill = 1;
    else if (isWorking) targetPill = 1;
    else targetPill = 0;

    this.pillScaleLerp = THREE.MathUtils.damp(this.pillScaleLerp, targetPill, 10, dt);

    if (this.pillScaleLerp > 0.01) {
      this.billboard.visible = true;
      const s = this.pillScaleLerp;
      this.billboard.scale.set(5.3 * s, 1.7 * s, 1);
      const pillBob = Math.sin(this.elapsed * 1.8 + this.seed) * 0.05;
      this.billboard.position.y = this.billboardY + pillBob;
    } else {
      this.billboard.visible = false;
      this.billboard.scale.set(0, 0, 0);
    }

    if (this.pillScaleLerp < 0.98) {
      this.microDot.visible = true;
      const dotProgress = 1 - this.pillScaleLerp;
      const breathe = 1 + Math.sin(this.elapsed * 2.2 + this.seed) * 0.16;
      const dotScale = 0.95 * dotProgress * breathe;
      this.microDot.scale.set(dotScale, dotScale, 1);
      this.microDot.position.y = 1.45 + Math.sin(this.elapsed * 1.5 + this.seed) * 0.05;
    } else {
      this.microDot.visible = false;
      this.microDot.scale.set(0, 0, 0);
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

export class RobloxOffice3D {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public container: HTMLElement;
  public avatars: Map<string, RobloxAvatar3D> = new Map();

  // Water cooler bubbles animation meshes
  private waterBubbles: THREE.Mesh[] = [];

  // Living Props & Workstation Lighting (Atelier Japandi)
  private coffeeSteam?: {
    points: THREE.Points;
    update: (dt: number, now: number) => void;
    dispose: () => void;
  };

  private workstationLights: Map<
    string,
    {
      light: THREE.PointLight;
      deskGlow: THREE.Mesh;
      floorGlow: THREE.Mesh;
    }
  > = new Map();

  // Frame-Rate Independent Camera Smoothing (Astra Blueprint)
  private isDragging = false;
  private prevMouseX = 0;
  private prevMouseY = 0;
  public cameraAngleX = Math.PI / 4.7; // ~38.3 deg architectural cutaway pitch
  public cameraAngleY = 0.0;           // Frontal orientation
  public cameraDistance = 54;          // Fills the screen with stunning architectural presence!
  public cameraTarget = new THREE.Vector3(0, 0.2, -2.4);

  public desiredCameraPos = new THREE.Vector3();
  public desiredCameraTarget = new THREE.Vector3(0, 0.2, 0);
  public smoothTarget = new THREE.Vector3(0, 0.2, 0);

  private rafId = 0;
  private lastTime = 0;
  public simSpeed = 1;
  public onSelectAgent?: (id: string | null) => void;

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();

    // 1. Dark Studio Atelier Canvas (#16181D) - Elegant charcoal studio background
    this.scene.background = new THREE.Color(0x16181D);
    this.scene.fog = new THREE.FogExp2(0x16181D, 0.0012);

    // Camera
    const aspect = container.clientWidth / container.clientHeight;
    const baseFov = aspect < 1.0 ? Math.min(62, 38 * (1.25 / aspect)) : 38;
    this.camera = new THREE.PerspectiveCamera(baseFov, aspect, 0.5, 600);
    this.updateCameraPosition();
    this.smoothTarget.copy(this.cameraTarget);

    // WebGL Renderer with PCFShadowMap & ACES Tone Mapping
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    container.appendChild(this.renderer.domElement);

    // Build the World
    this.setupLighting();
    this.buildOfficeLayout();
    this.debugVisualizer = new OfficeDebugVisualizer();
    this.scene.add(this.debugVisualizer.group);
    this.setupCoffeeSteam();
    this.setupWorkstationLighting();
    this.setupControls();
    this.spawnInitialAgents();

    window.addEventListener('resize', this.onResize);
  }

  private setupLighting() {
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
  }

  public floorPlan?: OfficeFloorPlan;
  public debugVisualizer!: OfficeDebugVisualizer;

  private buildOfficeLayout() {
    this.floorPlan = new OfficeFloorPlan({
      scene: this.scene,
      aspect: this.camera.aspect,
      shadows: true,
      background: "#0e1116",
      addLights: false, // RobloxOffice3D manages the unified master architectural lighting!
    });
  }

  private createCodeSyntaxTexture(agentId: string): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 80;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#0B0F19';
    ctx.fillRect(0, 0, 128, 80);

    const colors = ['#F97316', '#38BDF8', '#4ADE80', '#A855F7', '#FCD34D'];
    for (let y = 8; y < 72; y += 8) {
      let x = 8;
      while (x < 110) {
        const w = 8 + Math.random() * 24;
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        ctx.fillRect(x, y, w, 4);
        x += w + 6;
      }
    }

    return new THREE.CanvasTexture(canvas);
  }

  private setupCoffeeSteam() {
    const origins = [
      { x: -5.6, y: 2.0, z: 8.75 },   // Espresso cup on cafe barista counter
      { x: -3.70, y: 1.05, z: 16.45 }, // Demitasse cup on lounge table
    ];
    const particlesPerCup = 14;
    const particleCount = origins.length * particlesPerCup; // 28 particles in total
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const progress = new Float32Array(particleCount);
    const speed = new Float32Array(particleCount);
    const driftPhase = new Float32Array(particleCount);
    const driftRadius = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const orig = origins[Math.floor(i / particlesPerCup)];
      progress[i] = Math.random();
      speed[i] = 0.28 + Math.random() * 0.35;
      driftPhase[i] = Math.random() * Math.PI * 2;
      driftRadius[i] = 0.04 + Math.random() * 0.07;

      positions[i * 3 + 0] = orig.x;
      positions[i * 3 + 1] = orig.y + progress[i] * 2.0;
      positions[i * 3 + 2] = orig.z;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Create soft particle circular alpha texture
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      grad.addColorStop(0.35, 'rgba(255, 245, 230, 0.65)');
      grad.addColorStop(0.7, 'rgba(255, 235, 210, 0.25)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
    }
    const particleTexture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      map: particleTexture,
      size: 1.4,
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.82,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });

    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    this.scene.add(points);

    this.coffeeSteam = {
      points,
      update: (dt: number, now: number) => {
        const posAttr = geometry.attributes.position as THREE.BufferAttribute;
        const posArray = posAttr.array as Float32Array;

        for (let i = 0; i < particleCount; i++) {
          const orig = origins[Math.floor(i / particlesPerCup)];
          progress[i] += dt * speed[i];
          if (progress[i] >= 1.0) {
            progress[i] -= 1.0;
          }

          const p = progress[i];
          // Gentle rising with wafting curl
          const waftAngle = now * 1.6 + driftPhase[i];
          const r = driftRadius[i] * (1.0 + p * 2.2);

          posArray[i * 3 + 0] = orig.x + Math.cos(waftAngle) * r;
          posArray[i * 3 + 1] = orig.y + p * 2.2;
          posArray[i * 3 + 2] = orig.z + Math.sin(waftAngle) * r;
        }

        posAttr.needsUpdate = true;
      },
      dispose: () => {
        geometry.dispose();
        material.dispose();
        particleTexture.dispose();
        points.removeFromParent();
      },
    };
  }

  private setupWorkstationLighting() {
    const deskGlowGeo = new THREE.PlaneGeometry(4.2, 1.8);
    deskGlowGeo.rotateX(-Math.PI / 2);

    // Shared soft halo canvas texture for desk reflection
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(64, 64, 10, 64, 64, 60);
      grad.addColorStop(0, 'rgba(255, 185, 110, 0.95)');
      grad.addColorStop(0.45, 'rgba(255, 170, 80, 0.55)');
      grad.addColorStop(0.85, 'rgba(255, 150, 60, 0.18)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
    }
    const glowTexture = new THREE.CanvasTexture(canvas);

    for (const [id, spot] of Object.entries(AGENT_3D_SPOTS)) {
      const isFacingSouth = Math.abs(spot.rotY) < 0.1;
      const deskZ = isFacingSouth ? spot.z + 1.65 : spot.z - 1.65;
      const deskX = spot.x;
      const deskY = 1.91; // Sits directly on top of 1.88 oak desk surface
      const midZ = (spot.z + deskZ) / 2;

      // 1. PointLight 2700K warm amber incandescent glow (castShadow = false for mobile 60 FPS)
      const light = new THREE.PointLight('#FFA534', 0, 14.0, 1.4);
      light.position.set(deskX, 3.2, midZ);
      light.visible = false;
      this.scene.add(light);

      // 2. Desk glow pad (warm 2700K illumination on keyboard and desk surface)
      const glowMat = new THREE.MeshBasicMaterial({
        map: glowTexture,
        color: 0xFFAA33,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const deskGlow = new THREE.Mesh(deskGlowGeo, glowMat);
      deskGlow.position.set(deskX, deskY, deskZ + (isFacingSouth ? -0.3 : 0.3));
      deskGlow.visible = false;
      this.scene.add(deskGlow);

      // 3. Floor pool halo (warm 2700K pool of ambient light under workstation)
      const floorGlowGeo = new THREE.PlaneGeometry(6.2, 5.4);
      floorGlowGeo.rotateX(-Math.PI / 2);
      const floorGlowMat = new THREE.MeshBasicMaterial({
        map: glowTexture,
        color: 0xFFAA33,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const floorGlow = new THREE.Mesh(floorGlowGeo, floorGlowMat);
      floorGlow.position.set(deskX, 0.16, midZ);
      floorGlow.visible = false;
      this.scene.add(floorGlow);

      this.workstationLights.set(id, { light, deskGlow, floorGlow });
    }
  }

  private updateWorkstationLighting(delta: number) {
    const lerpFactor = 1 - Math.exp(-6 * delta);

    for (const [id, ws] of this.workstationLights.entries()) {
      const avatar = this.avatars.get(id);
      const isWorking = avatar
        ? (avatar.state.status === 'working' ||
           avatar.state.status === 'tool_call' ||
           !!avatar.state.activeTool ||
           avatar.state.currentTask?.status === 'running')
        : false;

      const targetIntensity = isWorking ? 8.5 : 0.0;
      const targetOpacity = isWorking ? 0.90 : 0.0;
      const targetFloorOpacity = isWorking ? 0.55 : 0.0;

      ws.light.intensity += (targetIntensity - ws.light.intensity) * lerpFactor;
      ws.light.visible = ws.light.intensity > 0.02;

      const padMat = ws.deskGlow.material as THREE.MeshBasicMaterial;
      padMat.opacity += (targetOpacity - padMat.opacity) * lerpFactor;
      ws.deskGlow.visible = padMat.opacity > 0.02;

      const floorMat = ws.floorGlow.material as THREE.MeshBasicMaterial;
      floorMat.opacity += (targetFloorOpacity - floorMat.opacity) * lerpFactor;
      ws.floorGlow.visible = floorMat.opacity > 0.02;
    }
  }

  private currentRoomKey = 'all';

  public setSelectedAgent(id: string | null) {
    for (const [agentId, avatar] of this.avatars.entries()) {
      avatar.isSelected = (agentId === id);
    }
    if (id) {
      const avatar = this.avatars.get(id);
      if (avatar) {
        this.cameraTarget.set(avatar.group.position.x, avatar.group.position.y + 1, avatar.group.position.z);
        this.cameraDistance = 42;
        this.updateCameraPosition();
      }
    } else {
      this.focusRoom(this.currentRoomKey || 'all');
    }
  }

  public updateAgentsData(data: OfficeUpdatePayload) {
    for (const [id, state] of Object.entries(data.agents)) {
      let avatar = this.avatars.get(id);
      if (!avatar) {
        avatar = new RobloxAvatar3D(state);
        this.avatars.set(id, avatar);
        this.scene.add(avatar.group);
      }

      const prevStatus = avatar.state.status;
      avatar.updateState(state);

      // Realtime task routing: if working or executing tools, return directly to home desk!
      if ((state.status === 'working' || state.status === 'tool_call') && prevStatus !== state.status) {
        avatar.controller.setHermesStatus(true);
      } else if (state.status === 'meeting' && prevStatus !== 'meeting') {
        const confChair = findAvailableChair('meeting', 'conference');
        if (confChair) {
          avatar.controller.navigateToChair(confChair);
        }
      }
    }
  }

  public start() {
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public stop() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.floorPlan?.dispose();
    this.coffeeSteam?.dispose();
    for (const ws of this.workstationLights.values()) {
      ws.light.removeFromParent();
      ws.deskGlow.geometry.dispose();
      (ws.deskGlow.material as THREE.Material).dispose();
      ws.deskGlow.removeFromParent();
      ws.floorGlow.geometry.dispose();
      (ws.floorGlow.material as THREE.Material).dispose();
      ws.floorGlow.removeFromParent();
    }
    this.workstationLights.clear();
  }

  private loop = (now: number) => {
    const delta = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;

    // 1. Collect all controllers for local avoidance
    const controllers = Array.from(this.avatars.values()).map((a) => a.controller);

    // 2. Tick Avatars with full local avoidance
    for (const avatar of this.avatars.values()) {
      avatar.tick(delta, this.simSpeed, controllers);
    }

    // 3. Update debug visualizer
    if (this.debugVisualizer && this.debugVisualizer.isEnabled) {
      this.debugVisualizer.update(controllers);
    }

    // 4. Animate Floor Plan
    if (this.floorPlan) {
      this.floorPlan.update(now * 0.001);
    }

    // 5. Living Props & Workstation Lighting
    this.coffeeSteam?.update(delta, now * 0.001);
    this.updateWorkstationLighting(delta);

    // 6. Smooth Camera Lerp Interpolation
    const alpha = 1 - Math.exp(-6 * delta);
    this.camera.position.lerp(this.desiredCameraPos, alpha);
    this.smoothTarget.lerp(this.desiredCameraTarget, alpha);
    this.camera.lookAt(this.smoothTarget);

    this.renderer.render(this.scene, this.camera);
    this.rafId = requestAnimationFrame(this.loop);
  };

    private spawnInitialAgents() {
    const DEFAULT_AGENTS = [
      { id: 'orion', name: 'ORION', role: 'Chief of Staff', color: '#3B82F6', status: 'idle' },
      { id: 'forge', name: 'FORGE', role: 'Backend & APIs', color: '#F97316', status: 'idle' },
      { id: 'frame', name: 'FRAME', role: 'Frontend UI', color: '#06B6D4', status: 'idle' },
      { id: 'aurora', name: 'AURORA', role: 'Product Design', color: '#EC4899', status: 'idle' },
      { id: 'radar', name: 'RADAR', role: 'Source Intel', color: '#10B981', status: 'idle' },
      { id: 'quant', name: 'QUANT', role: 'Quantitative', color: '#84CC16', status: 'idle' },
      { id: 'prism', name: 'PRISM', role: 'Functional QA', color: '#A855F7', status: 'idle' },
      { id: 'lens', name: 'LENS', role: 'Visual QA', color: '#6366F1', status: 'idle' },
      { id: 'sentinel', name: 'SENTINEL', role: 'Security', color: '#EF4444', status: 'idle' },
      { id: 'atlas', name: 'ATLAS', role: 'Infrastructure', color: '#EAB308', status: 'idle' },
      { id: 'nexus', name: 'NEXUS', role: 'Operations', color: '#14B8A6', status: 'idle' },
    ];

    for (const a of DEFAULT_AGENTS) {
      if (!this.avatars.has(a.id)) {
        const avatar = new RobloxAvatar3D(a as any);
        this.avatars.set(a.id, avatar);
        this.scene.add(avatar.group);
      }
    }
  }

  private setupControls() {
    const dom = this.renderer.domElement;
    dom.style.touchAction = 'none';
    dom.style.userSelect = 'none';
    (dom.style as any).webkitUserSelect = 'none';

    // Desktop Mouse Drag
    dom.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.prevMouseX = e.clientX;
      this.prevMouseY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.prevMouseX;
      const dy = e.clientY - this.prevMouseY;
      this.prevMouseX = e.clientX;
      this.prevMouseY = e.clientY;

      if (e.buttons === 1) {
        this.cameraAngleY -= dx * 0.006;
        this.cameraAngleX = Math.max(0.15, Math.min(Math.PI / 2.1, this.cameraAngleX + dy * 0.006));
        this.updateCameraPosition();
      } else if (e.buttons === 2) {
        const panSpeed = 0.04 * (this.cameraDistance / 40);
        this.cameraTarget.x -= dx * panSpeed;
        this.cameraTarget.z -= dy * panSpeed;
        this.desiredCameraTarget.copy(this.cameraTarget);
        this.updateCameraPosition();
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    dom.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoom = e.deltaY > 0 ? 1.08 : 0.92;
      this.cameraDistance = Math.max(20, Math.min(140, this.cameraDistance * zoom));
      this.updateCameraPosition();
    }, { passive: false });

    // TOUCH CONTROLS FOR SMARTPHONE & TABLET
    let touchStartX = 0;
    let touchStartY = 0;
    let prevTouchX = 0;
    let prevTouchY = 0;
    let initialPinchDist = 0;
    let initialCameraDist = this.cameraDistance;
    let isPinching = false;
    let touchStartTime = 0;

    dom.addEventListener('touchstart', (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isPinching = false;
        const touch = e.touches[0];
        touchStartX = prevTouchX = touch.clientX;
        touchStartY = prevTouchY = touch.clientY;
        touchStartTime = performance.now();
      } else if (e.touches.length === 2) {
        isPinching = true;
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        initialPinchDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        initialCameraDist = this.cameraDistance;
        prevTouchX = (t1.clientX + t2.clientX) / 2;
        prevTouchY = (t1.clientY + t2.clientY) / 2;
      }
    }, { passive: false });

    dom.addEventListener('touchmove', (e: TouchEvent) => {
      e.preventDefault(); // Crucial: stops native mobile scroll/refresh!

      if (e.touches.length === 1 && !isPinching) {
        // Single-finger drag: Rotate camera smoothly
        const touch = e.touches[0];
        const dx = touch.clientX - prevTouchX;
        const dy = touch.clientY - prevTouchY;
        prevTouchX = touch.clientX;
        prevTouchY = touch.clientY;

        this.cameraAngleY -= dx * 0.008;
        this.cameraAngleX = Math.max(0.15, Math.min(Math.PI / 2.1, this.cameraAngleX + dy * 0.008));
        this.updateCameraPosition();
      } else if (e.touches.length === 2) {
        // Two-finger pinch-to-zoom & two-finger pan
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const currentPinchDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

        if (initialPinchDist > 0 && currentPinchDist > 0) {
          const pinchFactor = initialPinchDist / currentPinchDist;
          this.cameraDistance = Math.max(20, Math.min(140, initialCameraDist * pinchFactor));
        }

        // Two-finger pan
        const midX = (t1.clientX + t2.clientX) / 2;
        const midY = (t1.clientY + t2.clientY) / 2;
        const dx = midX - prevTouchX;
        const dy = midY - prevTouchY;
        prevTouchX = midX;
        prevTouchY = midY;

        const panSpeed = 0.05 * (this.cameraDistance / 40);
        this.cameraTarget.x -= dx * panSpeed;
        this.cameraTarget.z -= dy * panSpeed;
        this.desiredCameraTarget.copy(this.cameraTarget);
        this.updateCameraPosition();
      }
    }, { passive: false });

    dom.addEventListener('touchend', (e: TouchEvent) => {
      // Tap detection for agent raycast selection on touchscreens
      if (!isPinching && e.changedTouches.length === 1) {
        const touch = e.changedTouches[0];
        const movedDist = Math.hypot(touch.clientX - touchStartX, touch.clientY - touchStartY);
        const duration = performance.now() - touchStartTime;

        if (movedDist < 12 && duration < 400) {
          this.handleRaycastClick(touch.clientX, touch.clientY);
        }
      }

      if (e.touches.length === 0) {
        isPinching = false;
        initialPinchDist = 0;
      }
    }, { passive: false });

    // Desktop Mouse Click
    dom.addEventListener('click', (e) => {
      this.handleRaycastClick(e.clientX, e.clientY);
    });

    dom.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private handleRaycastClick(clientX: number, clientY: number) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);

    let clickedAgentId: string | null = null;
    for (const [id, avatar] of this.avatars.entries()) {
      const intersects = raycaster.intersectObjects(avatar.group.children, true);
      if (intersects.length > 0) {
        clickedAgentId = id;
        avatar.onUserClick();
        break;
      }
    }

    if (this.onSelectAgent) {
      this.onSelectAgent(clickedAgentId);
    }
  }

  public updateCameraPosition() {
    const x = this.cameraTarget.x + this.cameraDistance * Math.sin(this.cameraAngleY) * Math.cos(this.cameraAngleX);
    const y = this.cameraDistance * Math.sin(this.cameraAngleX);
    const z = this.cameraTarget.z + this.cameraDistance * Math.cos(this.cameraAngleY) * Math.cos(this.cameraAngleX);

    this.desiredCameraPos.set(x, y, z);
    this.desiredCameraTarget.copy(this.cameraTarget);
  }

  public focusRoom(roomKey: string) {
    if (roomKey === 'all') {
      this.cameraTarget.set(0, 0.8, 0);
      this.cameraDistance = 58;
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
  }

  private onResize = () => {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.renderer.setSize(w, h);
    if (this.floorPlan) {
      this.floorPlan.resize(w, h);
      this.camera.aspect = this.floorPlan.camera.aspect;
      this.camera.fov = this.floorPlan.camera.fov;
      this.camera.near = this.floorPlan.camera.near;
      this.camera.far = this.floorPlan.camera.far;
      this.camera.updateProjectionMatrix();
      if (this.currentRoomKey === 'all') {
        this.camera.position.copy(this.floorPlan.camera.position);
        this.camera.rotation.copy(this.floorPlan.camera.rotation);
        return;
      }
    } else {
      const aspect = w / h;
      this.camera.aspect = aspect;
      this.camera.fov = aspect < 1.0 ? Math.min(62, 30 * (1.25 / aspect)) : 30;
      this.camera.updateProjectionMatrix();
    }
  };
}
