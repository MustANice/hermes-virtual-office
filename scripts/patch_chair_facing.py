with open('/root/projects/hermes-virtual-office/src/engine/ChairInteractionSystem.ts', 'r') as f:
    text = f.read()

# Replace Aurora chair facingAngle & approach
old_aurora = """registerChair({
  chairId: 'dev_chair_aurora',
  name: 'Aurora Workstation Chair',
  roomId: 'dev',
  deskId: 'dev_desk_3',
  seatAnchor: { x: -2.15, y: 0.68, z: -8.75 },
  approachPoint: { x: -1.05, y: 0.08, z: -8.75 },
  exitPoint: { x: -1.05, y: 0.08, z: -8.75 },
  facingAngle: Math.PI / 2, // Faces West toward desk at X = -3.35
  kind: 'task',
});"""

new_aurora = """registerChair({
  chairId: 'dev_chair_aurora',
  name: 'Aurora Workstation Chair',
  roomId: 'dev',
  deskId: 'dev_desk_3',
  seatAnchor: { x: -2.15, y: 0.68, z: -8.75 },
  approachPoint: { x: -1.05, y: 0.08, z: -8.75 },
  exitPoint: { x: -1.05, y: 0.08, z: -8.75 },
  facingAngle: -Math.PI / 2, // Faces West toward desk at X = -3.35
  kind: 'task',
});"""
text = text.replace(old_aurora, new_aurora)

# Replace Quant and Radar
old_quant_radar = """registerChair({
  chairId: 'res_chair_quant',
  name: 'Quant Research Chair',
  roomId: 'research',
  deskId: 'research_desk_1',
  seatAnchor: { x: 10.3, y: 0.68, z: -9.05 },
  approachPoint: { x: 10.3, y: 0.08, z: -7.85 },
  exitPoint: { x: 10.3, y: 0.08, z: -7.85 },
  facingAngle: 0.0, // Faces North toward desk at Z = -10.25
  kind: 'task',
});

registerChair({
  chairId: 'res_chair_radar',
  name: 'Radar Research Chair',
  roomId: 'research',
  deskId: 'research_desk_2',
  seatAnchor: { x: 15.4, y: 0.68, z: -9.05 },
  approachPoint: { x: 15.4, y: 0.08, z: -7.85 },
  exitPoint: { x: 15.4, y: 0.08, z: -7.85 },
  facingAngle: 0.0, // Faces North toward desk at Z = -10.25
  kind: 'task',
});"""

new_quant_radar = """registerChair({
  chairId: 'res_chair_quant',
  name: 'Quant Research Chair',
  roomId: 'research',
  deskId: 'research_desk_1',
  seatAnchor: { x: 10.3, y: 0.68, z: -9.05 },
  approachPoint: { x: 10.3, y: 0.08, z: -7.85 },
  exitPoint: { x: 10.3, y: 0.08, z: -7.85 },
  facingAngle: Math.PI, // Faces North toward desk at Z = -10.25
  kind: 'task',
});

registerChair({
  chairId: 'res_chair_radar',
  name: 'Radar Research Chair',
  roomId: 'research',
  deskId: 'research_desk_2',
  seatAnchor: { x: 15.4, y: 0.68, z: -9.05 },
  approachPoint: { x: 15.4, y: 0.08, z: -7.85 },
  exitPoint: { x: 15.4, y: 0.08, z: -7.85 },
  facingAngle: Math.PI, // Faces North toward desk at Z = -10.25
  kind: 'task',
});"""
text = text.replace(old_quant_radar, new_quant_radar)

