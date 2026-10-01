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

export const ROOMS: RoomDef[] = [
  { id: 'manager', name: 'EXECUTIVE SUITE', x: 80, y: 70, w: 240, h: 170, color: '#161924', accent: '#3B82F6' },
  { id: 'dev', name: 'DEVELOPMENT LAB', x: 350, y: 70, w: 290, h: 180, color: '#131824', accent: '#F97316' },
  { id: 'research', name: 'RESEARCH & INTEL', x: 670, y: 70, w: 290, h: 170, color: '#121A22', accent: '#10B981' },
  { id: 'meeting', name: 'WAR ROOM / A2A', x: 370, y: 285, w: 250, h: 135, color: '#141828', accent: '#38BDF8' },
  { id: 'qa_security', name: 'QA & HARDENING', x: 80, y: 350, w: 260, h: 250, color: '#181524', accent: '#A855F7' },
  { id: 'lounge', name: 'LOUNGE & OPERATIONS', x: 370, y: 440, w: 270, h: 165, color: '#1A181C', accent: '#14B8A6' },
  { id: 'server_room', name: 'SRE & INFRASTRUCTURE', x: 670, y: 350, w: 290, h: 250, color: '#10141E', accent: '#EAB308' },
];

// Statically allocated constant tables to ensure Zero-GC per frame rendering
const PARQUET_TONES = ['#281B14', '#2E2018', '#33241B', '#38271E', '#2B1E16'] as const;

const SERVER_RACKS = [
  { x: 885, y: 375, w: 58, h: 34, index: 0 },
  { x: 885, y: 418, w: 58, h: 34, index: 1 },
  { x: 885, y: 461, w: 58, h: 34, index: 2 },
  { x: 885, y: 504, w: 58, h: 34, index: 3 },
] as const;

const WINDOW_BAYS = [
  { x: 115, y: 62, w: 120, h: 16, seed: 1 }, // Executive Suite
  { x: 385, y: 62, w: 85, h: 16, seed: 2 },  // Dev Lab Bay A (above Forge)
  { x: 510, y: 62, w: 85, h: 16, seed: 3 },  // Dev Lab Bay B (above Frame)
  { x: 735, y: 62, w: 130, h: 16, seed: 4 }, // Research Lab (above Radar/Quant)
] as const;

const CABLE_LOOM_COLORS = ['#2563EB', '#EAB308', '#9333EA'] as const;

