with open('/root/projects/hermes-virtual-office/astra_total_overhaul_output.txt', 'r') as f:
    lines = f.readlines()

code_lines = lines[8:1722]

with open('/root/projects/hermes-virtual-office/src/engine/OfficeFloorPlan.ts', 'w') as f:
    f.writelines(code_lines)

print(f"Extracted {len(code_lines)} lines into src/engine/OfficeFloorPlan.ts")
