import urllib.request
import json
import sqlite3
import sys

def get_astra_code_patches():
    conn = sqlite3.connect('/root/.9router/db/data.sqlite')
    key = conn.cursor().execute('SELECT key FROM apiKeys LIMIT 1').fetchone()[0]
    conn.close()

    context = """
// 1. Current Desk Positions in RobloxOffice3D.ts:
export const DESK_3D_SPOTS: Record<string, { x: number; y: number; z: number; rotY: number }> = {
  // Strategy Pod (Elevated Y = 0.7)
  orion: { x: -16, y: 0.7, z: -14, rotY: 0 },
  radar: { x: -12, y: 0.7, z: -12.5, rotY: 0.3 },
  quant: { x: -20, y: 0.7, z: -12.5, rotY: -0.3 },

  // Dev Pod (Elevated Y = 0.7)
  forge: { x: -3.5, y: 0.7, z: -14, rotY: 0 },
  frame: { x: 3.5, y: 0.7, z: -14, rotY: 0 },
  aurora: { x: 0, y: 0.7, z: -9.5, rotY: Math.PI },

  // QA Pod (Elevated Y = 0.7)
  prism: { x: 12, y: 0.7, z: -12.5, rotY: -0.3 },
  lens: { x: 16, y: 0.7, z: -14, rotY: 0 },
  sentinel: { x: 20, y: 0.7, z: -12.5, rotY: 0.3 },

  // SRE Vault (Mid-tier Y = 0.2)
  atlas: { x: 16, y: 0.2, z: 0, rotY: -Math.PI / 2 },

  // Social Commons (Y = 0.0)
  nexus: { x: 0, y: 0.0, z: 9, rotY: 0 },
};

// 2. Currently, the desk chair is placed inside the deskGroup:
// chair.position.set(0, 0, 1.2);
// chair.rotation.y = Math.PI;
// deskGroup.add(chair);
// Problem: the avatar was placed at (desk.x, desk.y, desk.z), so avatar sat INSIDE the desk!
// We need the avatar's sitting position to match the chair:
// sittingX = desk.x + Math.sin(desk.rotY) * 1.25
// sittingZ = desk.z + Math.cos(desk.rotY) * 1.25
// sittingRotY = desk.rotY + Math.PI (facing the desk!)

// 3. Current Agora Code:
// A cylinder geometry was used for the floor:
// const pitGeo = new THREE.CylinderGeometry(6.5, 6.5, 0.3, 32);
// pitGeo.scale(1.4, 1, 0.85);
// Problem: Repeated texture on top of cylinder creates a pinched starburst/vortex artifact at the center.
"""

    prompt = f"""You are OpenAI Codex (GPT-6 Astra).
Here is the exact context from RobloxOffice3D.ts:
{context}

Now write the exact TypeScript code for:
1. `computeSittingSpot(deskSpot)` function and the resulting `AGENT_3D_SPOTS` where avatars sit directly ON their chairs facing their monitors.
2. Sleek compact `createBillboard(state)`:
   - High-DPI canvas (width 320, height 90)
   - Name tag pill (w: 160, h: 32, r: 8, font: 'bold 16px Inter')
   - Status dot 4px
   - Thought bubble (w: 240, h: 26, font: '11px Inter')
   - Sprite scale: (2.4, 0.68, 1), position.y = 3.6
3. Clean `buildSunkenAgora()`:
   - Flat planar floor: `THREE.CircleGeometry` with smooth cyan/blue luxury carpet texture with proper UVs (no pinched vortex).
   - Wood rim: `THREE.RingGeometry`.
   - Conference table with laptop meshes and glowing hologram ring.
   - Whiteboard architecture screen.

Output only valid, complete TypeScript code."""

    req = urllib.request.Request(
        'http://127.0.0.1:20128/v1/chat/completions',
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {key}'
        },
        data=json.dumps({
            'model': 'cx/gpt-6-astra',
            'messages': [{'role': 'user', 'content': prompt}],
            'max_tokens': 2500,
            'temperature': 0.1,
            'stream': True
        }).encode('utf-8')
    )

    print("Requesting code from Astra with full context...")
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
                        sys.stdout.write(delta['content'])
                        sys.stdout.flush()
                except Exception:
                    pass
    print("\nCode streaming finished.")

if __name__ == '__main__':
    get_astra_code_patches()
