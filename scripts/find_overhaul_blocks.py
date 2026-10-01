with open('/root/projects/hermes-virtual-office/astra_total_overhaul_output.txt', 'r') as f:
    lines = f.readlines()

blocks = []
in_block = False
current = []
tag = ""

for idx, line in enumerate(lines):
    if line.startswith('```typescript') or line.startswith('```ts'):
        in_block = True
        current = []
        tag = line.strip()
    elif line.startswith('```') and in_block:
        in_block = False
        blocks.append((tag, len(current), idx - len(current), idx))
    elif in_block:
        current.append(line)

print("Found code blocks:")
for b in blocks:
    print(b)
