import urllib.request
import json
import sqlite3
import sys

def stream_astra():
    conn = sqlite3.connect('/root/.9router/db/data.sqlite')
    key = conn.cursor().execute('SELECT key FROM apiKeys LIMIT 1').fetchone()[0]
    conn.close()

    prompt = """You are OpenAI Codex (GPT-6 Astra), Principal 3D Game Graphics Engineer & Three.js Architect.
The user provided a reference 3D isometric diorama image of a minimalist, cozy Japandi / Scandinavian studio interior and asked:
"Bantu buatkan ruangan ruangannya agar memiliki bentu seperti ini gunakan model astra agar hasil maksimal"

Key Architectural Details from the reference:
1. 3D ISOMETRIC DIORAMA CUTAWAY ROOMS:
   - Each room is a self-contained architectural diorama box with two walls forming a 90° corner (North back wall and Left/West wall), with the front and right cut away.
   - Thick white beveled architectural framing rim (0.35 thickness) around cutaway wall profiles.
   - Wall palette: Cool Slate/Dusty Blue accent wall (#9DB0BC) paired with Soft Cream/Bone White (#E8E3D8).
   - Flooring: Pale Scandinavian Oak / Birch parquet (#DFC2A5) with subtle matte finish.
2. RECESSED WINDOW WITH BRIGHT DAYLIGHT:
   - Large minimalist double-pane recessed window with light birch frame, framing bright white light spilling onto the sill.
3. JAPANDI FURNITURE & INTEGRATED SHELVING:
   - Tapered dowel-leg desks in pale oak (#E5C5A8) with charcoal desk mats and slim modern hardware.
   - Integrated tall open-frame shelving units with minimalist books, ceramics, and small accessories.
   - Low-profile platform seating / lounge in cream linen (#F1EFEA) and warm wood.
   - Potted fiddle-leaf plants in square terracotta planters (#C47A6C) in corners.
   - Minimalist thin dark-framed wall art prints.
4. LIGHTING & ATMOSPHERE:
   - High-key warm sunlight (5000K) + emissive window glow + soft ambient fill.

Write the complete, clean Three.js TypeScript code functions to construct these Japandi diorama rooms and furniture in RobloxOffice3D.ts."""

    req = urllib.request.Request(
        'http://127.0.0.1:20128/v1/chat/completions',
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {key}'
        },
        data=json.dumps({
            'model': 'cx/gpt-6-astra',
            'messages': [{'role': 'user', 'content': prompt}],
            'max_tokens': 3000,
            'temperature': 0.15,
            'stream': True
        }).encode('utf-8')
    )

    print("Connecting to cx/gpt-6-astra stream for Japandi Diorama Architecture...")
    with urllib.request.urlopen(req, timeout=180) as resp:
        for line in resp:
            line_str = line.decode('utf-8').strip()
            if line_str.startswith('data: '):
                chunk_data = line_str[6:]
                if chunk_data == '[DONE]':
                    break
                try:
                    delta = json.loads(chunk_data)['choices'][0]['delta']
                    if 'content' in delta:
                        sys.stdout.write(delta['content'])
                        sys.stdout.flush()
                except Exception:
                    pass
    print("\nStream finished.")

if __name__ == '__main__':
    stream_astra()
