with open('/root/projects/hermes-virtual-office/src/engine/RobloxOffice3D.ts', 'r') as f:
    text = f.read()

# 1. Update scale in constructor
text = text.replace(
    'this.group.scale.setScalar(0.68);',
    'this.group.scale.setScalar(0.54);'
)
text = text.replace(
    'this.group.scale.setScalar(0.72);',
    'this.group.scale.setScalar(0.54);'
)

# 2. Add spawnInitialAgents to RobloxOffice3D
spawn_code = '''  private spawnInitialAgents() {
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
  }'''

if 'private spawnInitialAgents()' not in text:
    target_str = 'this.setupControls();'
    replacement = 'this.setupControls();\n    this.spawnInitialAgents();'
    text = text.replace(target_str, replacement)
    
    # insert method before setupControls
    text = text.replace('private setupControls() {', spawn_code + '\n\n  private setupControls() {')
    print("Added spawnInitialAgents and call in constructor!")

# 3. Update camera distance
text = text.replace('public cameraDistance = 86;', 'public cameraDistance = 54;')
text = text.replace('public cameraDistance = 56;', 'public cameraDistance = 54;')
text = text.replace('this.cameraDistance = 56;', 'this.cameraDistance = 54;')
text = text.replace('this.cameraDistance = 86;', 'this.cameraDistance = 54;')
text = text.replace('this.cameraDistance = 82;', 'this.cameraDistance = 54;')

# 4. Update sitting hip height to match table height
text = text.replace('hipY = 1.44;', 'hipY = 1.25;')
text = text.replace('torsoY = 2.34 + breathY * 0.6;', 'torsoY = 2.15 + breathY * 0.6;')

with open('/root/projects/hermes-virtual-office/src/engine/RobloxOffice3D.ts', 'w') as f:
    f.write(text)

print("RobloxOffice3D.ts live patch applied successfully!")
