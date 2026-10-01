import { AgentState } from '../types/office';
import { WaypointGraph } from './WaypointGraph';

export class AgentAvatar {
  public id: string;
  public state: AgentState;
  public x: number;
  public y: number;
  public targetX: number;
  public targetY: number;
  public currentPath: Array<{ x: number; y: number }> = [];
  public walkCycle = 0;
  public isSelected = false;
  public isHovered = false;

  constructor(state: AgentState) {
    this.id = state.id;
    this.state = state;
    this.x = state.homeDesk.x;
    this.y = state.homeDesk.y;
    this.targetX = state.homeDesk.x;
    this.targetY = state.homeDesk.y;
  }

  public updateState(newState: AgentState, navGraph: WaypointGraph) {
    this.state = newState;

    let destX = newState.homeDesk.x;
    let destY = newState.homeDesk.y;

    // If in meeting, target meeting table seat
    if (newState.status === 'meeting') {
      const meetingSeats = [
        { x: 460, y: 345 },
        { x: 490, y: 345 },
        { x: 520, y: 345 },
        { x: 460, y: 375 },
        { x: 490, y: 375 },
        { x: 520, y: 375 },
      ];
      // Deterministic seat index based on agent id
      const hash = this.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const seat = meetingSeats[hash % meetingSeats.length];
      destX = seat.x;
      destY = seat.y;
    } else if (newState.status === 'idle') {
      // 50% chance idle agents hang out in lounge
      const loungeSpots = [
        { x: 460, y: 550 },
        { x: 620, y: 550 },
        { x: 450, y: 480 },
        { x: 530, y: 560 },
      ];
      const hash = this.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      if (hash % 2 === 0) {
        const spot = loungeSpots[hash % loungeSpots.length];
        destX = spot.x;
        destY = spot.y;
      }
    }

    // If destination changed materially, calculate new path
    if (Math.hypot(this.targetX - destX, this.targetY - destY) > 20) {
      this.targetX = destX;
      this.targetY = destY;
      this.currentPath = navGraph.findPath(this.x, this.y, destX, destY);
    }
  }

  public tick(simSpeed = 1) {
    if (this.currentPath.length > 0) {
      const nextPoint = this.currentPath[0];
      const dx = nextPoint.x - this.x;
      const dy = nextPoint.y - this.y;
      const dist = Math.hypot(dx, dy);
      const speed = 2.2 * simSpeed;

      if (dist <= speed) {
        this.x = nextPoint.x;
        this.y = nextPoint.y;
        this.currentPath.shift();
      } else {
        this.x += (dx / dist) * speed;
        this.y += (dy / dist) * speed;
        this.walkCycle += 0.25 * simSpeed;
      }
    } else {
      this.walkCycle = 0;
    }
  }

  public isHit(clickX: number, clickY: number): boolean {
    const dx = clickX - this.x;
    const dy = clickY - (this.y - 10);
    return Math.hypot(dx, dy) < 24;
  }

  public render(ctx: CanvasRenderingContext2D, animTime: number) {
    const isMoving = this.currentPath.length > 0;
    const isWorking = this.state.status === 'working' && !isMoving;
    const isToolCall = this.state.status === 'tool_call' && !isMoving;
    const isMeeting = this.state.status === 'meeting' && !isMoving;
    const isError = this.state.status === 'error';

    ctx.save();
    ctx.translate(this.x, this.y);

    // 1. Selection / Hover Ring
    if (this.isSelected || this.isHovered) {
      ctx.beginPath();
      ctx.ellipse(0, 4, 18, 9, 0, 0, Math.PI * 2);
      ctx.fillStyle = this.isSelected ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255, 255, 255, 0.15)';
      ctx.fill();
      ctx.strokeStyle = this.isSelected ? '#3B82F6' : '#94A3B8';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      // Default soft shadow
      ctx.beginPath();
      ctx.ellipse(0, 4, 12, 5, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fill();
    }

    // 2. Character Body & Animation
    const bob = isMoving ? Math.sin(this.walkCycle) * 2 : (isWorking ? Math.sin(animTime * 6) * 0.8 : 0);
    const legOffset = isMoving ? Math.sin(this.walkCycle) * 3 : 0;

    // Legs
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(-5, 0 - bob, 4, 7 + legOffset);
    ctx.fillRect(1, 0 - bob, 4, 7 - legOffset);

    // Torso / Hoodie (Agent Color)
    ctx.fillStyle = this.state.color;
    this.drawRoundedRect(ctx, -8, -14 - bob, 16, 15, 3);
    ctx.fill();

    // Torso detail / zipper
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -14 - bob);
    ctx.lineTo(0, 0 - bob);
    ctx.stroke();

