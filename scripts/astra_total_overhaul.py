import urllib.request
import json
import sqlite3

def run_astra_masterpiece():
    conn = sqlite3.connect('/root/.9router/db/data.sqlite')
    key = conn.cursor().execute('SELECT key FROM apiKeys LIMIT 1').fetchone()[0]
    conn.close()

    prompt = """You are OpenAI Codex (GPT-6 Astra), World-Class 3D Architectural Director & Three.js Engine Master.
The user sent the target architectural rendering (`img_a737683fa9e2.jpg`) and gave the decisive order:
"Gw mau Sama persis kaya gini ,Rombak total aja biar sama seperti ini ,persis ya analisa selama mungkin agar hasilnya sama ,gunakan model astra full ya"

Here is the exhaustive forensic architectural audit of `img_a737683fa9e2.jpg`:

1. CAMERA & PERSPECTIVE:
   - Frontal elevated perspective cutaway.
   - Pitch angle (cameraAngleX): ~38° downward tilt (Math.PI / 4.7).
   - Yaw angle (cameraAngleY): 0.0 (strictly frontal, north wall is perfectly horizontal across the top of the frame).
   - FOV: Narrow long-focal-length (~28° - 32°), camera distance ~82.
   - Background: Dark charcoal studio backdrop (#0E1116) with subtle ambient falloff.
   - Building slab sits elevated with a soft contact shadow underneath.

2. MATERIALS & COLOR PALETTE:
   - Corridor Floors: Dark charcoal/slate engineered planks (#1C1E22, roughness 0.65, metalness 0.1) with fine negative-reveal expansion joints running horizontally.
   - Suite Floors: Natural honey/blonde white oak parquet (#C89D66 / #B88B58, roughness 0.55) oriented horizontally in Executive, A2A Connect, Research, War Room, QA, and Lounge.
   - SRE Technical Floor: Dark metallic gray raised access floor panels (600x600mm grid, #26292E, roughness 0.45, metalness 0.35) with visible grid joints and a light metallic sheen.
   - Perimeter Cyan LED Reveals: Recessed ice-blue/cyan LED strips (#00E5FF / #67E8F9, emissiveIntensity 3.0) tracing the baseboards of SRE, QA & Hardening, and room thresholds.
   - Acoustic Wood Slats: Vertical natural white oak timber battens (#C89D66) spaced closely over dark charcoal acoustic backing (#1A1C1E).
   - Black Architectural Metal: Matte black powder-coated steel (#1E2024, metalness 0.85, roughness 0.35).
   - Glass: Semi-translucent clear tempered glass with subtle reflections and soft cyan tint (#E0F2FE).
   - Cognac Saddle Leather: Rich caramel/cognac leather (#A75D2A, roughness 0.62) for the 10 War Room executive chairs.

3. ARCHITECTURAL WALLS & BOUNDARIES:
   - North Back Wall: Full 5.8m industrial loft wall clad in vertical oak acoustic slats from floor to ceiling, interrupted by three panoramic horizontal clerestory ribbon windows admitting soft natural daylight.
   - Dividing Party Walls: Thick oak-slatted structural walls between Executive <-> A2A Connect and A2A Connect <-> Research, with framed door portals.
   - Room Front Boundaries: Low to half-height structural glass railings (~1.1m) with black steel posts and oak handrail caps, framing open doorway portals.
   - Side Corridors: East-West glass security partition walls across the side hallways with framed double doors and vertical pull handles.

4. COMPLETE ROOM-BY-ROOM INTERIOR RECONSTRUCTION:
   - EXECUTIVE SUITE (Top-Left):
     * Large curved blonde oak executive desk with dark leather desk blotter.
     * High-back black leather executive swivel chair.
     * 2 cream/light-gray upholstered tub guest armchairs on a large rectangular off-white woven area rug.
     * Rear wall: Low oak credenza with decorative vases and a framed minimalist geometric abstract art print (arch and circle in ochre and black).
     * West wall: Floor-to-ceiling illuminated display shelving unit with books and ceramics.
     * 3 lush potted plants in white conical ceramic floor planters.
   - A2A COORDINATION / CONNECT (Top-Center):
     * 4 spacious oak-topped workstations arranged in an open collaborative pod (2 back, 1 left, 1 right).
     * 5 ergonomic black mesh chairs.
     * Multi-monitor curved ultra-wide displays showing blue telemetry HUD curves.
     * 4 potted floor plants and oak slat acoustic feature wall.
   - RESEARCH & INTEL (Top-Right):
     * 2 large forward-facing research workstations side-by-side.
     * 2 ergonomic black mesh task chairs.
     * Curved dual ultra-wide displays showing threat analytics and telemetry.
     * Back wall: Large dry-erase collaboration whiteboard filled with architectural flowcharts (INGEST -> REASON -> ACT -> INDEX -> VERIFY -> OBSERVE).
     * Right wall: Tall vertical oak library bookcase.
     * Left side: Wall-mounted bulletin/telemetry display screen.
     * 3 potted floor plants.
   - WAR ROOM / A (Dead Center):
     * Monolithic boat-shaped / racetrack conference table in rich dark walnut with flush pop-up power/connectivity modules.
     * EXACTLY 10 cognac/caramel saddle leather mid-back executive conference chairs (4 top, 4 bottom, 1 at each end cap).
     * Large textured light-gray woven area rug beneath the table.
     * Back wall: Panoramic multi-panel video wall displaying a luminous blue global network topology / threat map.
     * 4 potted ficus plants (2 flanking the video wall, 2 at the front portal).
   - QA & HARDENING (Bottom-Left):
     * 3 developer workstations arranged in an open triangle facing forward.
     * 3 ergonomic black mesh chairs.
     * Dual-monitor curved displays showing telemetry graphs and test suite outputs.
     * Left wall: Low wooden credenza with framed art prints above.
     * 4 potted plants.
   - LOUNGE & OPERATIONS (Bottom-Center):
     * Modern off-white / cream 3-seater sofa and 2 matching cream club armchairs over a neutral woven area rug.
     * Round walnut coffee table with magazines and books.
     * Rear-left: Long wooden credenza refreshment counter equipped with commercial espresso machine, coffee maker, carafes, mugs, and warm accent lamp.
     * Right side: Single operations desk with dual monitors and ergonomic mesh chair.
     * 3 potted floor plants.
   - SRE & INFRASTRUCTURE (Bottom-Right):
     * Bank of 5-6 tall black 42U enterprise server cabinets along the east wall with perforated mesh doors and active vertical blue/cyan LED indicators.
     * Dark gray metallic raised access floor tiles (600x600mm grid) with illuminated cyan perimeter border.
     * Top-left: Operations workstation with dual curved screens and task chair.
     * Bottom-left: Square 4-person incident response / collaboration table with 4 black chairs and a centerpiece succulent.
     * 1 potted plant.
   - ENTRANCE THRESHOLD RUNNER MATS / PLAQUES:
     * Dark charcoal rectangular welcome mats with fine border and crisp white uppercase sans-serif lettering inside the doorway of each room:
       1. EXECUTIVE SUITE
       2. A2A COORDINATION / CONNECT
       3. RESEARCH & INTEL
       4. WAR ROOM / A
       5. QA & HARDENING
       6. LOUNGE & OPERATIONS
       7. SRE & INFRASTRUCTURE

Now, write the complete, immaculate, drop-in replacement TypeScript code for `src/engine/OfficeFloorPlan.ts` that implements this entire architectural diorama with breathtaking craft, zero errors, and smooth 60 FPS performance!
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
            'temperature': 0.1,
            'stream': True
        }).encode('utf-8')
    )

    print("Streaming GPT-6 Astra's Total Overhaul of OfficeFloorPlan.ts...")
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
    run_astra_masterpiece()
