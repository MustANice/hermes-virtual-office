# DESIGN CONTRACT — Hermes Virtual Office Simulator (OfficeMap.ts Engine)

**Target Production File:** `/root/projects/hermes-virtual-office/src/engine/OfficeMap.ts`  
**Consuming Specialist:** FRAME (Principal Frontend Experience Engineer)  
**Authoring Specialist:** AURORA (Product Design Intelligence & Art Direction Director)  
**QA & Verification Specialist:** LENS (Visual QA & Inspection Lead)  
**Parent Task ID:** `t_f7195a1d` | **Downstream Implementation Task:** `t_287bcdeb`  
**Date:** September 28, 2026  
**Governance Standard:** Fleet V3.1 8-Step Design Protocol, Fleet UI Diversity Governance V3.3 & Fleet Excellence V1  

---

## 1. Scope, Target & Compatibility Contract

### 1.1 Non-Negotiable Integration Invariants
FRAME must implement the complete visual overhaul of `OfficeMap.ts` while preserving 100% runtime compatibility with the existing engine. The following interfaces, exports, and contracts must remain intact:

1. **Exported Interface `RoomDef`**:
   ```typescript
   export interface RoomDef {
     id: string;
     name: string;
     x: number;
     y: number;
     w: number;
     h: number;
     color: string;
     accent: string;
   }
   ```
2. **Exported Array `ROOMS`**:
   Must retain the exact 7 room definitions, identifiers, and bounds:
   - `manager`: `x: 80, y: 70, w: 240, h: 170`, color: `#161924`, accent: `#3B82F6`
   - `dev`: `x: 350, y: 70, w: 290, h: 180`, color: `#131824`, accent: `#F97316`
   - `research`: `x: 670, y: 70, w: 290, h: 170`, color: `#121A22`, accent: `#10B981`
   - `meeting`: `x: 370, y: 285, w: 250, h: 135`, color: `#141828`, accent: `#38BDF8`
   - `qa_security`: `x: 80, y: 350, w: 260, h: 250`, color: `#181524`, accent: `#A855F7`
   - `lounge`: `x: 370, y: 440, w: 270, h: 165`, color: `#1A181C`, accent: `#14B8A6`
   - `server_room`: `x: 670, y: 350, w: 290, h: 250`, color: `#10141E`, accent: `#EAB308`
3. **Exported Class `OfficeMap`**:
   Must expose the public render signature:
   ```typescript
   export class OfficeMap {
     public render(ctx: CanvasRenderingContext2D, activeRoomFilter = 'all'): void;
   }
   ```
4. **Waypoint & Avatar Path Safety Invariant**:
   Zero furniture, equipment, or architectural boundaries may block, occlude, or collide with the coordinates declared in `WaypointGraph.ts` or agent home desks declared in `hermesAdapter.js`.

---

## 2. Master Spatial Coordinate & Furniture Reference Map

Every object in the virtual office is mathematically mapped to world coordinates. FRAME must implement exact dimensions and positions according to this master registry:

### 2.1 Campus Perimeter & Architectural Shell
- **Campus Midpoint**: `(520, 335)`
- **Outer Campus Boundary**: `x: 50, y: 40, w: 940, h: 590` (Corner radius: 16px, Wall thickness: 3px `#1E2533`)
- **Hallway Arterial Flooring**: `x: 55, y: 45, w: 930, h: 580` (Corner radius: 12px, Base fill: `#141822`, Tile grain lines every 24px)

### 2.2 Top-Wall Skyline Windows & Venetian Blinds
- **Executive Suite Window**: `x: 120, y: 70, w: 100, h: 8` (4 panes, 3 vertical mullions, 5 horizontal blind slats)
- **Dev Lab Windows**:
  - Bay A: `x: 385, y: 70, w: 85, h: 8` (Above Forge workstation)
  - Bay B: `x: 510, y: 70, w: 85, h: 8` (Above Frame workstation)
- **Research Lab Window**: `x: 740, y: 70, w: 120, h: 8` (4 panes, above Radar/Quant workstations)
- **Visual Spec**:
  - Sky gradient: `ctx.createLinearGradient(x, y, x, y + 8)` from `#0A1120` to `#1E293B`.
  - Distant skyscraper towers: 5-8 tiny vertical rectangular building tops with illuminated window pixels (`#FCD34D`, `#60A5FA`).
  - Venetian blinds: 1px horizontal lines (`rgba(255, 255, 255, 0.16)`) spaced 2px apart with soft drop shadow onto floor.

