with open('/root/projects/hermes-virtual-office/src/engine/RobloxOffice3D.ts', 'r') as f:
    text = f.read()

# 1. Update AGENT_3D_SPOTS
old_spots = """export const AGENT_3D_SPOTS: Record<string, { x: number; y: number; z: number; rotY: number }> = {
  orion: { x: -13.3, y: 0.12, z: -13.2, rotY: 0 },
  forge: { x: -3.2, y: 0.12, z: -11.2, rotY: Math.PI },
  frame: { x: 3.2, y: 0.12, z: -11.2, rotY: Math.PI },
  aurora: { x: 0.0, y: 0.12, z: -12.8, rotY: Math.PI },
  quant: { x: 11.2, y: 0.12, z: -10.25, rotY: Math.PI },
  radar: { x: 15.4, y: 0.12, z: -10.25, rotY: Math.PI },
  prism: { x: -15.4, y: 0.12, z: 10.2, rotY: Math.PI },
  lens: { x: -11.2, y: 0.12, z: 10.2, rotY: Math.PI },
  sentinel: { x: -13.25, y: 0.12, z: 13.55, rotY: 0 },
  nexus: { x: 4.2, y: 0.12, z: 10.2, rotY: Math.PI },
  atlas: { x: 10.8, y: 0.12, z: 9.2, rotY: Math.PI },
};"""

new_spots = """export const AGENT_3D_SPOTS: Record<string, { x: number; y: number; z: number; rotY: number }> = {
  orion: { x: -13.4, y: 0.12, z: -13.15, rotY: 0 },
  forge: { x: -2.75, y: 0.12, z: -11.65, rotY: 0 },
  frame: { x: 2.75, y: 0.12, z: -11.65, rotY: 0 },
  aurora: { x: -2.15, y: 0.12, z: -8.75, rotY: Math.PI / 2 },
  quant: { x: 10.3, y: 0.12, z: -9.05, rotY: 0 },
  radar: { x: 15.4, y: 0.12, z: -9.05, rotY: 0 },
  prism: { x: -15.9, y: 0.12, z: 9.6, rotY: 0 },
  lens: { x: -10.65, y: 0.12, z: 9.6, rotY: 0 },
  sentinel: { x: -13.25, y: 0.12, z: 13.55, rotY: 0 },
  nexus: { x: 4.12, y: 0.12, z: 12.0, rotY: 0 },
  atlas: { x: 11.15, y: 0.12, z: 9.65, rotY: 0 },
};"""

if old_spots in text:
    text = text.replace(old_spots, new_spots)
    print("Replaced AGENT_3D_SPOTS!")
else:
    print("Could not find old_spots")

# 2. Update IDLE_LOCATIONS
old_idle = """    const IDLE_LOCATIONS: Record<string, { x: number; y: number; z: number; rotY: number; loc: 'desk' | 'coffee' | 'sofa' | 'meeting' | 'other' }> = {
      orion: { x: -13.4, y: 0.12, z: -13.15, rotY: 0, loc: 'desk' },
      forge: { x: -2.75, y: 0.12, z: -13.5, rotY: 0, loc: 'desk' },
      frame: { x: 2.75, y: 0.12, z: -13.5, rotY: 0, loc: 'desk' },
      aurora: { x: -3.35, y: 0.12, z: -7.9, rotY: Math.PI, loc: 'desk' },
      quant: { x: 10.3, y: 0.12, z: -11.05, rotY: 0, loc: 'desk' },
      radar: { x: 13.2, y: 0.12, z: -14.2, rotY: Math.PI, loc: 'other' },
      prism: { x: -15.4, y: 0.12, z: 9.4, rotY: Math.PI, loc: 'desk' },
      lens: { x: -11.2, y: 0.12, z: 9.4, rotY: Math.PI, loc: 'desk' },
      sentinel: { x: -13.25, y: 0.12, z: 13.55, rotY: 0, loc: 'desk' },
      nexus: { x: 4.12, y: 0.12, z: 12.0, rotY: 0, loc: 'desk' },
      atlas: { x: 10.8, y: 0.12, z: 8.4, rotY: Math.PI, loc: 'desk' },
    };"""

new_idle = """    const IDLE_LOCATIONS: Record<string, { x: number; y: number; z: number; rotY: number; loc: 'desk' | 'coffee' | 'sofa' | 'meeting' | 'other' }> = {
      orion: { x: -13.4, y: 0.12, z: -13.15, rotY: 0, loc: 'desk' },
      forge: { x: -2.75, y: 0.12, z: -11.65, rotY: 0, loc: 'desk' },
      frame: { x: 2.75, y: 0.12, z: -11.65, rotY: 0, loc: 'desk' },
      aurora: { x: -2.15, y: 0.12, z: -8.75, rotY: Math.PI / 2, loc: 'desk' },
      quant: { x: 10.3, y: 0.12, z: -9.05, rotY: 0, loc: 'desk' },
      radar: { x: 15.4, y: 0.12, z: -9.05, rotY: 0, loc: 'desk' },
      prism: { x: -15.9, y: 0.12, z: 9.6, rotY: 0, loc: 'desk' },
      lens: { x: -10.65, y: 0.12, z: 9.6, rotY: 0, loc: 'desk' },
      sentinel: { x: -13.25, y: 0.12, z: 13.55, rotY: 0, loc: 'desk' },
      nexus: { x: 4.12, y: 0.12, z: 12.0, rotY: 0, loc: 'desk' },
      atlas: { x: 11.15, y: 0.12, z: 9.65, rotY: 0, loc: 'desk' },
    };"""

if old_idle in text:
    text = text.replace(old_idle, new_idle)
    print("Replaced IDLE_LOCATIONS!")
else:
    print("Could not find old_idle")

# 3. Update camera target and distance
text = text.replace(
    "public cameraTarget = new THREE.Vector3(0, 0.8, 0);",
    "public cameraTarget = new THREE.Vector3(0, 0.4, 1.2);"
)
text = text.replace(
    "this.cameraTarget.set(0, 0.8, 0);\n      this.cameraDistance = 56;",
    "this.cameraTarget.set(0, 0.4, 1.2);\n      this.cameraDistance = 58;"
)
text = text.replace(
    "this.cameraDistance = 54;",
    "this.cameraDistance = 58;"
)

with open('/root/projects/hermes-virtual-office/src/engine/RobloxOffice3D.ts', 'w') as f:
    f.write(text)

print("RobloxOffice3D camera and spot alignments patched successfully!")
