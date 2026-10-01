with open('/root/projects/hermes-virtual-office/src/engine/RobloxOffice3D.ts', 'r') as f:
    text = f.read()

# Check imports at top
print("Imports section:")
print("\n".join(text.splitlines()[:20]))
