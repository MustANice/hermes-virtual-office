import urllib.request
import json
import sqlite3

def ask_astra_for_walls():
    conn = sqlite3.connect('/root/.9router/db/data.sqlite')
    key = conn.cursor().execute('SELECT key FROM apiKeys LIMIT 1').fetchone()[0]
    conn.close()

    prompt = """You are OpenAI Codex (GPT-6 Astra), Principal 3D Three.js Architect.
The user wants to add realistic architectural SIDE WALLS ('dinding dinding samping') and INTERIOR ROOM PARTITIONS ('sekat antar ruangan') to our 7-room virtual office diorama in Three.js.

Current 7-Room Layout (on 68 x 52 baseplate, centered at 0,0):
- NW: Executive Suite (X: -21, Z: -14, W: 18, D: 14)
- North: Development Lab (X: 0, Z: -16, W: 20, D: 11)
- NE: Research & Intel (X: 21, Z: -14, W: 18, D: 14)
- Center: War Room / A2A (X: 0, Z: -2.5, W: 20, D: 12)
- SW: QA & Hardening (X: -21, Z: 12, W: 18, D: 16)
- South: Lounge & Operations (X: 0, Z: 14, W: 20, D: 15)
- SE: SRE & Infrastructure (X: 21, Z: 12, W: 18, D: 16)

Requirements for realistic architectural walls:
1. Outer Perimeter Walls ('Dinding-dinding samping'):
   - North Back Wall: Architectural wall (H: 3.8m, Z: -21.5) with recessed clerestory glass windows with aluminum mullions.
   - West & East Side Walls: Stepped isometric cutaway walls (tapering from 3.8m at North down to 1.6m at South) so the diorama has realistic enclosure without blocking the isometric camera!
2. Interior Room Partitions ('Sekat antar ruangan'):
   - Modern glass & wood partitions: lower oak/white acoustic baseboard (H: 0.8m) + fluted/frosted glass panels (H: 1.6m, total H: 2.4m) with slim black/aluminum mullions.
   - Partitions with clear doorway openings (2.2m - 2.8m wide) between:
     - Executive Suite & Dev Lab (X: -11)
     - Dev Lab & Research (X: +11)
     - Executive & QA (Z: -2)
     - Dev Lab & War Room (Z: -9.5)
     - War Room & Lounge (Z: 5)
     - Research & SRE (Z: 2)
     - Lounge & SRE (X: +11)
3. Return a clean, modular TypeScript function `buildArchitecturalWalls(parent: THREE.Group)` that creates and adds all these walls and partitions with materials, shadows, and clean geometry.
"""

    req = urllib.request.Request(
        'http://127.0.0.1:20128/v1/chat/completions',
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {key}'
        },
        data=json.dumps({
            'model': 'cx/gpt-6-astra',
            'messages': [{'role': 'user', 'content': prompt}],
            'max_tokens': 3800,
            'temperature': 0.15,
            'stream': True
        }).encode('utf-8')
    )

    print("Streaming GPT-6 Astra's Architectural Walls & Partitions...")
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
                        print(delta['content'], end='', flush=True)
                except Exception:
                    pass
    print("\nStream finished.")

if __name__ == '__main__':
    ask_astra_for_walls()
