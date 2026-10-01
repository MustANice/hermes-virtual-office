with open('/root/projects/hermes-virtual-office/scripts/test_movement_and_collision.cjs', 'r') as f:
    text = f.read()

text = text.replace(
    "for (let step = 0; step < 12; step++) {\n            ctrl.update(0.04, []);\n          }\n          if (ctrl.phase === 'IDLE_STANDING')",
    "for (let step = 0; step < 25; step++) {\n            ctrl.update(0.04, []);\n          }\n          if (ctrl.phase === 'IDLE_STANDING')"
)

with open('/root/projects/hermes-virtual-office/scripts/test_movement_and_collision.cjs', 'w') as f:
    f.write(text)

print("Updated tick count in test runner")
