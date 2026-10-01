import urllib.request
import json
import sqlite3
import sys

def stream_astra():
    conn = sqlite3.connect('/root/.9router/db/data.sqlite')
    key = conn.cursor().execute('SELECT key FROM apiKeys LIMIT 1').fetchone()[0]
    conn.close()

    prompt = """You are OpenAI Codex (GPT-6 Astra), Principal Graphics Engineer.
Provide a concise, high-impact technical specification for elevating the 3D Three.js Roblox Virtual Office at /root/projects/hermes-virtual-office:
1. 3 key procedural texture generators (parquet wood planks, grid carpet, presentation whiteboard architecture diagram).
2. Lighting setup (Directional sun, Ambient, Point lights, contact shadow bias).
3. 5 essential micro-props for desks & cafe (mugs, sticky notes, water cooler bubbles, donuts, server rack cables).
4. Smooth camera Lerp code snippet.
Keep it direct, code-heavy, and focused on immediate implementation."""

    req = urllib.request.Request(
        'http://127.0.0.1:20128/v1/chat/completions',
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {key}'
        },
        data=json.dumps({
            'model': 'cx/gpt-6-astra',
            'messages': [{'role': 'user', 'content': prompt}],
            'max_tokens': 1200,
            'temperature': 0.2,
            'stream': True
        }).encode('utf-8')
    )

    print("Connecting to cx/gpt-6-astra stream...")
    with urllib.request.urlopen(req, timeout=120) as resp:
        for line in resp:
            line_str = line.decode('utf-8').strip()
            if line_str.startswith('data: '):
                chunk_data = line_str[6:]
                if chunk_data == '[DONE]':
                    break
                try:
                    delta = json.loads(chunk_data)['choices'][0]['delta']
                    if 'content' in delta:
                        sys.stdout.write(delta['content'])
                        sys.stdout.flush()
                except Exception:
                    pass
    print("\nStream finished.")

if __name__ == '__main__':
    stream_astra()