# Replace Forge and Frame facing angles to Math.PI (facing North)
old_forge_frame = """registerChair({
  chairId: 'dev_chair_forge',
  name: 'Forge Workstation Chair',
  roomId: 'dev',
  deskId: 'dev_desk_1',
  seatAnchor: { x: -2.75, y: 0.68, z: -11.65 },
  approachPoint: { x: -2.75, y: 0.08, z: -10.55 },
  exitPoint: { x: -2.75, y: 0.08, z: -10.55 },
  facingAngle: 0.0, // Faces North toward desk at Z = -12.85
  kind: 'task',
});

registerChair({
  chairId: 'dev_chair_frame',
  name: 'Frame Workstation Chair',
  roomId: 'dev',
  deskId: 'dev_desk_2',
  seatAnchor: { x: 2.75, y: 0.68, z: -11.65 },
  approachPoint: { x: 2.75, y: 0.08, z: -10.55 },
  exitPoint: { x: 2.75, y: 0.08, z: -10.55 },
  facingAngle: 0.0, // Faces North toward desk at Z = -12.85
  kind: 'task',
});"""

new_forge_frame = """registerChair({
  chairId: 'dev_chair_forge',
  name: 'Forge Workstation Chair',
  roomId: 'dev',
  deskId: 'dev_desk_1',
  seatAnchor: { x: -2.75, y: 0.68, z: -11.65 },
  approachPoint: { x: -2.75, y: 0.08, z: -10.55 },
  exitPoint: { x: -2.75, y: 0.08, z: -10.55 },
  facingAngle: Math.PI, // Faces North toward desk at Z = -12.85
  kind: 'task',
});

registerChair({
  chairId: 'dev_chair_frame',
  name: 'Frame Workstation Chair',
  roomId: 'dev',
  deskId: 'dev_desk_2',
  seatAnchor: { x: 2.75, y: 0.68, z: -11.65 },
  approachPoint: { x: 2.75, y: 0.08, z: -10.55 },
  exitPoint: { x: 2.75, y: 0.08, z: -10.55 },
  facingAngle: Math.PI, // Faces North toward desk at Z = -12.85
  kind: 'task',
});"""
text = text.replace(old_forge_frame, new_forge_frame)

# Replace QA chairs (Prism, Lens, Sentinel) facingAngle to Math.PI
old_qa_chairs = """registerChair({
  chairId: 'qa_chair_prism',
  name: 'Prism QA Workstation Chair',
  roomId: 'qa_security',
  deskId: 'qa_desk_1',
  seatAnchor: { x: -15.9, y: 0.68, z: 9.6 },
  approachPoint: { x: -15.9, y: 0.08, z: 10.7 },
  exitPoint: { x: -15.9, y: 0.08, z: 10.7 },
  facingAngle: 0.0, // Faces North toward desk at Z = 8.4
  kind: 'task',
});

registerChair({
  chairId: 'qa_chair_lens',
  name: 'Lens QA Workstation Chair',
  roomId: 'qa_security',
  deskId: 'qa_desk_2',
  seatAnchor: { x: -10.65, y: 0.68, z: 9.6 },
  approachPoint: { x: -10.65, y: 0.08, z: 10.7 },
  exitPoint: { x: -10.65, y: 0.08, z: 10.7 },
  facingAngle: 0.0, // Faces North toward desk at Z = 8.4
  kind: 'task',
});

registerChair({
  chairId: 'qa_chair_sentinel',
  name: 'Sentinel Security Workstation Chair',
  roomId: 'qa_security',
  deskId: 'qa_desk_3',
  seatAnchor: { x: -13.25, y: 0.68, z: 13.55 },
  approachPoint: { x: -13.25, y: 0.08, z: 14.65 },
  exitPoint: { x: -13.25, y: 0.08, z: 14.65 },
  facingAngle: 0.0, // Faces North toward QA south workstation
  kind: 'task',
});"""

