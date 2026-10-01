with open('/root/projects/hermes-virtual-office/scripts/extracted_avatar.ts', 'r') as f:
    code = f.read()

# 1. Update billboard scale to 15.5 x 7.0 and billboardY to 9.2
code = code.replace("sprite.scale.set(11.0, 5.0, 1);", "sprite.scale.set(15.5, 7.0, 1);")
code = code.replace("private readonly billboardY = 7.6;", "private readonly billboardY = 9.2;")

# 2. Update typography in createBillboardTexture
old_draw_content = """    const font = 'Inter, "Segoe UI", sans-serif';
    const left = 190;
    const right = 910;

    // 4. Status Badge on Right
    ctx.font = `bold 24px ${font}`;
    const badgeWidth = Math.ceil(ctx.measureText(content.badge).width) + 38;
    const badgeX = right - badgeWidth;
    const badgeY = 145;
    const badgeH = 46;

    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeWidth, badgeH, 23);
    ctx.fillStyle = content.color;
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(content.badge, badgeX + badgeWidth / 2, badgeY + badgeH / 2);

    // 5. Agent Name on Left (with 24px safety margin from badge)
    ctx.font = `bold 34px ${font}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#0F172A';
    const maxNameWidth = badgeX - left - 24;
    ctx.fillText(
      this.fitText(ctx, `${this.roleIcon()} ${state.name} • ${state.role.split('&')[0].trim()}`, maxNameWidth),
      left,
      badgeY + badgeH / 2,
    );

    // 6. Crisp Horizontal Divider
    ctx.beginPath();
    ctx.moveTo(left, 215);
    ctx.lineTo(right, 215);
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 7. Large, Bold, Clear Activity Explanation in plain Indonesian
    ctx.font = `bold 30px ${font}`;
    ctx.fillStyle = '#1E293B';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      this.fitText(ctx, content.activity, right - left),
      left,
      260,
    );"""

new_draw_content = """    const font = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const left = 170;
    const right = 930;

    // 4. Status Badge on Right (Bold 28px)
    ctx.font = `bold 28px ${font}`;
    const badgeWidth = Math.ceil(ctx.measureText(content.badge).width) + 44;
    const badgeX = right - badgeWidth;
    const badgeY = 138;
    const badgeH = 54;

    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeWidth, badgeH, 27);
    ctx.fillStyle = content.color;
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(content.badge, badgeX + badgeWidth / 2, badgeY + badgeH / 2 + 1);

    // 5. Agent Name on Left (Huge 44px bold with safe margin)
    ctx.font = `900 44px ${font}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#0F172A';
    const maxNameWidth = badgeX - left - 20;
    ctx.fillText(
      this.fitText(ctx, `${this.roleIcon()} ${state.name}`, maxNameWidth),
      left,
      badgeY + badgeH / 2,
    );

    // 6. Crisp Horizontal Divider
    ctx.beginPath();
    ctx.moveTo(left, 215);
    ctx.lineTo(right, 215);
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 7. Large, Bold, Clear Activity Explanation (Huge 34px bold, perfectly fitting)
    ctx.font = `bold 34px ${font}`;
    ctx.fillStyle = '#1E293B';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      this.fitText(ctx, content.activity, right - left),
      left,
      265,
    );"""

code = code.replace(old_draw_content, new_draw_content)

# 3. Add initial flexible idle dispersion in constructor
old_spot_init = """    // Place at assigned terraced spot
    const spot = AGENT_3D_SPOTS[state.id] || { x: 0, y: 0, z: 0, rotY: 0 };
    this.currentX = spot.x;
    this.currentY = spot.y;
    this.currentZ = spot.z;
    this.targetX = spot.x;
    this.targetY = spot.y;
    this.targetZ = spot.z;
    this.group.position.set(this.currentX, this.currentY, this.currentZ);
    this.group.rotation.y = spot.rotY;"""

new_spot_init = """    // Initial flexible posture dispersion for idle agents
    // (If idle, some start at sofa, coffee, or walking, not all glued to desk!)
    const initialIdleSpreads: Record<string, { x: number; y: number; z: number; rotY: number; loc: 'desk' | 'coffee' | 'sofa' | 'meeting' }> = {
      sentinel: { x: -3.8, y: 0.12, z: 9.8, rotY: 0, loc: 'coffee' }, // standing at coffee counter
      nexus: { x: -4.0, y: 0.12, z: 14.5, rotY: 0, loc: 'sofa' },      // lounging on sofa
      aurora: { x: 0.0, y: 0.12, z: -5.12, rotY: 0, loc: 'meeting' }, // reviewing War Room hologram
      radar: { x: 2.0, y: 0.12, z: 8.5, rotY: Math.PI / 2, loc: 'other' as any }, // casually stretching in lounge
    };

    const isIdle = state.status === 'idle';
    const initSpread = isIdle && initialIdleSpreads[state.id];
    const spot = initSpread || AGENT_3D_SPOTS[state.id] || { x: 0, y: 0, z: 0, rotY: 0 };

    this.currentX = spot.x;
    this.currentY = spot.y;
    this.currentZ = spot.z;
    this.targetX = spot.x;
    this.targetY = spot.y;
    this.targetZ = spot.z;
    this.currentLocation = initSpread ? initSpread.loc : 'desk';
    this.group.position.set(this.currentX, this.currentY, this.currentZ);
    this.group.rotation.y = spot.rotY;
    // Stagger idle movement timers so agents don't move in robotic unison
    this.actionTimer = Math.random() * 22;"""

code = code.replace(old_spot_init, new_spot_init)

# 4. Make idle timer more lively (every 18-24s instead of 32s)
code = code.replace("if (this.actionTimer >= 32) {", "if (this.actionTimer >= 20) {")

with open('/root/projects/hermes-virtual-office/scripts/extracted_avatar.ts', 'w') as f:
    f.write(code)

print("SUCCESS: updated extracted_avatar.ts with mega billboard and lively idle postures!")
