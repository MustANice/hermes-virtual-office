import urllib.request
import json
import sqlite3

def ask_astra_for_animation_and_visual_mastery():
    conn = sqlite3.connect('/root/.9router/db/data.sqlite')
    key = conn.cursor().execute('SELECT key FROM apiKeys LIMIT 1').fetchone()[0]
    conn.close()

    prompt = """You are OpenAI Codex (GPT-6 Astra), World-Class 3D Technical Director & Three.js Animation Master.
The user wants to dramatically elevate our Hermes Virtual AI Agent Office:
"Sekarang gw mau update visual agar lebih bagus ,bantu analisa agar hasil terbaru lebih bagus untuk visualisasi animasi animasinya ,Gunakan codex model astra agar hasilnya maksimal"

Analyze and design a high-end visual & animation upgrade for our 3D office (Three.js WebGL):

1. Procedural Character & Avatar Animation Mastery:
   - Breathing & Idle Micro-Animations: Subtle natural torso respiration bobbing, head micro-turns scanning the room, gentle weight shifting while standing.
   - Walking Physics: Natural spring-based step gait (sinusoidal bounce with foot plant and knee fold, slight forward torso tilt 0.05 rad, rhythmic arm swing).
   - Typing & Work Interaction: Active tactile typing with alternating left/right hand micro-strikes on keyboard keys, head focused on code monitors with saccadic glances between screens.
   - Coffee & Lounge Relaxation: Smooth cup-raising drinking gesture at cafe with gentle steam particles; relaxed reclined lounging on sofa with slow head tilt.
   - State Transition Smoothing: Seamless slerp/lerp between sitting, standing, walking, and working states so avatars NEVER snap or teleport!

2. Living Environment & Prop Animation:
   - War Room A2A Holographic Core: Outer spinning gimbal rings, pulsing particle sparks, glowing cyan core beacon with breathing light radius.
   - Datacenter SRE Infrastructure: Dynamic LED chase patterns across the 4 server rack blades (blinking green/cyan/amber data traffic), glowing pulsing fiber optic trunk cables.
   - Workstation Monitors: Subtle animated code line scanning, glowing oscilloscopes, and screen light bounce.
   - Potted Plants: Subtle gentle ambient breeze sway on broad monstera and ficus leaves.

3. Cloud Thought Billboard ('Teks Berawan') Floating Dynamics:
   - Gentle ambient float / levitation: Subtle smooth floating bobbing (Y oscillation +-0.12 with gentle sine wave), giving a delightful buoyant cloud feeling.
   - Pop & Spring transition when task/status changes.

Provide an exhaustive architectural critique and the complete, drop-in replacement code for `RobloxOffice3D.ts` (or the specific animation modules) that brings this living virtual office to life at smooth 60 FPS.
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
            'max_tokens': 3900,
            'temperature': 0.15,
            'stream': True
        }).encode('utf-8')
    )

    print("Streaming GPT-6 Astra's Animation & Visual Mastery Blueprint...")
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
    ask_astra_for_animation_and_visual_mastery()
