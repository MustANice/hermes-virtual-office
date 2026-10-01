import { OfficeMap } from './OfficeMap';
import { WaypointGraph } from './WaypointGraph';
import { AgentAvatar } from './AgentAvatar';
import { OfficeUpdatePayload, AgentState } from '../types/office';

export class OfficeEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private map: OfficeMap;
  private navGraph: WaypointGraph;
  private avatars: Map<string, AgentAvatar> = new Map();

  // Camera & viewport
  public cameraX = 0;
  public cameraY = 0;
  public zoom = 1.0;
  public isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;

  // Animation & timing
  private rafId = 0;
  private lastTime = 0;
  private animTime = 0;
  private frameCount = 0;
  private lastFpsUpdate = 0;
  public fps = 60;
  public simSpeed = 1;

  // Callbacks
  public onSelectAgent?: (agentId: string | null) => void;
  public onFpsUpdate?: (fps: number) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.map = new OfficeMap();
    this.navGraph = new WaypointGraph();

    this.setupEventListeners();
    this.resizeCanvas();
  }

  public initAgents(agents: Record<string, AgentState>) {
    for (const [id, state] of Object.entries(agents)) {
      if (!this.avatars.has(id)) {
        this.avatars.set(id, new AgentAvatar(state));
      }
    }
  }

  public updateAgentsData(data: OfficeUpdatePayload) {
    for (const [id, state] of Object.entries(data.agents)) {
      let avatar = this.avatars.get(id);
      if (!avatar) {
        avatar = new AgentAvatar(state);
        this.avatars.set(id, avatar);
      }
      avatar.updateState(state, this.navGraph);
    }
  }

  public setSelectedAgent(selectedId: string | null) {
    for (const avatar of this.avatars.values()) {
      avatar.isSelected = avatar.id === selectedId;
    }
  }

  public setCamera(x: number, y: number, zoom: number) {
    this.cameraX = x;
    this.cameraY = y;
    this.zoom = Math.max(0.6, Math.min(2.2, zoom));
  }

  public start() {
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public stop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
  }

  private loop = (now: number) => {
    const delta = (now - this.lastTime) / 1000;
    this.lastTime = now;
    this.animTime += delta;

    // FPS calculation
    this.frameCount++;
    if (now - this.lastFpsUpdate >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsUpdate = now;
      if (this.onFpsUpdate) this.onFpsUpdate(this.fps);
    }

    // Update Avatars physics / waypoints
    for (const avatar of this.avatars.values()) {
      avatar.tick(this.simSpeed);
    }

    // Render Canvas
    this.render();

    this.rafId = requestAnimationFrame(this.loop);
  };

  private render() {
    const ctx = this.ctx;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rectWidth = this.canvas.clientWidth || window.innerWidth;
    const rectHeight = this.canvas.clientHeight || window.innerHeight;

    // Reset transform & clear physical canvas buffer
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0B0D11';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    // Scale for Retina/Hi-DPI screens
    ctx.scale(dpr, dpr);

    // Center camera in CSS logical pixels
    ctx.translate(rectWidth / 2 + this.cameraX, rectHeight / 2 + this.cameraY);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-520, -335); // Center around office midpoint (bounds 50..990, 40..630)

    // 1. Render Map Floors, Walls, Furniture
    this.map.render(ctx);

    // 2. Y-Sort Avatars for realistic depth sorting
    const sortedAvatars = Array.from(this.avatars.values()).sort((a, b) => a.y - b.y);

    // 3. Render Avatars
    for (const avatar of sortedAvatars) {
      avatar.render(ctx, this.animTime);
    }

    ctx.restore();
  }

  public resizeCanvas() {
    const rect = this.canvas.parentElement?.getBoundingClientRect();
    if (rect) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = Math.floor(rect.width * dpr);
      this.canvas.height = Math.floor(rect.height * dpr);
      this.canvas.style.width = `${rect.width}px`;
      this.canvas.style.height = `${rect.height}px`;
    }
  }

  private setupEventListeners() {
    window.addEventListener('resize', () => this.resizeCanvas());

    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.dragStartX = e.clientX - this.cameraX;
      this.dragStartY = e.clientY - this.cameraY;
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        this.cameraX = e.clientX - this.dragStartX;
        this.cameraY = e.clientY - this.dragStartY;
      } else {
        // Hit-test on hover
        const worldPos = this.screenToWorld(e.clientX, e.clientY);
        let foundHover = false;
        for (const avatar of this.avatars.values()) {
          avatar.isHovered = avatar.isHit(worldPos.x, worldPos.y);
          if (avatar.isHovered) foundHover = true;
        }
        this.canvas.style.cursor = foundHover ? 'pointer' : (this.isDragging ? 'grabbing' : 'grab');
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    this.canvas.addEventListener('click', (e) => {
      const worldPos = this.screenToWorld(e.clientX, e.clientY);
      let clickedAgentId: string | null = null;

      for (const avatar of this.avatars.values()) {
        if (avatar.isHit(worldPos.x, worldPos.y)) {
          clickedAgentId = avatar.id;
          break;
        }
      }

      if (this.onSelectAgent) {
        this.onSelectAgent(clickedAgentId);
      }
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      this.zoom = Math.max(0.6, Math.min(2.2, this.zoom * zoomFactor));
    }, { passive: false });

    // Touch support for mobile / iPad
    let touchStartX = 0;
    let touchStartY = 0;
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        touchStartX = e.touches[0].clientX - this.cameraX;
        touchStartY = e.touches[0].clientY - this.cameraY;
      }
    }, { passive: true });

    this.canvas.addEventListener('touchmove', (e) => {
      if (this.isDragging && e.touches.length === 1) {
        this.cameraX = e.touches[0].clientX - touchStartX;
        this.cameraY = e.touches[0].clientY - touchStartY;
      }
    }, { passive: true });

    this.canvas.addEventListener('touchend', () => {
      this.isDragging = false;
    });
  }

  private screenToWorld(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const worldX = (screenX - centerX - this.cameraX) / this.zoom + 520;
    const worldY = (screenY - centerY - this.cameraY) / this.zoom + 335;

    return { x: worldX, y: worldY };
  }
}
