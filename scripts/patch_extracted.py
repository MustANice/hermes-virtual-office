with open('/root/projects/hermes-virtual-office/scripts/extracted_avatar.ts', 'r') as f:
    avatar_code = f.read()

# Replace drawSymmetricalCloud and createBillboardTexture with our flawless union cloud
old_draw_cloud = """  private drawSymmetricalCloud(
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
      x + width * 0.68, y + height * 1.02,
      x + width * 0.62, y + height * 0.92,
    );
    ctx.bezierCurveTo(
      x + width * 0.58, y + height * 1.04,
      x + width * 0.42, y + height * 1.04,
      x + width * 0.38, y + height * 0.92,
    );
    ctx.bezierCurveTo(
      x + width * 0.32, y + height * 1.02,
      x + width * 0.12, y + height * 1.02,
      x + width * 0.1, y + height * 0.8,
    );
    ctx.closePath();
  }"""

new_draw_cloud = """  private drawSymmetricalCloud(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    // Defined as a smooth series of overlapping puffy circles around a central core
    const circles = [
      { x: x + width * 0.15, y: y + height * 0.25, r: height * 0.35 },
      { x: x + width * 0.32, y: y + height * 0.12, r: height * 0.42 },
      { x: x + width * 0.50, y: y + height * 0.08, r: height * 0.45 },
      { x: x + width * 0.68, y: y + height * 0.12, r: height * 0.42 },
      { x: x + width * 0.85, y: y + height * 0.25, r: height * 0.35 },
      { x: x + width * 0.92, y: y + height * 0.55, r: height * 0.38 },
      { x: x + width * 0.84, y: y + height * 0.85, r: height * 0.36 },
      { x: x + width * 0.67, y: y + height * 0.92, r: height * 0.40 },
      { x: x + width * 0.50, y: y + height * 0.95, r: height * 0.42 },
      { x: x + width * 0.33, y: y + height * 0.92, r: height * 0.40 },
      { x: x + width * 0.16, y: y + height * 0.85, r: height * 0.36 },
      { x: x + width * 0.08, y: y + height * 0.55, r: height * 0.38 },
    ];

    ctx.beginPath();
    ctx.roundRect(x + width * 0.12, y + height * 0.18, width * 0.76, height * 0.64, 40);
    circles.forEach((c) => {
      ctx.moveTo(c.x + c.r, c.y);
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    });
  }"""

avatar_code = avatar_code.replace(old_draw_cloud, new_draw_cloud)

# Update createBillboardTexture and sprite scale
old_billboard_tex_start = "  private createBillboardTexture(state: AgentState): THREE.CanvasTexture {"
old_billboard_tex_end = "  public createBillboard(state: AgentState): THREE.Sprite {"

new_billboard_tex = """  private createBillboardTexture(state: AgentState): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1100;
    canvas.height = 500;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is required for avatar billboards.');

    const content = this.resolveBillboard(state);
    this.currentThought = content.activity;

    const cx = 80, cy = 60, cw = 940, ch = 250;

    // 1. Soft Ambient Drop Shadow
    ctx.save();
    ctx.shadowColor = 'rgba(15, 23, 42, 0.24)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 12;
    this.drawSymmetricalCloud(ctx, cx, cy, cw, ch);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.restore();

    // 2. Crisp Vibrant Border
    this.drawSymmetricalCloud(ctx, cx, cy, cw, ch);
    ctx.strokeStyle = content.color;
    ctx.lineWidth = 6;
    ctx.stroke();

    // 3. Descending Trail Bubbles (pointing down to avatar head)
    const tailX = 550;
    const tailY = 410;
    [
      { x: tailX, y: tailY + 10, r: 22 },
      { x: tailX - 6, y: tailY + 45, r: 14 },
      { x: tailX - 12, y: tailY + 70, r: 8 },
    ].forEach((b) => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.strokeStyle = content.color;
      ctx.lineWidth = 4;
      ctx.stroke();
    });

    const font = 'Inter, "Segoe UI", sans-serif';
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
    );

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    return texture;
  }

"""

start_pos = avatar_code.find(old_billboard_tex_start)
end_pos = avatar_code.find(old_billboard_tex_end)

if start_pos != -1 and end_pos != -1:
    avatar_code = avatar_code[:start_pos] + new_billboard_tex + avatar_code[end_pos:]

# Update sprite scale in createBillboard
avatar_code = avatar_code.replace("sprite.scale.set(6.8, 2.9, 1);", "sprite.scale.set(11.0, 5.0, 1);")
avatar_code = avatar_code.replace("private readonly billboardY = 6.2;", "private readonly billboardY = 7.6;")

with open('/root/projects/hermes-virtual-office/scripts/extracted_avatar.ts', 'w') as f:
    f.write(avatar_code)

print("SUCCESS: updated extracted_avatar.ts with flawless union cloud and enlarged 11x5 sprite scale!")
