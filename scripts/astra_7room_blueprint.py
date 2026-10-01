import urllib.request
import json
import sqlite3

def generate_3d_blueprint_with_astra():
    conn = sqlite3.connect('/root/.9router/db/data.sqlite')
    key = conn.cursor().execute('SELECT key FROM apiKeys LIMIT 1').fetchone()[0]
    conn.close()

    blueprint_spec = """
EXACT ROOM SPECIFICATION TO REPLICATE IN 3D (THREE.JS):
Layout: 3 Columns x Asymmetric Rows on an Architectural Baseplate (68 x 52):

1. NORTH-WEST (NW): EXECUTIVE SUITE (ORION)
   - Position: X = -21, Z = -14. Dimensions: W = 18, D = 14
   - Border / Rim: Electric Blue (#2563EB) rounded neon/glow architectural trim.
   - Floor: Warm dark oak parquet planks.
   - Agent: ORION (Blue body, Gold Crown) seated at executive desk facing South.
   - Props: Executive desk with dual curved ultrawide screens (cyan/pink IDE UI), twin minimalist desk lamps, wall telemetry LED bars, potted ficus plant in terracotta pot.

2. NORTH (N): DEVELOPMENT LAB (FORGE & FRAME & AURORA)
   - Position: X = 0, Z = -16. Dimensions: W = 20, D = 11
   - Border / Rim: Bright Orange (#F97316) architectural trim.
   - Floor: Warm dark oak parquet planks.
   - Agents: FORGE (Orange shirt) at left bay, FRAME (Cyan shirt) at right bay, AURORA (Rose/Purple) at front design console.
   - Props: Two developer workstation bays with L-shaped desk lamps, ultrawide curved code monitors, center oscilloscope test console, wall-mounted hardware rack, white planter.

3. NORTH-EAST (NE): RESEARCH & INTEL (QUANT & RADAR)
   - Position: X = 21, Z = -14. Dimensions: W = 18, D = 14
   - Border / Rim: Emerald Green (#10B981) architectural trim.
   - Floor: Warm dark oak parquet planks.
   - Agents: QUANT (Lime green shirt, charts/plots), RADAR (Teal/Emerald shirt, satellite telemetry).
   - Props: Side-by-side trading/intel desks with candlestick graphs, wall-mounted multi-bus network patch panel with color-coded conduits, corner leafy plant.

4. CENTER: WAR ROOM / A2A
   - Position: X = 0, Z = -2.5. Dimensions: W = 20, D = 12
   - Border / Rim: Sky Blue (#38BDF8) architectural trim.
   - Header / Node: Interactive A2A Coordination node banner at north entrance.
   - Floor: Warm dark oak parquet with dashed rectangular conference perimeter.
   - Props: Massive elongated dark-wood hexagonal conference table with beveled ends and diamond wood inlay, 6 integrated conference chairs with glowing cyan interface panels, holographic projection core.

5. SOUTH-WEST (SW): QA & HARDENING (PRISM & LENS)
   - Position: X = -21, Z = 12. Dimensions: W = 18, D = 16
   - Border / Rim: Bright Purple / Violet (#A855F7) architectural trim.
   - Floor: Warm dark oak parquet planks.
   - Agents: PRISM (Purple shirt, test suite displays), LENS (Violet shirt, visual QA screens).
   - Props: 3 diagnostic test workstations with sine wave waveforms, error telemetry monitors, corner planter.

6. SOUTH (CENTER-SOUTH): LOUNGE & OPERATIONS (SENTINEL & NEXUS)
   - Position: X = 0, Z = 14. Dimensions: W = 20, D = 15
   - Border / Rim: Bright Cyan / Teal (#06B6D4) architectural trim.
   - Floor: Warm dark oak parquet with dark charcoal crosshatched lounge rug area.
   - Agents: SENTINEL (Crimson/Red shirt) near security/vending, NEXUS (Bright Teal shirt) at operations console.
   - Props: Illuminated arcade/coffee vending machine, operations workstation desk with waveform charts, low modular lounge sofa with central coffee table, terracotta planter.

7. SOUTH-EAST (SE): SRE & INFRASTRUCTURE (ATLAS)
   - Position: X = 21, Z = 12. Dimensions: W = 18, D = 16
   - Border / Rim: Golden Yellow (#EAB308) architectural trim.
   - Floor: Technical dark slate-blue raised datacenter floor with cyan grid line pattern!
   - Agent: ATLAS (Golden yellow shirt, hardhat) at SRE monitoring console.
   - Props: 4 full-height server rack towers along East wall with dual blade server columns, flashing cyan/green LEDs, and heavy trunk cables (magenta, cyan, yellow) cascading down to the raised floor.
"""

    prompt = f"""You are OpenAI Codex (GPT-6 Astra), Principal 3D Three.js Architect.
The user wants their virtual office layout updated to match this EXACT 7-room floor plan in 3D:
{blueprint_spec}

Rules:
1. Keep the beautiful 3D WebGL diorama style with warm Scandinavian lighting, soft contact shadows, and articulated avatars (knees bent 90° when sitting).
2. Arrange all 7 rooms in the EXACT spatial layout specified (3 columns x asymmetric rows: NW Executive, N Dev, NE Research, Center War Room, SW QA, S Lounge, SE SRE).
3. Each room must have its signature color-coded border, exact room badge, floor type (wood parquet or SRE datacenter grid), and custom signature props.
4. Output a clean, high-performance Three.js TypeScript module that can be integrated cleanly into RobloxOffice3D.ts.
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

    print("Streaming GPT-6 Astra's 3D Blueprint Module...")
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
    generate_3d_blueprint_with_astra()
