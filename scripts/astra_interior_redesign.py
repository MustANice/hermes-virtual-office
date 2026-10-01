import urllib.request
import json
import sqlite3

def run_astra_interior_redesign():
    conn = sqlite3.connect('/root/.9router/db/data.sqlite')
    key = conn.cursor().execute('SELECT key FROM apiKeys LIMIT 1').fetchone()[0]
    conn.close()

    prompt = """You are OpenAI Codex (GPT-6 Astra), World-Class 3D Technical Director, Architect & Three.js Master.
The user provided a new interior design reference image for the Hermes Virtual Office:
"Sekarang saya Punya referensi desain interior terbaru ,jadi disini saya meminta kamu untuk Redesign interion kantornya ya ,Pakai saja codex model Astra"

We performed an exhaustive architectural analysis of the reference image:
1. Overall Style: "Warm Cyber-Atelier" / Modern Executive Scandinavian & Japandi Mission Control.
   - Palette: Deep matte charcoal/graphite (#1E2022 to #272A2E) circulation corridors & structural frames.
   - Natural white oak (#C89D66 / #D4A373) horizontal parquet plank floors in rooms.
   - Cognac / amber saddle leather (#A75D2A) upholstery on War Room chairs.
   - Off-white linen (#E8E6E1) on Lounge sofa.
   - Brushed brass / champagne gold hardware (#C5A059).
   - 3000K warm LED light channel troughs flush-mounted along the inner edge of every room's floor perimeter.
   - Deep cyber cyan (#00D2FF) & ice-blue displays.

2. Room-by-Room Redesign Architecture:
   - EXECUTIVE SUITE (x: -21, z: -14, w: 18, d: 14): Monolithic walnut/oak desk with rounded corners, leather inlay pad, high-back black leather chair, two cream guest armchairs, plush cream wool rug, low oak credenza with books & minimalist framed art, potted ficus plant.
   - A2A COORDINATION / CONNECT (Dev Lab) (x: 0, z: -16, w: 20, d: 11): 4 high-perf oak workstations with chamfered edges, dark modesty panels, dual/triple curved ultrawide displays on gas-spring arms, black ergonomic mesh chairs.
   - RESEARCH & INTEL (x: 21, z: -14, w: 18, d: 14): Massive magnetic planning whiteboard with architecture flowcharts/sticky notes framed by oak battens, vertical monitor display, dual workstations with dual curved monitors.
   - WAR ROOM / A2A (Center - x: 0, z: -2.5, w: 20, d: 12): Massive racetrack/boat-shaped walnut conference table, 8 ergonomic conference chairs in COGNAC/AMBER SADDLE LEATHER, custom low-pile cream rug underneath, big real-time world network map video wall display on back partition, glowing cyan 3D A2A hologram core floating over the table center, clear glass balustrades with dark steel posts & brass caps, symmetrical indoor trees in cylindrical white ceramic pots.
   - QA & HARDENING (x: -21, z: 12, w: 18, d: 16): 3 developer pods arranged in an L-Cluster with dual widescreen displays showing telemetry/dark terminal, low oak credenza against left wall with framed schematics.
   - LOUNGE & OPERATIONS (x: 0, z: 14, w: 20, d: 15): Contemporary 3-seater L-sofa in warm off-white linen on textured rug, round dark-stained oak / marble disc coffee table, long oak refreshment bar credenza with espresso machine, bean grinders, glassware, amber-shaded table lamp, and dedicated duty monitoring desk.
   - SRE & INFRASTRUCTURE (x: 21, z: 12, w: 18, d: 16): Industrial 600x600 metallic raised access tile grid, row of 6 industrial 42U server cabinets against the wall with perforated mesh doors, illuminated vertical cable runs, glowing ice-blue and amber status LEDs, monitoring desk with curved ultrawide display + 4-person emergency staging table with task chairs.
   - Threshold Identification Plinths: Low-profile elongated chamfered dark plinth blocks on the corridor floor edge at each room's entrance with crisp uppercase letter-spaced signage (EXECUTIVE SUITE, A2A COORDINATION / CONNECT, RESEARCH & INTEL, WAR ROOM / A2A, QA & HARDENING, LOUNGE & OPERATIONS, SRE & INFRASTRUCTURE).

Write the complete, drop-in replacement TypeScript code for `src/engine/OfficeFloorPlan.ts` implementing this exact interior redesign with meticulous precision, rich geometry, proper materials, and 60 FPS performance!
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

    print("Streaming GPT-6 Astra's Complete OfficeFloorPlan Redesign...")
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
    run_astra_interior_redesign()