### 2.3 Room 1: Executive Suite (`manager`, x: 80, y: 70, w: 240, h: 170)
- **Flooring**: Alternating walnut parquet planks (`x: 80, y: 70, w: 240, h: 170`, 24x10px planks).
- **Executive Desk (Orion)**:
  - Desk Body: `x: 155, y: 145, w: 85, h: 36` (Solid beveled dark mahogany `#322219`, chamfered 4px radius).
  - Desk Pad: `x: 168, y: 150, w: 60, h: 26` (`#1A1C23`).
  - Dual Curved Monitors:
    - Left Screen (IDE): `x: 170, y: 146, w: 24, h: 7` (Bezel `#0F172A`, Code highlight lines `#F97316`, `#38BDF8`).
    - Right Screen (Executive Telemetry): `x: 198, y: 146, w: 24, h: 7` (Bezel `#0F172A`, Area sparkline `#3B82F6`).
  - Mechanical Keyboard: `x: 180, y: 158, w: 22, h: 7` (`#1E222D` with `#38BDF8` spacebar).
  - Optical Mouse: `x: 206, y: 160, w: 4, h: 6` (`#2D3748`).
  - Warm Desk Lamp: `x: 158, y: 148` (Brass base `#D97706`, lamp arm, 2700K radial cone radius 45px).
  - Steaming Coffee Mug: `x: 230, y: 152, w: 5, h: 5` (`#E2E8F0`, animated dual-particle steam).
- **Leather Executive Chair**: `x: 183, y: 185, w: 28, h: 18` (Padded black leather `#18171C`, 4px radius).
- **Executive Area Rug**: `x: 140, y: 135, w: 115, h: 72` (Midnight navy `#151E2B`, gold border `#B45309`, 4px radius).
- **Mahogany Bookshelf**: `x: 88, y: 108, w: 18, h: 72` (3 shelves, colorful book spines `#EF4444`, `#3B82F6`, `#F59E0B`, `#10B981`).
- **Monstera Plant**: `x: 95, y: 220` (Terracotta pot `w: 14, h: 12` `#9A3412`, 5 fenestrated leaves `#15803D`).

### 2.4 Room 2: Development Lab (`dev`, x: 350, y: 70, w: 290, h: 180)
- **Flooring**: Alternating walnut parquet planks (`x: 350, y: 70, w: 290, h: 180`, 24x10px planks).
- **Workstation 1 (Forge - Backend & APIs)**:
  - Desk: `x: 395, y: 130, w: 75, h: 32` (Walnut `#36281E`, 4px radius).
  - Dual Displays: `x: 410, y: 132, w: 22, h: 6` & `x: 435, y: 132, w: 22, h: 6` (Orange code syntax `#F97316`).
  - Keyboard & Mouse: `x: 422, y: 142, w: 20, h: 6` & `x: 446, y: 143, w: 4, h: 5`.
  - Steaming Mug: `x: 400, y: 135` (`#F97316` ceramic).
  - Desk Lamp: `x: 462, y: 133` (Warm amber cone).
- **Workstation 2 (Frame - Frontend & UI)**:
  - Desk: `x: 515, y: 130, w: 75, h: 32` (Walnut `#36281E`, 4px radius).
  - Dual Displays: `x: 530, y: 132, w: 22, h: 6` & `x: 555, y: 132, w: 22, h: 6` (Cyan UI mockups `#06B6D4`).
  - Keyboard & Mouse: `x: 542, y: 142, w: 20, h: 6` & `x: 566, y: 143, w: 4, h: 5`.
  - Steaming Mug: `x: 520, y: 135` (`#06B6D4` ceramic).
  - Desk Lamp: `x: 582, y: 133` (Warm amber cone).
- **Workstation 3 (Aurora - Product & Art Direction)**:
  - Desk: `x: 455, y: 200, w: 75, h: 32` (Walnut `#36281E`, 4px radius).
  - Dual Displays: `x: 470, y: 222, w: 22, h: 6` & `x: 495, y: 222, w: 22, h: 6` (Pink design palette `#EC4899`).
  - Keyboard & Mouse: `x: 482, y: 212, w: 20, h: 6` & `x: 506, y: 213, w: 4, h: 5`.
  - Steaming Mug: `x: 460, y: 205` (`#EC4899` ceramic).
  - Desk Lamp: `x: 462, y: 223` (Warm amber cone).
- **Architectural Whiteboard**: `x: 624, y: 110, w: 6, h: 52` (Aluminum frame, blue/cyan flow diagrams).
- **Fiddle-Leaf Fig Tree**: `x: 362, y: 225` (Ceramic white pot `w: 12, h: 12`, tall trunk, 4 violin leaves `#166534`).

### 2.5 Room 3: Research & Intel (`research`, x: 670, y: 70, w: 290, h: 170)
- **Flooring**: Alternating walnut parquet planks (`x: 670, y: 70, w: 290, h: 170`).
- **Workstation 4 (Radar - Research & Sources)**:
  - Desk: `x: 735, y: 130, w: 75, h: 32` (Walnut `#36281E`, 4px radius).
  - Dual Displays: `x: 750, y: 132, w: 22, h: 6` & `x: 775, y: 132, w: 22, h: 6` (Emerald crawler streams `#10B981`).
  - Steaming Mug: `x: 740, y: 135` (`#10B981` ceramic).
- **Workstation 5 (Quant - Quantitative & Market Analysis)**:
  - Desk: `x: 855, y: 130, w: 75, h: 32` (Walnut `#36281E`, 4px radius).
  - Dual Displays: `x: 870, y: 132, w: 22, h: 6` & `x: 895, y: 132, w: 22, h: 6` (Lime market candlestick charts `#84CC16`).
  - Steaming Mug: `x: 860, y: 135` (`#84CC16` ceramic).