    // Head
    ctx.fillStyle = '#FCD34D'; // friendly warm skin
    ctx.beginPath();
    ctx.arc(0, -20 - bob, 7, 0, Math.PI * 2);
    ctx.fill();

    // Hair / Cap
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.arc(0, -22 - bob, 7, Math.PI, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(-3, -21 - bob, 2, 2);
    ctx.fillRect(1, -21 - bob, 2, 2);

    // Typing Hands animation when working at computer
    if (isWorking || isToolCall) {
      const typeHand = Math.sin(animTime * 12) * 2;
      ctx.fillStyle = '#FCD34D';
      ctx.fillRect(-7 + typeHand, -6 - bob, 4, 3);
      ctx.fillRect(3 - typeHand, -6 - bob, 4, 3);
    }

    // 3. Overhead Name & Status UI Tag
    ctx.textAlign = 'center';
    
    // Agent Name Pill
    const nameY = -34 - bob;
    ctx.font = '700 9px Inter, sans-serif';
    const nameWidth = ctx.measureText(this.state.name).width;
    
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = this.isSelected ? this.state.color : 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    this.drawRoundedRect(ctx, -nameWidth / 2 - 8, nameY - 8, nameWidth + 16, 12, 4);
    ctx.fill();
    ctx.stroke();

    // Status indicator dot
    let dotColor = '#94A3B8'; // idle grey
    if (isWorking) dotColor = '#22C55E'; // green
    if (isToolCall) dotColor = '#38BDF8'; // cyan
    if (isMeeting) dotColor = '#A855F7'; // purple
    if (isError) dotColor = '#EF4444'; // red

    ctx.fillStyle = dotColor;
    ctx.beginPath();
    ctx.arc(-nameWidth / 2 - 3, nameY - 2, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Name text
    ctx.fillStyle = '#F8FAFC';
    ctx.fillText(this.state.name, 3, nameY);

    // 4. Activity Bubble or Tool Call Badge
    if (isToolCall && this.state.activeTool) {
      const toolY = -52 - bob;
      const toolText = `⚡ ${this.state.activeTool.name}`;
      ctx.font = '600 8px Fira Code, monospace';
      const toolWidth = ctx.measureText(toolText).width;

      ctx.fillStyle = 'rgba(6, 182, 212, 0.9)';
      this.drawRoundedRect(ctx, -toolWidth / 2 - 6, toolY - 8, toolWidth + 12, 12, 3);
      ctx.fill();
      ctx.fillStyle = '#082F49';
      ctx.fillText(toolText, 0, toolY);
    } else if (isMeeting) {
      const meetY = -50 - bob;
      ctx.font = '600 8px Inter, sans-serif';
      ctx.fillStyle = 'rgba(168, 85, 247, 0.9)';
      this.drawRoundedRect(ctx, -24, meetY - 8, 48, 12, 3);
      ctx.fill();
      ctx.fillStyle = '#3B0764';
      ctx.fillText('💬 In Sync', 0, meetY);
    } else if (isError) {
      const errY = -50 - bob;
      ctx.font = '700 9px Inter, sans-serif';
      ctx.fillStyle = 'rgba(239, 68, 68, 0.95)';
      this.drawRoundedRect(ctx, -26, errY - 8, 52, 12, 3);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('⚠️ Blocked', 0, errY);
    }

    ctx.restore();
  }

  private drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}
