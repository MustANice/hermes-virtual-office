import urllib.request
import json
import sqlite3

def ask_astra():
    conn = sqlite3.connect('/root/.9router/db/data.sqlite')
    key = conn.cursor().execute('SELECT key FROM apiKeys LIMIT 1').fetchone()[0]
    conn.close()

    prompt = """You are OpenAI Codex (GPT-6 Astra), Principal 3D Three.js Engineer.
The user requested:
"Dari analisa gw nih coba perbaiki postur karakter jika dia ngga kerja bebas fleksibel ,kalo lagi mengerjakan sesuatu dia duduk ,dan teks awannya memberi keterangan yang jelas (Tolong Perbesar untuk teks awannya agar terlihat dengan jelas)"

1. FLEXIBLE IDLE POSTURES (When NOT working: status === 'idle'):
   - Avatars should NOT all look identical or rigid!
   - They should have diverse, expressive, flexible postures depending on where they are:
     - On Lounge Sofa: Relaxed slouch, one arm draped over the sofa backrest, legs casually outstretched or crossed.
     - At Coffee Counter: Standing casually, weight shifted to one hip, holding a coffee cup up to drink every few seconds.
     - Standing in Corridor / Room: Relaxed contrapposto standing, hands on hips or crossed, head looking around slowly.
     - At Desk while Idle: Leaning back in chair with hands behind head or resting on armrests, relaxed head tilt.
     - Wandering: Natural walking swing with knees bending.

2. FOCUSED SEATED POSTURE (When WORKING or TOOL_CALL: status === 'working' | 'tool_call'):
   - Immediately returns to assigned desk workstation.
   - Sits upright facing monitors, thighs horizontal on chair, shins 90° down in legwell.
   - Active typing animation on mechanical keyboard (hands rapid oscillation).
   - Head looking attentively at the screens with subtle micro-movements between dual monitors.

3. SIGNIFICANTLY ENLARGED, ULTRA-CLEAR THOUGHT CLOUD BILLBOARD:
   - User said: "Tolong Perbesar untuk teks awannya agar terlihat dengan jelas" and "memberi keterangan yang jelas".
   - Scale must be large enough to read easily from the isometric camera (cameraDistance = 90)!
     - Canvas size: 680 x 300 (High-DPI 2x Retina clarity).
     - Sprite 3D scale: ~6.2 x 2.7 (roughly 2x larger than before!).
     - Cloud graphics: Beautiful puffy cartoon cloud with 3 centered descending bubbles.
     - Line 1 (Header): Large 24px bold Agent Name + Role icon + Status Badge with glowing colored tag.
     - Line 2 (Divider): Subtle clean line.
     - Line 3 (Clear Activity Explanation): Large 19px medium font with clear, descriptive Indonesian text stating EXACTLY what the agent is doing:
       - Idle at desk: "☕ Standby • Memantau sistem di meja kerja"
       - Idle at coffee: "☕ Istirahat sejenak • Minum kopi di cafe"
       - Idle on sofa: "🛋️ Brainstorming santai di sofa lounge"
       - Idle wandering: "🚶‍♂️ Berkeliling lorong kantor"
       - Working: "⚡ Task: [Task Title / Active Job]"
       - Tool call: "💻 Eksekusi Tool: [Tool Name] [Snippet]"
       - Meeting: "🤝 Diskusi A2A di War Room"
       - Blocked: "⚠️ Terkendala: [Error/Reason]"

Provide the complete updated TypeScript code for RobloxAvatar3D (including billboard creation, postures, and animations) in RobloxOffice3D.ts.
Clean, complete, production-ready code.
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

    print("Streaming GPT-6 Astra's Avatar Postures & Enlarged Thought Clouds...")
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
    ask_astra()
