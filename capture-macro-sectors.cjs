const { chromium } = require('/root/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');
const path = require('path');

const ARTIFACTS_DIR = '/root/projects/hermes-virtual-office/lens-artifacts';

async function captureHighResSectors() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2 // 2x Retina resolution
  });

  await page.goto('http://127.0.0.1:3333');
  await page.waitForTimeout(1500);

  // Switch to 2D
  await page.click('button:has-text("2D Office")');
  await page.waitForTimeout(800);

  // Helper to set engine camera directly via window store
  async function focusWorld(wx, wy, zoom) {
    await page.evaluate(({ wx, wy, zoom }) => {
      // In useOfficeStore:
      // cameraX = -(wx - 520) * zoom?
      // Wait, let's see how OfficeEngine translates:
      // ctx.translate(rectWidth / 2 + cameraX, rectHeight / 2 + cameraY);
      // ctx.scale(zoom, zoom);
      // ctx.translate(-520, -335);
      // So to center world coordinate (wx, wy) on the screen:
      // (wx - 520) * zoom + cameraX = 0 => cameraX = -(wx - 520) * zoom? No, ctx.translate(rectWidth/2 + cameraX) then ctx.scale(zoom) then translate(-520).
      // Screen pos of world (wx, wy) is:
      // rectWidth/2 + cameraX + (wx - 520) * zoom.
      // So to make it centered at rectWidth/2:
      // cameraX = -(wx - 520) * zoom.
      // Let's set camera directly:
      const store = window.__OFFICE_STORE__; // Let's check if store is accessible or we can use setCamera
      // Alternatively, dispatch wheel / drag or use store hook if exported, or evaluate on canvas
    }, { wx, wy, zoom });
  }

  // Let's check how focusRoom works in useOfficeStore:
  // camera: { x: -(target.x - 520), y: -(target.y - 335), zoom: target.zoom }
  // Notice that in OfficeEngine:
  // ctx.translate(rectWidth / 2 + this.cameraX, rectHeight / 2 + this.cameraY);
  // ctx.scale(this.zoom, this.zoom);
  // ctx.translate(-520, -335);
  // Wait! Notice that in useOfficeStore:
  // x: -(target.x - 520), y: -(target.y - 335)
  // Let's see how setCamera is called!
  
  // Let's inspect window in page to see how we can set camera zoom:
  const sectorList = [
    {
      name: 'closeup-01-orion-desk',
      worldX: 190,
      worldY: 155,
      zoom: 3.5,
      desc: 'Orion Desk, Dual Monitors, Syntax lines, Sparkline, Lamp Halo, Steaming Mug, Bookshelf, Window'
    },
    {
      name: 'closeup-02-dev-lab',
      worldX: 470,
      worldY: 165,
      zoom: 2.8,
      desc: 'Forge, Frame, Aurora Desks, Fiddle-Leaf Fig, Whiteboard, Skyline Windows with Blinds'
    },
    {
      name: 'closeup-03-war-room-meeting',
      worldX: 495,
      worldY: 345,
      zoom: 3.0,
      desc: '65" Presentation Screen with Architecture Diagram, Analog Wall Clock, Kilim Rug, Conference Laptops'
    },
    {
      name: 'closeup-04-lounge-espresso-watercooler',
      worldX: 460,
      worldY: 510,
      zoom: 3.0,
      desc: 'Water Cooler with Bubbles, Espresso Bar with Steam, Sectional Sofa, Berber Rug, Coffee Table'
    },
    {
      name: 'closeup-05-sre-servers-cables',
      worldX: 860,
      worldY: 450,
      zoom: 2.8,
      desc: 'Raised Datacenter Tiles with Rivets, Four 42U Server Cabinets, Combed Cable Looms, Multi-rate LEDs'
    }
  ];

  for (const s of sectorList) {
    await page.evaluate(({ wx, wy, zoom }) => {
      // Access Zustand store via React root or document
      // Let's find the canvas element and get its engine or store
      const canvas = document.querySelector('canvas');
      // If we simulate drag or mouse wheel, or trigger store:
      // Let's see if we can trigger zustand store through DOM
      const buttons = Array.from(document.querySelectorAll('header button'));
      // But we want custom high zoom!
      // Let's see if engine is attached to canvas:
    }, { wx: s.worldX, wy: s.worldY, zoom: s.zoom });

    // Wait, let's see how useOfficeStore is exposed or can be manipulated
  }

  await browser.close();
}

console.log('Capture script prepared.');
