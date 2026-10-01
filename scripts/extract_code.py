with open('/root/projects/hermes-virtual-office/astra_7rooms_output.txt', 'r') as f:
    text = f.read()

start_marker = '```ts'
end_marker = '```'

start_idx = text.find(start_marker)
if start_idx != -1:
    code_start = start_idx + len(start_marker)
    # find next ```
    end_idx = text.find(end_marker, code_start)
    if end_idx != -1:
        code = text[code_start:end_idx].strip()
        with open('/root/projects/hermes-virtual-office/src/engine/OfficeFloorPlan.ts', 'w') as out:
            out.write(code)
        print("Successfully extracted OfficeFloorPlan.ts! Length:", len(code), "chars")
    else:
        print("End marker not found")
else:
    print("Start marker not found")
