import re

with open('/root/projects/hermes-virtual-office/scripts/extracted_avatar.ts', 'r') as f:
    code = f.read()

# 1. Update billboard scale to 20.0 x 8.8 and billboardY to 10.5
code = re.sub(r'sprite\.scale\.set\(.*?\);', 'sprite.scale.set(20.0, 8.8, 1);', code)
code = re.sub(r'private readonly billboardY = .*?;', 'private readonly billboardY = 10.5;', code)

# 2. Update canvas size and typography in createBillboardTexture
old_tex_func_start = "  private createBillboardTexture(state: AgentState): THREE.CanvasTexture {"
old_tex_func_end = "  public createBillboard(state: AgentState): THREE.Sprite {"

new_tex_func = """  private createBillboardTexture(state: AgentState): THREE.CanvasTexture {
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
    ctx.font = `800 40px ${font}`;
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

"""

start_pos = code.find(old_tex_func_start)
end_pos = code.find(old_tex_func_end)

if start_pos != -1 and end_pos != -1:
    code = code[:start_pos] + new_tex_func + code[end_pos:]

# 3. Enhance flexible idle postures in applyPosture
old_posture_start = "    } else if (!standing) {\n      torsoRX = -0.1;\n      torsoZ = -0.07;"
new_posture = """    } else if (!standing) {
      // Idle at desk: Relaxed lean-back posture with arms resting casually on chair armrests!
      torsoRX = -0.22;
      torsoY = 1.72;
      torsoZ = -0.12;
      leftArmRX = -0.42;
      rightArmRX = -0.42;
      leftArmRZ = -0.28;
      rightArmRZ = 0.28;
      headRX = 0.04;
      headRY = Math.sin(t * 0.7) * 0.16; // casual head looking around"""

code = code.replace(old_posture_start, new_posture)

# 4. Make idle routine active and lively across rooms
code = code.replace("if (this.actionTimer >= 20) {", "if (this.actionTimer >= 14) {")

with open('/root/projects/hermes-virtual-office/scripts/extracted_avatar.ts', 'w') as f:
    f.write(code)

print("SUCCESS: upgraded extracted_avatar.ts with mega 20x8.8 billboard and ultra-distinct postures!")