- **Research Library Bookshelf**: `x: 938, y: 80, w: 18, h: 65` (Multi-color spine stacks).
- **Fiddle-Leaf Fig Tree**: `x: 940, y: 220` (Ceramic pot, tall leafy canopy).

### 2.6 Room 4: War Room / Conference (`meeting`, x: 370, y: 285, w: 250, h: 135)
- **Glass Perimeter Enclosure**: Frosted acoustic glass border (`rgba(56, 189, 248, 0.4)` with animated refraction).
- **Hand-Woven Kilim Area Rug**: `x: 405, y: 312, w: 180, h: 90` (Terracotta base `#45211B`, ivory diamond lozenges `#D4C4B5`, fringed edge ticks).
- **Conference Presentation Screen (65")**:
  - Body: `x: 445, y: 288, w: 100, h: 28` (Matte black bezel `#0B0F19`, glass surface `#0F172A`).
  - Diagram: Glowing microservices topology (cloud ingress `#38BDF8`, worker nodes `#F59E0B`, database `#10B981`, connecting arrows).
- **Solid Mahogany Conference Table**:
  - Table: `x: 435, y: 332, w: 120, h: 56` (Rounded 18px radius, beveled walnut `#322017`).
  - Center Cable Trough: `x: 460, y: 356, w: 70, h: 8` (Brushed steel `#71717A`).
- **Conference Laptops**: 4 open ultra-slim laptops around the table with glowing screen angles (`#E2E8F0`).
- **6 Conference Chairs**: 3 top (`y: 322`, `x: 450, 490, 530`), 3 bottom (`y: 390`, `x: 450, 490, 530`).
- **Analog Wall Clock**: `x: 495, y: 284` (Brass circular bezel, ticking hour/minute/second hands).

### 2.7 Room 5: QA & Hardening (`qa_security`, x: 80, y: 350, w: 260, h: 250)
- **Flooring**: Alternating dark walnut parquet planks (`x: 80, y: 350, w: 260, h: 250`).
- **Workstation 6 (Prism - Functional QA)**:
  - Desk: `x: 145, y: 430, w: 75, h: 32` (Walnut `#36281E`, dual displays with purple test matrices `#A855F7`).
- **Workstation 7 (Lens - Visual QA & Metrology)**:
  - Desk: `x: 245, y: 430, w: 75, h: 32` (Walnut `#36281E`, dual displays with indigo diff renders `#6366F1`).
- **Workstation 8 (Sentinel - Security & Threat Review)**:
  - Desk: `x: 195, y: 520, w: 75, h: 32` (Walnut `#36281E`, dual displays with crimson threat telemetry `#EF4444`).
- **Monstera Plant**: `x: 92, y: 565` (Terracotta pot with lush fenestrated leaves).

### 2.8 Room 6: Lounge & Operations (`lounge`, x: 370, y: 440, w: 270, h: 165)
- **Flooring**: Alternating honey-walnut parquet planks (`x: 370, y: 440, w: 270, h: 165`).
- **Woven Berber Lounge Rug**: `x: 435, y: 525, w: 140, h: 65` (Warm sand cross-hatch `#2A2722`).
- **Modular Sectional Sofa**: `x: 440, y: 535, w: 70, h: 35` (Padded charcoal corduroy `#2D2830`, 6px radius).
- **Walnut Low Coffee Table**: `x: 525, y: 540, w: 35, h: 25` (Walnut `#241B14`, magazines, coffee cups).
- **Top-Loading 5-Gallon Water Cooler**:
  - Base: `x: 382, y: 448, w: 18, h: 26` (White dispenser base, hot/cold spigots).
  - Bottle: Inverted 5-gal blue water jug (`rgba(56, 189, 248, 0.45)` with animated rising bubbles).
- **Commercial Italian Espresso Bar**:
  - Counter: `x: 378, y: 480, w: 26, h: 50` (Walnut bar with stainless steel countertop).
  - Machine: Chrome twin-group espresso machine with dual portafilters and animated rising steam.
- **Workstation 9 (Nexus - Runbooks & Operations)**:
  - Desk: `x: 535, y: 485, w: 65, h: 28` (Teal runbook screen `#14B8A6`).
- **Large Potted Monstera**: `x: 622, y: 468` (Fluted terracotta pot, rich green leaves).

### 2.9 Room 7: SRE & Infrastructure Datacenter (`server_room`, x: 670, y: 350, w: 290, h: 250)
- **Flooring**: Raised anti-static computer room floor tiles (24x24px grid, `#121622` slate, corner rivet dots `#2D3B54`, recessed seam lines).
- **Four 42U Server Cabinets**:
  - Rack 1: `x: 885, y: 375, w: 58, h: 34`
  - Rack 2: `x: 885, y: 418, w: 58, h: 34`
  - Rack 3: `x: 885, y: 461, w: 58, h: 34`
  - Rack 4: `x: 885, y: 504, w: 58, h: 34`
  - Features: Dark matte graphite frame, recessed perforated mesh door, vertical silver unit ticks, server blades with drive trays.
  - Multi-Rate Status LEDs: 3 clusters per blade (Power steady green `#22C55E`, Network link blinking blue `#38BDF8`, Disk I/O stochastic amber `#F59E0B`).
- **Combed Cable Looms**: Bundles of blue cat6 (`#2563EB`), yellow fiber (`#EAB308`), and purple patch cables (`#9333EA`) emerging from rack sides into floor grommets.
- **Workstation 10 (Atlas - SRE & Systems)**:
  - Desk: `x: 800, y: 455, w: 65, h: 32` (Amber terminal display `#EAB308`).

---

## 3. Strict Rendering Layer Pipeline (Paint Order Z-Index)

To guarantee flawless depth and prevent visual artifacts, FRAME must structure `OfficeMap.render()` into this exact 12-layer paint sequence:

```
[Layer 0]  Campus Foundation & Outer Drop Shadow
   ↓
[Layer 1]  Campus Boundary Walls & Hallway Base Floor
   ↓
[Layer 2]  Top-Wall Windows, Twilight Skyline & Venetian Blinds
   ↓
[Layer 3]  Room Flooring (Parquet Planks, Raised Server Tiles, Hallway Basalt)
   ↓
[Layer 4]  Woven Area Rugs (Kilim, Berber, Fringe Tassels)
   ↓
[Layer 5]  Architectural Dividers, Door Thresholds & Glass Partitions
   ↓
[Layer 6]  Heavy Fixtures & Background Fixtures (Bookshelves, Server Racks, Espresso Bar, Conference Display)
   ↓
[Layer 7]  Desks, Conference Table, Sectional Sofas & Chairs
   ↓
[Layer 8]  Desk Equipment & Peripherals (Monitors, Keyboards, Mice, Laptops, Coffee Mugs)
   ↓
[Layer 9]  Ambient Dynamic Overlays (2700K Lamp Cones, Steam Wisps, Water Bubbles, Blinking LEDs, Clock Hands)
   ↓
[Layer 10] Biophilic Plants (Monstera Pots, Fiddle-Leaf Fig Trees)
   ↓
[Layer 11] Room Header Badges & Monospace Typographic Labels
```

---

## 4. Concrete Canvas 2D Primitives & Algorithms for FRAME

### 4.1 Alternating Parquet Plank Drawing Algorithm
FRAME must render parquet floors by clipping to the room bounds and iterating through staggered rows:
```typescript
private drawParquetFloor(ctx: CanvasRenderingContext2D, rx: number, ry: number, rw: number, rh: number) {
  ctx.save();
  this.drawRoundedRect(ctx, rx, ry, rw, rh, 8);
  ctx.clip();

  const plankW = 24;
  const plankH = 10;
  const tones = ['#281B14', '#2E2018', '#33241B', '#38271E', '#2B1E16'];

  for (let y = ry; y < ry + rh; y += plankH) {
    const rowIndex = Math.floor((y - ry) / plankH);
    const offsetX = (rowIndex % 2 === 0) ? 0 : plankW / 2;
    for (let x = rx - plankW; x < rx + rw; x += plankW) {
      const plankIndex = Math.abs(Math.floor((x - rx) / plankW) + rowIndex * 7) % tones.length;
      ctx.fillStyle = tones[plankIndex];
      ctx.fillRect(x + offsetX, y, plankW, plankH);

      // 1px beveled v-groove separation lines
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + offsetX + 0.5, y + 0.5, plankW, plankH);
    }
  }
  ctx.restore();
}
```

### 4.2 Raised Server Datacenter Floor Tile Algorithm
```typescript
private drawServerTiles(ctx: CanvasRenderingContext2D, rx: number, ry: number, rw: number, rh: number) {
  ctx.save();
  this.drawRoundedRect(ctx, rx, ry, rw, rh, 8);
  ctx.clip();

  ctx.fillStyle = '#121622';
  ctx.fillRect(rx, ry, rw, rh);

  const tileSize = 24;
  ctx.strokeStyle = '#1A2232';
  ctx.lineWidth = 1;

  for (let x = rx; x <= rx + rw; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, ry);
    ctx.lineTo(x + 0.5, ry + rh);
    ctx.stroke();
  }
  for (let y = ry; y <= ry + rh; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(rx, y + 0.5);
    ctx.lineTo(rx + rw, y + 0.5);
    ctx.stroke();
  }

  // Corner metallic rivets
  ctx.fillStyle = '#2D3B54';
  for (let x = rx; x <= rx + rw; x += tileSize) {
    for (let y = ry; y <= ry + rh; y += tileSize) {
      ctx.fillRect(x - 1, y - 1, 2, 2);
    }
  }
  ctx.restore();
}
```

### 4.3 Woven Geometric Kilim Rug Algorithm
```typescript
private drawKilimRug(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.save();
  // Base textile
  ctx.fillStyle = '#45211B';
  this.drawRoundedRect(ctx, x, y, w, h, 4);
  ctx.fill();

  // Geometric border
  ctx.strokeStyle = '#D4C4B5';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 5, y + 5, w - 10, h - 10);

  // Central diamond lozenges
  ctx.fillStyle = 'rgba(212, 196, 181, 0.25)';
  const step = 20;
  for (let dx = x + 16; dx < x + w - 16; dx += step) {
    ctx.beginPath();
    ctx.moveTo(dx, y + h / 2 - 8);
    ctx.lineTo(dx + 8, y + h / 2);
    ctx.lineTo(dx, y + h / 2 + 8);
    ctx.lineTo(dx - 8, y + h / 2);
    ctx.closePath();
    ctx.fill();
  }

  // Fringe ticks on left & right ends
  ctx.strokeStyle = 'rgba(212, 196, 181, 0.4)';
  ctx.lineWidth = 1;
  for (let fy = y + 4; fy < y + h - 4; fy += 4) {
    ctx.beginPath();
    ctx.moveTo(x - 2, fy);
    ctx.lineTo(x, fy);
    ctx.moveTo(x + w, fy);
    ctx.lineTo(x + w + 2, fy);
    ctx.stroke();
  }
  ctx.restore();
}
```

### 4.4 Top-Wall Window with Twilight Skyline & Venetian Blinds Algorithm
```typescript
private drawTopWallWindow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.save();
  // 1. Cutout window aperture
  ctx.fillStyle = '#080E1A';
  ctx.fillRect(x, y, w, h);

  // 2. Twilight Sky Gradient
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, '#0C1628');
  grad.addColorStop(1, '#241D33');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);

  // 3. Skyscraper Silhouettes
  ctx.fillStyle = '#070B14';
  const numBuildings = Math.floor(w / 14);
  for (let i = 0; i < numBuildings; i++) {
    const bx = x + i * 14 + 1;
    const bh = 3 + (i * 7) % 5;
    ctx.fillRect(bx, y + h - bh, 12, bh);
    // Glowing window dots
    if (i % 2 === 0) {
      ctx.fillStyle = '#FCD34D';
      ctx.fillRect(bx + 2, y + h - bh + 1, 1.5, 1.5);
      ctx.fillStyle = '#60A5FA';
      ctx.fillRect(bx + 6, y + h - bh + 1, 1.5, 1.5);
      ctx.fillStyle = '#070B14';
    }
  }

  // 4. Horizontal Venetian Blinds
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.lineWidth = 1;
  for (let by = y + 1.5; by < y + h; by += 2.5) {
    ctx.beginPath();
    ctx.moveTo(x, by);
    ctx.lineTo(x + w, by);
    ctx.stroke();
  }

  // 5. Window Frame / Mullions
  ctx.strokeStyle = '#2D3748';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  for (let mx = x + w / 3; mx < x + w - 10; mx += w / 3) {
    ctx.beginPath();
    ctx.moveTo(Math.floor(mx) + 0.5, y);
    ctx.lineTo(Math.floor(mx) + 0.5, y + h);
    ctx.stroke();
  }
  ctx.restore();
}
```

### 4.5 Dual-Monitor Workstation with Syntax Lines & Sparklines
```typescript
private drawWorkstation(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  accentColor: string, isScreenDown = true
) {
  ctx.save();
  // 1. Solid Walnut Desk Top with Chamfer
  ctx.fillStyle = '#36281E';
  this.drawRoundedRect(ctx, x, y, w, h, 4);
  ctx.fill();
  ctx.strokeStyle = '#4A372A';
  ctx.lineWidth = 1;
  ctx.stroke();

  // 2. Desk Mat / Blotter
  ctx.fillStyle = '#181B22';
  this.drawRoundedRect(ctx, x + 8, y + 6, w - 16, h - 12, 2);
  ctx.fill();

  // 3. Monitor Coordinates
  const monY = isScreenDown ? y + 2 : y + h - 8;
  const leftMonX = x + 12;
  const rightMonX = x + 38;

  // Left Monitor (IDE Code Lines)
  ctx.fillStyle = '#0A0F1D';
  ctx.fillRect(leftMonX, monY, 22, 6);
  // Code syntax lines
  ctx.fillStyle = '#F97316'; ctx.fillRect(leftMonX + 2, monY + 1.5, 5, 1);
  ctx.fillStyle = '#38BDF8'; ctx.fillRect(leftMonX + 8, monY + 1.5, 7, 1);
  ctx.fillStyle = '#10B981'; ctx.fillRect(leftMonX + 2, monY + 3.5, 9, 1);
  // Power LED
  ctx.fillStyle = '#22C55E'; ctx.fillRect(leftMonX + 20, monY + 5, 1, 1);

  // Right Monitor (Sparkline Chart)
  ctx.fillStyle = '#0A0F1D';
  ctx.fillRect(rightMonX, monY, 22, 6);
  // Mini sparkline
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(rightMonX + 2, monY + 4);
  ctx.lineTo(rightMonX + 6, monY + 2);
  ctx.lineTo(rightMonX + 11, monY + 4.5);
  ctx.lineTo(rightMonX + 16, monY + 1.5);
  ctx.lineTo(rightMonX + 20, monY + 3);
  ctx.stroke();

  // 4. Mechanical Keyboard with Accent Spacebar
  const kbY = isScreenDown ? y + 13 : y + 10;
  ctx.fillStyle = '#1C1F2B';
  ctx.fillRect(x + 24, kbY, 18, 6);
  ctx.fillStyle = accentColor;
  ctx.fillRect(x + 30, kbY + 4, 6, 1); // Spacebar

  // 5. Optical Mouse
  ctx.fillStyle = '#2E3648';
  ctx.fillRect(x + 46, kbY + 1, 4, 5);

  // 6. Ceramic Mug with Rising Steam
  const mugX = x + 6;
  const mugY = isScreenDown ? y + 14 : y + 8;
  this.drawMugWithSteam(ctx, mugX, mugY, accentColor);

  // 7. Warm Desk Lamp with 2700K Radial Glow Cone
  const lampX = x + w - 8;
  const lampY = isScreenDown ? y + 6 : y + h - 6;
  this.drawWarmDeskLamp(ctx, lampX, lampY);

  ctx.restore();
}
```

### 4.6 Animated Steam Particle Wisp Algorithm
```typescript
private drawMugWithSteam(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  // Ceramic mug cup
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 5, 5);
  ctx.fillStyle = '#1A120B';
  ctx.fillRect(x + 1, y + 1, 3, 3); // Coffee surface

  // Animated curling steam wisps
  const steam1 = Math.sin(this.animTick * 2.8) * 1.5;
  const steam2 = Math.cos(this.animTick * 2.2) * 1.5;
  const alpha = 0.2 + (Math.sin(this.animTick * 2.5) + 1) * 0.2;

  ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 2, y);
  ctx.quadraticCurveTo(x + 2 + steam1, y - 4, x + 2 + steam2, y - 8);
  ctx.stroke();
}
```

### 4.7 Water Cooler with Animated Micro Bubbles Algorithm
```typescript
private drawWaterCooler(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  // White dispenser cabinet
  ctx.fillStyle = '#F8FAFC';
  this.drawRoundedRect(ctx, x, y + 10, 18, 16, 2);
  ctx.fill();
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Spigots
  ctx.fillStyle = '#EF4444'; ctx.fillRect(x + 4, y + 13, 3, 2); // Hot
  ctx.fillStyle = '#3B82F6'; ctx.fillRect(x + 11, y + 13, 3, 2); // Cold

  // Inverted Blue 5-Gallon Bottle
  ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
  this.drawRoundedRect(ctx, x + 2, y, 14, 11, 4);
  ctx.fill();
  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Water level & neck
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fillRect(x + 4, y + 2, 10, 1);
  ctx.fillStyle = '#E2E8F0';
  ctx.fillRect(x + 6, y + 10, 6, 2);

  // Animated Rising Micro-Bubbles
  const b1 = (Math.floor(this.animTick * 20) % 10);
  const b2 = (Math.floor(this.animTick * 20 + 5) % 10);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fillRect(x + 6, y + 9 - b1, 1.5, 1.5);
  ctx.fillRect(x + 10, y + 9 - b2, 1.5, 1.5);
  ctx.restore();
}
```

### 4.8 Commercial Espresso Bar Algorithm
```typescript
private drawEspressoBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.save();
  // Countertop
  ctx.fillStyle = '#2B1E16';
  this.drawRoundedRect(ctx, x, y, w, h, 3);
  ctx.fill();

  // Stainless steel drip tray & espresso machine housing
  ctx.fillStyle = '#E2E8F0';
  ctx.fillRect(x + 3, y + 10, w - 6, 26);
  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 3.5, y + 10.5, w - 7, 25);

  // Chrome Twin Group Heads & Portafilters
  ctx.fillStyle = '#475569';
  ctx.fillRect(x + 6, y + 20, 5, 6);
  ctx.fillRect(x + 15, y + 20, 5, 6);
  ctx.fillStyle = '#0F172A'; // Black portafilter handles
  ctx.fillRect(x + 7, y + 26, 3, 5);
  ctx.fillRect(x + 16, y + 26, 3, 5);

  // Pressure dials
  ctx.fillStyle = '#F8FAFC';
  ctx.beginPath(); ctx.arc(x + 8, y + 14, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 17, y + 14, 2, 0, Math.PI * 2); ctx.fill();

  // Cup warming rack on top with demitasse cups
  ctx.fillStyle = '#CBD5E1';
  ctx.fillRect(x + 4, y + 8, w - 8, 2);
  ctx.fillStyle = '#EF4444'; ctx.fillRect(x + 6, y + 5, 3, 3);
  ctx.fillStyle = '#3B82F6'; ctx.fillRect(x + 11, y + 5, 3, 3);
  ctx.fillStyle = '#10B981'; ctx.fillRect(x + 16, y + 5, 3, 3);

  // Rising steam wisps
  const steam = Math.sin(this.animTick * 3) * 1.5;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.beginPath();
  ctx.moveTo(x + 9, y + 5);
  ctx.lineTo(x + 9 + steam, y - 2);
  ctx.stroke();

  ctx.restore();
}
```

### 4.9 Real-Time Analog Wall Clock Algorithm
```typescript
private drawAnalogClock(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  const radius = 8;
  // Brass bezel
  ctx.fillStyle = '#D97706';
  ctx.beginPath(); ctx.arc(cx, cy, radius + 1, 0, Math.PI * 2); ctx.fill();

  // Off-white face
  ctx.fillStyle = '#F8FAFC';
  ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.fill();

  // 12 hour tick marks
  ctx.fillStyle = '#475569';
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    ctx.fillRect(cx + Math.cos(angle) * 5.5 - 0.5, cy + Math.sin(angle) * 5.5 - 0.5, 1, 1);
  }

  // Live time calculations
  const now = new Date();
  const sec = now.getSeconds() + now.getMilliseconds() / 1000;
  const min = now.getMinutes() + sec / 60;
  const hr = (now.getHours() % 12) + min / 60;

  // Hour hand
  const hrAngle = (hr * Math.PI) / 6 - Math.PI / 2;
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(hrAngle) * 3.5, cy + Math.sin(hrAngle) * 3.5); ctx.stroke();

  // Minute hand
  const minAngle = (min * Math.PI) / 30 - Math.PI / 2;
  ctx.strokeStyle = '#1E293B';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(minAngle) * 5.5, cy + Math.sin(minAngle) * 5.5); ctx.stroke();

  // Second hand (crimson)
  const secAngle = (sec * Math.PI) / 30 - Math.PI / 2;
  ctx.strokeStyle = '#EF4444';
  ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(secAngle) * 6.5, cy + Math.sin(secAngle) * 6.5); ctx.stroke();

  // Center brass pin
  ctx.fillStyle = '#D97706';
  ctx.beginPath(); ctx.arc(cx, cy, 1, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
```

### 4.10 Biophilic Foliage: Monstera & Fiddle-Leaf Fig Algorithms
```typescript
private drawMonstera(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  // Terracotta Planter Pot
  ctx.fillStyle = '#9A3412';
  this.drawRoundedRect(ctx, cx - 8, cy - 2, 16, 14, 2);
  ctx.fill();
  // Soil
  ctx.fillStyle = '#27170E';
  ctx.fillRect(cx - 7, cy - 1, 14, 2);

  // Large Fenestrated Foliage Cluster
  const leaves = [
    { dx: -7, dy: -8, r: 8, color: '#14532D' },
    { dx: 7, dy: -9, r: 8, color: '#166534' },
    { dx: 0, dy: -13, r: 9, color: '#15803D' },
    { dx: -10, dy: -3, r: 6, color: '#16A34A' },
    { dx: 9, dy: -4, r: 6, color: '#22C55E' },
  ];

  for (const leaf of leaves) {
    ctx.fillStyle = leaf.color;
    ctx.beginPath();
    ctx.arc(cx + leaf.dx, cy + leaf.dy, leaf.r, 0, Math.PI * 2);
    ctx.fill();

    // Leaf cutouts / fenestrations (slits)
    ctx.strokeStyle = '#0F291E';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx + leaf.dx - leaf.r * 0.4, cy + leaf.dy);
    ctx.lineTo(cx + leaf.dx + leaf.r * 0.4, cy + leaf.dy);
    ctx.stroke();
  }
  ctx.restore();
}

private drawFiddleLeafFig(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  // White cylindrical planter
  ctx.fillStyle = '#F8FAFC';
  this.drawRoundedRect(ctx, cx - 7, cy + 2, 14, 14, 2);
  ctx.fill();
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Woody central trunk
  ctx.fillStyle = '#5A3E2B';
  ctx.fillRect(cx - 1.5, cy - 18, 3, 20);

  // Scalloped violin-shaped leaves
  const leaves = [
    { x: cx - 6, y: cy - 18, w: 9, h: 6, color: '#14532D' },
    { x: cx + 1, y: cy - 15, w: 9, h: 6, color: '#15803D' },
    { x: cx - 7, y: cy - 10, w: 10, h: 7, color: '#166534' },
    { x: cx + 2, y: cy - 6, w: 10, h: 7, color: '#16A34A' },
  ];

  for (const l of leaves) {
    ctx.fillStyle = l.color;
    this.drawRoundedRect(ctx, l.x, l.y, l.w, l.h, 3);
    ctx.fill();
    // Midrib vein
    ctx.strokeStyle = '#14532D';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(l.x + 1, l.y + l.h / 2);
    ctx.lineTo(l.x + l.w - 1, l.y + l.h / 2);
    ctx.stroke();
  }
  ctx.restore();
}
```

### 4.11 Server Racks with Combed Cable Looms & Multi-Rate LEDs Algorithm
```typescript
private drawServerRack(
  ctx: CanvasRenderingContext2D,
  rx: number, ry: number, rw: number, rh: number,
  rackIndex: number
) {
  ctx.save();
  // 1. Dark matte graphite enclosure
  ctx.fillStyle = '#0B0D13';
  this.drawRoundedRect(ctx, rx, ry, rw, rh, 2);
  ctx.fill();
  ctx.strokeStyle = '#1E293B';
  ctx.lineWidth = 1;
  ctx.stroke();

  // 2. Perforated mesh door pattern
  ctx.fillStyle = '#151922';
  ctx.fillRect(rx + 4, ry + 4, rw - 8, rh - 8);

  // 3. Server Blades (3 units per rack)
  const bladeH = 7;
  for (let b = 0; b < 3; b++) {
    const by = ry + 5 + b * 8;
    ctx.fillStyle = '#1E2430';
    ctx.fillRect(rx + 6, by, rw - 12, bladeH);

    // Drive bay handles
    ctx.fillStyle = '#334155';
    ctx.fillRect(rx + 8, by + 1.5, 8, 4);
    ctx.fillRect(rx + 18, by + 1.5, 8, 4);

    // Multi-rate status LEDs
    const tick = Math.floor(this.animTick * 6 + rackIndex * 5 + b);
    const isPowerGreen = true; // Always steady on
    const isLinkBlue = (tick % 3) === 0;
    const isDiskAmber = ((tick + b * 2) % 4) === 0;

    ctx.fillStyle = isPowerGreen ? '#22C55E' : '#052E16';
    ctx.fillRect(rx + rw - 18, by + 2.5, 2, 2);
    ctx.fillStyle = isLinkBlue ? '#38BDF8' : '#082F49';
    ctx.fillRect(rx + rw - 14, by + 2.5, 2, 2);
    ctx.fillStyle = isDiskAmber ? '#F59E0B' : '#451A03';
    ctx.fillRect(rx + rw - 10, by + 2.5, 2, 2);
  }

  // 4. Combed Multi-Color Cable Looms
  // Emerging from rack left edge and routing down into floor grommet
  const loomX = rx - 6;
  const cableColors = ['#2563EB', '#EAB308', '#9333EA']; // Cat6 Blue, Fiber Yellow, Patch Purple
  for (let c = 0; c < cableColors.length; c++) {
    ctx.strokeStyle = cableColors[c];
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(rx + 2, ry + 8 + c * 7);
    ctx.quadraticCurveTo(loomX + c * 2, ry + 12 + c * 7, loomX + c * 2, ry + rh + 2);
    ctx.stroke();
  }

  // Velcro tie wrap around cable bundle
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(loomX - 1, ry + rh / 2, 6, 2);

  ctx.restore();
}
```

---

## 5. Performance, Memory & 60 FPS Runtime Budget

1. **Zero-GC Render Loop Invariant**:
   - `render()` executes up to 60 times per second.
   - **STRICTLY PROHIBITED**: Instantiating objects, arrays, closures, or strings inside per-frame drawing loops (e.g. `new Array()`, `new Path2D()`, `room.name.split()`).
   - Store static color lookup tables as module-level constants or class members.
2. **Integer Pixel Alignment**:
   - For all 1px stroke lines (grid seams, borders, blind slats), offset coordinates by `+0.5` pixels (or snap with `Math.floor`) to prevent blurry half-pixel subpixel interpolation.
3. **Canvas State Discipline**:
   - Every `ctx.save()` must be balanced with a corresponding `ctx.restore()` in the same function scope.
   - Do not use expensive `ctx.filter = 'blur(...)'` inside per-frame animation loops as it disables hardware raster acceleration. Use cached procedural radial gradients instead.

---

## 6. Acceptance & Verification Checklist for FRAME and LENS

Before declaring implementation completion, FRAME must verify and LENS must independently audit:

- [ ] **Geometry & Export Fidelity**: `RoomDef`, `ROOMS`, and `OfficeMap` class interface exported without breaking changes.
- [ ] **Parquet Flooring**: Alternating plank offsets, plank color tone shifts, and crisp v-grooves rendered in all non-server rooms.
- [ ] **Woven Area Rugs**: Kilim rug in War Room with diamond patterns and fringe; Berber rug in Lounge; Navy rug under Orion desk.
- [ ] **Server Datacenter Floor**: Anti-static tile grid, corner screw rivets, and cable slot cutouts in `server_room`.
- [ ] **Top-Wall Windows**: Northern window apertures with twilight skyline gradient, skyscraper silhouettes, and Venetian blinds.
- [ ] **Dual-Monitor Desks**: Syntax-highlighted code editor on left screen, live sparkline on right screen, mechanical keyboard with accent spacebar, optical mouse, and steaming mug on all 10 agent workstations.
- [ ] **Warm Desk Lamps**: 2700K soft radial illumination cones on desks.
- [ ] **Hospitality Amenities**: Water cooler with blue jug & animated rising bubbles; commercial espresso machine with steam; ticking analog clock; colorful bookshelves.
- [ ] **Biophilic Plants**: Monstera with split-leaf fenestrations and tall Fiddle-Leaf Fig in pots.
- [ ] **War Room Presentation**: 65" screen with architecture topology diagram and conference laptops.
- [ ] **Datacenter Infrastructure**: Four 42U server cabinets with perforated mesh doors, combed cable looms, and multi-rate status LEDs.
- [ ] **Navigation & Avatar Safety**: Avatars walk smoothly along waypoints without clipping into furniture or getting stuck.
- [ ] **Performance**: 60 FPS verified, zero memory leaks, zero console errors.
