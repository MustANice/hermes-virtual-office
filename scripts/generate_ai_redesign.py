import urllib.request
import urllib.parse
import os

prompt = """Photorealistic 3D architectural visualization, high-end office interior render, isometric cutaway bird's-eye view of a modern corporate technology headquarters. 
Seven glass-partitioned operational zones on an elevated dark diorama slab against a dark studio background:
Top row: Executive Suite with curved natural oak desk and cream armchairs, central A2A Collaboration room with wooden workstations and monitors, Research & Intel room with whiteboard diagram and research desks.
Center: War Room conference room with large boat-shaped dark walnut table, ten cognac leather chairs, and panoramic world network map display.
Bottom row: QA & Hardening workspace with workstations, Lounge & Operations area with cream sofa, round coffee table and espresso counter, SRE & Infrastructure room with black enterprise server racks and metallic raised access floor.
Natural white oak parquet flooring in suites, dark charcoal wood plank circulation corridors, waist-high glass balustrades with thin black steel frames and natural oak door portals with double glass doors swung open. Warm white lighting, soft shadows, realistic PBR materials, biophilic indoor potted plants, architectural presentation quality, ultra sharp, 8k resolution."""

encoded_prompt = urllib.parse.quote(prompt)
url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1280&height=720&model=flux&nologo=true&seed=42"

print("Requesting image from Pollinations...")
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
try:
    with urllib.request.urlopen(req, timeout=90) as resp:
        data = resp.read()
        out_path = "/root/projects/hermes-virtual-office/rendered_redesign_office.jpg"
        with open(out_path, "wb") as f:
            f.write(data)
        print(f"Saved {len(data)} bytes to {out_path}")
except Exception as e:
    print("Error:", e)
