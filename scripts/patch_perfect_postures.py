with open('/root/projects/hermes-virtual-office/scripts/extracted_avatar.ts', 'r') as f:
    code = f.read()

# 1. Fix text font to bold 31px so it NEVER truncates
code = code.replace("ctx.font = `800 40px ${font}`;", "ctx.font = `bold 31px ${font}`;")

# 2. Richer initial idle spread across the entire office so idle agents aren't just glued to desk chairs!
old_spread = """    const initialIdleSpreads: Record<string, { x: number; y: number; z: number; rotY: number; loc: 'desk' | 'coffee' | 'sofa' | 'meeting' }> = {
      sentinel: { x: -3.8, y: 0.12, z: 9.8, rotY: 0, loc: 'coffee' }, // standing at coffee counter
      nexus: { x: -4.0, y: 0.12, z: 14.5, rotY: 0, loc: 'sofa' },      // lounging on sofa
      aurora: { x: 0.0, y: 0.12, z: -5.12, rotY: 0, loc: 'meeting' }, // reviewing War Room hologram
      radar: { x: 2.0, y: 0.12, z: 8.5, rotY: Math.PI / 2, loc: 'other' as any }, // casually stretching in lounge
    };"""

new_spread = """    const initialIdleSpreads: Record<string, { x: number; y: number; z: number; rotY: number; loc: 'desk' | 'coffee' | 'sofa' | 'meeting' | 'other' }> = {
      sentinel: { x: -3.8, y: 0.12, z: 9.8, rotY: 0, loc: 'coffee' },              // standing at coffee counter sipping coffee
      nexus: { x: -4.0, y: 0.12, z: 14.5, rotY: 0, loc: 'sofa' },                   // lounging casually on sofa
      aurora: { x: 0.0, y: 0.12, z: -5.12, rotY: 0, loc: 'meeting' },              // standing at War Room hologram
      frame: { x: 0.0, y: 0.12, z: -1.5, rotY: Math.PI, loc: 'other' },             // taking a stroll in central corridor
      radar: { x: 23.5, y: 0.12, z: -15.5, rotY: 0, loc: 'other' },                 // standing by Research data wall
      prism: { x: -21.0, y: 0.12, z: 6.5, rotY: 0, loc: 'other' },                  // standing by QA telemetry screen
      atlas: { x: 21.0, y: 0.12, z: 8.0, rotY: -Math.PI / 2, loc: 'other' },        // standing by datacenter server racks
      lens: { x: -17.55, y: 0.12, z: 9.8, rotY: 0, loc: 'desk' },                  // leaning back at desk
      quant: { x: 17.0, y: 0.12, z: -13.0, rotY: 0, loc: 'desk' },                 // leaning back at desk
      forge: { x: -5.3, y: 0.12, z: -17.1, rotY: 0, loc: 'desk' },                 // leaning back at desk
      orion: { x: -21, y: 0.12, z: -16.15, rotY: Math.PI, loc: 'desk' },            // deep executive lean-back
    };"""

code = code.replace(old_spread, new_spread)

# 3. Enhance idle postures: when standing in 'other' locations, relaxed contrapposto standing looking around!
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

with open('/root/projects/hermes-virtual-office/scripts/extracted_avatar.ts', 'w') as f:
    f.write(code)

print("SUCCESS: updated extracted_avatar.ts with non-truncated text and rich idle dispersion!")
