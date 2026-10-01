with open('/root/projects/hermes-virtual-office/astra_total_overhaul_output.txt', 'r') as f:
    lines = f.readlines()

code = lines[8:1722]
print("Lines 0..60:")
print("".join(code[:60]))
print("\nLines -60..end:")
print("".join(code[-60:]))
