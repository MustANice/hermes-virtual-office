import urllib.request
import json
import sqlite3

def stream_complete_avatar():
    conn = sqlite3.connect('/root/.9router/db/data.sqlite')
    key = conn.cursor().execute('SELECT key FROM apiKeys LIMIT 1').fetchone()[0]
    conn.close()

    with open('/root/projects/hermes-virtual-office/src/engine/RobloxOffice3D.ts', 'r') as f:
        full_file = f.read()

    # Extract the RobloxAvatar3D class section
    start_str = "export class RobloxAvatar3D {"
    end_str = "export class RobloxOffice3D {"
    avatar_section = full_file[full_file.find(start_str):full_file.find(end_str)]

    prompt = f"""You are OpenAI Codex (GPT-6 Astra), Principal 3D Graphics Engineer.
Here is our existing `RobloxAvatar3D` class:
```ts
{avatar_section}
```

Now rewrite and upgrade `RobloxAvatar3D` with:
1. MUCH LARGER, HIGH-DPI CARTOON THOUGHT CLOUD BILLBOARD:
   - High-DPI Canvas: 1024 x 440 (sharp text from isometric camera distance 90).
   - Sprite Scale: 6.8 x 2.9 (roughly 2.2x larger than before!).
   - Puffy cartoon cloud silhouette with 3 descending circular trail bubbles.
   - Text formatting:
     - Top line: Large bold (28px) Agent Name with role icon & vibrant pill badge (⚡ SEDANG KERJA, ☕ IDLE / SANTAI, 💻 EKSEKUSI TOOL, ⚠️ TERKENDALA).
     - Divider line.
     - Bottom line: Large (24px) crystal-clear activity explanation in plain Indonesian:
       - If idle at desk: "☕ Standby • Memantau sistem di meja kerja"
       - If idle at coffee: "☕ Istirahat • Minum kopi di barista cafe"
       - If idle on sofa: "🛋️ Santai & diskusi di sofa lounge"
       - If working: "⚡ Mengerjakan task: [Task Title]"
       - If tool_call: "💻 Menjalankan tool: [Tool Name] [Snippet]"
       - If blocked: "⚠️ Terkendala: [Error Details]"
2. FLEXIBLE & REALISTIC POSTURES:
   - When WORKING (status === 'working' | 'tool_call'):
     - Sits firmly in chair facing monitors, typing active hand motion, head looking at screens.
   - When IDLE (status === 'idle'):
     - If at sofa: reclined sitting posture (torso tilted back 0.18 rad, arms relaxed, legs stretched out).
     - If at coffee counter: standing contrapposto posture (torso slightly shifted, right arm raising cup to sip periodically).
     - If at desk: casual lean-back posture with arms resting on chair armrests.
     - If walking: natural swinging legs with knee flexion.
3. Keep `navigateTo`, `tick`, `updateState`, and `onUserClick`.

Output ONLY the complete TypeScript code for `export class RobloxAvatar3D {{ ... }}`.
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

    print("Streaming upgraded RobloxAvatar3D from GPT-6 Astra...")
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
    stream_complete_avatar()
