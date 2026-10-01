import urllib.request
import json
import sqlite3

def ask_astra_exact_match():
    conn = sqlite3.connect('/root/.9router/db/data.sqlite')
    key = conn.cursor().execute('SELECT key FROM apiKeys LIMIT 1').fetchone()[0]
    conn.close()

    prompt = """You are OpenAI Codex (GPT-6 Astra), World-Class Architectural 3D Director & Three.js WebGL Master.
The user inspected our latest render and remarked:
"Tolong Analisa lagi dong saya rasa masih belum mirip persis" (Please analyze again, I feel it's still not an exact match).

We performed an exhaustive forensic vision comparison between their reference image (`img_900e71c807be.jpg`) and our current WebGL render.
Here are the critical discrepancies that prevent it from being an exact match:

1. INTERIOR WALLS & BALUSTRADES (Critical Over-Clutter):
   - Current Flaw: `ArchitecturalWalls.ts` generates 4.2m-tall solid-base interior walls cutting through the corridors and rooms, causing heavy visual clutter and blocking sightlines.
   - Reference Ground Truth: In the reference image, the interior room boundaries facing the corridors are exclusively WAIST-HIGH (approx 0.95m - 1.05m tall) architectural clear tempered glass balustrades with slender black/charcoal steel posts and champagne brass top caps! Only the three back-row rooms (Executive, A2A Connect, Research) have full-height dividing party walls between them. The entire front and center are open, airy, and visible!

2. WAR ROOM CENTERPIECE (Sci-Fi Hologram vs Executive Luxury):
   - Current Flaw: We have a floating spinning cyan wireframe hologram sphere hovering above the conference table.
   - Reference Ground Truth: The reference image is a realistic executive mission-control center, NOT a sci-fi game. There is NO floating hologram in the center of the table! Instead, the racetrack walnut table is clean, featuring sleek recessed flush pop-up power/connectivity modules. The hero visual is the massive world network topology map video wall mounted on the back partition, flanked by two indoor ficus trees in cylindrical white ceramic planters.

3. SRE & INFRASTRUCTURE RACKS (Neon Spaghetti vs Enterprise Cleanliness):
   - Current Flaw: Bright neon pink, cyan, and yellow glowing cables looping high in the air above server racks.
   - Reference Ground Truth: Clean, enterprise-grade 42U server cabinets (6 units) with realistic matte perforated doors, vertical structured cable trays, and subtle ice-blue and amber status LEDs. The metallic 600x600 grid floor has a 4-person emergency staging table with task chairs.

4. CAMERA PERSPECTIVE & COMPOSITION:
   - Current Flaw: Camera pitch is too flat (~43°), making the front rooms crowd the viewport while compressing the back wall.
   - Reference Ground Truth: Camera angle is an elegant high isometric pitch (~48° to 50°, angleX = Math.PI / 3.75), with cameraTarget centered on the War Room (0, 0, 0), perfectly revealing the horizontal white oak plank floors, the dark slate circulation corridors, and the back slat wall.

5. LIGHTING & STUDIO AMBIENCE:
   - Current Flaw: Flat illumination on a solid black void.
   - Reference Ground Truth: Warm architectural studio illumination: 4500K sunlight coming through the clerestory ribbon windows at 45°, 3000K warm interior fill, subtle flush warm LED perimeter floor troughs defining each room island, and a dark charcoal studio backdrop (#16181D) with soft ambient contact shadow beneath the floating building slab.

Provide the exact, targeted code refactoring across:
1. `src/engine/ArchitecturalWalls.ts`: Re-engineer interior partitions to match the reference (waist-high 1.0m glass balustrades with dark steel posts & brass caps; full-height dividers only between the 3 back suites; clear doorways).
2. `src/engine/OfficeFloorPlan.ts`: Remove the floating hologram from the War Room, refine the racetrack table with flush connectivity modules, clean up SRE server cabling to enterprise structured trays, and calibrate the 7 entrance plinth labels.
3. `src/engine/RobloxOffice3D.ts`: Adjust camera angle (pitch ~49°, distance, target) and lighting to match the reference's elegant studio composition.

Provide precise, actionable code snippets that we can immediately apply.
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
            'temperature': 0.15,
            'stream': True
        }).encode('utf-8')
    )

    print("Streaming GPT-6 Astra's Exact Match Architecture Refactor...")
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
    ask_astra_exact_match()
