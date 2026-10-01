with open('/root/projects/hermes-virtual-office/astra_full_replica_output.txt', 'r') as f:
    lines = f.readlines()

main_code = lines[8:2327]
print("Lines 0..50 of code:")
print("".join(main_code[:50]))
print("\nLines -50..end of code:")
print("".join(main_code[-50:]))
