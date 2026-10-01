import urllib.request
import json
import sqlite3

def ask_astra_for_fixes():
    conn = sqlite3.connect('/root/.9router/db/data.sqlite')
    key = conn.cursor().execute('SELECT key FROM apiKeys LIMIT 1').fetchone()[0]
    conn.close()

    audit_summary = """
Our visual audit of https://office.dindustries.my.id identified 4 critical flaws compared to the user's cozy Japandi reference image:
1. STERILE CLINICAL LIGHTING:
   - Too cold/white (6500K). Needs warm golden-hour Scandinavian sunlight (3800K-4500K #FFF1DC), warm ambient bounce (#F0E4D4), and cozy amber radial desk lamps (2700K #FBBF24).
   - Real contact shadows: sun directional light positioned at (25, 45, 20) with shadow.bias = -0.0001 and normalBias = 0.02, casting soft long shadows across warm oak parquet.
2. FLOATING / UNGROUNDED AGORA CONFERENCE TABLE & SCREEN:
   - Conference table currently appears to hover because table legs are missing or invisible! Add solid architectural fluted oak pedestal legs and soft contact shadow blob beneath.
   - Presentation whiteboard currently floats in mid-air! Add dual wooden easel posts with beveled aluminum floor feet (tripod/H-frame stand) resting firmly on the floor.
3. RIGID AVATAR "L-SIT" POSE & MISSING VISIBLE CHAIRS:
   - Sitting avatars have block legs sticking straight out horizontally at 90° into empty air.
   - In Roblox R6 sitting: hip pivot rotates leg down, but the knee should tuck down into the chair, with torso resting squarely on a visible ergonomic mesh chair (with black backrest and armrests).
   - Add procedural head tilts towards dual monitors and typing arm oscillations.
4. EMPTY FOREGROUND DESERT:
   - The lower-left foreground is an empty white void with one lonely bench.
   - Transform it into a full Japandi Coffee Lounge & Library:
     - Woven circular jute rug (radius 3.5m)
     - L-shaped low-slung linen sofa in warm terracotta (#C47A6C) and cream (#F1EFEA)
     - Isamu Noguchi-style curved birch coffee table with design books and ceramic teapot
     - Espresso bar counter with chrome dual-group machine and water cooler
     - Lush Ficus / Monstera plants in square terracotta planters
5. FLOATING DIORAMA BASEPLATE:
   - Constrain the entire campus to an architectural floating diorama slab (width 64, depth 50, height 1.8) with thick beveled white perimeter walls and warm oak edge trim.
"""

    prompt = f"""You are OpenAI Codex (GPT-6 Astra), Principal 3D Graphics Engineer & Three.js Architect.
Based on the visual audit below:
{audit_summary}

Provide the complete, refined Three.js TypeScript code to implement these fixes in RobloxOffice3D.ts:
- Warm lighting setup
- Grounded Agora with solid fluted table legs & easel whiteboard stand
- Realistic avatar sitting pose with visible chairs
- Fully furnished Japandi Coffee Lounge & Library in foreground
- Floating architectural diorama slab
Output clean, complete, robust TypeScript code."""

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
            'temperature': 0.15,
            'stream': True
        }).encode('utf-8')
    )

    print("Streaming Astra's architectural solutions...")
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
    ask_astra_for_fixes()
