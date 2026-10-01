import urllib.request
import json
import sqlite3
import time

def query_astra():
    conn = sqlite3.connect('/root/.9router/db/data.sqlite')
    key = conn.cursor().execute('SELECT key FROM apiKeys LIMIT 1').fetchone()[0]
    conn.close()

    prompt = """You are OpenAI Codex powered by GPT-6 Astra, an elite Principal 3D Game Graphics Engineer & Three.js Architect.
Review the 3D Roblox Virtual Office project at /root/projects/hermes-virtual-office.
The user asked: "bantu analisa dan build dengan codex model astra agar visual bagus".

Provide:
1. Architectural & Visual Analysis:
   - Identify the top 5 areas where the Three.js Roblox office can achieve AAA indie game polish (lighting, textures, props, shaders, post-processing/shadows).
2. Concrete Implementation Blueprint:
   - Specific procedural canvas textures for parquet wood planks with specular reflection.
   - Wall art posters on the north wall ("Ship It", "Hermes Fleet", "Think Different").
   - Large presentation screen in the Sunken Agora displaying an illuminated architecture diagram.
   - Micro-props on desks: sticky notes, mousepads with neon borders, mechanical keyboards with colored keycaps, trash bins.
   - Cafe details: pastry display case with donuts/croissants, water cooler with rising air bubbles, steaming espresso cup.
   - Smooth camera interpolation (Lerp) when changing rooms.
Keep the code practical, clean, and directly usable in Three.js."""

    req = urllib.request.Request(
        'http://127.0.0.1:20128/v1/chat/completions',
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {key}'
        },
        data=json.dumps({
            'model': 'cx/gpt-6-astra',
            'messages': [{'role': 'user', 'content': prompt}],
            'max_tokens': 2000,
            'temperature': 0.2
        }).encode('utf-8')
    )

    t0 = time.time()
    print("Sending prompt to cx/gpt-6-astra via 9Router...")
    with urllib.request.urlopen(req, timeout=180) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        t1 = time.time()
        print(f"Response received in {t1 - t0:.1f}s!\n")
        print("=== ASTRA ANALYSIS & BLUEPRINT ===")
        print(res['choices'][0]['message']['content'])

if __name__ == '__main__':
    query_astra()
