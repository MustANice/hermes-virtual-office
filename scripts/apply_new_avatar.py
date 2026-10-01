with open('/root/projects/hermes-virtual-office/src/engine/RobloxOffice3D.ts', 'r') as f:
    roblox_code = f.read()

with open('/root/projects/hermes-virtual-office/scripts/extracted_avatar.ts', 'r') as f:
    avatar_code = f.read().strip()

start_marker = "export class RobloxAvatar3D {"
end_marker = "export class RobloxOffice3D {"

start_pos = roblox_code.find(start_marker)
end_pos = roblox_code.find(end_marker)

if start_pos != -1 and end_pos != -1:
    new_code = roblox_code[:start_pos] + avatar_code + "\n\n" + roblox_code[end_pos:]
    with open('/root/projects/hermes-virtual-office/src/engine/RobloxOffice3D.ts', 'w') as f:
        f.write(new_code)
    print("SUCCESS: replaced RobloxAvatar3D in RobloxOffice3D.ts!")
else:
    print(f"FAILED: start_pos={start_pos}, end_pos={end_pos}")
