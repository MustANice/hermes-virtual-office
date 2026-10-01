import os

target = 0xEDE8E0
target_hex = "ede8e0"
target_dec = str(target)

for root, dirs, files in os.walk('/root/projects/hermes-virtual-office'):
    if 'node_modules' in root or '.git' in root:
        continue
    for f in files:
        p = os.path.join(root, f)
        try:
            with open(p, 'rb') as fp:
                data = fp.read()
            if target_hex.encode() in data.lower() or target_dec.encode() in data:
                print(f"Found in: {p}")
        except Exception:
            pass
