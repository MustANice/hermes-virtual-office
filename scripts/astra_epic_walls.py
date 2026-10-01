import urllib.request
import json
import sqlite3

def ask_astra_for_epic_walls():
    conn = sqlite3.connect('/root/.9router/db/data.sqlite')
    key = conn.cursor().execute('SELECT key FROM apiKeys LIMIT 1').fetchone()[0]
    conn.close()

    prompt = """You are OpenAI Codex (GPT-6 Astra), World-Class 3D Architectural Graphics Engineer.
The user gave feedback on the virtual office walls:
"Visual dinding nya kurang keren dan sepertinya kurang tinggi"
(The visuals of the walls are not cool enough, and they seem not tall enough).

We need to completely elevate the walls into a breathtaking, premium, tall modern tech studio / loft diorama in Three.js!

Key Architectural Upgrades Needed:
1. MUCH TALLER CEILING / WALL HEIGHT:
   - Increase height from 3.8m to 5.6m - 6.2m!
   - North Back Wall: 5.8m tall grand industrial loft clerestory wall with double-tier floor-to-ceiling Crittall black steel paned windows, letting in warm golden ambient daylight.
   - West & East Side Walls: Majestic architectural stepped cutaways tapering from 5.8m at North down to 3.6m at South, capped with thick Scandinavian blonde oak fascia and perimeter LED uplight cove.

2. VISUALLY STUNNING MATERIALS (NO BORING FLAT GREY GYPSUM!):
   - Vertical Fluted Acoustic Wood Slat Panels: 3D alternating oak/walnut timber battens with dark charcoal shadow recesses (the iconic Apple Park / Scandinavian tech studio signature).
   - Biophilic Living Moss Wall Accents: Lush preserved green moss panels embedded into executive & research feature walls.
   - Industrial Black Steel & Fluted Glass Partitions: 3.6m tall room dividers featuring black anodized aluminum frames, lower walnut acoustic base (1.0m), and tall fluted privacy glass with subtle light transmission.
   - Architectural Wall Grazing LED Light Strips: Integrated warm amber (3000K #FDE68A) LED cove wash lights beneath the oak copings and along partition headers, giving dramatic depth and ambient glow.
   - Real Grand Doorway Portals: 2.8m wide x 3.4m tall portals with thick solid oak casing and illuminated room identity signage.

3. MAINTAIN CUTAWAY PLAYABILITY:
   - The South (Front) remains open/low so the isometric camera has a 100% crystal-clear view into all 7 rooms without any avatar obstruction!
   - The thought clouds ('teks berawan') must float with plenty of breathing room.

Provide the complete, refined, drop-in replacement TypeScript file `ArchitecturalWalls.ts` that implements this epic high-ceiling architectural wall system in Three.js.
Output clean, complete, high-performance TypeScript code."""

    req = urllib.request.Request(
        'http://127.0.0.1:20128/v1/chat/completions',
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {key}'
        },
        data=json.dumps({
            'model': 'cx/gpt-6-astra',
            'messages': [{'role': 'user', 'content': prompt}],
            'max_tokens': 3900,
            'temperature': 0.15,
            'stream': True
        }).encode('utf-8')
    )

    print("Streaming GPT-6 Astra's Epic Tall Architectural Walls...")
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
    ask_astra_for_epic_walls()
