with open('/root/projects/hermes-virtual-office/astra_avatar_complete.txt', 'r') as f:
    text = f.read()

start_marker = '```ts'
end_marker = '```'

start_idx = text.find(start_marker)
if start_idx != -1:
    code_start = start_idx + len(start_marker)
    end_idx = text.find(end_marker, code_start)
    if end_idx != -1:
        code = text[code_start:end_idx].strip()
        with open('/root/projects/hermes-virtual-office/scripts/extracted_avatar.ts', 'w') as out:
            out.write(code)
        print("Successfully extracted extracted_avatar.ts! Length:", len(code), "chars")
    else:
        print("End marker not found")
else:
    print("Start marker not found")
