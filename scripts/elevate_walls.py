with open('/root/projects/hermes-virtual-office/src/engine/ArchitecturalWalls.ts', 'r') as f:
    code = f.read()

# Increase north wall height to 6.2m
code = code.replace('const northHeight = 5.8;', 'const northHeight = 6.2;')
code = code.replace('const windowTop = 5.3;', 'const windowTop = 5.6;')

# Increase side wall steps
code = code.replace(
    'const sideSteps = [\n'
    '    { start: -21.5 + wallThickness / 2, end: -10.5, height: 5.8 }, // North tier: full 5.8m!\n'
    '    { start: -10.5, end: 0.5, height: 4.8 },                        // Mid tier 1: 4.8m!\n'
    '    { start: 0.5, end: 11.5, height: 3.9 },                         // Mid tier 2: 3.9m!\n'
    '    { start: 11.5, end: 22.5, height: 3.0 },                        // South tier: 3.0m!\n'
    '  ];',
    'const sideSteps = [\n'
    '    { start: -21.5 + wallThickness / 2, end: -10.5, height: 6.2 }, // North tier: 6.2m!\n'
    '    { start: -10.5, end: 0.5, height: 5.2 },                        // Mid tier 1: 5.2m!\n'
    '    { start: 0.5, end: 11.5, height: 4.2 },                         // Mid tier 2: 4.2m!\n'
    '    { start: 11.5, end: 22.5, height: 3.4 },                        // South tier: 3.4m!\n'
    '  ];'
)

# Increase interior partition height to 4.2m and base to 1.2m
code = code.replace('const baseHeight = 1.05;', 'const baseHeight = 1.2;')
code = code.replace('const partitionHeight = 3.5;', 'const partitionHeight = 4.2;')

with open('/root/projects/hermes-virtual-office/src/engine/ArchitecturalWalls.ts', 'w') as f:
    f.write(code)

print("Updated ArchitecturalWalls.ts with 6.2m north walls and 4.2m partitions!")
