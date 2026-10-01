import urllib.request
import json
import sqlite3
import sys

def stream_astra():
    conn = sqlite3.connect('/root/.9router/db/data.sqlite')
    key = conn.cursor().execute('SELECT key FROM apiKeys LIMIT 1').fetchone()[0]
    conn.close()

    prompt = """You are OpenAI Codex (GPT-6 Astra), Principal 3D Game Graphics Engineer & Three.js Systems Architect.
The user inspected our 3D Roblox Virtual Office and said:
"masih banyak bug dan kurang terlihat real bantu analisa lagi dan perbaiki dengan model codex astra"

We did a visual audit of the current render and identified these critical flaws:
1. AVATAR POSITION & CHAIR CLIPPING BUG:
   - Avatars are currently placed at the desk center (spot.x, spot.z), causing avatars to sit INSIDE the desk or on top of the monitors, rather than sitting on the office chair behind the desk facing the monitors!
   - Chair offsets: If desk is at (x, z) with rotation rotY, the chair is at distance ~1.3 units behind the desk, and the avatar must sit on the chair at (chairX, chairZ) facing the desk.
2. SUNKEN AGORA FLOOR TEXTURE UV GLITCH:
   - Applying a repeated CanvasTexture to a CylinderGeometry creates a severe pinched starburst / distorted vortex artifact at the center of the Agora floor!
   - Fix: Use a flat RingGeometry / CircleGeometry with proper planar UV mapping or smooth solid radial gradient so it looks like a clean luxury circular conference carpet with wood trim.
3. OVERSIZED FLOATING BILLBOARDS (BLOCKING THE OFFICE):
   - Overhead billboard sprites are too large (scale 4.2 x 1.7) and opaque, blocking the view of avatars, desks, and banners behind them.
   - Fix: Make them sleek, compact, high-DPI modern Roblox nameplates (compact pill with small dot, agent name in bold, and subtle clean status, with thought bubble appearing only dynamically or much smaller and cleaner).
4. LACK OF ARCHITECTURAL REALISM (FLOATING ON WHITE VOID):
   - Currently the office sits on a plain white slab in a void. A real tech office needs:
     - Real enclosed boundary walls with stylish dark slate baseboards.
     - Warm ambient occlusion and soft floor reflections or contact shadows under desks and chairs.
     - Glass partitions between pods with aluminum frames.
     - Warm ceiling pendant lamps hanging over each desk pod.
     - Potted plants that look like real low-poly indoor trees (fiddle leaf, palm).
     - Realistic breakroom lounge with coffee bar counter, sink, mugs, water dispenser with clear jug and blue water.
5. SRE SERVER VAULT:
   - Server racks should look like real enterprise rack cabinets (perforated front mesh door with glowing green/blue LED switches, cable trays overhead).

Write the complete, bug-free, beautifully refined Three.js code for RobloxOffice3D.ts to solve every single one of these issues."""

    req = urllib.request.Request(
        'http://127.0.0.1:20128/v1/chat/completions',
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {key}'
        },
        data=json.dumps({
            'model': 'cx/gpt-6-astra',
            'messages': [{'role': 'user', 'content': prompt}],
            'max_tokens': 3500,
            'temperature': 0.2,
            'stream': True
        }).encode('utf-8')
    )

    print("Connecting to cx/gpt-6-astra stream for full audit and architecture rewrite...")
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
