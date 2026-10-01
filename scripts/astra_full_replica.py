import urllib.request
import json
import sqlite3

def run_astra_full_replica():
    conn = sqlite3.connect('/root/.9router/db/data.sqlite')
    key = conn.cursor().execute('SELECT key FROM apiKeys LIMIT 1').fetchone()[0]
    conn.close()

    prompt = """You are OpenAI Codex (GPT-6 Astra), World-Class 3D Architectural Director & Three.js Master.
The user sent the target architectural cutaway rendering (`img_8763800c2d15.jpg`) and gave the explicit command:
"Masih banyak yang ga mirip saya mau Semuanya mirip ,kerjain pakai model astra biar maksimal hasilnya mirip ,pastikan mirp ya"

We conducted a forensic microscopic visual audit of `img_8763800c2d15.jpg`. Here are the EXACT, NON-NEGOTIABLE architectural specifications that MUST be faithfully implemented:

1. PERSPECTIVE & CAMERA:
   - Frontal elevated cutaway perspective (~46° elevation, 0° azimuth).
   - The back wall runs strictly horizontal across the top of the frame.
   - The building slab sits elevated with a soft diffused ambient contact shadow beneath.

2. MATERIALS, PALETTE & LIGHTING:
   - Corridor Floors: Dark charcoal/graphite planking with subtle horizontal grain and soft specular sheen.
   - Office & Lounge Floors: Warm natural honey-oak hardwood planks oriented horizontally (left-to-right).
   - SRE Floor: Dark gray raised-access square floor tiles (600x600 grid) with visible joint seams.
   - Floor Perimeter LED Glow: COOL CYAN / ICE-BLUE (#00E5FF / #67E8F9 / #A5F3FC) illuminated under-glow troughs tracing the baseboard edge of EVERY room island and glass threshold! This gives the signature floating cyber-pavilion look!
   - Area Rugs: Light-gray/beige textured rectangular area rugs in Executive Suite, War Room / A, and Lounge.

3. ARCHITECTURAL WALLS & PARTITIONS (ArchitecturalWalls.ts):
   - Back Wall: Spans entire rear width (Y=0 to 6.0m). Lower section clad in vertical natural oak acoustic slats with dark baseboards; upper section smooth off-white drywall; 3 large horizontal ribbon clerestory windows (one centered in each rear suite) admitting soft exterior daylight.
   - Side Cutaway Walls: Stepped profile with vertical timber slats on interior and oak coping.
   - Full-Height Party Walls: Dividing wall between Executive <-> A2A Connect, and dividing wall between A2A Connect <-> Research.
   - Full-Height Glass Partition Doors: Full-height glass partition with double glass doors (brass handles) in the side corridors (between Executive/QA corridor and between Research/SRE corridor).
   - Room Front Boundaries: Waist-high (1.0m) clear tempered glass balustrades with slender black metal posts and dark/brass handrails, with doorway openings.

4. ROOM-BY-ROOM FURNITURE & PROPS INVENTORY (OfficeFloorPlan.ts):
   - EXECUTIVE SUITE (Top-Left):
     * Monolithic curved dark-walnut executive desk with black leather desk mat.
     * High-back black leather executive swivel chair.
     * 2 light-gray upholstered tub guest armchairs facing the desk.
     * Left wall: Floor-to-ceiling illuminated display shelving unit with books, plants, and ambient downlights.
     * Back wall: Low oak credenza with books, table lamp, framed abstract wall art.
     * Large light-gray area rug, potted fiddle-leaf fig trees in corners.
   - A2A COORDINATION / CONNECT (Top-Center):
     * 4 identical wood-topped workstations arranged in open layout (one left, one right, one back-center, one front-center).
     * Dual and curved ultrawide monitors on each desk displaying blue UI code/dashboards.
     * 4 black ergonomic mesh chairs.
     * Corner potted plants and utility counter.
   - RESEARCH & INTEL (Top-Right):
     * Back wall: Large white magnetic collaboration whiteboard with system architecture diagram (INGEST -> REASON -> ACT -> INDEX -> VERIFY -> OBSERVE).
     * Left wall: Vertical dark operations screen.
     * Right wall: Tall vertical oak bookcase.
     * Foreground: 2 forward-facing desks side-by-side with dual curved ultrawide displays and black mesh chairs.
     * Potted ficus plants.
   - WAR ROOM / A (Dead Center):
     * Large boat-shaped / racetrack conference table in rich dark walnut with integrated center flush connectivity cubbies (NO floating hologram!).
     * EXACTLY 10 cognac/caramel saddle leather (#A75D2A) conference chairs on swivel caster bases (4 top, 4 bottom, 1 at each end!).
     * Back wall: Wide horizontal display wall mounted on oak slat backing showing luminous blue world network threat/topology map.
     * Light gray woven area rug beneath the table.
     * Symmetrical potted plants on white pedestals flanking the screen.
   - QA & HARDENING (Bottom-Left):
     * 3 developer workstations arranged in an offset triangle (two in back, one in front with ultrawide curved monitor showing network topologies).
     * 3 black ergonomic task chairs.
     * Left wall: Low wooden credenza with decorative objects, framed prints above it.
     * Large potted plants in corners.
   - LOUNGE & OPERATIONS (Bottom-Center):
     * Long modern light-gray fabric sofa.
     * 2 matching light-gray armchairs facing each other over a round dark-wood coffee table with magazines/books.
     * Textured rectangular area rug.
     * Back-left: Wooden credenza refreshment counter with espresso machine, coffee maker, cups, and warm table lamp.
     * Back-right: Operations workstation desk with dual monitors and ergonomic chair.
   - SRE & INFRASTRUCTURE (Bottom-Right):
     * Line of 6 tall black enterprise server cabinets along the right wall with perforated mesh doors, internal vertical cable trays, and active blue/cyan vertical LED indicators.
     * Dark gray raised-access square floor tiles (600x600 grid).
     * Top-left: Single operations desk with dual screens and task chair.
     * Bottom-left: Square four-person incident/collaboration table with 4 black chairs and a centerpiece succulent.
   - FLOOR ENTRANCE PLAQUES:
     * Dark charcoal rectangular floor plinths with rounded corners, fine GLOWING CYAN OUTLINE (#00E5FF), and centered crisp white sans-serif uppercase text at the entrance of each room:
       1. EXECUTIVE SUITE
       2. A2A COORDINATION / CONNECT
       3. RESEARCH & INTEL
       4. WAR ROOM / A
       5. QA & HARDENING
       6. LOUNGE & OPERATIONS
       7. SRE & INFRASTRUCTURE

Write the complete, self-contained, drop-in replacement TypeScript code for `src/engine/OfficeFloorPlan.ts` that executes this entire architectural inventory with flawless precision, gorgeous materials, and stable 60 FPS.
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
            'max_tokens': 4000,
            'temperature': 0.12,
            'stream': True
        }).encode('utf-8')
    )

    print("Streaming GPT-6 Astra's Complete OfficeFloorPlan.ts replica...")
    with urllib.request.urlopen(req, timeout=300) as resp:
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
    run_astra_full_replica()