new_qa_chairs = """registerChair({
  chairId: 'qa_chair_prism',
  name: 'Prism QA Workstation Chair',
  roomId: 'qa_security',
  deskId: 'qa_desk_1',
  seatAnchor: { x: -15.9, y: 0.68, z: 9.6 },
  approachPoint: { x: -15.9, y: 0.08, z: 10.7 },
  exitPoint: { x: -15.9, y: 0.08, z: 10.7 },
  facingAngle: Math.PI, // Faces North toward desk at Z = 8.4
  kind: 'task',
});

registerChair({
  chairId: 'qa_chair_lens',
  name: 'Lens QA Workstation Chair',
  roomId: 'qa_security',
  deskId: 'qa_desk_2',
  seatAnchor: { x: -10.65, y: 0.68, z: 9.6 },
  approachPoint: { x: -10.65, y: 0.08, z: 10.7 },
  exitPoint: { x: -10.65, y: 0.08, z: 10.7 },
  facingAngle: Math.PI, // Faces North toward desk at Z = 8.4
  kind: 'task',
});

registerChair({
  chairId: 'qa_chair_sentinel',
  name: 'Sentinel Security Workstation Chair',
  roomId: 'qa_security',
  deskId: 'qa_desk_3',
  seatAnchor: { x: -13.25, y: 0.68, z: 13.55 },
  approachPoint: { x: -13.25, y: 0.08, z: 14.65 },
  exitPoint: { x: -13.25, y: 0.08, z: 14.65 },
  facingAngle: Math.PI, // Faces North toward QA south workstation
  kind: 'task',
});"""
text = text.replace(old_qa_chairs, new_qa_chairs)

# Replace Nexus and Atlas chairs facingAngle to Math.PI
old_nexus_atlas = """registerChair({
  chairId: 'lounge_chair_nexus',
  name: 'Nexus Operations Workstation Chair',
  roomId: 'lounge',
  deskId: 'lounge_ops_desk',
  seatAnchor: { x: 4.12, y: 0.68, z: 12.0 },
  approachPoint: { x: 4.12, y: 0.08, z: 13.1 },
  exitPoint: { x: 4.12, y: 0.08, z: 13.1 },
  facingAngle: 0.0, // Faces North
  kind: 'task',
});"""

new_nexus_atlas = """registerChair({
  chairId: 'lounge_chair_nexus',
  name: 'Nexus Operations Workstation Chair',
  roomId: 'lounge',
  deskId: 'lounge_ops_desk',
  seatAnchor: { x: 4.12, y: 0.68, z: 12.0 },
  approachPoint: { x: 4.12, y: 0.08, z: 13.1 },
  exitPoint: { x: 4.12, y: 0.08, z: 13.1 },
  facingAngle: Math.PI, // Faces North toward monitors
  kind: 'task',
});"""
text = text.replace(old_nexus_atlas, new_nexus_atlas)

old_atlas = """registerChair({
  chairId: 'sre_chair_atlas',
  name: 'Atlas SRE Operator Chair',
  roomId: 'server_room',
  deskId: 'sre_ops_desk',
  seatAnchor: { x: 11.15, y: 0.68, z: 9.65 },
  approachPoint: { x: 11.15, y: 0.08, z: 10.75 },
  exitPoint: { x: 11.15, y: 0.08, z: 10.75 },
  facingAngle: 0.0, // Faces North
  kind: 'task',
});"""

new_atlas = """registerChair({
  chairId: 'sre_chair_atlas',
  name: 'Atlas SRE Operator Chair',
  roomId: 'server_room',
  deskId: 'sre_ops_desk',
  seatAnchor: { x: 11.15, y: 0.68, z: 9.65 },
  approachPoint: { x: 11.15, y: 0.08, z: 10.75 },
  exitPoint: { x: 11.15, y: 0.08, z: 10.75 },
  facingAngle: Math.PI, // Faces North toward monitors
  kind: 'task',
});"""
text = text.replace(old_atlas, new_atlas)

with open('/root/projects/hermes-virtual-office/src/engine/ChairInteractionSystem.ts', 'w') as f:
    f.write(text)

print("Updated ChairInteractionSystem.ts facing angles successfully!")
