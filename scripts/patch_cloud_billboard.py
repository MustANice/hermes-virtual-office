with open('/root/projects/hermes-virtual-office/src/engine/RobloxOffice3D.ts', 'r') as f:
    text = f.read()

# Replace createBillboard down to updateState
start_marker = "  public createBillboard(state: AgentState): THREE.Sprite {"
end_marker = "  public tick(delta: number, simSpeed: number) {"

start_pos = text.find(start_marker)
end_pos = text.find(end_marker)

if start_pos != -1 and end_pos != -1:
    new_methods = """  public createBillboard(state: AgentState): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 460;
    canvas.height = 220;
    const ctx = canvas.getContext('2d')!;

    // Resolve 100% REAL LIVE activity information from Hermes state
    let statusDot = '#94A3B8';
    let statusBadge = 'IDLE';
    let statusBadgeColor = '#64748B';
    let activityText = 'Standby • Ready for dispatch';
    let borderColor = state.color || '#38BDF8';

    if (this.isGreeting) {
      statusDot = '#38BDF8';
      statusBadge = 'INTERACTIVE';
      statusBadgeColor = '#0284C7';
      activityText = 'Halo Bos Adhi! 👋 Siap gas task!';
    } else if (state.status === 'error' || (state.currentTask && (state.currentTask.status === 'blocked' || state.currentTask.lastFailure))) {
      statusDot = '#EF4444';
      statusBadge = 'BLOCKED';
      statusBadgeColor = '#DC2626';
      borderColor = '#EF4444';
      activityText = state.currentTask?.lastFailure || state.currentTask?.title || 'Execution blocked';
    } else if (state.status === 'meeting') {
      statusDot = '#A855F7';
      statusBadge = 'A2A MEETING';
      statusBadgeColor = '#9333EA';
      borderColor = '#A855F7';
      activityText = `War Room sync with ${state.meetingWith?.join(', ') || 'fleet'}`;
    } else if (state.status === 'working' || (state.currentTask && state.currentTask.status === 'running')) {
      statusDot = '#22C55E';
      statusBadge = 'WORKING';
      statusBadgeColor = '#059669';
      borderColor = '#22C55E';
      activityText = state.currentTask ? `Task: ${state.currentTask.title}` : (state.lastActivity || 'Running active session');
    } else if (state.status === 'tool_call') {
      statusDot = '#06B6D4';
      statusBadge = 'TOOL EXECUTION';
      statusBadgeColor = '#0891B2';
      borderColor = '#06B6D4';
      activityText = state.activeTool ? `Tool: ${state.activeTool.name}${state.activeTool.snippet ? ' (' + state.activeTool.snippet + ')' : ''}` : 'Tool execution in progress';
    } else {
      // Real idle status from Hermes
      statusDot = '#94A3B8';
      statusBadge = 'IDLE';
      statusBadgeColor = '#64748B';
      activityText = state.lastActivity && state.lastActivity !== 'Processing' ? state.lastActivity : 'Standby • Ready for dispatch';
    }

    // Geometry parameters for the cloud
    const cx = 35, cy = 25, cw = 390, ch = 100;

    // Draw Puffy Cartoon Thought Cloud (Teks Berawan)
    // 1. Soft Ambient Drop Shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.16)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 6;
    this.drawSymmetricalCloud(ctx, cx, cy, cw, ch);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.restore();

    // 2. Crisp Emissive Border
    ctx.save();
    this.drawSymmetricalCloud(ctx, cx, cy, cw, ch);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2.8;
    ctx.stroke();

    // 3. Descending Trail Bubbles (Thought Cloud Trail leading straight down to avatar's head)
    const tailX = cx + cw * 0.5;
    const tailY = cy + ch + 2;
    [
      { x: tailX, y: tailY + 8, r: 6.5 },
      { x: tailX - 4, y: tailY + 22, r: 4.5 },
      { x: tailX - 7, y: tailY + 34, r: 2.8 },
    ].forEach((b) => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    });
    ctx.restore();

    // 4. Header inside Cloud: Status Dot + Agent Name + Status Badge
    ctx.beginPath();
    ctx.arc(82, 57, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = statusDot;
    ctx.fill();

    ctx.font = 'bold 15px Inter, sans-serif';
    ctx.fillStyle = '#0F172A';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${state.name} • ${state.role.split('&')[0].trim()}`, 96, 58);

    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillStyle = statusBadgeColor;
    ctx.textAlign = 'right';
    ctx.fillText(statusBadge, 375, 58);

    // 5. Divider Line inside Cloud
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.8)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(80, 72);
    ctx.lineTo(375, 72);
    ctx.stroke();

    // 6. Real Live Activity Description (Second Line)
    ctx.font = '500 13px Inter, sans-serif';
    ctx.fillStyle = '#334155';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const maxChars = 38;
    const truncatedActivity = activityText.length > maxChars ? activityText.slice(0, maxChars - 1) + '…' : activityText;
    ctx.fillText(truncatedActivity, 80, 92);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: true, depthWrite: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(3.4, 1.62, 1);
    return sprite;
  }

  private drawSymmetricalCloud(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.beginPath();
    const r = h * 0.45;
    
    // Left lobe
    ctx.arc(x + r * 0.85, y + h * 0.5, r * 0.72, Math.PI * 0.5, Math.PI * 1.5);
    
    // Top lobes (4 symmetrical arcs)
    ctx.arc(x + w * 0.22, y + r * 0.42, r * 0.65, Math.PI * 1.05, Math.PI * 1.85);
    ctx.arc(x + w * 0.42, y + r * 0.28, r * 0.78, Math.PI * 1.15, Math.PI * 1.95);
    ctx.arc(x + w * 0.62, y + r * 0.28, r * 0.78, Math.PI * 1.05, Math.PI * 1.85);
    ctx.arc(x + w * 0.80, y + r * 0.42, r * 0.65, Math.PI * 1.15, Math.PI * 1.95);
    
    // Right lobe
    ctx.arc(x + w - r * 0.85, y + h * 0.5, r * 0.72, -Math.PI * 0.5, Math.PI * 0.5);
    
    // Bottom lobes (4 symmetrical arcs)
    ctx.arc(x + w * 0.78, y + h - r * 0.42, r * 0.62, 0, Math.PI * 0.85);
    ctx.arc(x + w * 0.58, y + h - r * 0.32, r * 0.72, Math.PI * 0.15, Math.PI * 0.95);
    ctx.arc(x + w * 0.38, y + h - r * 0.32, r * 0.72, Math.PI * 0.05, Math.PI * 0.85);
    ctx.arc(x + w * 0.20, y + h - r * 0.42, r * 0.62, Math.PI * 0.15, Math.PI * 1.0);
    
    ctx.closePath();
  }

  public onUserClick() {
    this.jumpVelocity = 0.35;
    this.isGreeting = true;
    this.refreshBillboard();
    setTimeout(() => {
      this.isGreeting = false;
      this.refreshBillboard();
    }, 4000);
  }

  public refreshBillboard() {
    this.group.remove(this.billboard);
    this.billboard = this.createBillboard(this.state);
    this.billboard.position.y = 4.2;
    this.group.add(this.billboard);
  }

  public updateState(newState: AgentState) {
    this.state = newState;
    this.refreshBillboard();
  }

"""
    new_text = text[:start_pos] + new_methods + text[end_pos:]
    with open('/root/projects/hermes-virtual-office/src/engine/RobloxOffice3D.ts', 'w') as f:
        f.write(new_text)
    print("SUCCESS: integrated cloud thought bubble with real Hermes live activities!")
else:
    print("FAILED to locate markers")