const BOOK_SPINE_COLORS = ['#EF4444', '#3B82F6', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899', '#06B6D4', '#E2E8F0'] as const;

export class OfficeMap {
  private animTick = 0;

  public render(ctx: CanvasRenderingContext2D, activeRoomFilter = 'all') {
    this.animTick += 0.05;

    // [Layer 0] Campus Foundation & Outer Drop Shadow
    this.drawCampusPerimeter(ctx);

    // [Layer 1] Hallway Arterial Flooring & Basalt Slate Grid
    this.drawHallwayFlooring(ctx);

    // [Layer 2] Room Flooring (Alternating Walnut Parquet Planks & Raised Server Tiles)
    this.drawRoomFloors(ctx);

    // [Layer 3] Top-Wall Architectural Skyline Windows & Venetian Blinds (Drawn on top of floor)
    this.drawTopWallWindows(ctx);

    // [Layer 4] Woven Area Rugs (Kilim, Berber, Executive Navy)
    this.drawAreaRugs(ctx);

    // [Layer 5] Architectural Dividers, Door Thresholds & Glass Partitions
    this.drawRoomBoundaries(ctx, activeRoomFilter);

    // [Layer 6] Heavy & Background Fixtures (Bookshelves, Whiteboard, World Map, Server Racks, Presentation Screen)
    this.drawHeavyFixtures(ctx);

    // [Layer 7] Desks, Conference Table, Sectional Sofas & Chairs
    this.drawFurnitureStructures(ctx);

    // [Layer 8] Desk Equipment & Peripherals (Monitors with Code/Charts, Keyboards, Mice, Laptops)
    this.drawWorkstationPeripherals(ctx);

    // [Layer 9] Ambient Dynamic Overlays (2700K Lamp Cones, Steaming Mugs, Bubbles, Espresso Bar, Server LEDs, Wall Clock)
    this.drawAmbientDynamics(ctx);

    // [Layer 10] Biophilic Plants (Lush Fenestrated Monstera & Tall Fiddle-Leaf Figs)
    this.drawBiophilicPlants(ctx);

    // [Layer 11] Room Header Badges & Monospace Typographic Labels
    this.drawRoomHeaders(ctx, activeRoomFilter);
  }

  // =========================================================================
  // Layer 0: Campus Foundation & Outer Drop Shadow
  // =========================================================================
  private drawCampusPerimeter(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
    ctx.shadowBlur = 32;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = '#0F1219';
    ctx.strokeStyle = '#1E2533';
    ctx.lineWidth = 3;

    // Outer campus perimeter: (50, 40) to (990, 630), midpoint: (520, 335)
    this.drawRoundedRect(ctx, 50, 40, 940, 590, 16);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // =========================================================================
  // Layer 1: Hallway Arterial Flooring & Basalt Grid
  // =========================================================================
  private drawHallwayFlooring(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.fillStyle = '#141822';
    this.drawRoundedRect(ctx, 55, 45, 930, 580, 12);
    ctx.fill();

    // Dark basalt slate tile seams
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.lineWidth = 1;

    for (let x = 60; x <= 980; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 45);
      ctx.lineTo(x + 0.5, 625);
      ctx.stroke();
    }
    for (let y = 50; y <= 620; y += 24) {
      ctx.beginPath();
      ctx.moveTo(55, y + 0.5);
      ctx.lineTo(985, y + 0.5);
      ctx.stroke();
    }
    ctx.restore();
  }

  // =========================================================================
  // Layer 2: Room Flooring (Alternating Parquet & Raised Server Tiles)
  // =========================================================================
  private drawRoomFloors(ctx: CanvasRenderingContext2D) {
    for (const r of ROOMS) {
      if (r.id === 'server_room') {
        this.drawServerTiles(ctx, r.x, r.y, r.w, r.h);
      } else {
        this.drawParquetFloor(ctx, r.x, r.y, r.w, r.h);
      }
    }
  }

  private drawParquetFloor(ctx: CanvasRenderingContext2D, rx: number, ry: number, rw: number, rh: number) {
    ctx.save();
    this.drawRoundedRect(ctx, rx, ry, rw, rh, 8);
    ctx.clip();

    const plankW = 24;
    const plankH = 10;

    for (let y = ry; y < ry + rh; y += plankH) {
      const rowIndex = Math.floor((y - ry) / plankH);
      const offsetX = rowIndex % 2 === 0 ? 0 : plankW / 2;
      for (let x = rx - plankW; x < rx + rw; x += plankW) {
        const plankIndex = Math.abs(Math.floor((x - rx) / plankW) + rowIndex * 7) % PARQUET_TONES.length;
        ctx.fillStyle = PARQUET_TONES[plankIndex];
        ctx.fillRect(x + offsetX, y, plankW, plankH);

        // 1px beveled v-groove separation lines
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + offsetX + 0.5, y + 0.5, plankW, plankH);
      }
    }
    ctx.restore();
  }

  private drawServerTiles(ctx: CanvasRenderingContext2D, rx: number, ry: number, rw: number, rh: number) {
    ctx.save();
    this.drawRoundedRect(ctx, rx, ry, rw, rh, 8);
    ctx.clip();

    // Base anti-static dark slate
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

    // Corner metallic rivets/screws
    ctx.fillStyle = '#2D3B54';
    for (let x = rx; x <= rx + rw; x += tileSize) {
      for (let y = ry; y <= ry + rh; y += tileSize) {
        ctx.fillRect(x - 1, y - 1, 2, 2);
      }
    }

    // Sub-floor cable grommets leading into server cabinets
    ctx.fillStyle = '#080B10';
    ctx.strokeStyle = '#273549';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const gy = 380 + i * 43;
      this.drawRoundedRect(ctx, 874, gy, 6, 14, 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  // =========================================================================
  // Layer 3: Top-Wall Architectural Skyline Windows & Venetian Blinds
  // =========================================================================
  private drawTopWallWindows(ctx: CanvasRenderingContext2D) {
    for (let i = 0; i < WINDOW_BAYS.length; i++) {
      const win = WINDOW_BAYS[i];
      this.drawTopWallWindow(ctx, win.x, win.y, win.w, win.h, win.seed);
    }
  }

  private drawTopWallWindow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seed: number) {
    ctx.save();

    // 1. Cutout architectural window aperture
    ctx.fillStyle = '#080E1A';
    this.drawRoundedRect(ctx, x, y, w, h, 2);
    ctx.fill();

    // 2. Twilight Sky Gradient (Atmospheric Deep Blue to Dusky Purple)
    const skyGrad = ctx.createLinearGradient(x, y, x, y + h);
    skyGrad.addColorStop(0, '#060E1D');
    skyGrad.addColorStop(0.6, '#141E33');
    skyGrad.addColorStop(1, '#2E1F3B');
    ctx.fillStyle = skyGrad;
    this.drawRoundedRect(ctx, x + 1, y + 1, w - 2, h - 2, 1);
    ctx.fill();

    // 3. Distant Skyscraper Silhouettes with glowing windows
    ctx.fillStyle = '#060912';
    const buildingWidth = 14;
    const numBuildings = Math.floor((w - 4) / buildingWidth);
    for (let i = 0; i < numBuildings; i++) {
      const bx = x + 2 + i * buildingWidth;
      const bh = 5 + ((i * 7 + seed * 5) % 8);
      ctx.fillRect(bx, y + h - bh, 12, bh);

      // Glowing skyscraper office windows
      ctx.fillStyle = (i + seed) % 2 === 0 ? '#FCD34D' : '#60A5FA';
      ctx.fillRect(bx + 2, y + h - bh + 2, 2, 2);
      if (bh > 8) {
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(bx + 7, y + h - bh + 3, 2, 2);
      }
      ctx.fillStyle = '#060912';
    }

    // 4. Horizontal Venetian Blinds casting delicate slats
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 1;
    for (let by = y + 2.5; by < y + h - 1; by += 3) {
      ctx.beginPath();
      ctx.moveTo(x + 1, by);
      ctx.lineTo(x + w - 1, by);
      ctx.stroke();
    }

    // 5. Window Mullions & Outer Architectural Frame
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

    // Vertical pane mullions
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1;
    const paneStep = Math.floor(w / 3);
    for (let mx = x + paneStep; mx < x + w - 10; mx += paneStep) {
      ctx.beginPath();
      ctx.moveTo(Math.floor(mx) + 0.5, y);
      ctx.lineTo(Math.floor(mx) + 0.5, y + h);
      ctx.stroke();
    }

    // Top lintel & bottom interior sill
    ctx.fillStyle = '#475569';
    ctx.fillRect(x - 2, y - 1, w + 4, 2); // Top lintel
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(x - 2, y + h - 1, w + 4, 3); // Interior sill

    // Soft daylight wash cast onto the parquet floor directly below window
    const floorCastGrad = ctx.createLinearGradient(x, y + h, x, y + h + 18);
    floorCastGrad.addColorStop(0, 'rgba(147, 197, 253, 0.16)');
    floorCastGrad.addColorStop(0.5, 'rgba(147, 197, 253, 0.06)');
    floorCastGrad.addColorStop(1, 'rgba(147, 197, 253, 0)');
    ctx.fillStyle = floorCastGrad;
    ctx.fillRect(x - 4, y + h + 2, w + 8, 18);

    ctx.restore();
  }

  // =========================================================================
  // Layer 4: Woven Area Rugs (Kilim, Berber, Executive Navy)
  // =========================================================================
  private drawAreaRugs(ctx: CanvasRenderingContext2D) {
    // 1. Executive Suite: Midnight Navy rug under Orion's desk
    this.drawExecutiveRug(ctx, 140, 135, 115, 72);

    // 2. War Room / Conference: Hand-woven geometric Kilim rug
    this.drawKilimRug(ctx, 405, 312, 180, 90);

    // 3. Lounge & Operations: Warm Sand Berber cross-hatch rug
    this.drawBerberRug(ctx, 435, 525, 140, 65);
  }

  private drawExecutiveRug(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.save();
    // Midnight navy base
    ctx.fillStyle = '#151E2B';
    this.drawRoundedRect(ctx, x, y, w, h, 4);
    ctx.fill();

    // Gold accent border
    ctx.strokeStyle = '#B45309';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);

    // Inner subtle weave tone
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let lx = x + 8; lx < x + w - 8; lx += 6) {
      ctx.beginPath();
      ctx.moveTo(lx, y + 6);
      ctx.lineTo(lx, y + h - 6);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawKilimRug(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.save();
    // Clip strictly to rug bounds to prevent any coordinate leaks
    this.drawRoundedRect(ctx, x, y, w, h, 4);
    ctx.clip();

    // Terracotta woven base
    ctx.fillStyle = '#45211B';
    ctx.fillRect(x, y, w, h);

    // Ivory geometric border
    ctx.strokeStyle = '#D4C4B5';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x + 5, y + 5, w - 10, h - 10);

    // Central diamond lozenges
    ctx.fillStyle = 'rgba(212, 196, 181, 0.32)';
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

    // Fringe ticks on left and right borders
    ctx.strokeStyle = 'rgba(212, 196, 181, 0.55)';
    ctx.lineWidth = 1;
    for (let fy = y + 4; fy < y + h - 4; fy += 4) {
      ctx.beginPath();
      ctx.moveTo(x - 2, fy);
      ctx.lineTo(x + 3, fy);
      ctx.moveTo(x + w - 3, fy);
      ctx.lineTo(x + w + 2, fy);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawBerberRug(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.save();
    // Clip strictly to rug bounds so diagonal weave lines never bleed out
    this.drawRoundedRect(ctx, x, y, w, h, 4);
    ctx.clip();

    // Warm sand / sage cross-hatch textile base
    ctx.fillStyle = '#2A2722';
    ctx.fillRect(x, y, w, h);

    // Cross-hatch diamond weave lines
    ctx.strokeStyle = 'rgba(214, 206, 191, 0.15)';
    ctx.lineWidth = 1;
    for (let d = -h; d < w + h; d += 12) {
      ctx.beginPath();
      ctx.moveTo(x + d, y);
      ctx.lineTo(x + d + h, y + h);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x + d + h, y);
      ctx.lineTo(x + d, y + h);
      ctx.stroke();
    }

    // Outer border
    ctx.strokeStyle = '#3D372F';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);

    // Soft fringe along top and bottom edges
    ctx.strokeStyle = 'rgba(214, 206, 191, 0.4)';
    for (let fx = x + 4; fx < x + w - 4; fx += 5) {
      ctx.beginPath();
      ctx.moveTo(fx, y);
      ctx.lineTo(fx, y + 3);
      ctx.moveTo(fx, y + h - 3);
      ctx.lineTo(fx, y + h);
      ctx.stroke();
    }
    ctx.restore();
  }

  // =========================================================================
  // Layer 5: Architectural Dividers, Door Thresholds & Glass Partitions
  // =========================================================================
  private drawRoomBoundaries(ctx: CanvasRenderingContext2D, activeRoomFilter: string) {
    ctx.save();
    for (const r of ROOMS) {
      const isHighlighted = activeRoomFilter === 'all' || activeRoomFilter === r.id;

      if (r.id === 'meeting') {
        // Frosted acoustic glass partition for War Room (clean glass glow, no resize-handle artifacts)
        const glassPulse = 0.45 + Math.sin(this.animTick * 1.5) * 0.08;
        ctx.strokeStyle = `rgba(56, 189, 248, ${glassPulse})`;
        ctx.lineWidth = 2;
        this.drawRoundedRect(ctx, r.x, r.y, r.w, r.h, 8);
        ctx.stroke();

        // Subtle interior glass tint wash
        ctx.fillStyle = 'rgba(56, 189, 248, 0.025)';
        this.drawRoundedRect(ctx, r.x, r.y, r.w, r.h, 8);
        ctx.fill();
      } else {
        // Solid architectural perimeter room wall
        ctx.lineWidth = isHighlighted ? 2 : 1;
        ctx.strokeStyle = isHighlighted ? r.accent : 'rgba(255, 255, 255, 0.12)';
        this.drawRoundedRect(ctx, r.x, r.y, r.w, r.h, 8);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // =========================================================================
  // Layer 6: Heavy & Background Fixtures
  // =========================================================================
  private drawHeavyFixtures(ctx: CanvasRenderingContext2D) {
    // 1. Executive Suite Bookshelf
    this.drawBookshelf(ctx, 88, 108, 18, 72);

    // 2. Research Lab Library Bookshelf
    this.drawBookshelf(ctx, 938, 80, 18, 65);

    // 3. Research Wall Map / Telemetry Globe
    this.drawResearchMap(ctx, 940, 120);

    // 4. Dev Lab Architecture Whiteboard
    this.drawWhiteboard(ctx, 624, 110, 6, 52);

    // 5. War Room 65" Presentation Screen (Positioned with clean clearance from room badge)
    this.drawPresentationScreen(ctx, 458, 288, 92, 28);

    // 6. Datacenter 42U Server Cabinets with Combed Cable Looms
    this.drawServerRacks(ctx);
  }

  private drawBookshelf(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.save();
    // Solid dark oak shelf frame
    ctx.fillStyle = '#261D16';
    this.drawRoundedRect(ctx, x, y, w, h, 2);
    ctx.fill();
    ctx.strokeStyle = '#3E2D23';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 4 horizontal interior shelves
    const numShelves = 4;
    const shelfH = (h - 6) / numShelves;
    ctx.fillStyle = '#1A130E';
    for (let s = 1; s < numShelves; s++) {
      ctx.fillRect(x + 2, y + s * shelfH, w - 4, 1.5);
    }

    // Tightly packed colorful book spines with paper bookmarks
    let spineColorIndex = 0;
    for (let s = 0; s < numShelves; s++) {
      const sy = y + 2 + s * shelfH;
      for (let bx = x + 3; bx < x + w - 4; bx += 3) {
        ctx.fillStyle = BOOK_SPINE_COLORS[spineColorIndex % BOOK_SPINE_COLORS.length];
        spineColorIndex++;
        const bh = shelfH - 3;
        ctx.fillRect(bx, sy + 1, 2, bh);
      }
    }
    ctx.restore();
  }

  private drawWhiteboard(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.save();
    // Aluminum frame
    ctx.fillStyle = '#334155';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

    // Dry-erase whiteboard surface
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(x + 1, y + 2, w - 2, h - 4);

    // Architecture flow diagram sketches
    ctx.fillStyle = '#3B82F6';
    ctx.fillRect(x + 2, y + 8, 2, 10);
    ctx.fillRect(x + 2, y + 22, 2, 12);
    ctx.fillStyle = '#06B6D4';
    ctx.fillRect(x + 2, y + 38, 2, 8);
    ctx.restore();
  }

  private drawResearchMap(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
    ctx.save();
    // Circular world telemetry projection / map
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.stroke();

    // Equatorial & meridian telemetry rings
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 10, 4, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx, cy - 10);
    ctx.lineTo(cx, cy + 10);
    ctx.stroke();

    // Radar blip pulse
    const blipRadius = 2 + (this.animTick * 3) % 7;
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.5)';
    ctx.beginPath();
    ctx.arc(cx, cy, blipRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  private drawPresentationScreen(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.save();
    // 65" Matte black display bezel
    ctx.fillStyle = '#0B0F19';
    this.drawRoundedRect(ctx, x, y, w, h, 3);
    ctx.fill();
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Illuminated screen glass surface
    ctx.fillStyle = '#0F172A';
    this.drawRoundedRect(ctx, x + 3, y + 3, w - 6, h - 6, 2);
    ctx.fill();

    // Microservices Topology Architecture Diagram
    // 1. Cloud Ingress Node (Cyan)
    ctx.fillStyle = '#38BDF8';
    this.drawRoundedRect(ctx, x + 8, y + 8, 14, 10, 2);
    ctx.fill();

    // 2. Gateway Connector Arrow Line
    ctx.strokeStyle = '#818CF8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 22, y + 13);
    ctx.lineTo(x + 36, y + 13);
    ctx.stroke();

    // 3. Worker Node Cluster (Amber)
    ctx.fillStyle = '#F59E0B';
    this.drawRoundedRect(ctx, x + 38, y + 5, 18, 7, 2);
    ctx.fill();
    this.drawRoundedRect(ctx, x + 38, y + 15, 18, 7, 2);
    ctx.fill();

    // 4. Database Connector Arrow Lines
    ctx.strokeStyle = '#34D399';
    ctx.beginPath();
    ctx.moveTo(x + 56, y + 8);
    ctx.lineTo(x + 72, y + 13);
    ctx.moveTo(x + 56, y + 18);
    ctx.lineTo(x + 72, y + 13);
    ctx.stroke();

    // 5. Distributed Database Cylinder (Emerald)
    ctx.fillStyle = '#10B981';
    this.drawRoundedRect(ctx, x + 74, y + 8, 16, 11, 3);
    ctx.fill();

    // Lower bezel green power LED
    ctx.fillStyle = '#22C55E';
    ctx.fillRect(x + w / 2 - 1, y + h - 2, 2, 1);
    ctx.restore();
  }

  private drawServerRacks(ctx: CanvasRenderingContext2D) {
    for (let i = 0; i < SERVER_RACKS.length; i++) {
      const rack = SERVER_RACKS[i];
      this.drawServerRack(ctx, rack.x, rack.y, rack.w, rack.h, rack.index);
    }
  }

  private drawServerRack(ctx: CanvasRenderingContext2D, rx: number, ry: number, rw: number, rh: number, rackIndex: number) {
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

      // Hot-swap drive bay handles
      ctx.fillStyle = '#334155';
      ctx.fillRect(rx + 8, by + 1.5, 8, 4);
      ctx.fillRect(rx + 18, by + 1.5, 8, 4);

      // Multi-rate status LEDs
      const tick = Math.floor(this.animTick * 6 + rackIndex * 5 + b);
      const isPowerGreen = true; // Always steady on
      const isLinkBlue = tick % 3 === 0;
      const isDiskAmber = (tick + b * 2) % 4 === 0;

      ctx.fillStyle = isPowerGreen ? '#22C55E' : '#052E16';
      ctx.fillRect(rx + rw - 18, by + 2.5, 2, 2);
      ctx.fillStyle = isLinkBlue ? '#38BDF8' : '#082F49';
      ctx.fillRect(rx + rw - 14, by + 2.5, 2, 2);
      ctx.fillStyle = isDiskAmber ? '#F59E0B' : '#451A03';
      ctx.fillRect(rx + rw - 10, by + 2.5, 2, 2);
    }

    // 4. Combed Multi-Color Cable Looms
    // Bundles emerge from rack left edge and route down into sub-floor grommets
    const loomX = rx - 6;
    for (let c = 0; c < CABLE_LOOM_COLORS.length; c++) {
      ctx.strokeStyle = CABLE_LOOM_COLORS[c];
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

  // =========================================================================
  // Layer 7: Desks, Conference Table, Sectional Sofas & Chairs
  // =========================================================================
  private drawFurnitureStructures(ctx: CanvasRenderingContext2D) {
    // 1. Executive Suite Orion Desk & Leather Chair
    this.drawExecutiveDesk(ctx);

    // 2. Development Lab Desks (Forge, Frame, Aurora)
    this.drawDeskStructure(ctx, 395, 130, 75, 32); // Forge
    this.drawDeskStructure(ctx, 515, 130, 75, 32); // Frame
    this.drawDeskStructure(ctx, 455, 200, 75, 32); // Aurora

    // 3. Research Lab Desks (Radar, Quant)
    this.drawDeskStructure(ctx, 735, 130, 75, 32); // Radar
    this.drawDeskStructure(ctx, 855, 130, 75, 32); // Quant

    // 4. QA & Hardening Desks (Prism, Lens, Sentinel)
    this.drawDeskStructure(ctx, 145, 430, 75, 32); // Prism
    this.drawDeskStructure(ctx, 245, 430, 75, 32); // Lens
    this.drawDeskStructure(ctx, 195, 520, 75, 32); // Sentinel

    // 5. Lounge & Operations Desk (Nexus)
    this.drawDeskStructure(ctx, 535, 485, 65, 28); // Nexus

    // 6. SRE Datacenter Desk (Atlas)
    this.drawDeskStructure(ctx, 800, 455, 65, 32); // Atlas

    // 7. War Room Conference Table & 6 Chairs
    this.drawConferenceTable(ctx);

    // 8. Lounge Sectional Sofa & Low Coffee Table
    this.drawLoungeFurniture(ctx);
  }

  private drawExecutiveDesk(ctx: CanvasRenderingContext2D) {
    ctx.save();
    // Solid beveled dark mahogany desk body
    ctx.fillStyle = '#322219';
    this.drawRoundedRect(ctx, 155, 145, 85, 36, 4);
    ctx.fill();
    ctx.strokeStyle = '#4A372A';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Dark leather desk blotter
    ctx.fillStyle = '#1A1C23';
    this.drawRoundedRect(ctx, 168, 150, 60, 26, 2);
    ctx.fill();

    // Padded black leather executive chair
    ctx.fillStyle = '#18171C';
    this.drawRoundedRect(ctx, 183, 185, 28, 18, 4);
    ctx.fill();
    ctx.strokeStyle = '#27252E';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  private drawDeskStructure(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.save();
    // Solid beveled walnut top with chamfer
    ctx.fillStyle = '#36281E';
    this.drawRoundedRect(ctx, x, y, w, h, 4);
    ctx.fill();
    ctx.strokeStyle = '#4A372A';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Dark neoprene desk mat
    ctx.fillStyle = '#181B22';
    this.drawRoundedRect(ctx, x + 8, y + 6, w - 16, h - 12, 2);
    ctx.fill();
    ctx.restore();
  }

  private drawConferenceTable(ctx: CanvasRenderingContext2D) {
    ctx.save();
    // Solid mahogany conference table with rounded ends
    ctx.fillStyle = '#322017';
    this.drawRoundedRect(ctx, 435, 332, 120, 56, 18);
    ctx.fill();
    ctx.strokeStyle = '#4A3326';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Brushed steel wire routing trough in center
    ctx.fillStyle = '#71717A';
    this.drawRoundedRect(ctx, 460, 356, 70, 8, 2);
    ctx.fill();

    // 6 Ergonomic conference chairs (3 top, 3 bottom)
    ctx.fillStyle = '#181B24';
    const chairX = [450, 490, 530];
    for (const cx of chairX) {
      // Top 3 chairs
      this.drawRoundedRect(ctx, cx, 322, 18, 8, 2);
      ctx.fill();
      // Bottom 3 chairs
      this.drawRoundedRect(ctx, cx, 390, 18, 8, 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawLoungeFurniture(ctx: CanvasRenderingContext2D) {
    ctx.save();
    // Modular Sectional Sofa in charcoal corduroy
    ctx.fillStyle = '#2D2830';
    this.drawRoundedRect(ctx, 440, 535, 70, 35, 6);
    ctx.fill();
    ctx.strokeStyle = '#3E3742';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Cushion separation seams
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.moveTo(475, 536);
    ctx.lineTo(475, 569);
    ctx.stroke();

    // Low Walnut Coffee Table
    ctx.fillStyle = '#241B14';
    this.drawRoundedRect(ctx, 525, 540, 35, 25, 4);
    ctx.fill();
    ctx.strokeStyle = '#382A20';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Magazines & small demitasse cups on coffee table
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(528, 544, 9, 6);
    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(530, 546, 7, 2);

    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(544, 548, 3, 3);
    ctx.restore();
  }

  // =========================================================================
  // Layer 8: Desk Equipment & Peripherals
  // =========================================================================
  private drawWorkstationPeripherals(ctx: CanvasRenderingContext2D) {
    // 1. Orion Peripherals (Manager)
    this.drawDualMonitors(ctx, 170, 146, 24, 7, 198, 146, 24, 7, '#3B82F6');
    this.drawInputPeripherals(ctx, 180, 158, 22, 7, 206, 160, '#38BDF8');

    // 2. Dev Lab Peripherals (Forge, Frame, Aurora)
    this.drawWorkstationSetup(ctx, 395, 130, 75, 32, '#F97316', true);  // Forge
    this.drawWorkstationSetup(ctx, 515, 130, 75, 32, '#06B6D4', true);  // Frame
    this.drawWorkstationSetup(ctx, 455, 200, 75, 32, '#EC4899', false); // Aurora

    // 3. Research Lab Peripherals (Radar, Quant)
    this.drawWorkstationSetup(ctx, 735, 130, 75, 32, '#10B981', true);  // Radar
    this.drawWorkstationSetup(ctx, 855, 130, 75, 32, '#84CC16', true);  // Quant

    // 4. QA & Hardening Peripherals (Prism, Lens, Sentinel)
    this.drawWorkstationSetup(ctx, 145, 430, 75, 32, '#A855F7', true);  // Prism
    this.drawWorkstationSetup(ctx, 245, 430, 75, 32, '#6366F1', true);  // Lens
    this.drawWorkstationSetup(ctx, 195, 520, 75, 32, '#EF4444', false); // Sentinel

    // 5. Lounge & Operations (Nexus)
    this.drawWorkstationSetup(ctx, 535, 485, 65, 28, '#14B8A6', true);  // Nexus

    // 6. SRE Datacenter (Atlas)
    this.drawWorkstationSetup(ctx, 800, 455, 65, 32, '#EAB308', true);  // Atlas

    // 7. War Room Conference Laptops
    this.drawConferenceLaptops(ctx);
  }

  private drawWorkstationSetup(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number,
    accentColor: string, isScreenDown = true
  ) {
    const monY = isScreenDown ? y + 2 : y + h - 8;
    const leftMonX = x + 12;
    const rightMonX = x + 38;

    // Dual Displays
    this.drawDualMonitors(ctx, leftMonX, monY, 22, 6, rightMonX, monY, 22, 6, accentColor);

    // Mechanical Keyboard & Optical Mouse
    const kbY = isScreenDown ? y + 13 : y + 10;
    this.drawInputPeripherals(ctx, x + 24, kbY, 18, 6, x + 46, kbY + 1, accentColor);
  }

  private drawDualMonitors(
    ctx: CanvasRenderingContext2D,
    lx: number, ly: number, lw: number, lh: number,
    rx: number, ry: number, rw: number, rh: number,
    accentColor: string
  ) {
    ctx.save();
    // Left Monitor: IDE Code Syntax Lines
    ctx.fillStyle = '#0A0F1D';
    ctx.fillRect(lx, ly, lw, lh);
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(lx + 0.5, ly + 0.5, lw - 1, lh - 1);

    // Code syntax lines
    ctx.fillStyle = '#F97316'; ctx.fillRect(lx + 2, ly + 1.5, 5, 1);
    ctx.fillStyle = '#38BDF8'; ctx.fillRect(lx + 8, ly + 1.5, 7, 1);
    ctx.fillStyle = '#10B981'; ctx.fillRect(lx + 2, ly + 3.5, 9, 1);
    // Green power LED
    ctx.fillStyle = '#22C55E'; ctx.fillRect(lx + lw - 2, ly + lh - 1.5, 1, 1);

    // Right Monitor: Mini Telemetry Sparkline Chart
    ctx.fillStyle = '#0A0F1D';
    ctx.fillRect(rx, ry, rw, rh);
    ctx.strokeRect(rx + 0.5, ry + 0.5, rw - 1, rh - 1);

    // Mini sparkline in accent color
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rx + 2, ry + 4);
    ctx.lineTo(rx + 6, ry + 2);
    ctx.lineTo(rx + 11, ry + 4.5);
    ctx.lineTo(rx + 16, ry + 1.5);
    ctx.lineTo(rx + rw - 2, ry + 3);
    ctx.stroke();

    ctx.restore();
  }

  private drawInputPeripherals(
    ctx: CanvasRenderingContext2D,
    kx: number, ky: number, kw: number, kh: number,
    mx: number, my: number, accentColor: string
  ) {
    ctx.save();
    // Mechanical Keyboard
    ctx.fillStyle = '#1C1F2B';
    ctx.fillRect(kx, ky, kw, kh);
    ctx.strokeStyle = '#2D3548';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(kx + 0.5, ky + 0.5, kw - 1, kh - 1);

    // Contrasting accent spacebar
    ctx.fillStyle = accentColor;
    ctx.fillRect(kx + kw / 2 - 3, ky + kh - 2, 6, 1);

    // Optical Mouse
    ctx.fillStyle = '#2E3648';
    ctx.fillRect(mx, my, 4, 5);
    ctx.restore();
  }

  private drawConferenceLaptops(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const laptopSpots = [
      { x: 462, y: 338 },
      { x: 512, y: 338 },
      { x: 462, y: 368 },
      { x: 512, y: 368 },
    ];

    for (const spot of laptopSpots) {
      // Aluminum laptop base
      ctx.fillStyle = '#64748B';
      ctx.fillRect(spot.x, spot.y + 4, 12, 4);

      // Angled illuminated screen
      ctx.fillStyle = '#E2E8F0';
      ctx.fillRect(spot.x + 1, spot.y, 10, 4);
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(spot.x + 2, spot.y + 1, 8, 2);
    }
    ctx.restore();
  }

  // =========================================================================
  // Layer 9: Ambient Dynamic Overlays (Lighting Cones, Steam, Water, LEDs, Clock)
  // =========================================================================
  private drawAmbientDynamics(ctx: CanvasRenderingContext2D) {
    // 1. Water Cooler with Animated Micro-Bubbles
    this.drawWaterCooler(ctx, 382, 448);

    // 2. Commercial Italian Espresso Bar with Steam (High contrast, clearly visible)
    this.drawEspressoBar(ctx, 376, 478, 30, 50);

    // 3. Real-Time Analog Wall Clock (Centered above War Room screen)
    this.drawAnalogClock(ctx, 504, 284);

    // 4. Steaming Ceramic Mugs on all workstations
    this.drawMugWithSteam(ctx, 230, 152, '#E2E8F0'); // Orion
    this.drawMugWithSteam(ctx, 400, 135, '#F97316'); // Forge
    this.drawMugWithSteam(ctx, 520, 135, '#06B6D4'); // Frame
    this.drawMugWithSteam(ctx, 460, 205, '#EC4899'); // Aurora
    this.drawMugWithSteam(ctx, 740, 135, '#10B981'); // Radar
    this.drawMugWithSteam(ctx, 860, 135, '#84CC16'); // Quant
    this.drawMugWithSteam(ctx, 150, 435, '#A855F7'); // Prism
    this.drawMugWithSteam(ctx, 250, 435, '#6366F1'); // Lens
    this.drawMugWithSteam(ctx, 200, 525, '#EF4444'); // Sentinel
    this.drawMugWithSteam(ctx, 540, 490, '#14B8A6'); // Nexus
    this.drawMugWithSteam(ctx, 805, 460, '#EAB308'); // Atlas

    // 5. Warm 2700K Task Lamps on all workstations
    this.drawWarmDeskLamp(ctx, 158, 148); // Orion
    this.drawWarmDeskLamp(ctx, 462, 133); // Forge
    this.drawWarmDeskLamp(ctx, 582, 133); // Frame
    this.drawWarmDeskLamp(ctx, 462, 223); // Aurora
    this.drawWarmDeskLamp(ctx, 802, 133); // Radar
    this.drawWarmDeskLamp(ctx, 922, 133); // Quant
    this.drawWarmDeskLamp(ctx, 212, 433); // Prism
    this.drawWarmDeskLamp(ctx, 312, 433); // Lens
    this.drawWarmDeskLamp(ctx, 262, 543); // Sentinel
    this.drawWarmDeskLamp(ctx, 592, 488); // Nexus
    this.drawWarmDeskLamp(ctx, 858, 458); // Atlas
  }

  private drawMugWithSteam(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
    ctx.save();
    // Ceramic mug cup
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 5, 5);
    ctx.fillStyle = '#1A120B';
    ctx.fillRect(x + 1, y + 1, 3, 3); // Roasted coffee surface

    // Animated curling steam wisps
    const steam1 = Math.sin(this.animTick * 2.8) * 1.5;
    const steam2 = Math.cos(this.animTick * 2.2) * 1.5;
    const alpha = 0.25 + (Math.sin(this.animTick * 2.5) + 1) * 0.25;

    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 2, y);
    ctx.quadraticCurveTo(x + 2 + steam1, y - 4, x + 2 + steam2, y - 8);
    ctx.stroke();
    ctx.restore();
  }

  private drawWarmDeskLamp(ctx: CanvasRenderingContext2D, lx: number, ly: number) {
    ctx.save();
    // Brass lamp base & arm
    ctx.fillStyle = '#D97706';
    ctx.fillRect(lx - 2, ly - 2, 4, 4);
    ctx.strokeStyle = '#B45309';
    ctx.lineWidth = 1;
    ctx.strokeRect(lx - 2.5, ly - 2.5, 5, 5);

    // Soft 2700K ambient task lighting radial illumination cone
    const radGrad = ctx.createRadialGradient(lx, ly, 2, lx, ly, 38);
    radGrad.addColorStop(0, 'rgba(254, 243, 199, 0.24)');
    radGrad.addColorStop(0.5, 'rgba(251, 191, 36, 0.08)');
    radGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(lx, ly, 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawWaterCooler(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.save();
    // Crisp white dispenser base cabinet
    ctx.fillStyle = '#F8FAFC';
    this.drawRoundedRect(ctx, x, y + 10, 18, 16, 2);
    ctx.fill();
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Hot & Cold spigots
    ctx.fillStyle = '#EF4444'; ctx.fillRect(x + 4, y + 13, 3, 2); // Hot red
    ctx.fillStyle = '#3B82F6'; ctx.fillRect(x + 11, y + 13, 3, 2); // Cold blue

    // Inverted 5-Gallon Blue Water Jug
    ctx.fillStyle = 'rgba(56, 189, 248, 0.55)';
    this.drawRoundedRect(ctx, x + 2, y, 14, 11, 4);
    ctx.fill();
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Water level & bottle collar
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fillRect(x + 4, y + 2, 10, 1.5);
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(x + 6, y + 10, 6, 2);

    // Animated Rising Micro-Bubbles
    const b1 = Math.floor(this.animTick * 20) % 10;
    const b2 = Math.floor(this.animTick * 20 + 5) % 10;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillRect(x + 6, y + 9 - b1, 1.5, 1.5);
    ctx.fillRect(x + 10, y + 9 - b2, 1.5, 1.5);
    ctx.restore();
  }

  private drawEspressoBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.save();
    // 1. Deep Espresso Walnut Bar Counter with Brass Accent Trim
    ctx.fillStyle = '#17100B';
    this.drawRoundedRect(ctx, x, y, w, h, 3);
    ctx.fill();
    ctx.strokeStyle = '#D97706'; // Warm brass highlight trim
    ctx.lineWidth = 1;
    ctx.stroke();

    // 2. Brushed stainless steel countertop & drip tray
    ctx.fillStyle = '#F1F5F9';
    ctx.fillRect(x + 2, y + 8, w - 4, 30);
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 2.5, y + 8.5, w - 5, 29);

    // Drip tray grate
    ctx.fillStyle = '#475569';
    for (let gy = y + 26; gy < y + 36; gy += 3) {
      ctx.fillRect(x + 4, gy, w - 8, 1.2);
    }

    // 3. Chrome Twin Group Heads & Portafilters
    ctx.fillStyle = '#334155';
    ctx.fillRect(x + 5, y + 14, 8, 8);
    ctx.fillRect(x + 17, y + 14, 8, 8);
    ctx.fillStyle = '#0F172A'; // Black ergonomic portafilter handles angled
    ctx.fillRect(x + 6, y + 21, 5, 6);
    ctx.fillRect(x + 18, y + 21, 5, 6);

    // 4. Brass Pressure Dials
    ctx.fillStyle = '#D97706';
    ctx.beginPath(); ctx.arc(x + 9, y + 12, 2.8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 21, y + 12, 2.8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.arc(x + 9, y + 12, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 21, y + 12, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#EF4444'; // Red gauge needle
    ctx.fillRect(x + 8.5, y + 11, 1, 1.8);
    ctx.fillRect(x + 20.5, y + 11, 1, 1.8);

    // 5. Cup warming rack on top with colored ceramic demitasse cups
    ctx.fillStyle = '#CBD5E1';
    ctx.fillRect(x + 3, y + 6, w - 6, 2);
    ctx.fillStyle = '#EF4444'; ctx.fillRect(x + 4, y + 2.5, 4, 3.5);
    ctx.fillStyle = '#3B82F6'; ctx.fillRect(x + 10, y + 2.5, 4, 3.5);
    ctx.fillStyle = '#10B981'; ctx.fillRect(x + 16, y + 2.5, 4, 3.5);
    ctx.fillStyle = '#F59E0B'; ctx.fillRect(x + 22, y + 2.5, 4, 3.5);

    // 6. Rising animated steam wisps from group heads
    const steam1 = Math.sin(this.animTick * 3) * 1.5;
    const steam2 = Math.cos(this.animTick * 2.6) * 1.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 9, y + 2);
    ctx.quadraticCurveTo(x + 9 + steam1, y - 3, x + 9 + steam2, y - 7);
    ctx.moveTo(x + 21, y + 2);
    ctx.quadraticCurveTo(x + 21 + steam2, y - 3, x + 21 + steam1, y - 7);
    ctx.stroke();

    ctx.restore();
  }

  private drawAnalogClock(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
    ctx.save();
    const radius = 8;

    // Polished brass bezel
    ctx.fillStyle = '#D97706';
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 1, 0, Math.PI * 2);
    ctx.fill();

    // Off-white parchment dial face
    ctx.fillStyle = '#F8FAFC';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // 12-hour tick marks
    ctx.fillStyle = '#475569';
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      ctx.fillRect(cx + Math.cos(angle) * 5.5 - 0.5, cy + Math.sin(angle) * 5.5 - 0.5, 1, 1);
    }

    // Live real-time clock angles
    const now = new Date();
    const sec = now.getSeconds() + now.getMilliseconds() / 1000;
    const min = now.getMinutes() + sec / 60;
    const hr = (now.getHours() % 12) + min / 60;

    // Hour hand
    const hrAngle = (hr * Math.PI) / 6 - Math.PI / 2;
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(hrAngle) * 3.5, cy + Math.sin(hrAngle) * 3.5);
    ctx.stroke();

    // Minute hand
    const minAngle = (min * Math.PI) / 30 - Math.PI / 2;
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(minAngle) * 5.5, cy + Math.sin(minAngle) * 5.5);
    ctx.stroke();

    // Second hand (crimson)
    const secAngle = (sec * Math.PI) / 30 - Math.PI / 2;
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(secAngle) * 6.5, cy + Math.sin(secAngle) * 6.5);
    ctx.stroke();

    // Center brass pin
    ctx.fillStyle = '#D97706';
    ctx.beginPath();
    ctx.arc(cx, cy, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // =========================================================================
  // Layer 10: Biophilic Plants (Botanical Monstera & Fiddle-Leaf Fig)
  // =========================================================================
  private drawBiophilicPlants(ctx: CanvasRenderingContext2D) {
    // 1. Monstera Deliciosa with split-leaf fenestrations (3 distinct locations)
    this.drawMonstera(ctx, 95, 220);  // Executive Suite
    this.drawMonstera(ctx, 622, 468); // Lounge & Operations
    this.drawMonstera(ctx, 92, 565);  // QA & Hardening

    // 2. Fiddle-Leaf Fig Trees with violin leaves & veins (2 distinct locations)
    this.drawFiddleLeafFig(ctx, 362, 225); // Dev Lab
    this.drawFiddleLeafFig(ctx, 940, 220); // Research Lab
  }

  private drawMonstera(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
    ctx.save();
    // Terracotta Planter Pot with Rim
    ctx.fillStyle = '#9A3412'; // Rich terracotta
    this.drawRoundedRect(ctx, cx - 10, cy - 2, 20, 16, 3);
    ctx.fill();
    ctx.fillStyle = '#B45309'; // Pot rim
    this.drawRoundedRect(ctx, cx - 12, cy - 4, 24, 4, 1);
    ctx.fill();
    // Soil
    ctx.fillStyle = '#27170E';
    ctx.fillRect(cx - 9, cy - 1, 18, 3);

    // Broad Fenestrated Monstera Leaves (distinct organic lobes with deep slits)
    const leaves = [
      { angle: -2.3, length: 18, width: 12, color: '#14532D', slits: 2 },
      { angle: -1.7, length: 22, width: 14, color: '#166534', slits: 3 },
      { angle: -1.1, length: 20, width: 13, color: '#15803D', slits: 2 },
      { angle: -0.6, length: 17, width: 11, color: '#16A34A', slits: 2 },
      { angle: -2.8, length: 15, width: 10, color: '#14532D', slits: 1 },
      { angle: -0.2, length: 14, width: 9, color: '#22C55E', slits: 1 },
    ];

    for (const l of leaves) {
      ctx.save();
      ctx.translate(cx, cy - 2);
      ctx.rotate(l.angle);

      // Petiole / Stem
      ctx.strokeStyle = '#14532D';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(l.length * 0.35, 0);
      ctx.stroke();

      // Leaf blade (heart / oval shape)
      ctx.translate(l.length * 0.3, 0);
      ctx.fillStyle = l.color;
      ctx.beginPath();
      ctx.ellipse(l.length * 0.4, 0, l.length * 0.45, l.width * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Leaf fenestration slits (signature Monstera cutouts)
      ctx.strokeStyle = '#0B1E13';
      ctx.lineWidth = 1.2;
      for (let s = 1; s <= l.slits; s++) {
        const sx = l.length * (0.2 + s * 0.22);
        ctx.beginPath();
        ctx.moveTo(sx, -l.width * 0.4);
        ctx.lineTo(sx + 1, -l.width * 0.1);
        ctx.moveTo(sx, l.width * 0.4);
        ctx.lineTo(sx + 1, l.width * 0.1);
        ctx.stroke();
      }

      // Central pale midrib
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.4)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(l.length * 0.8, 0);
      ctx.stroke();

      ctx.restore();
    }
    ctx.restore();
  }

  private drawFiddleLeafFig(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
    ctx.save();
    // Modern white ceramic cylindrical pot
    ctx.fillStyle = '#F8FAFC';
    this.drawRoundedRect(ctx, cx - 8, cy + 2, 16, 16, 2);
    ctx.fill();
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Dark potting soil
    ctx.fillStyle = '#27170E';
    ctx.fillRect(cx - 7, cy + 2, 14, 2);

    // Slender central woody trunk
    ctx.fillStyle = '#5A3E2B';
    ctx.fillRect(cx - 1.5, cy - 24, 3, 26);

    // Broad scalloped violin-shaped leaves (Ficus Lyrata) radiating outward
    const leaves = [
      { dx: -12, dy: -24, w: 14, h: 10, angle: -0.3, color: '#14532D' },
      { dx: 3, dy: -22, w: 15, h: 11, angle: 0.25, color: '#15803D' },
      { dx: -14, dy: -14, w: 16, h: 11, angle: -0.15, color: '#166534' },
      { dx: 2, dy: -12, w: 16, h: 12, angle: 0.2, color: '#16A34A' },
      { dx: -11, dy: -5, w: 14, h: 9, angle: -0.2, color: '#15803D' },
      { dx: 1, dy: -4, w: 14, h: 9, angle: 0.15, color: '#22C55E' },
    ];

    for (const l of leaves) {
      ctx.save();
      ctx.translate(cx + (l.dx > 0 ? 1 : -1), cy + l.dy + l.h / 2);
      ctx.rotate(l.angle);

      // Violin-shaped leaf (pinched base, scalloped wide tip)
      ctx.fillStyle = l.color;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(l.w * 0.3, -l.h * 0.3, l.w * 0.7, -l.h * 0.6, l.w, -l.h * 0.4);
      ctx.bezierCurveTo(l.w * 1.1, 0, l.w * 1.1, 0, l.w, l.h * 0.4);
      ctx.bezierCurveTo(l.w * 0.7, l.h * 0.6, l.w * 0.3, l.h * 0.3, 0, 0);
      ctx.fill();

      // Pale green midrib and lateral veins
      ctx.strokeStyle = 'rgba(187, 247, 208, 0.45)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(l.w * 0.95, 0);
      // Lateral veins
      ctx.moveTo(l.w * 0.4, 0); ctx.lineTo(l.w * 0.6, -l.h * 0.3);
      ctx.moveTo(l.w * 0.4, 0); ctx.lineTo(l.w * 0.6, l.h * 0.3);
      ctx.moveTo(l.w * 0.7, 0); ctx.lineTo(l.w * 0.85, -l.h * 0.25);
      ctx.moveTo(l.w * 0.7, 0); ctx.lineTo(l.w * 0.85, l.h * 0.25);
      ctx.stroke();

      ctx.restore();
    }
    ctx.restore();
  }

  // =========================================================================
  // Layer 11: Room Header Badges & Monospace Typographic Labels
  // =========================================================================
  private drawRoomHeaders(ctx: CanvasRenderingContext2D, activeRoomFilter: string) {
    ctx.save();
    ctx.font = '700 9px Fira Code, monospace';

    for (const r of ROOMS) {
      const isHighlighted = activeRoomFilter === 'all' || activeRoomFilter === r.id;
      const textW = ctx.measureText(r.name).width;

      // Clean pill badge container with customized clearance for War Room
      const badgeX = r.id === 'meeting' ? r.x + 6 : r.x + 10;
      const badgeW = r.id === 'meeting' ? textW + 8 : textW + 14;
      const textOffset = r.id === 'meeting' ? badgeX + 4 : r.x + 17;

      ctx.fillStyle = 'rgba(11, 13, 17, 0.88)';
      ctx.strokeStyle = isHighlighted ? r.accent : 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      this.drawRoundedRect(ctx, badgeX, r.y + 8, badgeW, 15, 3);
      ctx.fill();
      ctx.stroke();

      // High-contrast badge text
      ctx.fillStyle = isHighlighted ? r.accent : 'rgba(255, 255, 255, 0.75)';
      ctx.fillText(r.name, textOffset, r.y + 19);
    }
    ctx.restore();
  }

  // =========================================================================
  // Geometric Helper: Rounded Rectangle Path
  // =========================================================================
  private drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}
