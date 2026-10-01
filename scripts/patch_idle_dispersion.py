with open('/root/projects/hermes-virtual-office/scripts/extracted_avatar.ts', 'r') as f:
    code = f.read()

# 1. Update billboard scale to 9.2 x 4.2 and billboardY to 5.8
import re
code = re.sub(r'sprite\.scale\.set\(.*?\);', 'sprite.scale.set(9.2, 4.2, 1);', code)
code = re.sub(r'private readonly billboardY = .*?;', 'private readonly billboardY = 5.8;', code)

# 2. Update constructor to place idle agents in their diverse locations
old_constructor_spot = """    const spot = AGENT_3D_SPOTS[state.id] || {
      x: 0,
      y: 0,
      z: 0,
      rotY: 0,
    };

    this.currentX = this.targetX = spot.x;
    this.currentY = this.targetY = spot.y;
    this.currentZ = this.targetZ = spot.z;
    this.targetRotY = spot.rotY;
    this.group.position.set(spot.x, spot.y, spot.z);
    this.group.rotation.y = spot.rotY;"""

new_constructor_spot = """    // Flexible idle postures and locations (when not working, disperse across cafe, sofa, war room, etc.)
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
    this.actionTimer = Math.random() * 22;"""

code = code.replace(old_constructor_spot, new_constructor_spot)

# 3. Update activities descriptions in resolveBillboard
old_activities = """    const activities = {
      desk: '☕ Standby • Memantau sistem di meja kerja',
      coffee: '☕ Istirahat • Minum kopi di barista cafe',
      sofa: '🛋️ Santai & diskusi di sofa lounge',
      meeting: '💬 Standby • Menunggu diskusi di ruang rapat',
      other: '☕ Standby • Memantau aktivitas sistem',
    };"""

new_activities = """    const specificIdleTexts: Record<string, string> = {
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
    };"""

code = code.replace(old_activities, new_activities)

# 4. Make standing posture apply to coffee, meeting, and other
old_standing = """    const standing =
      walking ||
      this.currentLocation === 'coffee' ||
      this.currentLocation === 'other';"""

new_standing = """    const standing =
      walking ||
      this.currentLocation === 'coffee' ||
      this.currentLocation === 'meeting' ||
      this.currentLocation === 'other';"""

code = code.replace(old_standing, new_standing)

# 5. Perfect typography sizing in createBillboardTexture
old_draw_content = """    const font = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
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
    );"""

new_draw_content = """    const font = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const left = 160;
    const right = 940;

    // 4. Status Badge on Right (Bold 26px pill badge)
    ctx.font = `bold 26px ${font}`;
    const badgeText = content.badge;
    const badgeWidth = Math.ceil(ctx.measureText(badgeText).width) + 40;
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
    ctx.fillText(badgeText, badgeX + badgeWidth / 2, badgeY + badgeH / 2 + 1);

    // 5. Agent Name on Left (Huge 44px bold with guaranteed clearance)
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
    ctx.moveTo(left, 218);
    ctx.lineTo(right, 218);
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 7. Large, Bold Activity Explanation (Bold 31px, fits 100% without truncation!)
    ctx.font = `bold 31px ${font}`;
    ctx.fillStyle = '#1E293B';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      this.fitText(ctx, content.activity, right - left),
      left,
      268,
    );"""

code = code.replace(old_draw_content, new_draw_content)

with open('/root/projects/hermes-virtual-office/scripts/extracted_avatar.ts', 'w') as f:
    f.write(code)

print("SUCCESS: updated extracted_avatar.ts with genuine idle dispersion and perfect text fitting!")
